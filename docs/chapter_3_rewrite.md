# CHAPTER THREE

# SYSTEM ANALYSIS AND DESIGN

## 3.1 INTRODUCTION

This chapter presents the system analysis and design for the Anchor Capital project. It bridges the theoretical research on decentralized credit markets established in the preceding chapters and the concrete software engineering implementation. The chapter evaluates the existing manual invoice factoring mechanisms and centralized crowdfunding platforms to identify the specific architectural failure points that the proposed system must address. It then transitions into the detailed architectural planning of the proposed decentralized Real-World Asset (RWA) tokenization and fundraising protocol built on the Solana blockchain.

The chapter begins with the requirement analysis techniques employed to define the system's operational constraints. It describes the methods of data collection used to gather both primary and secondary information relevant to the design decisions. The functional requirements section specifies how the Rust-based Anchor smart contracts and the Solana Token-2022 standard extensions (including PermanentDelegate and TransferFeeConfig) must execute fractional equity tokenization and automated dividend distribution. The non-functional requirements section defines the constraints governing transaction latency, execution cost, and zero-trust escrow safeguards managed autonomously through Program Derived Addresses (PDAs). The chapter concludes with visual software blueprints using standard Unified Modeling Language (UML) diagrams that map the interactions between the Next.js frontend, the off-chain Supabase database, and the on-chain Solana Devnet smart contract architecture.


## 3.2 REQUIREMENTS ANALYSIS TECHNIQUES

The requirement analysis phase determines the exact operational needs of the proposed system. To build a decentralized financial architecture that addresses the liquidity constraints of Nigerian MSMEs and the investment needs of retail participants, the analysis first established the financial and technical limitations of both user groups. Two specific techniques were employed to gather accurate software constraints.

The first technique was direct observation of the existing financial and technological environment. The current operational workflows of traditional invoice factoring and the manual ledger reconciliation processes used by centralized platforms were systematically evaluated. This observation confirmed that relying on traditional off-chain intermediaries introduces processing fees in the range of 7 to 10 percent and is susceptible to data entry errors in manual reconciliation. These findings informed the strict requirement for utilizing the Solana Token-2022 standard to automate fractional equity tokenization and eliminate manual administrative overhead. The observation also identified the structural vulnerability of centralized custodial accounts, which directly shaped the requirement for implementing Program Derived Addresses (PDAs) to handle trustless escrow and secure capital pooling.

The second technique involved the distribution of an exploratory pilot requirement-gathering survey (N=16) via Google Forms, administered to a small sample of local MSME operators and digital gig economy workers. The purpose of this survey was not to validate macroeconomic conclusions but to identify preliminary UI/UX constraints, trust heuristics, and user attitudes toward blockchain-based financial tools. The survey responses served as design-guiding heuristics for the system requirements and are summarized as follows:

- 75% of respondents reported having turned down a gig or project specifically because they lacked the necessary physical equipment or upfront funding.
- When assessing traditional funding methods, 37.5% cited high interest rates and 25% cited strict approval requirements as their primary frustrations.
- From the investor perspective, over 31% of respondents indicated high levels of concern (rating 4 or 5 out of 5) regarding creators misusing raised funds.
- 68.75% of participants confirmed they would be more likely to fund a project if payouts were securely tied to verifiable smart contract milestones rather than traditional lump-sum disbursements.
- 75% of respondents rated having a fully transparent, immutable ledger for fund transfers as highly important.
- 31.25% of respondents indicated they had never used a cryptocurrency wallet.

These pilot-survey findings guided several key design decisions. The high concern over fund misuse (31%) and the strong preference for milestone-based payouts (68.75%) reinforced the requirement for a zero-trust automated escrow mechanism. The significant proportion of non-crypto-wallet users (31.25%) dictated the critical requirement to abstract blockchain complexities away from the end user through an accessible, responsive Next.js web interface.


## 3.3 METHOD OF DATA COLLECTION

Gathering accurate information is foundational to any software engineering project. The data collection process for the Anchor Capital system focused on understanding both the economic realities of Nigerian MSMEs and the technical mechanics of decentralized asset tokenization on the Solana blockchain. The research relied on two distinct categories of information gathering.

### 3.3.1 PRIMARY SOURCE

Primary data refers to raw, firsthand information collected directly from the field. This research relied on direct observation alongside an exploratory pilot requirement-gathering survey (N=16) administered via Google Forms to a small convenience sample of local MSME owners, freelancers, and retail investors.

Direct observation of the traditional financial landscape allowed for a systematic evaluation of the operational bottlenecks of legacy bank lending and manual invoice factoring. It identified intermediary processing fees in the 7 to 10 percent range, excessive manual verification delays, and the absence of cryptographic guarantees in traditional escrow systems.

