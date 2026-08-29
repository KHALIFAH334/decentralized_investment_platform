# ADR 001: Hybrid Architecture and Token-2022 Selection

**Status**: Accepted  
**Date**: 2026-08-29  

## Context and Problem Statement
Our Decentralized Investment Platform ("Anchor Capital") requires a robust system to track both immutable on-chain financial state (investments, token issuance) and mutable off-chain metadata (business descriptions, hero images, categories) without incurring excessive transaction fees.

We must decide:
1. How to store and sync campaign metadata.
2. Which Solana token standard to use for representing business equity.

## Decision Drivers
- **Cost**: Storing large strings (like URLs and descriptions) directly in Solana accounts is prohibitively expensive (costing raw SOL for rent exemption).
- **Scalability**: The frontend must load metadata quickly without querying the RPC for every character.
- **Compliance & Security**: Equity tokens should not be freely tradeable on DEXs without the campaign owner's permission to prevent unregistered securities trading.

## Considered Options

### Storage & Architecture
- **Option 1: Full On-Chain Data (Anchor Strings)**. Store all metadata in the PDA.
- **Option 2: Hybrid (Solana + Supabase)**. Store only financial math (raised amount, goal, mint pubkey) on-chain, and store rich text metadata in a relational database.

### Token Standard
- **Option 1: SPL Token (Legacy)**. The standard fungible token standard.
- **Option 2: Token-2022 (Extensions)**. The new standard featuring transfer hooks and non-transferability.

## Decision Outcome

### 1. Hybrid Architecture (Solana + Supabase)
We chose **Option 2**. We use Solana for the source of truth regarding funds (investments, withdrawals, dividends) but rely on a Supabase PostgreSQL database to index metadata. 
**Rationale**: 
- **Cost Efficiency**: Reduces the PDA size drastically.
- **Performance**: We can fetch rich business metadata in a single HTTP request rather than parsing blockchain state.
- **Integrity**: We enforce that Supabase rows are only created after the `BusinessInitialized` on-chain transaction succeeds.

### 2. Token-2022 Standard
We chose **Option 2**.
**Rationale**: 
- **Regulatory Safety**: We utilize the `NonTransferable` extension. Investors receive equity tokens to prove their share and receive dividends, but they *cannot* dump these tokens on a decentralized exchange. This maps closely to real-world private equity, which is highly illiquid. 
- **Future Proofing**: Token-2022 allows us to add `TransferFeeConfig` later if the platform wants to take a royalty on secondary sales (if they are eventually enabled).

## Consequences
- **Positive**: Platform is extremely cheap to deploy and interact with. The UI is highly responsive. We are safe from immediate regulatory scrutiny regarding unlicensed DEX trading.
- **Negative**: The hybrid architecture introduces a single point of failure (Supabase). If Supabase goes down, the frontend cannot display campaign details, even though funds remain secure on-chain. We mitigate this by keeping the crucial financial state purely on-chain.
