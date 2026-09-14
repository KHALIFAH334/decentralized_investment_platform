'use client';

import React, { useState } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import type { DipProgram, AnchorWallet } from '../types/program';

interface BusinessDetail {
  publicKey: string;
  owner: string;
  fundingGoal: number;
  totalRaised: number;
  isFunded: boolean;
  isClosed: boolean;
  mintKey: string;
}

interface OwnerSidebarProps {
  business: BusinessDetail;
  program: DipProgram;
  wallet: AnchorWallet;
  onSuccess: () => void;
  showToast: (type: string, message: string) => void;
}

export function OwnerSidebar({ business, program, wallet, onSuccess, showToast }: OwnerSidebarProps) {
  const [submitting, setSubmitting] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const isOwner = wallet && wallet.publicKey.toBase58() === business.owner;
  if (!isOwner) return null;

  const handleWithdraw = async () => {
    if (!program || !wallet) return;
    const amountSol = parseFloat(withdrawAmount);
    if (isNaN(amountSol) || amountSol <= 0) return showToast('error', 'Invalid amount');

    try {
      setSubmitting(true);
      const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);
      const tx = await program.methods
        .withdrawFunds(amountLamports)
        .accounts({
          owner: wallet.publicKey,
          businessState: new PublicKey(business.publicKey),
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      showToast('success', `Successfully withdrew ${amountSol} SOL! TX: ${tx.slice(0, 10)}...`);
      setWithdrawAmount('');
      onSuccess();
    } catch (e: any) {
      showToast('error', e.message || 'Withdraw failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!program || !wallet) return;
    if (!confirm('Are you sure you want to close this campaign? This cannot be undone.')) return;
    try {
      setSubmitting(true);
      const tx = await program.methods
        .closeBusiness()
        .accounts({
          owner: wallet.publicKey,
          businessState: new PublicKey(business.publicKey),
        })
        .rpc();
      showToast('success', `Campaign closed! TX: ${tx.slice(0, 10)}...`);
      onSuccess();
    } catch (e: any) {
      showToast('error', e.message || 'Close failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: 'var(--space-lg)', border: '1px solid var(--accent-primary)' }}>
      <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
        👑 Owner Dashboard
      </h3>

      {!business.isClosed && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <button 
            className="btn-secondary" 
            style={{ width: '100%', borderColor: 'var(--error)', color: 'var(--error)' }}
            onClick={handleClose}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Close Campaign'}
          </button>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
            Warning: This permanently closes the campaign to new investors.
          </p>
        </div>
      )}

      {business.isFunded && (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Withdraw Raised Funds</h4>
          <div className="form-group">
            <input
              className="input mono"
              type="number"
              step="0.01"
              placeholder="Amount (SOL)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
            />
          </div>
          <button 
            className="btn-primary" 
            style={{ width: '100%' }}
            onClick={handleWithdraw}
            disabled={submitting || !withdrawAmount}
          >
            Withdraw Funds
          </button>
        </div>
      )}
    </div>
  );
}
