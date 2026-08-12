'use client';

import React from 'react';
import { useTokenPortfolio } from '../hooks/useTokenPortfolio';
import { useBusinesses } from '../hooks/useBusinesses';
import { useAllBusinessMetadata } from '../hooks/useBusinessMetadata';

export function MyInvestmentsTab() {
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
        <h3>No Investments Found</h3>
        <p>You haven&apos;t factored any campaigns on the platform yet.</p>
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

              <div className="detail-stat" style={{ fontSize: '0.85rem' }}>
                <span className="detail-stat-label">Yield Stake</span>
                <span className="detail-stat-value">{ownershipPercentage}%</span>
              </div>
              <div className="detail-stat" style={{ borderBottom: 'none', fontSize: '0.85rem' }}>
                <span className="detail-stat-label">Performance</span>
                <span className="detail-stat-value" style={{ color: biz.isFunded ? 'var(--success)' : 'inherit' }}>
                  Expected: {biz.equityPercentage}% | Actual: {biz.isFunded ? biz.equityPercentage : 0}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
