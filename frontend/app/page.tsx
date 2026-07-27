'use client'

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [sliderValue, setSliderValue] = useState(50);

  return (
    <div className="container">
      <div className="hero fade-in">
        <h1>Institutional On-Chain<br />Equity Raising.</h1>
        <p>Anchor Capital brings fractional equity investing to Solana. Fund local businesses, receive tokenized equity, earn dividends all on-chain.</p>
        <div className="hero-buttons">
          <Link href="/businesses" className="btn-primary">Browse Marketplace</Link>
          <Link href="/create" className="btn-secondary">List Your Business</Link>
        </div>
      </div>

      <div className="stat-ticker">
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">TOTAL RAISED</div>
          <div className="stat-ticker-value mono">127.4 SOL</div>
          <div className="stat-ticker-sub">+12.3 this week</div>
        </div>
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">ACTIVE LISTINGS</div>
          <div className="stat-ticker-value mono">24</div>
          <div className="stat-ticker-sub">8 funding</div>
        </div>
        <div className="stat-ticker-item">
          <div className="stat-ticker-label">EQUITY DISTRIBUTED</div>
          <div className="stat-ticker-value mono">2.4M tokens</div>
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
              <div className="flashcard-title">The Equity Tokenizer</div>
              <div className="flashcard-desc">Token-2022 minting turns your company's equity into tradable, fractional assets directly on-chain.</div>
            </div>
            <div className="flashcard-back" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <pre className="mono" style={{ fontSize: '0.75rem', textAlign: 'left', whiteSpace: 'pre-wrap', overflowX: 'hidden' }}>
                <code>{`pub fn initialize_business(
  ctx: Context<InitBusiness>,
  funding_goal: u64,
  equity_pct: u8,
  total_tokens: u64,
) -> Result<()>`}</code>
              </pre>
            </div>
          </div>
        </div>

        <div className="flashcard">
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="flashcard-number mono">02</div>
              <div className="flashcard-icon">💰</div>
              <div className="flashcard-title">Automated Dividend Vault</div>
              <div className="flashcard-desc">Distribute dividends to all your token holders automatically using our program vaults.</div>
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
