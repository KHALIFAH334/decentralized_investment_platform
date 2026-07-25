'use client';
import { WalletProvider } from './WalletProvider';
import { Navbar } from './Navbar';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <Navbar />
      <main>{children}</main>
    </WalletProvider>
  );
}
