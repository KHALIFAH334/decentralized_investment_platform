'use client';

import React from 'react';
import Link from 'next/link';
import { useBusinesses } from '../../src/hooks/useBusinesses';
import BusinessCard from '../../src/components/BusinessCard';

export default function BusinessesPage() {
  const { businesses, loading, error } = useBusinesses();

  return (
    <div className="container py-10">
      <div className="page-header mb-10 text-center fade-in">
        <h1 className="text-4xl font-bold mb-4 gradient-text">Investment Opportunities</h1>
        <p className="text-gray-400 text-lg">Discover and invest in decentralized businesses</p>
      </div>

      {error && (
        <div className="toast toast-error mb-8 p-4 bg-red-900 border border-red-500 rounded text-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton skeleton-card h-48 rounded-xl bg-gray-800 animate-pulse"></div>
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <div className="empty-state card text-center py-20 fade-in">
          <h2 className="text-2xl font-bold mb-4">No businesses listed yet</h2>
          <p className="text-gray-400 mb-6">Be the first to create a decentralized business!</p>
          <Link href="/create" className="btn-primary inline-block">
            Create Business
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <BusinessCard key={business.publicKey} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
