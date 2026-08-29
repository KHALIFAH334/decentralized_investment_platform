'use client';

import React from 'react';
import Link from 'next/link';
import { useBusinesses } from '../../src/hooks/useBusinesses';
import { useAllBusinessMetadata } from '../../src/hooks/useBusinessMetadata';
import { truncateAddress } from '../../src/lib/format';


export default function HistoryPage() {
  const { businesses, loading, error } = useBusinesses();
  const { metadata, loading: metaLoading } = useAllBusinessMetadata();

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Campaign History</h1>
        <p>A historical record of all funded and closed campaigns on Anchor Capital.</p>
      </div>

      {error && (
        <div className="toast toast-error" style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
          Error loading history: {error}
        </div>
      )}

      {(loading || metaLoading) ? (
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 60, marginBottom: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}></div>
          ))}
        </div>
      ) : (
        (() => {
          // Filter for past campaigns (either fully funded or closed/expired)
          const pastCampaigns = businesses.filter(biz => biz.isFunded || biz.isClosed);
          
          if (pastCampaigns.length === 0) {
            return (
              <div className="empty-state">
                <h3>No Historical Data</h3>
                <p>There are currently no completed or closed campaigns on the platform.</p>
              </div>
            );
          }

          return (
            <div className="data-grid-desktop">
              <table className="data-grid">
                <thead>
                  <tr>
                    <th>CAMPAIGN NAME</th>
                    <th>CREATED BY (DEBTOR)</th>
                    <th>SECTOR</th>
                    <th className="align-right">TARGET (SOL)</th>
                    <th className="align-right">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {pastCampaigns.map((biz) => {
                    const meta = metadata[biz.publicKey];
                    const goalSol = biz.fundingGoal / 1e9;
                    
                    const statusBadge = biz.isClosed
                      ? { className: 'badge badge-closed', label: 'Closed' }
                      : { className: 'badge badge-funded', label: 'Funded' };

                    return (
                      <tr key={biz.publicKey}>
                        <td>
                          <div className="entity-name">
                            <Link href={`/businesses/${biz.publicKey}`} style={{ color: 'inherit' }}>
                              {meta?.name || 'Unnamed Campaign'}
                            </Link>
                          </div>
                          <div className="entity-sub mono" style={{ fontSize: '0.7rem' }}>PDA: {truncateAddress(biz.publicKey)}</div>
                        </td>
                        <td>
                          <div className="mono" style={{ fontWeight: 600 }}>{truncateAddress(biz.owner)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wallet Address</div>
                        </td>
                        <td>{meta?.category || '—'}</td>
                        <td className="mono align-right">{goalSol.toFixed(2)}</td>
                        <td className="align-right">
                          <span className={statusBadge.className}>{statusBadge.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()
      )}
    </div>
  );
}
