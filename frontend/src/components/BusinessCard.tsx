'use client';

import React from 'react';
import Link from 'next/link';
import { BusinessData } from '../../src/hooks/useBusinesses';
import { BusinessMetadata } from '../../src/hooks/useBusinessMetadata';
import { truncateAddress } from '../lib/format';

interface BusinessCardProps {
  business: BusinessData;
  metadata?: BusinessMetadata;
}


export default function BusinessCard({ business, metadata }: BusinessCardProps) {
  const goalSol = business.fundingGoal / 1e9;
  const raisedSol = business.totalRaised / 1e9;
  const progress = business.fundingGoal > 0 
    ? Math.min((business.totalRaised / business.fundingGoal) * 100, 100) 
    : 0;

  const statusBadge = business.isClosed
    ? { className: 'badge badge-closed', label: 'Closed' }
    : business.isFunded
    ? { className: 'badge badge-funded', label: 'Funded' }
    : { className: 'badge badge-funding', label: 'Funding' };

  return (
    <Link href={`/businesses/${business.publicKey}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        {metadata?.image_url ? (
          <div style={{ width: '100%', height: '140px', backgroundImage: `url(${metadata.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        ) : (
          <div style={{ width: '100%', height: '140px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
        )}
        <div style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{metadata?.name || 'Unnamed Business'}</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 2 }}>
                {metadata?.category ? <span className="badge" style={{ padding: '2px 8px', fontSize: '0.7rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', marginRight: 6 }}>{metadata.category}</span> : null}
                Owner: {truncateAddress(business.owner)}
              </div>
            </div>
            <span className={statusBadge.className}>{statusBadge.label}</span>
          </div>

          {metadata?.description && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 'var(--space-md)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {metadata.description}
            </p>
          )}

        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Progress</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{progress.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Raised</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{raisedSol.toFixed(2)} SOL</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Goal</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{goalSol.toFixed(2)} SOL</div>
          </div>
        </div>

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Equity offered: <strong style={{ color: 'var(--text)' }}>{business.equityPercentage}%</strong>
        </div>
        </div>
      </div>
    </Link>
  );
}