The Google Forms survey complemented these observations by gathering firsthand data regarding funding challenges and Web3 readiness from the target user groups. The primary data revealed that 75% of respondents had turned down work opportunities due to a lack of upfront capital. Respondents identified high interest rates (37.5%) and strict approval requirements (25%) as their primary frustrations with traditional financing. 68.75% confirmed a willingness to fund local projects if disbursements were programmatically tied to verifiable smart contract milestones. These pilot findings served as design-guiding inputs for the zero-trust escrow mechanism driven by Program Derived Addresses (PDAs). The finding that 31.25% of participants had never interacted with a Web3 wallet directly informed the requirement for a simplified frontend built with Next.js to abstract complex blockchain operations from non-technical users.

### 3.3.2 SECONDARY SOURCE

Secondary data involves information extracted from existing published academic materials, regulatory documents, and technical specifications. Secondary data was gathered through a review of peer-reviewed journals, conference papers, and industry reports covering Decentralized Finance (DeFi), supply chain finance, and smart contract architecture.

The literature review in Chapter Two served as a foundational secondary source. Industry reports from the International Finance Corporation (IFC) established the quantitative benchmark for the research by defining the MSME credit gap in Nigeria. Published legal documentation, specifically the Nigerian Senate's Factoring, Assignment and Receivables Financing Bill (2026), provided the legal context for tokenizing unpaid invoices as enforceable Real-World Assets (RWAs). Academic literature (Schär, 2021; Sims, 2019; Javaid et al., 2022) identified the gas fee limitations and network congestion of early Ethereum-based crowdfunding systems, which informed the selection of the high-throughput, low-cost Solana blockchain. Technical documentation detailing the Solana Token-2022 standard and the Rust-based Anchor framework guided the selection of TransferFeeConfig for protocol monetization and PermanentDelegate for emergency asset recovery, ensuring that the software engineering choices were grounded in established technical paradigms.


## 3.4 DESCRIPTION OF THE EXISTING SYSTEM

This section analyzes the existing MSME financing and crowdfunding framework architectures as evaluated across the literature by Schär (2021), Miller et al. (2022), and Cong et al. (2021). It evaluates the dominant Web2 crowdfunding methodology (exemplified by platforms such as Kickstarter and Wefunder) alongside early Web3 Decentralized Finance (DeFi) lending protocols deployed on the Ethereum blockchain (such as Aave and Compound). The analysis focuses on the specific architectural and technical failure points that the proposed Solana-based system must address.

### 3.4.1 PROBLEMS OF THE EXISTING SYSTEM

The existing MSME financing architectures exhibit several structural vulnerabilities when applied to invoice factoring for micro-enterprises in emerging economies.

The first problem is the single point of failure inherent in centralized custodial escrow. In Web2 crowdfunding platforms, investor capital is deposited into a centralized escrow account controlled by the platform operator (Sims, 2019). The platform acts as a trusted third-party custodian. If the platform suffers a security breach, undergoes insolvency, or engages in mismanagement, no cryptographic mechanism exists for investors to independently verify the location or integrity of their funds. This centralized custody model introduces counterparty risk that the investor cannot mitigate programmatically.

The second problem involves high intermediary fee overhead. Traditional commercial factoring institutions charge between 5% and 15% in processing and compliance costs (Miller et al., 2022). Web2 crowdfunding platforms impose an additional 7% to 10% in platform fees alongside payment processing surcharges. These compounding deductions reduce the effective capital received by the enterprise and render small-ticket invoice factoring economically unviable for both micro-enterprises and retail micro-investors.

The third problem is clearing and settlement latency. The existing architectures rely on legacy banking infrastructure such as SWIFT wire transfers and local Automated Clearing House (ACH) networks for capital movement. This dependency introduces a 3 to 14 business day waiting period for clearing and settlement (Javaid et al., 2022). This temporal bottleneck is structurally incompatible with the urgent liquidity needs of invoice factoring.

The fourth problem is the computational overhead and error susceptibility of manual spreadsheet reconciliation for yield distribution. Traditional fund managers calculate fractional equity payouts using isolated spreadsheets and internal databases (Maiti et al., 2021). This methodology is susceptible to data entry errors and lacks a publicly verifiable audit trail. The manual identification of each investor, calculation of their proportional share, and execution of individual bank transfers introduce significant administrative overhead and verification difficulty.

The fifth problem, specific to early Web3 architectures, is the Ethereum Virtual Machine (EVM) gas fee model. Sims (2019) demonstrated that Ethereum's gas fee dynamics render retail micro-investments economically unviable during periods of network congestion; a transaction fee can exceed the investment amount itself. Ethereum's average block confirmation time of approximately twelve seconds introduces settlement latency that, while superior to traditional banking, falls short of the sub-second finality achievable on alternative Layer-1 chains. Existing Ethereum-based DeFi protocols also focus on over-collateralized crypto-native assets (Schär, 2021) and lack the tokenization standards required for under-collateralized physical Real-World Assets such as MSME invoices.


### 3.4.2 DESCRIPTION OF THE PROPOSED SYSTEM

