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
  fundingDeadline: number;
}

export function useBusinesses() {
  const { program } = useProgram();
  const [businesses, setBusinesses] = useState<BusinessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accounts = await (program.account as any).businessState.all();
      const data: BusinessData[] = accounts.map((acc: { publicKey: { toBase58(): string }; account: Record<string, unknown> }) => ({
        publicKey: acc.publicKey.toBase58(),
        owner: (acc.account.owner as { toBase58(): string }).toBase58(),
        fundingGoal: Number(acc.account.fundingGoal),
        totalRaised: Number(acc.account.totalRaised),
        equityPercentage: acc.account.equityPercentage as number,
        totalEquityTokens: Number(acc.account.totalEquityTokens),
        isFunded: acc.account.isFunded as boolean,
        isClosed: acc.account.isClosed as boolean,
        mintKey: (acc.account.mintKey as { toBase58(): string }).toBase58(),
        bump: acc.account.bump as number,
        fundingDeadline: Number(acc.account.fundingDeadline),
      }));
      setBusinesses(data);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => { refresh(); }, [refresh]);

  return { businesses, loading, error, refresh };
}
