'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Keypair, SystemProgram } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useProgram } from '../../src/hooks/useProgram';
import BusinessCard from '../../src/components/BusinessCard';

export default function CreateBusinessPage() {
  const { program, PROGRAM_ID } = useProgram();
  const { publicKey: walletPubkey } = useWallet();

  const [fundingGoal, setFundingGoal] = useState('');
  const [equityPct, setEquityPct] = useState('');
  const [totalTokens, setTotalTokens] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !walletPubkey) {
      setToast({ message: 'Please connect your wallet', type: 'error' });
      return;
    }

    try {
      setCreating(true);
      setToast(null);

      const goalSOL = parseFloat(fundingGoal);
      const pct = parseInt(equityPct);
      const tokens = parseInt(totalTokens);

      if (isNaN(goalSOL) || goalSOL <= 0) throw new Error('Invalid funding goal');
      if (isNaN(pct) || pct < 1 || pct > 100) throw new Error('Equity percentage must be 1-100');
      if (isNaN(tokens) || tokens <= 0) throw new Error('Invalid token amount');

      const fundingGoalBN = new BN(goalSOL * 1e9);
      const totalTokensBN = new BN(tokens);
      
      const mintKeypair = Keypair.generate();
      
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from('business'), walletPubkey.toBuffer()],
        PROGRAM_ID
      );

      const tx = await program.methods.initializeBusiness(fundingGoalBN, pct, totalTokensBN)
        .accounts({
          owner: walletPubkey,
          businessState: pda,
          equityMint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([mintKeypair])
        .rpc();

      setToast({ message: `Business created successfully! Address: ${pda.toBase58()}`, type: 'success' });
      setFundingGoal('');
      setEquityPct('');
      setTotalTokens('');
    } catch (err: any) {
      console.error(err);
      setToast({ message: `Failed to create business: ${err.message}`, type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const previewData = {
    publicKey: 'preview_key',
    owner: walletPubkey?.toBase58() || 'Connect Wallet',
    fundingGoal: parseFloat(fundingGoal || '0') * 1e9,
    totalRaised: 0,
    equityPercentage: parseInt(equityPct || '0'),
    totalEquityTokens: parseInt(totalTokens || '0'),
    isFunded: false,
    isClosed: false,
    mintKey: 'New Mint Generated on Submit',
    bump: 255,
  };

  return (
    <div className="container py-10 fade-in">
      <div className="page-header mb-10">
        <h1 className="text-4xl font-bold mb-4 gradient-text">List Your Business</h1>
        <p className="text-gray-400">Raise funds transparently on Solana</p>
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'} mb-6 p-4 rounded`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="card p-8">
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-6">
              <label className="label block text-sm text-gray-400 mb-2">Funding Goal (SOL)</label>
              <input 
                type="number" 
                step="0.01" 
                className="input w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                value={fundingGoal}
                onChange={(e) => setFundingGoal(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group mb-6">
              <label className="label block text-sm text-gray-400 mb-2">Equity Percentage (1-100)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                className="input w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                value={equityPct}
                onChange={(e) => setEquityPct(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-8">
              <label className="label block text-sm text-gray-400 mb-2">Total Equity Tokens</label>
              <input 
                type="number" 
                className="input w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
                value={totalTokens}
                onChange={(e) => setTotalTokens(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-3"
              disabled={creating || !walletPubkey}
            >
              {creating ? 'Creating...' : 'Launch Business'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-6 text-gray-300">Live Preview</h3>
          <BusinessCard business={previewData} />
        </div>
      </div>
    </div>
  );
}
