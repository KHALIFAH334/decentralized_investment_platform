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
  getMint,
} from "@solana/spl-token";
import { expect } from "chai";

describe("Decentralized Investment Platform", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .decentralized_investment_platform as Program<DecentralizedInvestmentPlatform>;

  // Test wallets
  const owner = Keypair.generate();
  const investor = Keypair.generate();
  const equityMint = Keypair.generate();

  // PDAs
  let businessStatePda: PublicKey;
  let businessStateBump: number;

  // Test parameters
  const FUNDING_GOAL = new anchor.BN(5 * LAMPORTS_PER_SOL); // 5 SOL
  const EQUITY_PERCENTAGE = 20; // 20%
  const TOTAL_EQUITY_TOKENS = new anchor.BN(1_000_000 * 1e6); // 1M tokens with 6 decimals

  before(async () => {
    // Derive the business state PDA
    [businessStatePda, businessStateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL to owner and investor
    const ownerAirdrop = await provider.connection.requestAirdrop(
      owner.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(ownerAirdrop, "confirmed");

    const investorAirdrop = await provider.connection.requestAirdrop(
      investor.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(investorAirdrop, "confirmed");

    console.log("  Owner:", owner.publicKey.toBase58());
    console.log("  Investor:", investor.publicKey.toBase58());
    console.log("  Business PDA:", businessStatePda.toBase58());
    console.log("  Equity Mint:", equityMint.publicKey.toBase58());
  });

  it("1. Initializes a business with Token-2022 equity mint", async () => {
    const tx = await program.methods
      .initializeBusiness(FUNDING_GOAL, EQUITY_PERCENTAGE, TOTAL_EQUITY_TOKENS)
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
        equityMint: equityMint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner, equityMint])
      .rpc();

    console.log("    tx:", tx);

    // Verify business state
    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(state.fundingGoal.toNumber()).to.equal(FUNDING_GOAL.toNumber());
    expect(state.equityPercentage).to.equal(EQUITY_PERCENTAGE);
    expect(state.totalEquityTokens.toNumber()).to.equal(
      TOTAL_EQUITY_TOKENS.toNumber()
    );
    expect(state.totalRaised.toNumber()).to.equal(0);
    expect(state.isFunded).to.equal(false);
    expect(state.isClosed).to.equal(false);
    expect(state.mintKey.toBase58()).to.equal(equityMint.publicKey.toBase58());

    console.log("    ✅ Business state verified");
    console.log(
      `    Goal: ${state.fundingGoal.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
    console.log(`    Equity: ${state.equityPercentage}%`);
  });

  it("2. Investor invests SOL and receives equity tokens", async () => {
    const investAmount = new anchor.BN(2 * LAMPORTS_PER_SOL); // 2 SOL

    // Get investor's ATA for Token-2022
    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
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

    console.log("    tx:", tx);

    // Wait for confirmation before querying Token-2022 accounts
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      { signature: tx, ...latestBlockhash },
      "confirmed"
    );

    // Verify updated business state
    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.totalRaised.toNumber()).to.equal(investAmount.toNumber());
    expect(state.isFunded).to.equal(false); // 2 SOL < 5 SOL goal

    // Verify investor received tokens
    const tokenAccount = await getAccount(
      provider.connection,
      investorAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    // Expected tokens: (2 SOL / 5 SOL) * 1,000,000 tokens = 400,000 tokens
    const expectedTokens = 400_000 * 1e6; // with 6 decimals
    expect(Number(tokenAccount.amount)).to.equal(expectedTokens);

    console.log("    ✅ Investment verified");
    console.log(
      `    Invested: ${investAmount.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
    console.log(
      `    Tokens received: ${Number(tokenAccount.amount) / 1e6}`
    );
    console.log(
      `    Total raised: ${state.totalRaised.toNumber() / LAMPORTS_PER_SOL}/${FUNDING_GOAL.toNumber() / LAMPORTS_PER_SOL} SOL`
    );
  });

  it("3. Second investment fully funds the business", async () => {
    const investAmount = new anchor.BN(3 * LAMPORTS_PER_SOL); // 3 SOL (completes the 5 SOL goal)

    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const tx = await program.methods
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

    console.log("    tx:", tx);

    // Wait for confirmation before querying Token-2022 accounts
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      { signature: tx, ...latestBlockhash },
      "confirmed"
    );

    // Verify business is now fully funded
    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.totalRaised.toNumber()).to.equal(FUNDING_GOAL.toNumber());
    expect(state.isFunded).to.equal(true);

    // Investor should now hold all 1,000,000 tokens (400K from test 2 + 600K from test 3)
    const tokenAccount = await getAccount(
      provider.connection,
      investorAta,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );
    expect(Number(tokenAccount.amount)).to.equal(
      TOTAL_EQUITY_TOKENS.toNumber()
    );

    console.log("    ✅ Business fully funded!");
    console.log(
      `    Total tokens held: ${Number(tokenAccount.amount) / 1e6}`
    );
  });

  it("4. Owner withdraws funds after funding goal met", async () => {
    const ownerBalanceBefore = await provider.connection.getBalance(
      owner.publicKey
    );
    const withdrawAmount = new anchor.BN(1 * LAMPORTS_PER_SOL); // Withdraw 1 SOL

    const tx = await program.methods
      .withdrawFunds(withdrawAmount)
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("    tx:", tx);

    const ownerBalanceAfter = await provider.connection.getBalance(
      owner.publicKey
    );
    // Owner should have gained ~1 SOL (minus tx fee)
    const gained = ownerBalanceAfter - ownerBalanceBefore;
    expect(gained).to.be.greaterThan(0.99 * LAMPORTS_PER_SOL);

    console.log("    ✅ Withdrawal successful");
    console.log(`    Withdrew: ${withdrawAmount.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`    Owner gained: ~${(gained / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
  });

  it("5. Owner distributes dividends to investor", async () => {
    const dividendAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL); // 0.5 SOL dividend

    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const investorBalanceBefore = await provider.connection.getBalance(
      investor.publicKey
    );

    const tx = await program.methods
      .distributeDividends(dividendAmount)
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
        equityMint: equityMint.publicKey,
        investor: investor.publicKey,
        investorTokenAccount: investorAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();

    console.log("    tx:", tx);

    const investorBalanceAfter = await provider.connection.getBalance(
      investor.publicKey
    );
    // Investor holds 100% of tokens, so they should receive 100% of dividend
    const gained = investorBalanceAfter - investorBalanceBefore;
    expect(gained).to.equal(dividendAmount.toNumber());

    console.log("    ✅ Dividend distributed");
    console.log(
      `    Investor received: ${gained / LAMPORTS_PER_SOL} SOL`
    );
  });

  it("6. Owner closes the business", async () => {
    const tx = await program.methods
      .closeBusiness()
      .accounts({
        owner: owner.publicKey,
        businessState: businessStatePda,
      })
      .signers([owner])
      .rpc();

    console.log("    tx:", tx);

    const state = await program.account.businessState.fetch(businessStatePda);
    expect(state.isClosed).to.equal(true);

    console.log("    ✅ Business closed");
  });

  it("7. Investment fails after business is closed", async () => {
    const investorAta = getAssociatedTokenAddressSync(
      equityMint.publicKey,
      investor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    try {
      await program.methods
        .invest(new anchor.BN(LAMPORTS_PER_SOL))
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
        .rpc();

      // If we get here, the test should fail
      expect.fail("Should have thrown an error");
    } catch (err: any) {
      // Expect BusinessClosed error (code 6005)
      expect(err.toString()).to.include("BusinessClosed");
      console.log("    ✅ Investment correctly rejected: BusinessClosed");
    }
  });

  it("8. Investor can refund if business is closed and funding goal is not met", async () => {
    // Setup a new business and investor
    const refundBusinessMint = Keypair.generate();
    const refundInvestor = Keypair.generate();
    
    // Derive PDA for new business
    const [refundPda, refundBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), owner.publicKey.toBuffer()],
      program.programId
    );

    // Because the seed relies on owner public key, we must use a different owner for the second business 
    // to avoid PDA conflict. Let's create a new owner.
    const newOwner = Keypair.generate();
    const [newPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("business"), newOwner.publicKey.toBuffer()],
      program.programId
    );

    // Airdrop SOL
    const airdrop1 = await provider.connection.requestAirdrop(newOwner.publicKey, 5 * LAMPORTS_PER_SOL);
    const airdrop2 = await provider.connection.requestAirdrop(refundInvestor.publicKey, 5 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(airdrop1, "confirmed");
    await provider.connection.confirmTransaction(airdrop2, "confirmed");

    // 1. Initialize
    await program.methods
      .initializeBusiness(FUNDING_GOAL, EQUITY_PERCENTAGE, TOTAL_EQUITY_TOKENS)
      .accounts({
        owner: newOwner.publicKey,
        businessState: newPda,
        equityMint: refundBusinessMint.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([newOwner, refundBusinessMint])
      .rpc();

    // 2. Invest 1 SOL (partial funding)
    const investAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const investorAta = getAssociatedTokenAddressSync(
      refundBusinessMint.publicKey,
      refundInvestor.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    await program.methods
      .invest(investAmount)
      .accounts({
        investor: refundInvestor.publicKey,
        businessState: newPda,
        equityMint: refundBusinessMint.publicKey,
        investorTokenAccount: investorAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([refundInvestor])
      .rpc({ commitment: "confirmed" });

    // 3. Close the business (goal not met)
    await program.methods
      .closeBusiness()
      .accounts({
        owner: newOwner.publicKey,
        businessState: newPda,
      })
      .signers([newOwner])
      .rpc({ commitment: "confirmed" });

    // 4. Refund
    const balanceBefore = await provider.connection.getBalance(refundInvestor.publicKey);

    const tx = await program.methods
      .refundInvestment()
      .accounts({
        investor: refundInvestor.publicKey,
        businessState: newPda,
        equityMint: refundBusinessMint.publicKey,
        investorTokenAccount: investorAta,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([refundInvestor])
      .rpc({ commitment: "confirmed" });
    
    console.log("    tx:", tx);

    const balanceAfter = await provider.connection.getBalance(refundInvestor.publicKey);
    const refundedAmount = balanceAfter - balanceBefore;
    
    // We invested 1 SOL, we expect roughly 1 SOL back (minus tx fees)
    expect(refundedAmount).to.be.greaterThan(0.99 * LAMPORTS_PER_SOL);
    
    // Verify tokens were burned
    const tokenAccountInfo = await provider.connection.getTokenAccountBalance(investorAta);
    expect(tokenAccountInfo.value.uiAmount).to.equal(0);

    console.log("    ✅ Refund correctly processed");
  });
});
