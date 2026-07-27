'use client';

import { ReactNode } from 'react';
import { WalletProvider } from './WalletProvider'; // Assuming this exists or is imported correctly. If it's named WalletContextProvider, we might need to adjust.
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WalletProvider>
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </WalletProvider>
  );
}
