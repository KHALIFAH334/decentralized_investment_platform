'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { useProgram } from '../../src/hooks/useProgram';
import { useBusinesses } from '../../src/hooks/useBusinesses';

export default function DashboardPage() {
  const { program } = useProgram();
  const { publicKey: walletPubkey } = useWallet();
  const { businesses, refresh } = useBusinesses();
  
  const [activeTab, setActiveTab] = useState<'businesses' | 'investments'>('businesses');
  const [withdrawAmount, setWithdrawAmount] = useState<{ [key: string]: string }>({});
  const [dividendAmount, setDividendAmount] = useState<{ [key: string]: string }>({});
  
  if (!walletPubkey) {
    return (
      <div className="container py-20 text-center fade-in">
        <h2 className="text-2xl font-bold mb-4">Not Connected</h2>
        <p className="text-gray-400">Connect your wallet to view your dashboard</p>
      </div>
    );
  }

  const myBusinesses = businesses.filter(b => b.owner === walletPubkey.toBase58());

  const handleWithdraw = async (businessKey: string) => {
    if (!program) return;
    try {
      const amount = parseFloat(withdrawAmount[businessKey]);
      if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
      
      const lamports = new BN(amount * 1e9);
      await program.methods.withdrawFunds(lamports)
        .accounts({
          owner: walletPubkey,
          businessState: new PublicKey(businessKey),
        })
        .rpc();
        
      alert('Withdrawal successful');
      setWithdrawAmount({ ...withdrawAmount, [businessKey]: '' });
      refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDividend = async (businessKey: string) => {
    if (!program) return;
    try {
      const amount = parseFloat(dividendAmount[businessKey]);
      if (isNaN(amount) || amount <= 0) return alert('Invalid amount');
      
      const lamports = new BN(amount * 1e9);
      
      // Note: Full implementation of dividend distribution involves token accounts.
      // This is a simplified call based on IDL signature.
      await program.methods.distributeDividends(lamports)
        .accounts({
          owner: walletPubkey,
          businessState: new PublicKey(businessKey),
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
        
      alert('Dividends distributed');
      setDividendAmount({ ...dividendAmount, [businessKey]: '' });
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleClose = async (businessKey: string) => {
    if (!program) return;
    if (!confirm('Are you sure you want to close this business?')) return;
    try {
      await program.methods.closeBusiness()
        .accounts({
          owner: walletPubkey,
          businessState: new PublicKey(businessKey),
        })
        .rpc();
        
      alert('Business closed');
      refresh();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="container py-10 fade-in">
      <h1 className="text-4xl font-bold mb-8 gradient-text">Dashboard</h1>
      
      <div className="tabs flex space-x-4 mb-8 border-b border-gray-800 pb-2">
        <button 
          className={`tab px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'businesses' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('businesses')}
        >
          My Businesses
        </button>
        <button 
          className={`tab px-4 py-2 text-lg font-medium transition-colors ${activeTab === 'investments' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}
          onClick={() => setActiveTab('investments')}
        >
          My Investments
        </button>
      </div>

      {activeTab === 'businesses' && (
        <div>
          {myBusinesses.length === 0 ? (
            <div className="text-gray-400 py-10">You haven't listed any businesses yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {myBusinesses.map(business => (
                <div key={business.publicKey} className="action-card card p-6 border-l-4 border-purple-500">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">Your Business</h3>
                    <div className="space-x-4">
                      <span className="text-gray-400">Raised: {(business.totalRaised / 1e9).toFixed(2)} SOL</span>
                      <span className={`badge ${business.isClosed ? 'badge-closed' : business.isFunded ? 'badge-funded' : 'badge-funding'}`}>
                        {business.isClosed ? 'Closed' : business.isFunded ? 'Funded' : 'Funding'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="action-row bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm text-gray-400">Withdraw Funds</h4>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          className="input w-full p-2 bg-gray-800 rounded"
                          value={withdrawAmount[business.publicKey] || ''}
                          onChange={e => setWithdrawAmount({ ...withdrawAmount, [business.publicKey]: e.target.value })}
                        />
                        <button className="btn-secondary px-4 py-2 text-sm whitespace-nowrap" onClick={() => handleWithdraw(business.publicKey)}>Withdraw</button>
                      </div>
                    </div>

                    <div className="action-row bg-gray-900 p-4 rounded-lg">
                      <h4 className="font-bold mb-2 text-sm text-gray-400">Distribute Dividends</h4>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Total Amount" 
                          className="input w-full p-2 bg-gray-800 rounded"
                          value={dividendAmount[business.publicKey] || ''}
                          onChange={e => setDividendAmount({ ...dividendAmount, [business.publicKey]: e.target.value })}
                        />
                        <button className="btn-secondary px-4 py-2 text-sm whitespace-nowrap" onClick={() => handleDividend(business.publicKey)}>Distribute</button>
                      </div>
                    </div>

                    <div className="action-row bg-gray-900 p-4 rounded-lg flex flex-col justify-center">
                      <h4 className="font-bold mb-2 text-sm text-gray-400">Danger Zone</h4>
                      <button 
                        className="btn-primary bg-red-600 hover:bg-red-700 w-full py-2"
                        onClick={() => handleClose(business.publicKey)}
                        disabled={business.isClosed}
                      >
                        {business.isClosed ? 'Business Closed' : 'Close Business'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'investments' && (
        <div className="empty-state text-center py-20 card">
          <h3 className="text-xl font-bold mb-2">Coming soon</h3>
          <p className="text-gray-400">View your equity token portfolio</p>
        </div>
      )}
    </div>
  );
}
