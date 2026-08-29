'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useProgram } from '../../../src/hooks/useProgram';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { useBusinessMetadata } from '../../../src/hooks/useBusinessMetadata';
import { InvestmentSidebar } from '../../../src/components/InvestmentSidebar';

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

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { program, wallet } = useProgram();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const { data: metadata, loading: metaLoading } = useBusinessMetadata(id);

  const fetchBusiness = useCallback(async () => {
    if (!program || !id) return;
    try {
      setLoading(true);
      const pubkey = new PublicKey(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const account = await (program.account as any).businessState.fetch(pubkey) as Record<string, unknown>;
      setBusiness({
        publicKey: id,
        owner: (account.owner as { toBase58(): string }).toBase58(),
        fundingGoal: Number(account.fundingGoal),
        totalRaised: Number(account.totalRaised),
        equityPercentage: account.equityPercentage as number,
        totalEquityTokens: Number(account.totalEquityTokens),
        isFunded: account.isFunded as boolean,
        isClosed: account.isClosed as boolean,
        mintKey: (account.mintKey as { toBase58(): string }).toBase58(),
      });
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [program, id]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  if (loading || metaLoading) {
    return (
      <div className="container">
        <div style={{ paddingTop: 'var(--space-2xl)' }}>
          <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 'var(--space-lg)' }}></div>
          <div className="skeleton" style={{ height: 360 }}></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Campaign not found</h3>
          <p>This listing does not exist or has been removed.</p>
          <Link href="/businesses" className="btn-primary">Back to MarketPlace</Link>
        </div>
      </div>
    );
  }

  const goalSol = business.fundingGoal / 1e9;
  const raisedSol = business.totalRaised / 1e9;
  const progress = business.fundingGoal > 0 ? Math.min((business.totalRaised / business.fundingGoal) * 100, 100) : 0;

  const statusBadge = business.isClosed
    ? { className: 'badge badge-closed', label: 'Closed' }
    : business.isFunded
    ? { className: 'badge badge-funded', label: 'Funded' }
    : { className: 'badge badge-funding', label: 'Funding' };

  return (
    <div className="container fade-in">
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <Link href="/businesses" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
          ← Back to MarketPlace
        </Link>
      </div>

      <div className="detail-layout">
        <div>
          {metadata?.image_url && (
            <div style={{
              width: '100%',
              height: '280px',
              backgroundImage: `url(${metadata.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-xl)',
              border: '1px solid var(--border-grid)',
            }}></div>
          )}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                  {metadata?.name || 'Campaign Details'}
                </h1>
                {metadata?.category && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
                    {metadata.category}
                  </div>
                )}
              </div>
              <span className={statusBadge.className}>{statusBadge.label}</span>
            </div>

            {metadata?.description && (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-xl)', fontSize: '0.9rem' }}>
                {metadata.description.split('\n').map((line: string, i: number) => (
                  <p key={i} style={{ marginBottom: line ? '0.5rem' : 0 }}>{line}</p>
                ))}
              </div>
            )}

            {metadata?.website_url && (
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <a href={metadata.website_url} target="_blank" rel="noopener noreferrer"
                  style={{ color: 'var(--accent-link)', fontSize: '0.85rem', fontWeight: 500 }}>
                  Visit Website ↗
                </a>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Funding Progress</span>
                <span className="mono" style={{ fontWeight: 600 }}>{progress.toFixed(1)}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span className="mono">{raisedSol.toFixed(2)} SOL raised</span>
                <span className="mono">{goalSol.toFixed(2)} SOL goal</span>
              </div>
            </div>

            <div className="detail-stat">
              <span className="detail-stat-label">Owner</span>
              <span className="detail-stat-value">{truncateAddress(business.owner)}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Discount Yield</span>
              <span className="detail-stat-value">{business.equityPercentage}%</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Total Yield Tokens</span>
              <span className="detail-stat-value">{(business.totalEquityTokens / 1e6).toLocaleString()}</span>
            </div>
            <div className="detail-stat" style={{ borderBottom: 'none' }}>
              <span className="detail-stat-label">Mint Address</span>
              <span className="detail-stat-value">{truncateAddress(business.mintKey)}</span>
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <InvestmentSidebar
            business={business}
            program={program}
            wallet={wallet!}
            onSuccess={fetchBusiness}
            showToast={showToast}
          />
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
