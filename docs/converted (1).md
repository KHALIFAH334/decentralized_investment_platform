CHAPTER ONE
INTRODUCTION
1.1 Background of the study
Micro, Small, and Medium Enterprises (MSMEs) serve as the primary economic driver in
Nigeria, yet they encounter crippling liquidity constraints. The unmet demand for credit among
Nigerian enterprises has reached approximately 13 trillion naira, or about 8.6 billion dollars
(International Finance Corporation, 2026). This staggering credit gap forces business owners to
rely on insufficient personal savings, while traditional commercial banks consistently reject loan
applications due to perceived structural risks. The continuous inability to access formal banking
channels leaves local enterprises entirely starved of the capital required to sustain daily
operations or expand their market reach.
To circumvent rigid banking structures, alternative financial models such as invoice factoring
have emerged. This mechanism enables businesses to convert unpaid invoices into immediate
cash, thereby unlocking liquidity that would otherwise remain trapped in receivables. Within
modern financial technology, these invoices are increasingly categorized as Real-World Assets
(RWAs). By tokenizing such assets into digital representations, enterprises can mathematically
unlock trapped liquidity. However, traditional invoice factoring has long been plagued by
centralized inefficiencies, including exorbitant intermediary fees and excessive manual
processing delays. In Nigeria, these challenges prompted the passage of the Factoring,
Assignment and Receivables Financing Bill in 2026, which provides a formal legal and
regulatory framework for debt factoring (Nigerian Senate, 2026).

---

Concurrently, Nigeria is witnessing a significant acceleration in digital finance adoption, a trend
largely propelled by the country’s rapidly expanding gig economy (Asimi & Samuel, 2025;
Ekene, 2025). Independent digital workers manage substantial financial capital, often
accumulated through international telemigration services and fintech platforms (Opesade, 2024).
Despite this accumulation of liquid assets, retail investors face persistent challenges within the
digital payment ecosystem, particularly the absence of secure and transparent platforms for
reinvesting their capital into local physical enterprises. Consequently, a critical infrastructure gap
remains, with no decentralized solutions capable of bridging the divide between the digital
wealth of freelancers and the capital requirements of traditional local businesses.
Web3 technology presents a revolutionary solution to these systemic financial barriers by
offering secure and cost-efficient alternatives to traditional intermediaries. The Solana
blockchain, specifically, provides a high-speed, low-cost environment characterized by a
parallel-execution architecture, enabling the seamless tokenization of RWAs. By utilizing
decentralized smart contracts, developers can engineer trustless escrow systems that
autonomously manage capital pooling and dividend distribution. This completely decentralized
architecture empowers freelance workers to collectively finance local business operations
through inclusive, blockchain-based protocols. Ultimately, it delivers a pure software alternative
that eliminates centralized banking bottlenecks while democratizing access to enterprise equity
in emerging markets.
1.2 Statement of the Problem

---

Despite legislative advancements aimed at bridging the credit gap for local enterprises, the
existing financial infrastructure for micro-business investments remains fundamentally flawed.
The current framework is characterized by three major systemic vulnerabilities that hinder
capital generation for businesses alongside yield generation for retail investors:
 Centralization Bottlenecks: Reliance on centralized intermediaries leads to
administrative delays and duplicated costs. Furthermore, these intermediaries charge
exorbitant processing fees (often 7–10%) and impose compliance costs that make small
funding rounds uneconomical, severely disadvantaging micro-enterprises that rely on fast
liquidity.
 Inefficient Yield Distribution: Distributing dividends and tracking fractional equity for
micro-investors relies on manual, off-chain ledger reconciliation. This archaic method is
highly prone to cascading data entry errors and lacks verifiable audit trails, leaving
investors without transparent verification of dividend flows. As a result, investors suffer
delayed returns while fund managers face exponentially increasing overhead.
 Lack of Trust and Escrow Safeguards: Retail investors frequently hesitate to fund local
MSMEs due to the elevated risk of fund mismanagement or misappropriation. The
conventional ecosystem relies on centralized custodians that fail to provide cryptographic
guarantees or automated, trustless escrows to guarantee refunds if funding targets are
missed. Consequently, small-scale investors remain exposed to unacceptable levels of
counterparty risk.
Therefore, a pressing need exists to engineer an automated framework that eradicates these
centralized inefficiencies. The core problem lies in the absence of a decentralized protocol that

