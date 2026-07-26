'use client';

import { useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/decentralized_investment_platform.json';

export const PROGRAM_ID = new PublicKey('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z');

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    return new Program(idl as any, provider);
  }, [connection, wallet]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { program: program as any, wallet, PROGRAM_ID };
}
