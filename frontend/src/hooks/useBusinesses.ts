'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useProgram } from './useProgram';

export interface BusinessData {
  publicKey: string;
  owner: string;
  fundingGoal: number;
  totalRaised: number;
  equityPercentage: number;
  totalEquityTokens: number;
  isFunded: boolean;
  isClosed: boolean;
  mintKey: string;
  bump: number;
}

export function useBusinesses() {
  const { program } = useProgram();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!program) { setLoading(false); return; }
    try {
      setLoading(true);
      const accounts = await program.account.businessState.all();
      const data = accounts.map(acc => ({
        publicKey: acc.publicKey.toBase58(),
        owner: acc.account.owner.toBase58(),
        fundingGoal: acc.account.fundingGoal.toNumber(),
        totalRaised: acc.account.totalRaised.toNumber(),
        equityPercentage: acc.account.equityPercentage,
        totalEquityTokens: acc.account.totalEquityTokens.toNumber(),
        isFunded: acc.account.isFunded,
        isClosed: acc.account.isClosed,
        mintKey: acc.account.mintKey.toBase58(),
        bump: acc.account.bump,
      }));
      setBusinesses(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { refresh(); }, [refresh]);

  return { businesses, loading, error, refresh };
}
