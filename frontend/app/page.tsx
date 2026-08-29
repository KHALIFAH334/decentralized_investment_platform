'use client'

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useBusinesses } from '../src/hooks/useBusinesses';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function LandingPage() {
  const [sliderValue, setSliderValue] = useState(50);
  const { businesses, loading } = useBusinesses();

  const stats = useMemo(() => {
    if (loading || businesses.length === 0) {
      return { totalRaised: '...', activeListings: '...', funding: '...', totalTokens: '...' };
    }
    
    const totalRaisedLamports = businesses.reduce((acc, b) => acc + b.totalRaised, 0);
    const totalRaisedSol = (totalRaisedLamports / LAMPORTS_PER_SOL).toFixed(1);
    
    const activeCount = businesses.filter(b => !b.isClosed).length;
    const fundingCount = businesses.filter(b => !b.isClosed && !b.isFunded).length;
    
    // totalTokens are stored with 6 decimals in the state/metadata, but let's just sum and format for display
    const totalTokensRaw = businesses.reduce((acc, b) => acc + b.totalEquityTokens, 0);
    // Assuming 6 decimals, divided by 1M gives full tokens. Then formatted to millions for display if very large.
    // However, the input in create page is already raw token count which is then multiplied by 1e6 before sending to program.
    // In useBusinesses, totalEquityTokens is the raw BN value. Let's convert back.
    const fullTokens = totalTokensRaw / 1e6;
    let tokensDisplay = fullTokens.toLocaleString();
    if (fullTokens >= 1_000_000) {
      tokensDisplay = (fullTokens / 1_000_000).toFixed(1) + 'M';
    } else if (fullTokens >= 1_000) {
      tokensDisplay = (fullTokens / 1_000).toFixed(1) + 'K';
    }

    return {
      totalRaised: `${totalRaisedSol} SOL`,
      activeListings: activeCount.toString(),
      funding: `${fundingCount} funding`,
      totalTokens: `${tokensDisplay} tokens`
    };
  }, [businesses, loading]);

  return (
    <div className="container">
      <div className="hero fade-in">
        <h1>Institutional On-Chain<br />Debt Factoring.</h1>
        <p>Anchor Capital brings MSME invoice factoring to Solana. Fund unpaid invoices, receive tokenized yield assets, and earn returns all on-chain.</p>
        <div className="hero-buttons">
          <Link href="/businesses" className="btn-primary">Browse Invoices</Link>
          <Link href="/create" className="btn-secondary">Factor Your Invoice</Link>
        </div>
      </div>

      <div className="stat-ticker">
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">TOTAL RAISED</div>
          <div className="stat-ticker-value mono">{stats.totalRaised}</div>
          <div className="stat-ticker-sub">Real-time on-chain</div>
        </div>
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">ACTIVE LISTINGS</div>
          <div className="stat-ticker-value mono">{stats.activeListings}</div>
          <div className="stat-ticker-sub">{stats.funding}</div>
        </div>
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">YIELD ASSETS DISTRIBUTED</div>
          <div className="stat-ticker-value mono">{stats.totalTokens}</div>
          <div className="stat-ticker-sub">Token-2022</div>
        </div>
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">NETWORK</div>
          <div className="stat-ticker-value mono">Solana Devnet</div>
          <div className="stat-ticker-sub">~400ms finality</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-lg)', marginTop: 'var(--space-3xl)', textAlign: 'center' }}>How It Works</h2>

      <div className="flashcard-grid">
        <div className="flashcard">
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="flashcard-number mono">01</div>
              <div className="flashcard-icon">⚡</div>
              <div className="flashcard-title">The Debt Tokenizer</div>
              <div className="flashcard-desc">Token-2022 minting turns your company's unpaid invoices into tradable, fractional yield assets directly on-chain.</div>
            </div>
            <div className="flashcard-back" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Smart contracts automatically handle the tokenization, escrow, and dividend distribution without intermediaries.
              </div>
            </div>
          </div>
        </div>

        <div className="flashcard">
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="flashcard-number mono">02</div>
              <div className="flashcard-icon">💰</div>
              <div className="flashcard-title">Automated Yield Vault</div>
              <div className="flashcard-desc">Distribute yield to all your token holders automatically using our trustless PDA escrow vaults.</div>
            </div>
            <div className="flashcard-back" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
               <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                 <div className="mono" style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>ESTIMATED RETURN (12.7% APY)</div>
                 <div className="flashcard-slider-value mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                   {(sliderValue * 0.127).toFixed(3)} SOL
                 </div>
               </div>
               <input 
                 type="range" 
                 className="flashcard-slider" 
                 min="0" 
                 max="100" 
                 step="1" 
                 value={sliderValue} 
                 onChange={(e) => setSliderValue(parseInt(e.target.value))}
                 style={{ width: '80%' }}
               />
               <div className="mono" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Investment: {sliderValue} SOL</div>
            </div>
          </div>
        </div>

        <div className="flashcard">
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="flashcard-number mono">03</div>
              <div className="flashcard-icon">📊</div>
              <div className="flashcard-title">Immutable Cap Tables</div>
              <div className="flashcard-desc">Your cap table is managed automatically on-chain, providing full transparency to all stakeholders.</div>
            </div>
            <div className="flashcard-back" style={{ padding: '1rem', display: 'flex', alignItems: 'center' }}>
               <table className="flashcard-table mono" style={{ fontSize: '0.7rem', width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                 <thead>
                   <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                     <th style={{ padding: '4px 0' }}>HOLDER</th>
                     <th style={{ padding: '4px 0', textAlign: 'right' }}>TOKENS</th>
                     <th style={{ padding: '4px 0', textAlign: 'right' }}>STAKE</th>
                   </tr>
                 </thead>
                 <tbody>
                   <tr><td style={{ padding: '4px 0' }}>7xKp...2nFq</td><td style={{ padding: '4px 0', textAlign: 'right' }}>250,000</td><td style={{ padding: '4px 0', textAlign: 'right' }}>25.0%</td></tr>
                   <tr><td style={{ padding: '4px 0' }}>3mRd...8vWj</td><td style={{ padding: '4px 0', textAlign: 'right' }}>180,000</td><td style={{ padding: '4px 0', textAlign: 'right' }}>18.0%</td></tr>
                   <tr><td style={{ padding: '4px 0' }}>9aLt...4xBn</td><td style={{ padding: '4px 0', textAlign: 'right' }}>120,000</td><td style={{ padding: '4px 0', textAlign: 'right' }}>12.0%</td></tr>
                   <tr><td style={{ padding: '4px 0' }}>5fGh...1mYk</td><td style={{ padding: '4px 0', textAlign: 'right' }}>450,000</td><td style={{ padding: '4px 0', textAlign: 'right' }}>45.0%</td></tr>
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
