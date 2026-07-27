'use client';

import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer" id="developer">
      <div className="container">
        <div className="footer-developer">
          <div className="footer-developer-column">
            <h3>PROJECT SPECS</h3>
            <div className="footer-developer-item">
              <span>Framework:</span> Next.js 16 (App Router)
            </div>
            <div className="footer-developer-item">
              <span>Blockchain:</span> Solana (Devnet)
            </div>
            <div className="footer-developer-item">
              <span>Smart Contract:</span> Anchor 1.1.2
            </div>
            <div className="footer-developer-item">
              <span>Token Standard:</span> SPL Token-2022
            </div>
            <div className="footer-developer-item">
              <span>Database:</span> Supabase (PostgreSQL)
            </div>
          </div>
          
          <div className="footer-developer-column">
            <h3>CONTACT & LINKS</h3>
            <div className="footer-developer-item">
              <span>GitHub:</span> <a href="https://github.com/khalifah334" target="_blank" rel="noopener noreferrer">github.com/khalifah334</a>
            </div>
            <div className="footer-developer-item">
              <span>Email:</span> <a href="mailto:khalifah334@example.com">khalifah334@example.com</a>
            </div>
            <div className="footer-developer-item">
              <span>Devnet Wallet:</span> <span className="mono">6CuFC2...BMEJn</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bar">
        <div className="container">
          <div className="footer-bar-inner">
            <div className="footer-bar-left">
              <Logo compact={true} />
              <span>© 2026 Anchor Capital</span>
            </div>
            <div className="footer-bar-right">
              <span className="status-dot"></span>
              <span>Devnet Status: Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