---

seamlessly tokenizes real-world assets while simultaneously providing a zero-trust escrow
mechanism for automated dividend distribution.
1.3 Objectives of the Study
The main objective of this research is to develop a decentralized application (dApp) on the
Solana blockchain that enables independent freelance workers to pool their funds to collectively
finance high-value Real-World Assets (RWAs).
To achieve this main objective, the specific objectives are:
1. To design an accessible technological framework and web interface capable of removing
the friction associated with traditional centralized fundraising platforms.
2. To implement Solana smart contracts utilizing the Token-2022 standard to automate
fractional equity tokenization and programmatic dividend distribution.
3. To deploy a transparent, pure software solution that leverages Program Derived
Addresses (PDAs) to provide secure, trustless escrow avenues for micro-investors.
1.4 Research Questions
The study seeks to answer the following questions:
1. How can smart contracts be optimally architected on the Solana blockchain to automate
fractional equity tokenization for capital pooling?

---

2. To what extent does the implementation of Program Derived Addresses (PDAs) eliminate
the friction and necessity of third-party escrow services within enterprise fund-raising
ecosystems?
3. How can the Solana Token-2022 standard extensions, specifically Permanent Delegate
and TransferFeeConfig, be leveraged to enforce on-chain compliance while ensuring
automated yield distribution?
1.5 Research Hypotheses
The research seeks to test the following propositions regarding the efficiency of the Solana
block-chain infrastructure compared to conventional financial systems:
 Null Hypothesis (H0): There is no significant difference in processing latency or
transaction throughput between a decentralized Token-2022 programmatic dividend
distribution pipeline and traditional manual off-chain ledger reconciliation.
 Alternative Hypothesis (H1): An automated Token-2022 programmatic dividend
distribution pipeline on the Solana network significantly reduces execution latency and
improves computational accuracy compared to traditional manual off-chain ledger
reconciliation.

---

1.6 Significance of the Study
The significance of this research extends across theoretical frameworks alongside practical
applications within the Nigerian economic landscape. Theoretically, this study contributes to the
expanding body of knowledge in software engineering and decentralized web domains. It
provides a practical demonstration of integrating the Solana Token-2022 standard with modern
full-stack web frameworks, showcasing how block-chain architecture can move beyond abstract
models to solve tangible, real-world financial problems.
Practically, this research has profound implications for financial inclusion. For local business
owners, it provides a borderless, low-cost avenue to raise essential capital directly from their
immediate communities. By converting future revenue streams into investable equity offerings,
small enterprises can bypass the exorbitant costs associated with traditional banking. For retail
investors, the platform democratizes access to business equity, allowing individuals to execute
micro-investments within a secure, verifiable environment. Ultimately, the Anchor Capital
platform empowers local entrepreneurs and micro-investors by providing a scalable, code
enforced architecture to deeply rooted liquidity constraints.
1.7 Scope and Limitations of the Study
Scope of the Study
This research focuses strictly on the software architecture and the smart contract development for
the proposed decentralized application. The technological boundaries of this project encompass
the creation of the web interface utilizing Next.js, coupled with Supabase for off-chain database
management. The smart contracts are written in Rust utilizing the Anchor framework.

---

Deployment is restricted exclusively to the Solana Devnet. Due to testing constraints
encountered during system development, the transactional proofs of concept utilize native SOL
rather than stablecoins (e.g., USDC). While the project meticulously handles the technical
execution of equity tokenization and secure escrow management, it explicitly excludes the legal
licensing required for a commercial mainnet deployment, placing regulatory compliance within
specific Nigerian financial jurisdictions outside the scope of this technological demonstration.
Limitations of the Study
 User Onboarding Friction: The inherent complexity of managing Web3 wallets (such
as Phantom) presents a steep learning curve for local business owners unfamiliar with
cryptographic technology, potentially slowing initial adoption rates.
 Dependence on Solana Devnet: The study relies heavily on the Solana Devnet, which
introduces infrastructural vulnerabilities. Network instability or periodic state resets could
temporarily disrupt the testing environment and delay the verification of the smart
contract execution pipeline.
 Asset Integration Constraints: The operational necessity to pivot to native SOL due to
developmental testing constraints limits the ability to test real-world stablecoin volatility
protections within this current research phase.