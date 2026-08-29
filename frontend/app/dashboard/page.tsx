'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '../../src/hooks/useProgram';
import { useBusinesses } from '../../src/hooks/useBusinesses';
import { MyCampaignsTab } from '../../src/components/MyCampaignsTab';
import { MyInvestmentsTab } from '../../src/components/MyInvestmentsTab';

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { program, wallet } = useProgram();
  const { businesses, loading, refresh } = useBusinesses();
  const [activeTab, setActiveTab] = useState<'businesses' | 'investments'>('businesses');
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  if (!publicKey) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Connect Your Wallet</h3>
          <p>Connect your Solana wallet to view your factoring portfolio.</p>
        </div>
      </div>
    );
  }

  const myBusinesses = businesses.filter((b) => b.owner === publicKey.toBase58());

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Portfolio</h1>
        <p>Manage your invoices and factoring portfolio.</p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          My Campaigns ({myBusinesses.length})
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          My Investments
        </button>
      </div>

      {activeTab === 'businesses' && (
        <MyCampaignsTab 
          businesses={businesses.filter((b) => b.owner === wallet?.publicKey.toBase58())} 
          loading={loading}
          program={program}
          wallet={wallet!}
          refresh={refresh}
          showToast={showToast}
        />
      )}

      {activeTab === 'investments' && (
        <MyInvestmentsTab />
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
