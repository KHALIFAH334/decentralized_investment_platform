#!/bin/bash
export PATH="/home/khalifah_334/.local/share/solana/install/active_release/bin:$PATH"
export PATH="/home/khalifah_334/.cargo/bin:$PATH"
cd /home/khalifah_334/decentralized_investment_platform
anchor deploy --provider.cluster devnet > deploy.log 2>&1
