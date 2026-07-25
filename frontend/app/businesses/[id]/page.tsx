'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useProgram } from '../../../src/hooks/useProgram';
import { BusinessData } from '../../../src/hooks/useBusinesses';

export default function BusinessDetail() {
  const params = useParams();
  const id = params.id as string;
  const { program } = useProgram();
  const { publicKey: walletPubkey } = useWallet();

  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [investing, setInvesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      if (!program) return;
      try {
        const accounts = await program.account.businessState.all();
        const found = accounts.find(a => a.publicKey.toBase58() === id);
        if (found) {
          setBusiness({
            publicKey: found.publicKey.toBase58(),
            owner: found.account.owner.toBase58(),
            fundingGoal: found.account.fundingGoal.toNumber(),
            totalRaised: found.account.totalRaised.toNumber(),
            equityPercentage: found.account.equityPercentage,
            totalEquityTokens: found.account.totalEquityTokens.toNumber(),
            isFunded: found.account.isFunded,
            isClosed: found.account.isClosed,
            mintKey: found.account.mintKey.toBase58(),
            bump: found.account.bump,
          });
        }
      } catch (err: any) {
        console.error(err);
        setToast({ message: 'Failed to load business', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchBusiness();
  }, [program, id]);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !walletPubkey || !business) {
      setToast({ message: 'Connect wallet to invest', type: 'error' });
      return;
    }

    const solAmount = parseFloat(amount);
    if (isNaN(solAmount) || solAmount <= 0) {
      setToast({ message: 'Enter a valid amount', type: 'error' });
      return;
    }

    setInvesting(true);
    setToast(null);

    try {
      const lamports = new BN(solAmount * 1e9);
      const mintPubKey = new PublicKey(business.mintKey);
      const investorTokenAccount = getAssociatedTokenAddressSync(
        mintPubKey,
        walletPubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods.invest(lamports)
        .accounts({
          investor: walletPubkey,
          businessState: new PublicKey(business.publicKey),
          equityMint: mintPubKey,
          investorTokenAccount: investorTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setToast({ message: `Investment successful! TX: ${tx}`, type: 'success' });
      setAmount('');
      // Optimistic update
      setBusiness(prev => prev ? { ...prev, totalRaised: prev.totalRaised + solAmount * 1e9 } : null);
    } catch (err: any) {
      console.error(err);
      setToast({ message: `Investment failed: ${err.message}`, type: 'error' });
    } finally {
      setInvesting(false);
    }
  };

  if (loading) {
    return <div className="container py-20 text-center">Loading...</div>;
  }

  if (!business) {
    return <div className="container py-20 text-center">Business not found</div>;
  }

  const fundingGoalSOL = business.fundingGoal / 1e9;
  const totalRaisedSOL = business.totalRaised / 1e9;
  const progressPercent = Math.min((business.totalRaised / business.fundingGoal) * 100, 100);

  let statusBadgeClass = 'badge-funding';
  let statusText = 'Funding';
  if (business.isClosed) {
    statusBadgeClass = 'badge-closed';
    statusText = 'Closed';
  } else if (business.isFunded) {
    statusBadgeClass = 'badge-funded';
    statusText = 'Funded';
  }

  return (
    <div className="container py-10 fade-in">
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'} mb-6 p-4 rounded`}>
          {toast.message}
        </div>
      )}

      <div className="detail-layout grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="detail-main lg:col-span-2">
          <div className="card p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Business Details</h1>
                <p className="text-gray-400 font-mono text-sm break-all">{business.owner}</p>
              </div>
              <span className={`badge ${statusBadgeClass} text-lg px-4 py-1`}>{statusText}</span>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-lg mb-2">
                <span>{totalRaisedSOL.toFixed(2)} SOL raised</span>
                <span>{progressPercent.toFixed(1)}% of {fundingGoalSOL} SOL</span>
              </div>
              <div className="progress-bar h-4">
                <div className="progress-fill h-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="detail-stat p-4 bg-gray-800 rounded-lg">
                <div className="detail-stat-label text-sm text-gray-400 mb-1">Equity Offered</div>
                <div className="detail-stat-value text-2xl font-bold">{business.equityPercentage}%</div>
              </div>
              <div className="detail-stat p-4 bg-gray-800 rounded-lg">
                <div className="detail-stat-label text-sm text-gray-400 mb-1">Total Tokens</div>
                <div className="detail-stat-value text-2xl font-bold">{business.totalEquityTokens.toLocaleString()}</div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 font-mono break-all">
              <strong>Mint Address:</strong> {business.mintKey}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card p-6">
            <h3 className="text-xl font-bold mb-6">Invest Now</h3>
            <form onSubmit={handleInvest}>
              <div className="form-group mb-4">
                <label className="label block text-sm text-gray-400 mb-2">Amount (SOL)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="input w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={investing || business.isClosed}
                />
              </div>
              
              {amount && !isNaN(parseFloat(amount)) && (
                <div className="mb-6 text-sm text-gray-400">
                  Estimated tokens to receive: ~{((parseFloat(amount) / fundingGoalSOL) * business.totalEquityTokens).toFixed(0)}
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={investing || business.isClosed || !amount}
              >
                {investing ? 'Processing...' : 'Invest SOL'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