The proposed Anchor Capital system introduces a decentralized software architecture designed to address the vulnerabilities identified in Section 3.4.1. The system replaces the centralized custody model with a deterministic, keyless escrow mechanism built on the Solana blockchain. The smart contract handles the entire financial enforcement logic directly on the decentralized ledger.

The core of the proposed system is a Rust smart contract compiled using the Anchor Framework (version 0.30.1) and deployed to the Solana Devnet. The smart contract exposes eight instructions that govern the campaign lifecycle:

**Campaign Initialization.** The `initialize_business` instruction creates a new campaign by generating a deterministic Program Derived Address (PDA) using a composite seed derived from the string literal "business", the owner's wallet public key, and a unique timestamp identifier (`id: u64`). This composite seed architecture allows a single MSME wallet to operate multiple concurrent campaigns. The PDA functions as a deterministic, keyless escrow account; no private key exists for a PDA, and deposited capital can only be moved by the codified rules of the smart contract. During initialization, the smart contract executes a Cross-Program Invocation (CPI) to the Solana Token-2022 program to create a new equity token mint configured with two protocol-level extensions. The `TransferFeeConfig` extension collects a 0.3% fee on every secondary transfer of equity tokens, enabling automated protocol monetization. The `PermanentDelegate` extension designates the PDA as an authorized delegate, providing an emergency compliance mechanism for token recovery in the event of an off-chain legal contract breach.

**Investment Processing.** The `invest` instruction accepts SOL from an investor's Phantom wallet and transfers it into the PDA escrow vault. The smart contract calculates the proportional number of equity tokens using the formula:

> tokens\_to\_mint = (investment\_amount × total\_equity\_tokens) / funding\_goal

This order of operations (multiplication before division) prevents integer truncation to zero in Rust's unsigned integer arithmetic. The contract executes a CPI to the Token-2022 program to mint these tokens into the investor's associated token account. The entire sequence settles within a single Solana block confirmation (approximately 400ms on Devnet) at a transaction fee below 0.001 SOL.

**Fund Withdrawal.** The `withdraw_funds` instruction allows only the verified campaign owner to withdraw accumulated SOL from the PDA escrow vault after the campaign has been marked as funded. The instruction verifies that the withdrawal amount does not exceed the available balance minus the rent-exempt minimum.

**Dividend Distribution.** The `distribute_dividends` instruction implements a programmatic yield distribution mechanism. When an MSME generates revenue, the business owner specifies a total dividend pool in SOL. The smart contract reads the investor's current token balance and the total token supply directly from the Token-2022 mint account. It calculates the proportional share using the formula:

> investor\_share = (total\_dividend × investor\_token\_balance) / total\_token\_supply

The SOL transfer executes atomically from the owner's wallet to the investor's wallet. This on-chain calculation is publicly verifiable and eliminates the reconciliation errors of manual off-chain ledger methods.

**Campaign Closure.** The `close_business` instruction allows the owner to mark a campaign as closed and prevents any further investment transactions.

**Deadline Auto-Closure.** The `auto_close` instruction introduces a programmatic deadline mechanism. It allows any network participant to close a campaign that has passed its `funding_deadline` without reaching its target, immediately unlocking refunds for all investors.

**Fee Harvesting.** The `harvest_fees` instruction allows the protocol admin to collect the accumulated 0.3% transfer fees generated by secondary token trading and secured via the Token-2022 `TransferFeeConfig` extension.

**Refund Processing.** The `refund_investment` instruction provides a programmatic refund safeguard. If a campaign is closed without reaching its funding target, any investor can independently trigger a refund. The smart contract burns the investor's equity tokens and calculates the refund by reversing the original minting formula:

> refund\_amount = (investor\_token\_balance × funding\_goal) / total\_equity\_tokens

The refund is transferred directly from the PDA escrow vault to the investor's wallet. This mechanism eliminates the counterparty risk associated with centralized platforms where investors have no programmatic guarantee of capital recovery (Cong et al., 2021).

**Hybrid Data Architecture.** Storing rich descriptive metadata directly on the Solana blockchain would be prohibitively expensive in terms of storage rent. The architecture features a hybrid on-chain/off-chain data model. Critical financial state variables (funding goal, total raised capital, equity percentage, token supply, funded/closed flags) are stored on-chain within the PDA account. Descriptive metadata (business name, sector, campaign description, cover images) is stored in a Supabase PostgreSQL database. The two data layers are linked by using the PDA's on-chain address as the primary key in the off-chain database. All metadata mutations are routed through secure Next.js server-side API routes (`/api/businesses`, `/api/upload`) that enforce input validation and sanitization before writing to the database using a privileged `service_role` key. The Supabase database is protected by strict Row Level Security (RLS) policies that restrict all `INSERT`, `UPDATE`, and `DELETE` operations exclusively to the server-side service role, preventing direct client-side manipulation of the metadata store.

