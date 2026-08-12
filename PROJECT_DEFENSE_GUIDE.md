# InvestBlock: Decentralized Investment Platform
## Final Year Project Defense & Codebase Guide

This document is designed to help you understand every aspect of the project, from high-level architecture decisions down to the low-level boilerplate code. It will equip you with the knowledge to defend your project confidently.

---

## 1. High-Level Architecture & Design Decisions

The project is built on a modern, hybrid web3 stack. It separates concerns between the blockchain (for trustless financial logic) and a traditional database (for rich, queryable metadata).

### Why Solana?
Solana was chosen for its high throughput and extremely low transaction fees. Since an investment platform requires many micro-transactions (investing, distributing dividends), deploying on Ethereum would price out average users due to gas fees. 

### Why Anchor Framework?
Writing raw Solana smart contracts in Rust requires immense boilerplate and manual security checks. Anchor is to Solana what Ruby on Rails is to Ruby. It abstracts away account serialization, generates an IDL (Interface Description Language) for the frontend to easily communicate with the contract, and enforces strict security constraints via macros (like `#[account(mut)]`).

### Why Token-2022 (SPL Token Extensions)?
Instead of the legacy SPL Token program, this project uses the new **Token-2022** program. This is a crucial defense point! Token-2022 allows for advanced tokenomics without needing to write custom programs. We use it to create Equity Tokens for the businesses. In the future, this allows you to easily add features like **Transfer Fees** (taking a cut when users trade equity) or **Permanent Delegates** (allowing the platform to freeze tokens for compliance reasons).

### Why Supabase (Off-chain Metadata)?
Storing data on the Solana blockchain costs rent (in SOL). Storing long business descriptions and high-resolution images on-chain is prohibitively expensive and inefficient.
- **On-chain**: We store only critical financial state (funding goal, total raised, equity percentage, wallet addresses).
- **Off-chain (Supabase)**: We store text and images. We link the two by using the blockchain's PDA (Program Derived Address) as the Primary Key (`id`) in the Supabase database.

---

## 2. Codebase Structure: Folder by Folder

### The Blockchain Backend (`/programs` & Root)

* **`Anchor.toml`**
  The configuration file for the Anchor workspace. It defines the cluster (devnet/localnet), the program ID, and the path to your wallet keypair.
* **`programs/decentralized_investment_platform/src/lib.rs`**
  This is the heart of the smart contract. It contains the logic for the platform.
  - **`initialize_business`**: Creates a new business listing. It calculates a PDA to securely hold funds, and uses a CPI (Cross-Program Invocation) to create a new Token-2022 Mint. This mint represents the business's equity.
  - **`invest`**: Allows users to send SOL to the business's PDA. In return, the smart contract mints Equity Tokens directly to the user's wallet based on their contribution size.
  - **`withdraw_funds`**: Only the business owner can call this. It transfers the accumulated SOL from the PDA to the owner's personal wallet to fund their real-world operations.
  - **`distribute_dividends`**: Allows the business owner to pay back investors. They send SOL to the smart contract, which is then routed to the token holders.
  - **`close_business`**: Closes the PDA account and reclaims the storage rent (SOL) back to the owner.

### The Frontend (`/frontend`)

The frontend is built with **Next.js 16 (App Router)** and **React**.

#### `/app` (Routing and Pages)
* **`layout.tsx` & `globals.css`**: The entry point. `layout.tsx` wraps the app in our wallet providers. `globals.css` contains our custom 500+ line Design System (Glassmorphism, dark mode, CSS variables) built without external UI libraries like Tailwind to show strong core frontend skills.
* **`page.tsx`**: The Landing Page. Contains the hero section and calls to action.
* **`businesses/page.tsx`**: The "Browse" page. Fetches all businesses from the blockchain and their corresponding metadata from Supabase, rendering them in a grid.
* **`businesses/[id]/page.tsx`**: The dynamic Detail Page. Reads the `id` from the URL, fetches that specific business, and provides the "Invest" input form.
* **`create/page.tsx`**: The form for business owners. It uploads the image to Supabase Storage, sends the blockchain transaction, and *then* writes the text metadata to the Supabase database.
* **`dashboard/page.tsx`**: The user portal. Contains two tabs: "My Businesses" (for owners to withdraw funds and distribute dividends) and "My Investments" (your Token Portfolio).

