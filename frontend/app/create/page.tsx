'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useProgram } from '../../src/hooks/useProgram';
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { supabase } from '../../src/lib/supabase';

const PROGRAM_ID = new PublicKey('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z');

export default function CreateBusinessPage() {
  const { program } = useProgram();
  const { publicKey } = useWallet();
  const [fundingGoal, setFundingGoal] = useState('');
  const [equityPercentage, setEquityPercentage] = useState('');
  const [totalTokens, setTotalTokens] = useState('');

  // Metadata state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 6000);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('business-images').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image: ', error);
      showToast('error', 'Image upload failed. Continuing anyway...');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey) {
      showToast('error', 'Connect your wallet first');
      return;
    }

    const goal = parseFloat(fundingGoal);
    const equity = parseInt(equityPercentage);
    const tokens = parseFloat(totalTokens);

    if (isNaN(goal) || goal <= 0) { showToast('error', 'Enter a valid funding goal'); return; }
    if (isNaN(equity) || equity < 1 || equity > 100) { showToast('error', 'Equity must be between 1-100%'); return; }
    if (isNaN(tokens) || tokens <= 0) { showToast('error', 'Enter a valid token supply'); return; }
    if (!name.trim()) { showToast('error', 'Entity name is required'); return; }

    try {
      setSubmitting(true);

      // 1. Upload image if present
      let imageUrl = '';
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      // 2. Blockchain Transaction
      const mintKeypair = Keypair.generate();
      const [businessPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('business'), publicKey.toBuffer()],
        PROGRAM_ID
      );

      const fundingGoalBN = new BN(goal * LAMPORTS_PER_SOL);
      const totalTokensBN = new BN(tokens * 1e6); // 6 decimals

      const tx = await program.methods
        .initializeBusiness(fundingGoalBN, equity, totalTokensBN)
        .accounts({
          owner: publicKey,
          businessState: businessPda,
          equityMint: mintKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([mintKeypair])
        .rpc({ commitment: 'confirmed' });

      // 3. Save Metadata to Supabase
      const { error: dbError } = await supabase.from('businesses').insert([
        {
          id: businessPda.toBase58(),
          owner: publicKey.toBase58(),
          name,
          description,
          category,
          image_url: imageUrl,
          website_url: websiteUrl,
        }
      ]);

      if (dbError) {
        console.error('Supabase error:', dbError);
        showToast('warning', `Entity created on-chain (TX: ${tx.slice(0, 10)}...) but metadata save failed.`);
      } else {
        showToast('success', `Entity created successfully! TX: ${tx.slice(0, 16)}...`);
      }

      // Reset form
      setFundingGoal(''); setEquityPercentage(''); setTotalTokens('');
      setName(''); setDescription(''); setCategory(''); setWebsiteUrl(''); setImageFile(null);
    } catch (e: any) {
      showToast('error', e.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Live preview values
  const previewGoal = parseFloat(fundingGoal) || 0;
  const previewEquity = parseInt(equityPercentage) || 0;
  const previewTokens = parseFloat(totalTokens) || 0;
  const previewImageUrl = imageFile ? URL.createObjectURL(imageFile) : '';

  return (
    <div className="container fade-in">
      <div className="page-header">
        <h1>Create Listing</h1>
        <p>Launch a new equity offering on the Solana blockchain.</p>
      </div>

      <div className="detail-layout">
        <div>
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1rem', fontWeight: 700 }}>Listing Details</h3>

            {!publicKey ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect your wallet to create an entity listing.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 'var(--space-xl)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-grid)' }}>
                  <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    1. Entity Profile (Off-chain)
                  </h4>

                  <div className="form-group">
                    <label className="label">Entity Name</label>
                    <input className="input" type="text" placeholder="e.g. Mama's Bakery" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="label">Description</label>
                    <textarea className="input" placeholder="Tell investors about your business..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 100 }} required />
                  </div>

                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                    <div>
                      <label className="label">Sector</label>
                      <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Select Sector</option>
                        <option value="Food & Beverage">Food & Beverage</option>
                        <option value="Retail">Retail</option>
                        <option value="Tech">Tech</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Website (Optional)</label>
                      <input className="input" type="url" placeholder="https://" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Cover Image</label>
                    <input className="input" type="file" accept="image/*" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }} />
                  </div>
                </div>

                <div style={{ marginBottom: 'var(--space-xl)' }}>
                  <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    2. Financials (On-chain)
                  </h4>

                  <div className="form-group">
                    <label className="label">Funding Goal (SOL)</label>
                    <input className="input mono" type="number" step="0.1" min="0" placeholder="e.g. 10" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="label">Equity Percentage (%)</label>
                    <input className="input mono" type="number" min="1" max="100" placeholder="e.g. 20" value={equityPercentage} onChange={(e) => setEquityPercentage(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="label">Total Equity Tokens (Supply)</label>
                    <input className="input mono" type="number" min="1" placeholder="e.g. 1000000" value={totalTokens} onChange={(e) => setTotalTokens(e.target.value)} required />
                  </div>
                </div>

                <button
                  className="btn-primary"
                  type="submit"
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Listing...' : 'Create Entity'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {previewImageUrl ? (
              <div style={{ width: '100%', height: '160px', backgroundImage: `url(${previewImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            ) : (
              <div style={{ width: '100%', height: '160px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Image Preview</div>
            )}

            <div style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ marginBottom: 'var(--space-xs)', fontSize: '1rem', fontWeight: 700 }}>
                {name || 'Entity Name'}
              </h3>
              {category && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--space-md)', fontWeight: 500 }}>{category}</div>}

              <div className="detail-stat">
                <span className="detail-stat-label">Funding Goal</span>
                <span className="detail-stat-value">{previewGoal.toFixed(2)} SOL</span>
              </div>
              <div className="detail-stat">
                <span className="detail-stat-label">Equity Offered</span>
                <span className="detail-stat-value">{previewEquity}%</span>
              </div>
              <div className="detail-stat" style={{ borderBottom: 'none' }}>
                <span className="detail-stat-label">Token Supply</span>
                <span className="detail-stat-value">{previewTokens.toLocaleString()}</span>
              </div>

              <div style={{ marginTop: 'var(--space-lg)' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 'var(--space-sm)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  0% funded
                </div>
              </div>
            </div>
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
