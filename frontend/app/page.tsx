'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="container">
      <div className="hero fade-in relative overflow-hidden py-20 text-center">
        <div className="hero-orb absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          <span className="gradient-text">Invest in Local Businesses.</span>
          <br /> On-Chain.
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          A decentralized platform powered by Solana. Earn equity tokens, receive dividends, trade freely.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/businesses" className="btn-primary">
            Explore Businesses
          </Link>
          <Link href="/create" className="btn-secondary">
            List Your Business
          </Link>
        </div>
      </div>

      <div className="py-20">
        <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="feature-card card text-center p-8">
            <div className="feature-icon text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">Trustless Escrow</h3>
            <p className="text-gray-400">Funds are locked securely in smart contracts until goals are met.</p>
          </div>
          <div className="feature-card card text-center p-8">
            <div className="feature-icon text-4xl mb-4">🪙</div>
            <h3 className="text-xl font-bold mb-2">Token-2022 Equity</h3>
            <p className="text-gray-400">Receive standard token extensions representing your equity stake.</p>
          </div>
          <div className="feature-card card text-center p-8">
            <div className="feature-icon text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Automatic Dividends</h3>
            <p className="text-gray-400">Receive payouts directly to your wallet based on your token holdings.</p>
          </div>
        </div>

        <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-gray-900 bg-opacity-50 rounded-2xl p-10 border border-gray-800">
          <div className="stat-item">
            <div className="stat-value text-4xl font-extrabold gradient-text mb-2">50+ SOL Invested</div>
            <div className="stat-label text-gray-400 uppercase tracking-widest text-sm">Total Volume</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-4xl font-extrabold gradient-text mb-2">12 Businesses</div>
            <div className="stat-label text-gray-400 uppercase tracking-widest text-sm">Funded Projects</div>
          </div>
          <div className="stat-item">
            <div className="stat-value text-4xl font-extrabold gradient-text mb-2">89 Investors</div>
            <div className="stat-label text-gray-400 uppercase tracking-widest text-sm">Active Users</div>
          </div>
        </div>
      </div>
    </div>
  );
}
