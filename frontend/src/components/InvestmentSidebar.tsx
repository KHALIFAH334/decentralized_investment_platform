'use client';

import React, { useState } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';

interface BusinessDetail {
  publicKey: string;
  owner: string;
  fundingGoal: number;
  totalRaised: number;
  equityPercentage: number;
  totalEquityTokens: number;
  isFunded: boolean;
  isClosed: boolean;
  mintKey: string;
}

interface InvestmentSidebarProps {
  business: BusinessDetail;
  program: any;
  wallet: any;
  onSuccess: () => void;
  showToast: (type: string, message: string) => void;
}

export function InvestmentSidebar({ business, program, wallet, onSuccess, showToast }: InvestmentSidebarProps) {
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canInvest = !business.isFunded && !business.isClosed && !!wallet;

  const tokensPreview = (() => {
    if (!investAmount) return 0;
    const amountSol = parseFloat(investAmount);
    if (isNaN(amountSol) || amountSol <= 0) return 0;
    const amountLamports = amountSol * LAMPORTS_PER_SOL;
    return (amountLamports / business.fundingGoal) * (business.totalEquityTokens / 1e6);
  })();

  const handleInvest = async () => {
    if (!program || !wallet || !business) return;
    const amountSol = parseFloat(investAmount);
    if (isNaN(amountSol) || amountSol <= 0) {
      showToast('error', 'Enter a valid SOL amount');
      return;
    }

    try {
      setSubmitting(true);
      const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);
      const businessPubkey = new PublicKey(business.publicKey);
      const mintPubkey = new PublicKey(business.mintKey);

      const investorAta = getAssociatedTokenAddressSync(
        mintPubkey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .invest(amountLamports)
        .accounts({
          investor: wallet.publicKey,
          businessState: businessPubkey,
          equityMint: mintPubkey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', `Investment successful! TX: ${tx.slice(0, 12)}...`);
      setInvestAmount('');
      onSuccess();
    } catch (e: any) {
      showToast('error', e.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem', fontWeight: 700 }}>Invest</h3>

      {!wallet ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect your wallet to factor this invoice.</p>
      ) : !canInvest ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {business.isClosed ? 'This campaign is closed.' : 'This campaign is fully funded.'}
        </p>
      ) : (
        <>
          <div className="form-group">
            <label className="label">Amount (SOL)</label>
            <input
              className="input mono"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={investAmount}
              onChange={(e) => setInvestAmount(e.target.value)}
            />
          </div>

          {tokensPreview > 0 && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              border: '1px solid var(--border-grid)',
            }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                You will receive
              </div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {tokensPreview.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>tokens</span>
              </div>
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={handleInvest}
            disabled={submitting || !investAmount}
          >
            {submitting ? 'Processing...' : 'Invest Now'}
          </button>
        </>
      )}
    </div>
  );
}