**Frontend Architecture.** The frontend is built using the Next.js framework with the App Router architecture. It provides four core user-facing pages: a public MarketPlace for browsing active campaigns, a campaign detail page with a real-time InvestmentSidebar component, a campaign creation form with a live preview panel, and a portfolio dashboard with tabbed views (`MyCampaignsTab`, `MyInvestmentsTab`) for managing owned campaigns and tracking investment holdings. The frontend communicates with the Solana blockchain through custom React hooks (`useProgram`, `useBusinesses`, `useBusinessMetadata`, `useTokenPortfolio`) that abstract RPC calls and Anchor program interactions into reusable state management modules. The Phantom Wallet adapter handles wallet connection and transaction signing.


### 3.4.3 JUSTIFICATION FOR THE PROPOSED SYSTEM

The justification for the Anchor Capital system is grounded in the specific architectural advantages of its design over the existing systems analyzed in Section 3.4.1. Each justification maps directly to a problem identified in that section.

**Elimination of centralized custody risk.** The system replaces the centralized escrow account with a deterministic, keyless Program Derived Address (PDA) on the Solana blockchain. A PDA has no private key; it cannot be compromised by a malicious actor, seized by an insolvent platform operator, or accessed outside the codified rules of the deployed smart contract. The only logic that can move deposited capital is the immutable Rust code on the Solana network. This architectural decision addresses the single point of failure identified in centralized custodial models (Sims, 2019).

**Reduction of intermediary fee overhead.** A Solana transaction costs approximately 0.000005 SOL, which is less than 0.1% of even the smallest micro-investment. The entire investment flow, from the investor's wallet to the PDA escrow vault including the minting of equity tokens, executes as a single atomic transaction at this cost. This eliminates the 5 to 15 percent fee overhead charged by traditional factoring institutions and Web2 crowdfunding platforms (Miller et al., 2022).

**Elimination of settlement latency.** Every financial transaction on the platform settles within a single Solana block confirmation, achieving sub-second finality (approximately 400ms on Devnet). The moment an investor approves the transaction in their Phantom wallet, the SOL is deposited in the PDA escrow vault and the equity tokens are minted to their wallet within the same block. This eliminates the 3 to 14 business day settlement window of legacy banking infrastructure (Javaid et al., 2022).

**Replacement of manual reconciliation with programmatic on-chain yield distribution.** The `distribute_dividends` instruction reads the investor's exact token balance and the total token supply directly from the on-chain Token-2022 mint account. The proportional share calculation executes atomically and is permanently recorded on the public blockchain, creating a verifiable audit trail that any party can independently confirm. This replaces the error-susceptible manual spreadsheet methodology identified in Section 3.4.1 (Maiti et al., 2021).

**Autonomous programmatic refund mechanism.** The `refund_investment` instruction allows any investor to independently trigger a refund without requiring permission from the business owner, the platform operator, or any third party. The smart contract burns the investor's equity tokens and reverses the original minting formula to calculate the exact SOL amount owed. This addresses the counterparty risk in failed campaigns on centralized platforms, where investors have no programmatic guarantee of capital recovery (Cong et al., 2021).


## 3.5 SYSTEM DESIGN

This section outlines the architectural blueprint of the Anchor Capital system. System design translates the requirements into a structured technical framework. It defines the interactions between the two human actors and the blockchain smart contract, structures the hybrid data pipeline linking the on-chain Solana PDA to the off-chain Supabase PostgreSQL database, and maps how the Next.js frontend communicates with both layers.


### 3.5.1 Use Case Diagram

A use case diagram represents the functional interactions between external actors and the proposed software. For the Anchor Capital system, the primary actors are the MSME (Business Owner) and the Investor (Retail or Gig Worker). The platform depends on two external systems: the Solana Smart Contract, which handles all financial logic, and the Supabase database, which stores descriptive campaign metadata.

Fig 3.2 Use Case Diagram

The MSME acts as the primary actor responsible for creating and managing campaigns. The interaction begins when the MSME executes the Connect Wallet use case to link their Phantom wallet to the application. Once connected, the MSME accesses the Create Campaign use case, which involves completing a form with business details and financial targets. This action interacts with both external systems: the Solana Smart Contract creates the on-chain PDA escrow vault and the Token-2022 equity mint, while Supabase stores the business name, description, sector, and cover image. The MSME can also Browse MarketPlace to view other campaigns. After a campaign is funded, the MSME gains access to three owner-restricted actions: Withdraw Funds to retrieve raised SOL from the escrow vault, Distribute Dividends to pay investors proportionally, and Close Campaign to terminate the listing.

The Investor interacts with the platform as the capital provider. The Investor also begins by connecting a wallet. From there, the Investor can Browse MarketPlace to discover active campaigns and select one to View Campaign Details, which displays the full description and real-time funding progress. The Invest in Campaign use case sends SOL into the escrow vault and returns equity tokens. After investing, the Investor can View Portfolio to track token holdings and yield performance. If a campaign fails to reach its target and is closed by the owner, the Investor can execute the Claim Refund use case to burn tokens and recover SOL. The Investor can also View Campaign History to review past funded and closed campaigns.


