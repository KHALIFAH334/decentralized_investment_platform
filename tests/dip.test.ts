import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DecentralizedInvestmentPlatform } from "../target/types/decentralized_investment_platform";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import { expect } from "chai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("Decentralized Investment Platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .decentralized_investment_platform as Program<DecentralizedInvestmentPlatform>;

  // --- Helpers & Globals ---
  const FUNDING_GOAL = new anchor.BN(5 * LAMPORTS_PER_SOL);
  const EQUITY_PERCENTAGE = 20;
  const TOTAL_EQUITY_TOKENS = new anchor.BN(1_000_000 * 1e6);

  // Main scenario wallets
  const owner = Keypair.generate();
  const investor = Keypair.generate();
  const equityMint = Keypair.generate();
  
  let businessId: anchor.BN;
  let businessStatePda: PublicKey;
  let businessStateBump: number;
  let fundingDeadline: anchor.BN;

  before(async () => {
    // Generate a pseudo-random ID
    businessId = new anchor.BN(Date.now());
    
    // Fetch cluster time
    const slot = await provider.connection.getSlot();
    const clusterTime = await provider.connection.getBlockTime(slot);
    const now = clusterTime || Math.floor(Date.now() / 1000);
    
    fundingDeadline = new anchor.BN(now + 3600); // 1 hr in future

    [businessStatePda, businessStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), owner.publicKey.toBuffer(), businessId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await Promise.all([
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(owner.publicKey, 10 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
      provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(investor.publicKey, 10 * LAMPORTS_PER_SOL),
        "confirmed"
      ),
    ]);
  });

  // --- HAPPY PATH (Existing Tests Updated) ---

  it("1. Initializes a business with Token-2022 equity mint", async () => {
    await program.methods
      .initializeBusiness(businessId, FUNDING_GOAL, EQUITY_PERCENTAGE, TOTAL_EQUITY_TOKENS, fundingDeadline)
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
        equityMint: equityMint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner, equityMint])
      .rpc();

    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(state.fundingGoal.toNumber()).to.equal(FUNDING_GOAL.toNumber());
    expect(state.totalRaised.toNumber()).to.equal(0);
    expect(state.isFunded).to.equal(false);
  });

  it("2. Investor invests SOL and receives equity tokens", async () => {
    const investAmount = new anchor.BN(2 * LAMPORTS_PER_SOL);
    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey, investor.publicKey, false, TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .invest(investAmount)
      .accounts({
        investor: investor.publicKey,
        businessState: businessStatePda,
        equityMint: equityMint.publicKey,
        investorTokenAccount: investorAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([investor])
      .rpc({ commitment: "confirmed" });

    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.totalRaised.toNumber()).to.equal(investAmount.toNumber());
    expect(state.isFunded).to.equal(false);
  });

  it("3. Second investment fully funds the business", async () => {
    const investAmount = new anchor.BN(3 * LAMPORTS_PER_SOL);
    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey, investor.publicKey, false, TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .invest(investAmount)
      .accounts({
        investor: investor.publicKey,
        businessState: businessStatePda,
        equityMint: equityMint.publicKey,
        investorTokenAccount: investorAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([investor])
      .rpc({ commitment: "confirmed" });

    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.isFunded).to.equal(true);
    expect(state.totalRaised.toNumber()).to.equal(FUNDING_GOAL.toNumber());
  });

  it("4. Owner withdraws funds after funding goal met", async () => {
    const balanceBefore = await provider.connection.getBalance(owner.publicKey);
    const withdrawAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);

    await program.methods
      .withdrawFunds(withdrawAmount)
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(owner.publicKey);
    expect(balanceAfter - balanceBefore).to.be.greaterThan(0.99 * LAMPORTS_PER_SOL);
  });

  // --- EDGE CASES & NEW FEATURES ---

  it("Edge: Fails to withdraw more than available balance", async () => {
    const tooMuch = new anchor.BN(10 * LAMPORTS_PER_SOL);
    try {
      await program.methods
        .withdrawFunds(tooMuch)
        .accounts({
          owner: owner.publicKey,
          businessState: businessStatePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (e: any) {
      expect(e.toString()).to.include("InsufficientFunds");
    }
  });

  it("Edge: Cannot refund on a fully funded business", async () => {
    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey, investor.publicKey, false, TOKEN_2022_PROGRAM_ID
    );
    try {
      await program.methods
        .refundInvestment()
        .accounts({
          investor: investor.publicKey,
          businessState: businessStatePda,
          equityMint: equityMint.publicKey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([investor])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (e: any) {
      expect(e.toString()).to.include("NotClosed");
    }
  });

  it("Edge: Double-closing a business fails", async () => {
    // First close
    await program.methods
      .closeBusiness()
      .accounts({ owner: owner.publicKey, businessState: businessStatePda })
      .signers([owner])
      .rpc();
    
    // Second close
    try {
      await program.methods
        .closeBusiness()
        .accounts({ owner: owner.publicKey, businessState: businessStatePda })
        .signers([owner])
        .rpc();
      expect.fail("Should have thrown error");
    } catch (e: any) {
      expect(e.toString()).to.include("BusinessClosed");
    }
  });

  // --- AUTO CLOSE & DEADLINE TESTING ---
  describe("Deadline & Auto-Close", () => {
    const shortOwner = Keypair.generate();
    const shortInvestor = Keypair.generate();
    const shortMint = Keypair.generate();
    const shortId = new anchor.BN(Date.now() + 1);
    
    let shortPda: PublicKey;
    let shortDeadline: anchor.BN;

    before(async () => {
      [shortPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("business"), shortOwner.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(shortOwner.publicKey, 5 * LAMPORTS_PER_SOL)
      );
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(shortInvestor.publicKey, 5 * LAMPORTS_PER_SOL)
      );
    });

    it("Initializes with a short deadline (4 seconds)", async () => {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      const now = clusterTime || Math.floor(Date.now() / 1000);
      shortDeadline = new anchor.BN(now + 4); // 4 seconds from now

      await program.methods
        .initializeBusiness(shortId, FUNDING_GOAL, EQUITY_PERCENTAGE, TOTAL_EQUITY_TOKENS, shortDeadline)
        .accounts({
          owner: shortOwner.publicKey,
          businessState: shortPda,
          equityMint: shortMint.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([shortOwner, shortMint])
        .rpc();
    });

    it("Edge: Auto-close fails BEFORE deadline", async () => {
      try {
        await program.methods
          .autoClose()
          .accounts({ businessState: shortPda })
          // anyone can sign, we use investor
          .rpc();
        expect.fail("Should have thrown error");
      } catch (e: any) {
        expect(e.toString()).to.include("DeadlineNotReached");
      }
    });

    it("Edge: Investing succeeds before deadline", async () => {
      const investorAta = getAssociatedTokenAddressSync(
        shortMint.publicKey, shortInvestor.publicKey, false, TOKEN_2022_PROGRAM_ID
      );
      await program.methods
        .invest(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          investor: shortInvestor.publicKey,
          businessState: shortPda,
          equityMint: shortMint.publicKey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([shortInvestor])
        .rpc();
    });

    it("Edge: Investing fails AFTER deadline", async () => {
      console.log("    ⏳ Waiting for validator clock to pass deadline...");
      let currentClusterTime = 0;
      while (currentClusterTime <= shortDeadline.toNumber()) {
        await sleep(1000);
        // Advance clock by forcing a transaction
        await provider.connection.requestAirdrop(provider.wallet.publicKey, 1 * LAMPORTS_PER_SOL);
        const slot = await provider.connection.getSlot("confirmed");
        currentClusterTime = await provider.connection.getBlockTime(slot) || 0;
      }

      const investorAta = getAssociatedTokenAddressSync(
        shortMint.publicKey, shortInvestor.publicKey, false, TOKEN_2022_PROGRAM_ID
      );
      
      try {
        await program.methods
          .invest(new anchor.BN(1 * LAMPORTS_PER_SOL))
          .accounts({
            investor: shortInvestor.publicKey,
            businessState: shortPda,
            equityMint: shortMint.publicKey,
            investorTokenAccount: investorAta,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([shortInvestor])
          .rpc();
        expect.fail("Should have thrown error");
      } catch (e: any) {
        expect(e.toString()).to.include("DeadlineExpired");
      }
    });

    it("Auto-close succeeds AFTER deadline by random caller", async () => {
      await program.methods
        .autoClose()
        .accounts({ businessState: shortPda })
        .rpc(); // Caller is provider wallet, not owner
        
      const state = await program.account.businessState.fetch(shortPda);
      expect(state.isClosed).to.equal(true);
    });

    it("Refund succeeds after auto-close", async () => {
      const balanceBefore = await provider.connection.getBalance(shortInvestor.publicKey);
      const investorAta = getAssociatedTokenAddressSync(
        shortMint.publicKey, shortInvestor.publicKey, false, TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .refundInvestment()
        .accounts({
          investor: shortInvestor.publicKey,
          businessState: shortPda,
          equityMint: shortMint.publicKey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([shortInvestor])
        .rpc();
        
      const balanceAfter = await provider.connection.getBalance(shortInvestor.publicKey);
      expect(balanceAfter - balanceBefore).to.be.greaterThan(0.99 * LAMPORTS_PER_SOL);
    });
  });
  
  // --- TRANSFER FEE TESTING ---
  describe("Transfer Fee Harvesting", () => {
    // Tests transfer fees and harvesting
    const owner2 = Keypair.generate();
    const investor2 = Keypair.generate();
    const investor3 = Keypair.generate();
    const mint2 = Keypair.generate();
    const id2 = new anchor.BN(Date.now() + 2);
    let pda2: PublicKey;
    let deadline2: anchor.BN;
    
    before(async () => {
      const slot = await provider.connection.getSlot();
      const clusterTime = await provider.connection.getBlockTime(slot);
      const now = clusterTime || Math.floor(Date.now() / 1000);
      deadline2 = new anchor.BN(now + 3600);
      
      [pda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("business"), owner2.publicKey.toBuffer(), id2.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(owner2.publicKey, 10 * LAMPORTS_PER_SOL)
      );
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(investor2.publicKey, 10 * LAMPORTS_PER_SOL)
      );
    });

    it("Initialize & invest for fee testing", async () => {
      await program.methods
        .initializeBusiness(id2, FUNDING_GOAL, EQUITY_PERCENTAGE, TOTAL_EQUITY_TOKENS, deadline2)
        .accounts({
          owner: owner2.publicKey,
          businessState: pda2,
          equityMint: mint2.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner2, mint2])
        .rpc();

      const investor2Ata = getAssociatedTokenAddressSync(
        mint2.publicKey, investor2.publicKey, false, TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .invest(FUNDING_GOAL)
        .accounts({
          investor: investor2.publicKey,
          businessState: pda2,
          equityMint: mint2.publicKey,
          investorTokenAccount: investor2Ata,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([investor2])
        .rpc({ commitment: "confirmed" });
    });

    it("Harvesting fees succeeds", async () => {
      // In a real scenario, fees accumulate from token transfers.
      // We will just call harvest_fees to ensure the instruction executes without error.
      const owner2Ata = getAssociatedTokenAddressSync(
        mint2.publicKey, owner2.publicKey, false, TOKEN_2022_PROGRAM_ID
      );
      
      // Need to create owner ATA first to receive fees
      await createAssociatedTokenAccount(
        provider.connection,
        owner2,
        mint2.publicKey,
        owner2.publicKey,
        { commitment: "confirmed" },
        TOKEN_2022_PROGRAM_ID
      );

      const investor2Ata = getAssociatedTokenAddressSync(
        mint2.publicKey, investor2.publicKey, false, TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .harvestFees()
        .accounts({
          owner: owner2.publicKey,
          businessState: pda2,
          equityMint: mint2.publicKey,
          feeDestination: owner2Ata,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .remainingAccounts([{ pubkey: investor2Ata, isWritable: true, isSigner: false }])
        .signers([owner2])
        .rpc();
    });
  });
});
