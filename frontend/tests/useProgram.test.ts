import { renderHook } from '@testing-library/react';
import { useProgram, PROGRAM_ID } from '../src/hooks/useProgram';
import { useConnection, useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';

jest.mock('@solana/wallet-adapter-react', () => ({
  useConnection: jest.fn(),
  useAnchorWallet: jest.fn(),
}));

jest.mock('@coral-xyz/anchor', () => ({
  AnchorProvider: jest.fn(),
  Program: jest.fn(),
}));

describe('useProgram', () => {
  const mockConnection = { rpcEndpoint: 'http://localhost:8899' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useConnection as jest.Mock).mockReturnValue({ connection: mockConnection });
  });

  it('initializes program with dummy wallet when no wallet is connected', () => {
    (useAnchorWallet as jest.Mock).mockReturnValue(undefined);

    const { result } = renderHook(() => useProgram());

    expect(result.current.wallet).toBeUndefined();
    expect(result.current.PROGRAM_ID.toBase58()).toBe(PROGRAM_ID.toBase58());

    // Verify AnchorProvider was called with a dummy wallet
    expect(AnchorProvider).toHaveBeenCalledTimes(1);
    const providerArgs = (AnchorProvider as jest.Mock).mock.calls[0];
    expect(providerArgs[0]).toBe(mockConnection);
    expect(providerArgs[1]).toHaveProperty('publicKey'); // Dummy wallet should have a publicKey
    expect(providerArgs[2]).toEqual({ commitment: 'confirmed' });

    expect(Program).toHaveBeenCalledTimes(1);
  });

  it('initializes program with connected wallet', () => {
    const mockWallet = {
      publicKey: new PublicKey('11111111111111111111111111111111'),
      signTransaction: jest.fn(),
      signAllTransactions: jest.fn(),
    };
    (useAnchorWallet as jest.Mock).mockReturnValue(mockWallet);

    const { result } = renderHook(() => useProgram());

    expect(result.current.wallet).toBe(mockWallet);

    // Verify AnchorProvider was called with the actual wallet
    expect(AnchorProvider).toHaveBeenCalledTimes(1);
    const providerArgs = (AnchorProvider as jest.Mock).mock.calls[0];
    expect(providerArgs[1]).toBe(mockWallet);
  });
});
