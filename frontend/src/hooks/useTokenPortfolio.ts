'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

export interface TokenHolding {
  mint: string;
  balance: number;
  decimals: number;
}

export function useTokenPortfolio() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [holdings, setHoldings] = useState<Record<string, TokenHolding>>({});
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!publicKey) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { value } = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      const newHoldings: Record<string, TokenHolding> = {};
      
      value.forEach((accountInfo) => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const tokenAmount = parsedInfo.tokenAmount;
        
        if (tokenAmount.uiAmount > 0) {
          newHoldings[mint] = {
            mint,
            balance: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
          };
        }
      });
      
      setHoldings(newHoldings);
    } catch (err) {
      console.error('Error fetching token portfolio:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { holdings, loading, refresh: fetchPortfolio };
}
