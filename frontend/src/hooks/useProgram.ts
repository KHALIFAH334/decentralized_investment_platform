'use client';

import { useMemo } from 'react';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';
import idl from '../idl/decentralized_investment_platform.json';
import type { DipProgram } from '../types/program';
import type { AnchorWallet } from '@solana/wallet-adapter-react';

export const PROGRAM_ID = new PublicKey('5gEZHMQfMSKofq89gBkWPzwx7g1vy3d1pn8RJjRSkN4Z');

export function useProgram(): {
  program: DipProgram;
  wallet: AnchorWallet | undefined;
  PROGRAM_ID: PublicKey;
} {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    // If no wallet is connected, use a dummy read-only wallet
    const readOnlyWallet: AnchorWallet = wallet || {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    };

    const provider = new AnchorProvider(connection, readOnlyWallet, { commitment: 'confirmed' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Program(idl as any, provider) as unknown as DipProgram;
  }, [connection, wallet]);

  return { program, wallet, PROGRAM_ID };
}
