import { useState } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BusinessData } from './useBusinesses';
import type { DipProgram, AnchorWallet } from '../types/program';

export function useCampaignActions(
  program: DipProgram | null,
  wallet: AnchorWallet | null,
  refresh: () => void,
  showToast: (type: string, message: string) => void
) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const withdraw = async (biz: BusinessData, amountStr: string) => {
    if (!program || !wallet) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { showToast('error', 'Enter a valid amount'); return; }

    try {
      setActionLoading(`withdraw-${biz.publicKey}`);
      const businessPubkey = new PublicKey(biz.publicKey);

      await program.methods
        .withdrawFunds(new BN(amount * LAMPORTS_PER_SOL))
        .accounts({
          owner: wallet.publicKey,
          businessState: businessPubkey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', `Withdrew ${amount} SOL successfully!`);
      refresh();
      return true;
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Withdrawal failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const distributeDividend = async (biz: BusinessData, amountStr: string, investorAddr: string) => {
    if (!program || !wallet) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { showToast('error', 'Enter a valid dividend amount'); return; }
    if (!investorAddr) { showToast('error', 'Enter investor address'); return; }

    try {
      setActionLoading(`dividend-${biz.publicKey}`);
      const businessPubkey = new PublicKey(biz.publicKey);
      const investorPubkey = new PublicKey(investorAddr);
      const mintPubkey = new PublicKey(biz.mintKey);

      const investorAta = getAssociatedTokenAddressSync(
        mintPubkey, investorPubkey, false, TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .distributeDividends(new BN(amount * LAMPORTS_PER_SOL))
        .accounts({
          owner: wallet.publicKey,
          businessState: businessPubkey,
          equityMint: mintPubkey,
          investor: investorPubkey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', `Distributed ${amount} SOL dividend!`);
      return true;
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Dividend distribution failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const closeBusiness = async (biz: BusinessData) => {
    if (!program || !wallet) return;
    try {
      setActionLoading(`close-${biz.publicKey}`);
      const businessPubkey = new PublicKey(biz.publicKey);

      await program.methods
        .closeBusiness()
        .accounts({
          owner: wallet.publicKey,
          businessState: businessPubkey,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', 'Campaign closed!');
      refresh();
      return true;
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Close failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const autoClose = async (biz: BusinessData) => {
    if (!program || !wallet) return;
    try {
      setActionLoading(`autoclose-${biz.publicKey}`);
      const businessPubkey = new PublicKey(biz.publicKey);

      await program.methods
        .autoClose()
        .accounts({
          businessState: businessPubkey,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', 'Campaign auto-closed! Refunds are now enabled.');
      refresh();
      return true;
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Auto-close failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  const refundInvestment = async (biz: BusinessData) => {
    if (!program || !wallet) return;
    try {
      setActionLoading(`refund-${biz.publicKey}`);
      const businessPubkey = new PublicKey(biz.publicKey);
      const mintPubkey = new PublicKey(biz.mintKey);
      
      const investorAta = getAssociatedTokenAddressSync(
        mintPubkey, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .refundInvestment()
        .accounts({
          investor: wallet.publicKey,
          businessState: businessPubkey,
          equityMint: mintPubkey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', 'Refund successful! Tokens burned and SOL returned.');
      refresh();
      return true;
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Refund failed');
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return { withdraw, distributeDividend, closeBusiness, autoClose, refundInvestment, actionLoading };
}