### 3.5.2 Activity Diagram

An activity diagram represents the dynamic behavior of the proposed software. It maps the sequence of steps from the moment a user opens the application until the campaign lifecycle is complete. The activity flow shows two parallel paths for the MSME and the Investor, including the alternative refund path for failed campaigns.

Fig 3.3 Activity Diagram

The process begins with a decision node that checks whether the user has connected their Phantom wallet. If the wallet is not connected, the interface prompts the user to connect. Once connected, the flow branches based on the user's role.

If the user is an MSME, the flow enters the campaign creation path. The MSME fills out the campaign form with the business name, description, sector, funding goal, yield percentage, and token supply. An optional image upload is handled through the server-side API route. The MSME submits the transaction, which opens the Phantom wallet for approval. Upon approval, the smart contract executes the `initialize_business` instruction: this creates the PDA escrow vault and the Token-2022 equity mint configured with TransferFeeConfig and PermanentDelegate extensions. The frontend then saves the descriptive metadata to Supabase through the secure API route. The campaign is now live on the MarketPlace.

If the user is an Investor, the flow enters the investment path. The Investor browses the MarketPlace and selects a campaign. The Investor enters a SOL amount and submits the transaction through Phantom. The smart contract executes the `invest` instruction, which transfers SOL into the PDA escrow vault and mints equity tokens into the Investor's wallet. The system then evaluates whether the total raised capital has reached the funding goal. If not, the campaign remains active for additional investors. If the goal is reached, the campaign is marked as funded.

Once a campaign is funded, the owner has three available actions: withdrawing SOL from the escrow, distributing dividends to investors based on token holdings, and closing the campaign. These actions can be performed in any order and repeated as needed.

The diagram also illustrates the refund path for failed campaigns. If the owner closes a campaign that has not reached its funding goal, any investor can trigger the `refund_investment` instruction. The smart contract burns the investor's equity tokens and returns the original SOL from the PDA escrow vault to the investor's wallet.


### 3.5.3 Sequence Diagram for User

A sequence diagram represents the chronological order of messages exchanged between system components during a specific operation. The diagram traces the technical flow when an Investor invests in a campaign, showing every message passed between the Investor, the Phantom Wallet, the Next.js Frontend, the Solana RPC node, the Smart Contract, and the Token-2022 Program.

Fig 3.4 Sequence Diagram for User

The flow begins when the Investor navigates to the campaign detail page. The frontend sends a request to the Solana RPC node to fetch the BusinessState account for the campaign. The RPC returns the on-chain data including the funding goal, total raised, and current status. The frontend renders the campaign details alongside the InvestmentSidebar component.

The Investor enters a SOL amount and clicks the Invest Now button. The frontend calculates a live preview of the equity tokens to be received. It then builds the transaction instruction and sends it to Phantom for signing. Phantom displays a popup showing the SOL amount that will leave the wallet. The Investor reviews and approves the transaction.

Phantom submits the signed transaction to the Solana RPC, which forwards it to the smart contract. The smart contract executes validation checks: it verifies the campaign is not closed, is not already fully funded, the investment amount is greater than zero, and the amount does not exceed the remaining funding gap. If any check fails, the transaction is rejected and the Investor's SOL is not transferred.

If all checks pass, the smart contract transfers SOL from the Investor's wallet into the PDA escrow vault. It calculates the tokens to mint using the formula: tokens\_to\_mint = (investment\_amount × total\_equity\_tokens) / funding\_goal. It calls the Token-2022 program through a Cross-Program Invocation to mint those tokens into the Investor's wallet. It updates the total\_raised field and checks whether the funding goal has been reached; if so, it sets the is\_funded flag to true.

The Solana RPC confirms the transaction and returns the transaction signature to the frontend. The frontend displays a success toast notification and updates the progress bar to reflect the new funding percentage.


### 3.5.4 Class Diagram

A class diagram represents the data structures used in the software and the relationships between them. The Anchor Capital architecture consists of three core data classes operating across two storage layers, plus a set of React frontend modules.

Fig 3.5 Class Diagram

The primary class is `BusinessState`. This on-chain data structure is stored inside the PDA on the Solana blockchain. It contains the following fields: a unique `id` (u64), the `owner` wallet address (Pubkey), `funding_goal` in lamports (u64), `equity_percentage` (u8), `total_raised` (u64), `total_equity_tokens` (u64), `is_funded` (bool), `is_closed` (bool), `bump` (u8), `funding_deadline` (i64), and `mint_key` (Pubkey). The class exposes eight methods corresponding to the smart contract instructions: `initialize_business`, `invest`, `withdraw_funds`, `distribute_dividends`, `close_business`, `auto_close`, `harvest_fees`, and `refund_investment`.

