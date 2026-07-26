'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '../../src/hooks/useProgram';
import { useBusinesses, BusinessData } from '../../src/hooks/useBusinesses';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useTokenPortfolio } from '../../src/hooks/useTokenPortfolio';
import { useAllBusinessMetadata, BusinessMetadata } from '../../src/hooks/useBusinessMetadata';

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { program, wallet } = useProgram();
  const { businesses, loading, refresh } = useBusinesses();
  const [activeTab, setActiveTab] = useState<'businesses' | 'investments'>('businesses');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  if (!publicKey) {
    return (
      <div className="container">
        <div className="empty-state" style={{ marginTop: 'var(--space-3xl)' }}>
          <h3>Connect Your Wallet</h3>
          <p>Connect your Solana wallet to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const myBusinesses = businesses.filter((b) => b.owner === publicKey.toBase58());

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Manage your businesses and investments.</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          My Businesses ({myBusinesses.length})
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          My Investments
        </button>
      </div>

      {activeTab === 'businesses' && (
        <MyBusinessesTab
          businesses={myBusinesses}
          loading={loading}
          program={program}
          wallet={wallet}
          refresh={refresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'investments' && (
        <MyInvestmentsTab />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function MyInvestmentsTab() {
  const { holdings, loading: tokenLoading } = useTokenPortfolio();
  const { businesses, loading: bizLoading } = useBusinesses();
  const { metadata, loading: metaLoading } = useAllBusinessMetadata();

  if (tokenLoading || bizLoading || metaLoading) {
    return (
      <div className="grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton skeleton-card"></div>
        ))}
      </div>
    );
  }

  // Filter token holdings to only include those that match a business on our platform
  const investedBusinesses = businesses.filter(biz => holdings[biz.mintKey]);

  if (investedBusinesses.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Investments Found</h3>
        <p>You haven't invested in any businesses on the platform yet.</p>
      </div>
    );
  }

  return (
    <div className="grid">
      {investedBusinesses.map(biz => {
        const holding = holdings[biz.mintKey];
        const meta = metadata[biz.publicKey];
        const tokenSupplyUi = biz.totalEquityTokens / 1e6;
        const ownershipPercentage = ((holding.balance / tokenSupplyUi) * 100).toFixed(2);

        return (
          <div key={biz.publicKey} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {meta?.image_url ? (
              <div style={{ width: '100%', height: '140px', backgroundImage: `url(${meta.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            ) : (
              <div style={{ width: '100%', height: '140px', background: 'var(--bg-surface)' }}></div>
            )}
            <div style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ margin: '0 0 var(--space-xs)', fontSize: '1.2rem' }}>{meta?.name || 'Unnamed Business'}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-lg)' }}>
                {meta?.category || 'Uncategorized'}
              </div>
              
              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Your Balance</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }} className="gradient-text">
                  <span className="gradient-text">{holding.balance.toLocaleString()}</span> tokens
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ownership Stake</span>
                <span style={{ fontWeight: 600 }}>{ownershipPercentage}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MyBusinessesTab({
  businesses,
  loading,
  program,
  wallet,
  refresh,
  showToast,
}: {
  businesses: BusinessData[];
  loading: boolean;
  program: any;
  wallet: any;
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
        <h3>No Businesses</h3>
        <p>You haven&apos;t created any business listings yet.</p>
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
    } catch (e: any) {
      showToast('error', e.message || 'Withdrawal failed');
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
    } catch (e: any) {
      showToast('error', e.message || 'Dividend distribution failed');
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

      showToast('success', 'Business closed!');
      refresh();
    } catch (e: any) {
      showToast('error', e.message || 'Close failed');
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
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  PDA: {truncateAddress(biz.publicKey)}
                </span>
              </div>
              <span className={statusBadge.className}>{statusBadge.label}</span>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{raisedSol.toFixed(2)} / {goalSol.toFixed(2)} SOL</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{progress.toFixed(1)}%</span>
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
                      className="input"
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
                    className="input"
                    type="text"
                    placeholder="Investor wallet address"
                    value={dividendInvestors[biz.publicKey] || ''}
                    onChange={(e) => setDividendInvestors((prev) => ({ ...prev, [biz.publicKey]: e.target.value }))}
                  />
                </div>
                <div className="action-row">
                  <div className="form-group">
                    <input
                      className="input"
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
                  {actionLoading === `close-${biz.publicKey}` ? 'Closing...' : 'Close Business'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
