'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Logo } from './Logo';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export function Navbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const navLinks = [
    { name: 'Invoices', path: '/businesses' },
    { name: 'Portfolio', path: '/dashboard' },
    { name: 'Factor Invoice', path: '/create' },
  ];

  return (
    <header className="header">
      <div className="container header-inner">
        <div className="header-left">
          <Logo />
        </div>

        <nav className="header-center">
          <ul className="header-nav">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.path}
                  className={`nav-link ${pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-right header-actions">
          <WalletMultiButton />
          <button className="hamburger" onClick={toggleMobileMenu} aria-label="Toggle mobile menu">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="mobile-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={pathname === link.path ? 'active' : ''}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
