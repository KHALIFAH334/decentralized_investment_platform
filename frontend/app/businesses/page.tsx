'use client';

import React from 'react';
import { useBusinesses } from '../../src/hooks/useBusinesses';
import { useAllBusinessMetadata } from '../../src/hooks/useBusinessMetadata';
import BusinessCard from '../../src/components/BusinessCard';
import Link from 'next/link';

export default function BusinessesPage() {
  const { businesses, loading, error } = useBusinesses();
  const { metadata, loading: metaLoading } = useAllBusinessMetadata();

  return (
    <div className="container">
      <div className="page-header">
        <h1>Investment Opportunities</h1>
        <p>Browse businesses seeking funding on the Solana blockchain.</p>
      </div>

      {error && (
        <div className="toast toast-error" style={{ position: 'relative', marginBottom: 'var(--space-lg)' }}>
          Error loading businesses: {error}
        </div>
      )}

      {(loading || metaLoading) ? (
        <div className="grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="empty-state">
          <h3>No businesses listed yet</h3>
          <p>Be the first to list your business on InvestBlock.</p>
          <Link href="/create" className="btn-primary">
            List Your Business
          </Link>
        </div>
      ) : (
        <div className="grid">
          {businesses.map((biz) => (
            <BusinessCard key={biz.publicKey} business={biz} metadata={metadata[biz.publicKey]} />
          ))}
        </div>
      )}
    </div>
  );
}
