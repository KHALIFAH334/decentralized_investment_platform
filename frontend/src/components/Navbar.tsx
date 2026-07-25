'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          💎 <span className="gradient-text">InvestBlock</span>
        </Link>
        <ul className="navbar-links">
          <li>
            <Link href="/" className={pathname === '/' ? 'active' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/businesses" className={pathname === '/businesses' ? 'active' : ''}>
              Businesses
            </Link>
          </li>
          <li>
            <Link href="/create" className={pathname === '/create' ? 'active' : ''}>
              Create
            </Link>
          </li>
          <li>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
        </ul>
        <WalletMultiButton />
      </div>
    </nav>
  );
}
