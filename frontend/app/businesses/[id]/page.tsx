'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useProgram } from '../../../src/hooks/useProgram';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import Link from 'next/link';
import { useBusinessMetadata } from '../../../src/hooks/useBusinessMetadata';

interface BusinessDetail {
  publicKey: string;
  owner: string;
  fundingGoal: number;
  totalRaised: number;
  equityPercentage: number;
  totalEquityTokens: number;
  isFunded: boolean;
  isClosed: boolean;
  mintKey: string;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

export default function BusinessDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { program, wallet } = useProgram();
  const { connection } = useConnection();
  const [business, setBusiness] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [investAmount, setInvestAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  
  const { data: metadata, loading: metaLoading } = useBusinessMetadata(id);

  const fetchBusiness = useCallback(async () => {
    if (!program || !id) return;
    try {
      setLoading(true);
      const pubkey = new PublicKey(id);
      const account = await program.account.businessState.fetch(pubkey);
      setBusiness({
        publicKey: id,
        owner: (account as any).owner.toBase58(),
        fundingGoal: (account as any).fundingGoal.toNumber(),
        totalRaised: (account as any).totalRaised.toNumber(),
        equityPercentage: (account as any).equityPercentage,
        totalEquityTokens: (account as any).totalEquityTokens.toNumber(),
        isFunded: (account as any).isFunded,
        isClosed: (account as any).isClosed,
        mintKey: (account as any).mintKey.toBase58(),
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [program, id]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleInvest = async () => {
    if (!program || !wallet || !business) return;
    const amountSol = parseFloat(investAmount);
    if (isNaN(amountSol) || amountSol <= 0) {
      showToast('error', 'Enter a valid SOL amount');
      return;
    }

    try {
      setSubmitting(true);
      const amountLamports = new BN(amountSol * LAMPORTS_PER_SOL);
      const businessPubkey = new PublicKey(business.publicKey);
      const mintPubkey = new PublicKey(business.mintKey);

      const investorAta = getAssociatedTokenAddressSync(
        mintPubkey,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const tx = await program.methods
        .invest(amountLamports)
        .accounts({
          investor: wallet.publicKey,
          businessState: businessPubkey,
          equityMint: mintPubkey,
          investorTokenAccount: investorAta,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc({ commitment: 'confirmed' });

      showToast('success', `Investment successful! TX: ${tx.slice(0, 12)}...`);
      setInvestAmount('');
      await fetchBusiness();
    } catch (e: any) {
      showToast('error', e.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const tokensPreview = (() => {
    if (!business || !investAmount) return 0;
    const amountSol = parseFloat(investAmount);
    if (isNaN(amountSol) || amountSol <= 0) return 0;
    const amountLamports = amountSol * LAMPORTS_PER_SOL;
    return (amountLamports / business.fundingGoal) * (business.totalEquityTokens / 1e6);
  })();

  if (loading || metaLoading) {
    return (
      <div className="container">
        <div style={{ paddingTop: 'var(--space-xl)' }}>
          <div className="skeleton" style={{ height: 40, width: 300, marginBottom: 'var(--space-lg)' }}></div>
          <div className="skeleton" style={{ height: 400 }}></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Business not found</h3>
          <p>This business listing does not exist.</p>
          <Link href="/businesses" className="btn-primary">Browse Businesses</Link>
        </div>
      </div>
    );
  }

  const goalSol = business.fundingGoal / 1e9;
  const raisedSol = business.totalRaised / 1e9;
  const progress = business.fundingGoal > 0 ? Math.min((business.totalRaised / business.fundingGoal) * 100, 100) : 0;
  const canInvest = !business.isFunded && !business.isClosed && !!wallet;

  const statusBadge = business.isClosed
    ? { className: 'badge badge-closed', label: 'Closed' }
    : business.isFunded
    ? { className: 'badge badge-funded', label: 'Funded' }
    : { className: 'badge badge-funding', label: 'Funding' };

  return (
    <div className="container fade-in">
      <div style={{ paddingTop: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <Link href="/businesses" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ← Back to listings
        </Link>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          {metadata?.image_url && (
            <div style={{ width: '100%', height: '300px', backgroundImage: `url(${metadata.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-xl)' }}></div>
          )}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{metadata?.name || 'Business Details'}</h1>
                {metadata?.category && <div style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', marginTop: 4 }}>{metadata.category}</div>}
              </div>
              <span className={statusBadge.className}>{statusBadge.label}</span>
            </div>
            
            {metadata?.description && (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
                {metadata.description.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: line ? '0.5rem' : 0 }}>{line}</p>
                ))}
              </div>
            )}
            
            {metadata?.website_url && (
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <a href={metadata.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Visit Website ↗
                </a>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Funding Progress</span>
                <span style={{ fontWeight: 600 }}>{progress.toFixed(1)}%</span>
              </div>
              <div className="progress-bar" style={{ height: 12 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-xs)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>{raisedSol.toFixed(2)} SOL raised</span>
                <span>{goalSol.toFixed(2)} SOL goal</span>
              </div>
            </div>

            <div className="detail-stat">
              <span className="detail-stat-label">Owner</span>
              <span className="detail-stat-value">{truncateAddress(business.owner)}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Equity Offered</span>
              <span className="detail-stat-value">{business.equityPercentage}%</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Total Equity Tokens</span>
              <span className="detail-stat-value">{(business.totalEquityTokens / 1e6).toLocaleString()}</span>
            </div>
            <div className="detail-stat">
              <span className="detail-stat-label">Mint Address</span>
              <span className="detail-stat-value">{truncateAddress(business.mintKey)}</span>
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.2rem', fontWeight: 700 }}>Invest</h3>

            {!wallet ? (
              <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to invest.</p>
            ) : !canInvest ? (
              <p style={{ color: 'var(--text-secondary)' }}>
                {business.isClosed ? 'This business is closed.' : 'This business is fully funded.'}
              </p>
            ) : (
              <>
                <div className="form-group">
                  <label className="label">Amount (SOL)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                  />
                </div>

                {tokensPreview > 0 && (
                  <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-lg)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>
                      You will receive
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                      <span className="gradient-text">{tokensPreview.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> tokens
                    </div>
                  </div>
                )}

                <button
                  className="btn-primary"
                  style={{ width: '100%' }}
                  onClick={handleInvest}
                  disabled={submitting || !investAmount}
                >
                  {submitting ? 'Processing...' : 'Invest Now'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