The second class is `BusinessMetadata`. This off-chain data structure is stored in the Supabase PostgreSQL database. It contains: `id` (text, primary key, set to the PDA address), `owner` (text), `name` (text), `description` (text), `category` (text), `image_url` (text), `website_url` (text), and `created_at` (timestamptz). The PDA address serves as the primary key, linking the on-chain financial data to the off-chain descriptive metadata.

The third class is `EquityToken`. This represents the Token-2022 mint created during campaign initialization. It stores the `mint_address` (Pubkey), `supply` (u64), `decimals` (u8, set to 6), and two extensions: `TransferFeeConfig` (fee rate of 0.3%) and `PermanentDelegate` (delegate set to the PDA).

On the frontend, four React hook classes handle data fetching. The `useProgram` hook connects the wallet to the Solana network and returns the Anchor program object. The `useBusinesses` hook fetches all BusinessState accounts from the blockchain. The `useBusinessMetadata` hook fetches descriptive metadata from Supabase. The `useTokenPortfolio` hook scans the Investor's wallet for equity token holdings.

Three React component classes handle the user interface. The `InvestmentSidebar` component provides the investment form with a live token preview and the Invest Now button. The `MyCampaignsTab` component displays the owner's campaigns and provides the withdraw, dividend, and close actions. The `MyInvestmentsTab` component displays the Investor's token holdings alongside expected versus actual yield performance.

Two server-side API route classes handle secure database operations. The `APIRoute_Businesses` class handles the POST request to `/api/businesses` for creating new campaign metadata; it validates required fields, cryptographically verifies the owner's signature using `tweetnacl`, and inserts the record using the privileged `service_role` key. The `APIRoute_BusinessDetail` class handles GET, PATCH, and DELETE requests to `/api/businesses/[id]`, utilizing the same cryptographic signature verification to ensure only the authenticated wallet owner can mutate or delete their campaign metadata. The `APIRoute_Upload` class handles image uploads to `/api/upload` through a secure server-side path. These routes ensure that the `service_role` key is never exposed to the frontend browser.


## 3.6 FUNCTIONAL REQUIREMENTS

The functional requirements for the proposed system include the following core behaviors:

1. **Campaign Initialization:** The smart contract must generate a unique Program Derived Address using a composite seed derived from the owner's wallet public key and a unique timestamp identifier. It must execute a Cross-Program Invocation to the Token-2022 program to create an equity token mint configured with the TransferFeeConfig extension at a rate of 0.3% and the PermanentDelegate extension assigned to the PDA. The frontend must transmit the campaign metadata to a server-side API route that validates and sanitizes all input fields before inserting the record into the Supabase PostgreSQL database using the PDA address as the primary key.

2. **Investment Processing:** The smart contract must accept a SOL amount from an investor's wallet and transfer it into the PDA escrow vault. It must calculate the proportional number of equity tokens using the formula: tokens\_to\_mint = (investment\_amount × total\_equity\_tokens) / funding\_goal. It must execute a Cross-Program Invocation to mint the calculated tokens into the investor's associated token account. It must mark the campaign as funded when the total raised capital equals or exceeds the funding goal.

3. **Programmatic Yield Distribution:** The smart contract must allow the business owner to specify a total dividend pool in SOL. It must read the investor's current token balance and the total token supply from the Token-2022 mint account. It must calculate the investor's proportional share using the formula: investor\_share = (total\_dividend × investor\_token\_balance) / total\_token\_supply. It must transfer the calculated SOL amount from the owner's wallet to the investor's wallet in a single atomic transaction.

5. **Autonomous Refund Execution:** The smart contract must allow any investor to independently trigger a refund if a campaign has been closed without reaching its funding goal. It must burn the investor's equity tokens. It must calculate the refund amount using the formula: refund\_amount = (investor\_token\_balance × funding\_goal) / total\_equity\_tokens. It must transfer the calculated SOL from the PDA escrow vault to the investor's wallet.

6. **Deadline-Triggered Auto-Close:** The smart contract must allow any network participant to execute the `auto_close` instruction if the campaign's `funding_deadline` has elapsed without reaching the `funding_goal`.

7. **Fund Withdrawal:** The smart contract must allow only the verified business owner to withdraw accumulated SOL from the PDA escrow vault after the campaign has been marked as funded. It must verify that the withdrawal amount does not exceed the available balance minus the rent-exempt minimum. It must reject any withdrawal attempt if the campaign has not reached its funding goal or has been closed.

8. **Real-Time Portfolio Monitoring:** The frontend dashboard must query the Solana blockchain to retrieve all BusinessState accounts associated with the connected wallet. It must query the investor's wallet for all Token-2022 equity token holdings using the parsed token accounts RPC method. It must display the investor's token balance, ownership percentage, and a comparison of expected yield versus actual yield. It must display the business owner's campaign progress, funding status, and provide interfaces for withdrawal, dividend distribution, and campaign closure.


## 3.7 NON-FUNCTIONAL REQUIREMENTS