#### `/src/components` (Reusable UI)
* **`ClientProviders.tsx` & `WalletProvider.tsx`**: Wraps the app in Solana's context providers so the user's Phantom wallet is accessible anywhere in the app.
* **`Navbar.tsx`**: The top navigation. It dynamically imports `WalletMultiButton` to prevent Next.js hydration errors (a common issue where server-rendered HTML mismatches the client browser state).
* **`BusinessCard.tsx`**: A reusable UI component that combines on-chain financial data (progress bar, SOL raised) with off-chain Supabase data (image, name).

#### `/src/hooks` (The Logic Layer)
* **`useProgram.ts`**: The most important hook. It takes the user's wallet, connects it to the Solana network via the RPC URL, and returns an `AnchorProvider`. This allows the frontend to call the Rust smart contract functions.
* **`useBusinesses.ts`**: Fetches all `BusinessState` accounts directly from the blockchain.
* **`useBusinessMetadata.ts`**: Fetches the text and image URLs from the Supabase PostgreSQL database.
* **`useTokenPortfolio.ts`**: Uses the `getParsedTokenAccountsByOwner` RPC call to find all Token-2022 equity tokens currently held in the user's Phantom wallet.

---

## 3. Low-Level Concepts Explained (For Defense Q&A)

### What is a PDA (Program Derived Address)?
**Expect this question!** A PDA is a Solana account that is controlled by a smart contract, not a user. It has no private key. 
- *Why we use it*: When a business is created, we derive a PDA using the string `"business"` and the creator's wallet address. This PDA acts as a decentralized vault. When investors send SOL, it goes to this PDA. Only the smart contract rules can move that SOL, ensuring the owner can't steal funds improperly.

### What is a CPI (Cross-Program Invocation)?
When our smart contract wants to mint Equity Tokens to an investor, it cannot do it directly because it doesn't own the Token Program. Instead, our contract performs a CPI—it "calls" the official Solana Token-2022 program and asks it to mint the tokens on our behalf. 

### How does Anchor validate accounts?
In `lib.rs`, you will see structs with `#[derive(Accounts)]`. 
Before any Rust logic runs, Anchor checks these constraints. For example, `#[account(mut, signer)]` ensures the person calling the function actually signed the transaction with their private key, preventing hackers from impersonating owners.

### How is the IDL (Interface Description Language) used?
When we compiled the smart contract, Anchor generated a JSON file (`decentralized_investment_platform.json`). We copied this to the frontend. The IDL acts like an API schema (similar to Swagger/OpenAPI). It tells the frontend exactly what functions exist, what arguments they take, and what the account structures look like.

---

## 4. Potential Defense Questions to Prepare For

**Q: What happens if a business fails to reach its funding goal?**
*A:* Currently, investors hold Equity Tokens representing their fractional stake. If you were to expand the project, you would add a `refund` instruction in the smart contract that allows users to burn their Equity Tokens in exchange for their SOL back if `total_raised < funding_goal` by a certain deadline.

**Q: How do you handle security for the Supabase database?**
*A:* For this prototype, Row Level Security (RLS) allows inserts from the frontend. In a production environment, we would implement **Message Signing**. The user would sign a message with their Phantom wallet, our backend would verify the cryptographic signature to prove they own the wallet, and only then would the database allow them to edit the business profile.

**Q: Why didn't you use Tailwind CSS?**
*A:* I chose to build a custom CSS architecture (`globals.css`) utilizing CSS Variables, Flexbox/Grid, and modern features like `backdrop-filter` to demonstrate a deep, fundamental understanding of CSS styling and design systems without relying on utility libraries.

**Q: How do you prevent malicious actors or fake businesses from raising funds?**
*A:* In this MVP, the platform operates in a permissionless manner. However, for a production rollout, we would integrate a Decentralized Oracle Network (like Chainlink) or a decentralized identity protocol (like Solana's Civic). The Oracle would securely bridge off-chain KYC (Know Your Customer) and business registration data on-chain. The smart contract would require the creator's wallet to hold a valid "Verified Identity" token or receive cryptographic confirmation from the Oracle before allowing the `initialize_business` transaction to succeed. This delegates the heavy lifting of real-world vetting to specialized identity networks without compromising the decentralized nature of the core protocol.

---

**Good luck with your defense! You've built a complex, full-stack Web3 application that bridges on-chain financial logic with off-chain data management.**
