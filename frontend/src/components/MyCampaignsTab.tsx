'use client';

import React, { useState } from 'react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { BusinessData } from '../hooks/useBusinesses';
import { truncateAddress } from '../lib/format';
import type { DipProgram, AnchorWallet } from '../types/program';
import { useCampaignActions } from '../hooks/useCampaignActions';


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

  const { withdraw, distributeDividend, closeBusiness, actionLoading } = useCampaignActions(
    program,
    wallet,
    refresh,
    showToast
  );

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
    const amountStr = withdrawAmounts[biz.publicKey] || '';
    const success = await withdraw(biz, amountStr);
    if (success) {
      setWithdrawAmounts((prev) => ({ ...prev, [biz.publicKey]: '' }));
    }
  };

  const handleDividend = async (biz: BusinessData) => {
    const amountStr = dividendAmounts[biz.publicKey] || '';
    const investorAddr = dividendInvestors[biz.publicKey] || '';
    const success = await distributeDividend(biz, amountStr, investorAddr);
    if (success) {
      setDividendAmounts((prev) => ({ ...prev, [biz.publicKey]: '' }));
      setDividendInvestors((prev) => ({ ...prev, [biz.publicKey]: '' }));
    }
  };

  const handleClose = async (biz: BusinessData) => {
    await closeBusiness(biz);
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
