'use client';

import React from 'react';
import Link from 'next/link';
import { useBusinesses } from '../../src/hooks/useBusinesses';
import { useAllBusinessMetadata } from '../../src/hooks/useBusinessMetadata';

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function MarketplacePage() {
  const { businesses, loading, error } = useBusinesses();
  const { metadata, loading: metaLoading } = useAllBusinessMetadata();

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>MarketPlace</h1>
        <p>Active, approved MSME campaigns on Solana Devnet.</p>
      </div>

      {error && (
        <div className="toast toast-error" style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
          Error loading data: {error}
        </div>
      )}

      {(loading || metaLoading) ? (
        <div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, marginBottom: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}></div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="empty-state">
          <h3>No listings yet</h3>
          <p>Be the first to raise capital for your business.</p>
          <Link href="/create" className="btn-primary">List Your Business</Link>
        </div>
      ) : (
        (() => {
          const approvedBusinesses = businesses.filter(biz => metadata[biz.publicKey]?.is_approved);
          if (approvedBusinesses.length === 0) {
            return (
              <div className="empty-state">
                <h3>No approved campaigns</h3>
                <p>Campaigns are currently under review by administrators.</p>
              </div>
            );
          }
          return (
            <>
              {/* Desktop Table */}
          <div className="data-grid-desktop">
            <table className="data-grid">
              <thead>
                <tr>
                  <th>DEBTOR / COMPANY</th>
                  <th>SECTOR</th>
                  <th className="align-right">TARGET (SOL)</th>
                  <th className="align-right">RAISED (%)</th>
                  <th>PROGRESS</th>
                  <th className="align-right">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {approvedBusinesses.map((biz) => {
                  const meta = metadata[biz.publicKey];
                  const goalSol = biz.fundingGoal / 1e9;
                  const progress = biz.fundingGoal > 0
                    ? Math.min((biz.totalRaised / biz.fundingGoal) * 100, 100)
                    : 0;

                  const statusBadge = biz.isClosed
                    ? { className: 'badge badge-closed', label: 'Closed' }
                    : biz.isFunded
                    ? { className: 'badge badge-funded', label: 'Funded' }
                    : { className: 'badge badge-funding', label: 'Funding' };

                  return (
                    <tr key={biz.publicKey}>
                      <td>
                        <div className="entity-name">{meta?.name || 'Unnamed Entity'}</div>
                        <div className="entity-sub mono">{truncateAddress(biz.owner)}</div>
                      </td>
                      <td>{meta?.category || '—'}</td>
                      <td className="mono align-right">{goalSol.toFixed(2)}</td>
                      <td className="mono align-right">
                        {progress.toFixed(1)}%
                        <span style={{ marginLeft: 6 }} className={statusBadge.className}>{statusBadge.label}</span>
                      </td>
                      <td>
                        <div className="progress-bar" style={{ width: 120, display: 'inline-block' }}>
                          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </td>
                      <td className="align-right">
                        <Link
                          href={`/businesses/${biz.publicKey}`}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="data-grid-mobile">
            {approvedBusinesses.map((biz) => {
              const meta = metadata[biz.publicKey];
              const goalSol = biz.fundingGoal / 1e9;
              const progress = biz.fundingGoal > 0
                ? Math.min((biz.totalRaised / biz.fundingGoal) * 100, 100)
                : 0;

              const statusBadge = biz.isClosed
                ? { className: 'badge badge-closed', label: 'Closed' }
                : biz.isFunded
                ? { className: 'badge badge-funded', label: 'Funded' }
                : { className: 'badge badge-funding', label: 'Funding' };

              return (
                <div key={biz.publicKey} className="data-grid-card">
                  <div className="data-grid-card-header">
                    <strong>{meta?.name || 'Unnamed Debtor'}</strong>
                    <span className={statusBadge.className}>{statusBadge.label}</span>
                  </div>

                  <div className="data-grid-card-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Sector</span>
                    <span>{meta?.category || '—'}</span>
                  </div>
                  <div className="data-grid-card-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Target</span>
                    <span className="mono">{goalSol.toFixed(2)} SOL</span>
                  </div>
                  <div className="data-grid-card-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Raised</span>
                    <span className="mono">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="data-grid-card-row">
                    <span style={{ color: 'var(--text-secondary)' }}>Owner</span>
                    <span className="mono">{truncateAddress(biz.owner)}</span>
                  </div>

                  <div className="progress-bar" style={{ margin: 'var(--space-md) 0' }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>

                  <Link
                    href={`/businesses/${biz.publicKey}`}
                    className="btn-secondary"
                    style={{ display: 'block', textAlign: 'center', padding: '8px' }}
                  >
                    View Details →
                  </Link>
                </div>
              );
            })}
          </div>
            </>
          );
        })()
      )}
    </div>
  );
}
