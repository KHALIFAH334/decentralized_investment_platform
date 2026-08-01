'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '../../src/hooks/useProgram';
import { useBusinesses, BusinessData } from '../../src/hooks/useBusinesses';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useTokenPortfolio } from '../../src/hooks/useTokenPortfolio';
import { useAllBusinessMetadata } from '../../src/hooks/useBusinessMetadata';

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
        <div className="empty-state">
          <h3>Connect Your Wallet</h3>
          <p>Connect your Solana wallet to view your factoring portfolio.</p>
        </div>
      </div>
    );
  }

  const myBusinesses = businesses.filter((b) => b.owner === publicKey.toBase58());

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Portfolio</h1>
        <p>Manage your invoices and factoring portfolio.</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          My Invoices ({myBusinesses.length})
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

  const investedBusinesses = businesses.filter(biz => holdings[biz.mintKey]);

  if (investedBusinesses.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Factored Invoices Found</h3>
        <p>You haven&apos;t factored any invoices on the platform yet.</p>
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
              <div style={{ width: '100%', height: '120px', backgroundImage: `url(${meta.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            ) : (
              <div style={{ width: '100%', height: '120px', background: 'var(--bg-surface)' }}></div>
            )}
            <div style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ margin: '0 0 var(--space-xs)', fontSize: '1rem', fontWeight: 700 }}>{meta?.name || 'Unnamed Debtor'}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 'var(--space-lg)', fontWeight: 500 }}>
                {meta?.category || 'Uncategorized'}
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-grid)', marginBottom: 'var(--space-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your Balance</div>
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {holding.balance.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>tokens</span>
                </div>
              </div>

              <div className="detail-stat" style={{ borderBottom: 'none', fontSize: '0.85rem' }}>
                <span className="detail-stat-label">Yield Stake</span>
                <span className="detail-stat-value">{ownershipPercentage}%</span>
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
        <h3>No Invoices</h3>
        <p>You haven&apos;t listed any invoices yet.</p>
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

      showToast('success', 'Invoice closed!');
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
                  {actionLoading === `close-${biz.publicKey}` ? 'Closing...' : 'Close Invoice'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
