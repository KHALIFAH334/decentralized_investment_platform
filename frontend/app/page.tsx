'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="container">
      <div className="hero fade-in">
        <div className="hero-orb"></div>
        <h1>
          <span className="gradient-text">Invest in Local Businesses.</span>
          <br /> On-Chain.
        </h1>
        <p>
          A decentralized platform powered by Solana. Earn equity tokens, receive dividends, trade freely.
        </p>
        <div className="hero-buttons">
          <Link href="/businesses" className="btn-primary">
            Explore Businesses
          </Link>
          <Link href="/create" className="btn-secondary">
            List Your Business
          </Link>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card card">
          <div className="feature-icon">🔐</div>
          <h3>Trustless Escrow</h3>
          <p>Funds are locked securely in smart contracts until goals are met.</p>
        </div>
        <div className="feature-card card">
          <div className="feature-icon">🪙</div>
          <h3>Token-2022 Equity</h3>
          <p>Receive standard token extensions representing your equity stake.</p>
        </div>
        <div className="feature-card card">
          <div className="feature-icon">💰</div>
          <h3>Automatic Dividends</h3>
          <p>Receive payouts directly to your wallet based on your token holdings.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value gradient-text">50+ SOL</div>
          <div className="stat-label">Total Invested</div>
        </div>
        <div className="stat-item">
          <div className="stat-value gradient-text">12</div>
          <div className="stat-label">Businesses Listed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value gradient-text">89</div>
          <div className="stat-label">Active Investors</div>
        </div>
      </div>
    </div>
  );
}