The non-functional requirements for the proposed system define the quality constraints governing trustless security, transaction efficiency, and system reliability:

1. **Security:** The PDA escrow must be cryptographically inaccessible to any human actor. The smart contract must enforce signer verification on every state-mutating instruction to ensure only the authorized wallet can execute owner-restricted operations (fund withdrawal, dividend distribution, campaign closure). The Supabase database must enforce Row Level Security policies restricting all insert, update, and delete operations to the server-side service role key. The frontend must never directly access or expose the service role credentials.

2. **Performance:** Every on-chain transaction must settle within a single Solana block confirmation, achieving sub-second finality. The smart contract must execute the complete investment flow (SOL transfer, token calculation, Token-2022 minting CPI) within a single atomic transaction. The frontend must render updated funding progress and portfolio data without requiring a manual page refresh after a successful transaction.

3. **Scalability:** The PDA derivation seed must incorporate a unique timestamp identifier alongside the owner's wallet public key, allowing a single MSME wallet to operate an unlimited number of concurrent campaigns. The frontend data-fetching hooks must retrieve and render all on-chain BusinessState accounts regardless of the total number of active campaigns.

4. **Data Integrity:** The hybrid on-chain/off-chain data architecture must maintain referential consistency by using the PDA's on-chain address as the primary key in the Supabase PostgreSQL database. The server-side API route must validate all required metadata fields and sanitize all string inputs before executing the database insertion. On-chain financial state and off-chain descriptive metadata must remain independently queryable but logically linked.

5. **Usability:** The frontend must abstract the complexity of blockchain interactions behind a standard web application experience. Users must be able to browse campaigns, invest SOL, receive equity tokens, and track portfolio performance without requiring knowledge of smart contract programming, RPC endpoints, or token account derivation. The interface must be responsive across desktop and mobile screen sizes.

6. **Cost Efficiency:** The total transaction fee for any single operation must not exceed 0.001 SOL. The combined cost of creating a campaign, investing, withdrawing funds, distributing dividends, and processing a refund must remain significantly below the 5 to 15 percent fees charged by traditional factoring institutions and centralized crowdfunding platforms.


### 3.7.1 SMART CONTRACT PROFILING AND RESOURCE CONSTRAINTS

To validate the technical viability of the proposed system, the Anchor Capital smart contract was profiled on the Solana Devnet. The Solana runtime enforces strict computational and storage limits, and the profiling results for three resource vectors confirm the efficiency of the proposed architecture.

**Compute Units (CU) Consumption.** The Solana Berkeley Packet Filter (BPF) runtime enforces a limit of 200,000 Compute Units per instruction. The most computationally intensive instruction in the system is the `invest` function, which performs input validation, executes a system transfer to move SOL into the PDA escrow, and performs a Cross-Program Invocation to the Token-2022 program to mint equity tokens. Devnet execution logs confirmed that the `invest` instruction consumed approximately 15,500 Compute Units, representing less than 8% of the maximum allowable budget. This leaves significant headroom for execution under variable network conditions.

**Storage Rent Cost.** Solana requires accounts to maintain a minimum SOL balance proportional to their data size for rent exemption. The `BusinessState` struct occupies the following byte footprint:

| Field | Type | Size (bytes) |
|---|---|---|
| Anchor Discriminator | \[u8; 8\] | 8 |
| id | u64 | 8 |
| owner | Pubkey | 32 |
| funding\_goal | u64 | 8 |
| equity\_percentage | u8 | 1 |
| total\_raised | u64 | 8 |
| total\_equity\_tokens | u64 | 8 |
| is\_funded | bool | 1 |
| is\_closed | bool | 1 |
| bump | u8 | 1 |
| funding\_deadline | i64 | 8 |
| mint\_key | Pubkey | 32 |
| **Total data** | | **116** |

The Solana network appends a 128-byte header to all accounts, bringing the total footprint to 244 bytes. At the network's rent rate of 6,960 lamports per byte, creating a new campaign escrow vault costs 1,698,240 lamports (0.00169824 SOL).

**Network Latency.** During deployment and interaction on the Solana Devnet, the system exhibited an average block confirmation time of approximately 400 milliseconds. From the moment a user approves a transaction in the Phantom wallet to the moment the SOL is locked in the PDA escrow and equity tokens are received, less than half a second elapses.


## 3.8 OUTPUT SPECIFICATION

The output specification details the data results and cryptographic assets produced by the proposed system. The system produces outputs in two categories: on-chain cryptographic outputs and digital interface outputs.

**On-Chain Cryptographic Outputs.** The primary on-chain output is the Token-2022 equity token. When an investor funds a campaign, the smart contract mints a quantity of equity tokens into the investor's Phantom wallet. The token uses the Solana Token-2022 standard with six decimal places of precision. The number of tokens is calculated proportionally based on the investor's SOL contribution relative to the funding goal. The token is delivered within a single block confirmation. It represents the investor's fractional ownership stake and serves as the basis for all subsequent dividend calculations. Each transaction also produces a unique transaction signature: a base-58 encoded string that serves as a permanent, verifiable receipt on any public Solana blockchain explorer.

