#!/bin/bash
export PATH="/home/khalifah_334/.local/share/solana/install/active_release/bin:$PATH"

solana config set --url devnet
echo "=== BALANCE ==="
solana balance

echo "=== AIRDROP ==="
solana airdrop 2

echo "=== BALANCE AFTER ==="
solana balance
