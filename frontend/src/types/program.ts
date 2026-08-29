import { Program, Idl } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

/**
 * The typed Anchor program instance for the Decentralized Investment Platform.
 */
export type DipProgram = Program<Idl>;

/**
 * Re-export wallet types so components don't need to import
 * from wallet-adapter directly.
 */
export type { AnchorWallet };

/**
 * Props interface for components that receive the program + wallet.
 */
export interface ProgramProps {
  program: DipProgram;
  wallet: AnchorWallet;
}