The system produces SOL transfer outputs at three points in the campaign lifecycle. First, when an investor funds a campaign, SOL is transferred from the investor's wallet to the PDA escrow vault. Second, when the business owner withdraws raised capital, SOL is transferred from the PDA escrow vault to the owner's wallet. Third, when dividends are distributed, SOL is transferred proportionally to investors based on their token holdings relative to the total supply. Each transfer is accompanied by an on-chain state update: the `total_raised` field is updated after every investment, the `is_funded` flag is set to true when the funding goal is reached, and the `is_closed` flag is set to true when the owner closes the campaign.

**Digital Interface Outputs.** The MarketPlace page renders a data table (desktop) with a responsive card list (mobile) displaying all active campaigns. Each entry includes the business name, truncated owner wallet address, sector classification, funding target in SOL, percentage funded, and a color-coded status badge: green (Funded), blue (Funding), or red (Closed). A horizontal progress bar provides a visual indicator of funding completion. Campaign data is rendered by simultaneously fetching financial state from the Solana blockchain and descriptive metadata from the Supabase database.

The portfolio dashboard renders a tabbed interface personalized to the connected wallet. The My Campaigns tab displays each campaign created by the user, showing the PDA address, funding progress bar, raised versus target SOL amounts, current status badge, and input fields with action buttons for withdrawing funds, distributing dividends, and closing the campaign. The My Investments tab displays a card for each investment, showing the business name, sector, exact token balance, ownership percentage (token balance divided by total supply), and a performance comparison of expected yield versus actual yield. The system produces toast notifications as temporary visual alerts after every transaction: a green toast confirms success and includes the truncated transaction signature, while a red toast alerts to failure and includes the error message returned by the smart contract.

## 3.9 VERIFICATION AND TESTING

The Anchor Capital system implements a comprehensive verification and testing suite to ensure the security, reliability, and accuracy of both on-chain and off-chain components. The testing strategy is divided into smart contract integration testing and frontend unit testing.

### 3.9.1 Smart Contract Integration Testing

The smart contract is tested using the Mocha testing framework paired with the Chai assertion library, executed through the Anchor Framework's local validator environment (`anchor test`). This environment simulates a live Solana node, allowing tests to execute realistic transaction flows without incurring actual network costs or latency.

The integration test suite (`tests/dip.test.ts`) verifies the entire campaign lifecycle through programmatic simulation:
1. **Initialization:** Verifies that the `initialize_business` instruction correctly computes the PDA, mints the Token-2022 equity token, and sets the initial state (e.g., funding goal, equity percentage). It asserts that the PDA address derived by the client matches the address initialized on-chain.
2. **Investment Processing:** Simulates an investor transferring SOL into the PDA escrow. The tests assert that the `invest` instruction correctly calculates the proportional equity tokens using the system's token-math formula. It verifies that the investor receives the correct token balance and that the `total_raised` field accurately updates. It also asserts that the `is_funded` flag toggles to `true` exactly when the funding target is reached.
3. **Yield Distribution:** Tests the `distribute_dividends` instruction by calculating expected dividend payouts off-chain and comparing them against the on-chain execution. It verifies that SOL is accurately transferred from the business owner to the investor based on fractional token holdings, preventing rounding errors or truncation vulnerabilities.
4. **Escrow and Refund Safeguards:** Simulates campaign failure scenarios. It tests the `auto_close` instruction by simulating a time jump past the `funding_deadline` to ensure network participants can trigger the closure. It tests the `refund_investment` instruction to confirm that investors can independently burn their equity tokens and recover their locked SOL from the PDA.
5. **Security & Access Control:** Explicitly attempts unauthorized actions, such as a non-owner attempting to withdraw funds or distribute dividends, and asserts that the smart contract correctly rejects these transactions with the appropriate error codes.

### 3.9.2 Frontend Unit Testing

The Next.js frontend is tested using Jest and the React Testing Library (`@testing-library/react`). This suite focuses on validating the accuracy of client-side calculations and the correct rendering of UI components.

The frontend test suite (`frontend/src/__tests__`) ensures that:
1. **Utility Functions:** Financial formatting functions (e.g., `formatSol`, `calculateEquityShare`) accurately convert between lamports and SOL, properly handling edge cases and zero values without triggering division-by-zero errors.
2. **Component Rendering:** Core UI components, such as the `InvestmentSidebar` and `MyCampaignsTab`, render the correct conditional states. For example, the test suite verifies that the "Invest Now" button is disabled if the campaign is fully funded or if the investment amount exceeds the remaining funding gap.
3. **State Management:** Custom React hooks (e.g., `useBusinesses`, `useTokenPortfolio`) are tested by mocking the Solana RPC responses. This ensures that the frontend correctly interprets on-chain state data and updates the UI defensively when the network is unreachable.
