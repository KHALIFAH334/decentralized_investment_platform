#!/bin/bash
export PATH="/home/khalifah_334/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/home/khalifah_334/.cargo/bin:$PATH"

echo "Setting config to devnet..."
solana config set --url devnet

echo "Checking balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Balance is $BALANCE"

# Compare if balance is less than 3
if (( $(echo "$BALANCE < 3.0" | bc -l) )); then
  echo "Airdropping 2 SOL..."
  solana airdrop 2
fi

echo "Building project..."
cd /home/khalifah_334/decentralized_investment_platform
anchor build

echo "Deploying to devnet..."
anchor deploy --provider.cluster devnet > deploy_out.txt 2>&1
cat deploy_out.txt
