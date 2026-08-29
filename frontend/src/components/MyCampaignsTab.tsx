'use client';

import React, { useState } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BusinessData } from '../hooks/useBusinesses';
import { truncateAddress } from '../lib/format';
import type { DipProgram, AnchorWallet } from '../types/program';


export function MyCampaignsTab({
  businesses,
  loading,
  program,
  wallet,
  refresh,
  showToast,
}: {
  businesses: BusinessData[];
  loading: boolean;
  program: DipProgram;
  wallet: AnchorWallet;
  refresh: () => void;
  showToast: (type: string, message: string) => void;
}) {
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [dividendAmounts, setDividendAmounts] = useState<Record<string, string>>({});
  const [dividendInvestors, setDividendInvestors] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card"></div>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Campaigns</h3>
        <p>You haven&apos;t created any campaigns yet.</p>
      </div>
    );
  }

  const handleWithdraw = async (biz: BusinessData) => {
    if (!program || !wallet) return;
    const amount = parseFloat(withdrawAmounts[biz.publicKey] || '');
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
      setWithdrawAmounts((prev) => ({ ...prev, [biz.publicKey]: '' }));
      refresh();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Withdrawal failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDividend = async (biz: BusinessData) => {
    if (!program || !wallet) return;
    const amount = parseFloat(dividendAmounts[biz.publicKey] || '');
    const investorAddr = dividendInvestors[biz.publicKey] || '';
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
      setDividendAmounts((prev) => ({ ...prev, [biz.publicKey]: '' }));
      setDividendInvestors((prev) => ({ ...prev, [biz.publicKey]: '' }));
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Dividend distribution failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (biz: BusinessData) => {
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

      showToast('success', 'Invoice closed!');
      refresh();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Close failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {businesses.map((biz) => {
        const goalSol = biz.fundingGoal / 1e9;
        const raisedSol = biz.totalRaised / 1e9;
        const progress = biz.fundingGoal > 0 ? (biz.totalRaised / biz.fundingGoal) * 100 : 0;

        const statusBadge = biz.isClosed
          ? { className: 'badge badge-closed', label: 'Closed' }
          : biz.isFunded
          ? { className: 'badge badge-funded', label: 'Funded' }
          : { className: 'badge badge-funding', label: 'Funding' };

        return (
          <div key={biz.publicKey} className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                PDA: {truncateAddress(biz.publicKey)}
              </span>
              <span className={statusBadge.className}>{statusBadge.label}</span>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.85rem' }}>
                <span className="mono" style={{ color: 'var(--text-secondary)' }}>{raisedSol.toFixed(2)} / {goalSol.toFixed(2)} SOL</span>
                <span className="mono" style={{ fontWeight: 600 }}>{progress.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
              </div>
            </div>

            {/* Withdraw */}
            {biz.isFunded && !biz.isClosed && (
              <div className="action-card">
                <h3>Withdraw Funds</h3>
                <div className="action-row">
                  <div className="form-group">
                    <input
                      className="input mono"
                      type="number"
                      step="0.01"
                      placeholder="SOL amount"
                      value={withdrawAmounts[biz.publicKey] || ''}
                      onChange={(e) => setWithdrawAmounts((prev) => ({ ...prev, [biz.publicKey]: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleWithdraw(biz)}
                    disabled={actionLoading === `withdraw-${biz.publicKey}`}
                  >
                    {actionLoading === `withdraw-${biz.publicKey}` ? 'Processing...' : 'Withdraw'}
                  </button>
                </div>
              </div>
            )}

            {/* Distribute Dividends */}
            {biz.isFunded && !biz.isClosed && (
              <div className="action-card">
                <h3>Distribute Dividends</h3>
                <div className="form-group">
                  <input
                    className="input mono"
                    type="text"
                    placeholder="Investor wallet address"
                    value={dividendInvestors[biz.publicKey] || ''}
                    onChange={(e) => setDividendInvestors((prev) => ({ ...prev, [biz.publicKey]: e.target.value }))}
                  />
                </div>
                <div className="action-row">
                  <div className="form-group">
                    <input
                      className="input mono"
                      type="number"
                      step="0.01"
                      placeholder="SOL amount"
                      value={dividendAmounts[biz.publicKey] || ''}
                      onChange={(e) => setDividendAmounts((prev) => ({ ...prev, [biz.publicKey]: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => handleDividend(biz)}
                    disabled={actionLoading === `dividend-${biz.publicKey}`}
                  >
                    {actionLoading === `dividend-${biz.publicKey}` ? 'Processing...' : 'Distribute'}
                  </button>
                </div>
              </div>
            )}

            {/* Close Business */}
            {!biz.isClosed && (
              <div style={{ marginTop: 'var(--space-md)' }}>
                <button
                  className="btn-secondary"
                  onClick={() => handleClose(biz)}
                  disabled={actionLoading === `close-${biz.publicKey}`}
                  style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                >
                  {actionLoading === `close-${biz.publicKey}` ? 'Closing...' : 'Close Campaign'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
