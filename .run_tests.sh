#!/bin/bash -i
source ~/.bashrc
export PATH="/home/khalifah_334/.local/bin:/home/khalifah_334/.local/share/solana/install/active_release/bin:/home/khalifah_334/.cargo/bin:$PATH"
export ANCHOR_PROVIDER_URL="http://127.0.0.1:8899"
export ANCHOR_WALLET="/home/khalifah_334/.config/solana/id.json"
cd /home/khalifah_334/decentralized_investment_platform

echo "Starting local validator in background..."
solana-test-validator --reset -q &
VALIDATOR_PID=$!

echo "Waiting for validator to boot..."
sleep 5

echo "Building and Deploying program..."
anchor build
anchor deploy --provider.cluster localnet

echo "Running tests..."
npm run test

echo "Cleaning up..."
kill $VALIDATOR_PID
