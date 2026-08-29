CHAPTER TWO
LITERATURE REVIEW
2.1 INTRODUCTION
This chapter reviews existing publications and research works to establish the current state of
knowledge regarding MSME financing, Web3 crowdfunding, and decentralized asset
tokenization. It breaks down the specific technologies and theoretical frameworks that form the
foundation of Anchor Capital. An exhaustive evaluation of previous studies and existing
financial architectures reveals critical technological gaps, justifying the development of a Solana-
based, zero-trust invoice factoring platform (Javaid et al., 2022; Schär, 2021).
2.2 CONCEPTUAL FRAMEWORK
The concenptual framework maps out the core financial theories alongside the technical
paradigms that guide the system design. This section creates a bridge between how economies
adapts and how computer software operates. It outlines the foundational concepts driving the
development of this study.
2.2.1 THE CONCEPT OF MSME LIQUIDITY CONSTRAINTS AND INVOICE FACTORING
Micro, Small, and Medium Enterprises (MSMEs) form the backbone of emerging economies but
are frequently bottlenecked by systemic liquidity constraints (Sharma et al., 2021). In Nigeria,
the unmet MSME credit gap has reached approximately ₦13 trillion (International Finance
Corporation, 2017). Traditional commercial lenders systematically reject these businesses due to
perceived structural risks and a lack of physical collateral. To survive, businesses turn to invoice
factoring a financial mechanism that converts unpaid invoices into immediate cash (Ioannou &
Demirel, 2022). Within modern financial technology, these verifiable invoices are increasingly

---

categorized as Real-World Assets (RWAs). By tokenizing these assets, businesses can unlock
trapped capital. However, traditional invoice factoring remains constrained by high
administrative overhead and high entry thresholds, making it inaccessible to retail and micro-
investors. The recent passage of the Factoring, Assignment and Receivables Financing Bill (2026)
provides the much-needed legal framework for debt factoring, validating the necessity for
scalable, software-driven solutions (Nigerian Senate, 2026).
2.2.2 THE CONCEPT OF WEB3 AND DECENTRALIZED FINANCE (DEFI)
Web3 and Decentralized Finance (DeFi) represent a paradigm shift from centralized financial
institutions to peer-to-peer (P2P) liquidity pooling governed by open-source protocols (Schär,
2021). By utilizing cryptographic smart contracts, DeFi eliminates the need for commercial
banks and centralized payment gateways. This architecture is particularly relevant in the context
of the rapidly expanding gig economy. Independent digital workers frequently accumulate
substantial digital assets (e.g., stablecoins and native SOL) via international telemigration
services. Despite this wealth generation, these workers lack transparent, secure avenues to
reinvest their capital into local physical enterprises. Web3 bridges this gap by enabling
permissionless, trustless capital pooling (Cong et al., 2021).
2.2.3 ARCHITECTURAL LIMITATIONS OF CENTRALIZED CROWDFUNDING &
TRADITIONAL FACTORING
While Web2 crowdfunding platforms (e.g., Kickstarter, Wefunder) and traditional banking
systems attempt to pool capital, they exhibit three systemic failure points. First, centralized
platforms frequently charge between 7% and 10% in processing and compliance costs, heavily

---

diluting the capital intended for the enterprise (Miller et al., 2022). Second, the reliance on
legacy banking infrastructure (SWIFT, local ACH) introduces a 3-5 business day latency for fiat
clearing and settlement. Finally, retail investors are forced to trust a centralized custodian. If
funding goals are missed or the platform goes bankrupt, there are no mathematical or
cryptographic guarantees that investors will successfully receive refunds (Sims, 2019).
2.2.4 OFF-CHAIN LEDGER RECONCILIATION VS. PROGRAMMATIC SMART
CONTRACT YIELD DISTRIBUTION
A core limitation of traditional asset syndication is the reliance on manual, off-chain ledger
reconciliation for dividend and yield distribution (Maiti et al., 2021). Traditional fund managers
utilize isolated databases and spreadsheets to calculate fractional equity payouts. This archaic
methodology is highly prone to cascading data entry errors, lacks a verifiable audit trail, and
generates immense administrative overhead, resulting in delayed returns for investors.
Conversely, programmatic yield distribution via smart contracts mathematically guarantees
payout accuracy. On-chain ledgers transparently process distributions in milliseconds based on
real-time token holdings, eliminating administrative friction (Schär, 2021).
2.2.5 THE ARCHITECTURE AND MECHANICS OF SOLANA TOKEN-2022 & PROGRAM
DERIVED ADDRESSES (PDAS)
Anchor Capital leverages the Solana blockchain due to its parallel-execution architecture,
enabling high-speed, low-cost asset tokenization. The system utilizes two critical technical
mechanics. First, unlike legacy SPL tokens, the Token-2022 standard allows for advanced state
mechanics at the protocol level. The TransferFeeConfig extension can be utilized for automated

---

protocol monetization, collecting micro-fees upon yield token transfers, while the
PermanentDelegate extension provides an emergency recovery mechanism, allowing authorized
administrators to burn or recover tokens in the event of an off-chain legal contract breach by a
debtor. Second, the architecture leverages Program Derived Addresses (PDAs). PDAs are
deterministically generated cryptographic addresses that have no private keys. Because no
human possesses the private key to a PDA, it serves as an impenetrable, zero-trust escrow vault.
PDAs are programmed to hold investor capital and only release funds to the enterprise if a
predefined funding goal is met. If the target fails, the PDA enables deadline-triggered refunds: after the funding deadline expires, any network participant can trigger the close instruction, and investors can independently claim their refund by burning equity tokens,
completely eliminating counterparty custody risk.
2.3 THEORETICAL FRAMEWORK
2.3.1 DECENTRALIZED FINANCIAL SYSTEMS THEORY
This theory proposes that the removal of trusted centralized intermediaries from a financial
system reduces transactional friction, eliminates rent-seeking administrative costs, and
maximizes peer-to-peer economic utility (Schär, 2021; Miller et al., 2022). Applied to Anchor
Capital, this theory forms the foundational justification for bypassing commercial bank lending
and Web2 crowdfunding platforms. By utilizing a decentralized ledger, the application
mathematically enforces financial agreements, empowering retail gig-workers and local
enterprises to interact directly.
2.3.2 PROGRAMMATIC TRUST & ZERO-INTERMEDIARY ESCROW THEORY

---

Programmatic Trust theory posits that codified, immutable logic (smart contracts) replaces
human discretion and the necessity for centralized legal custodians in executing financial
agreements (Sims, 2019). In Anchor Capital, this theory is put into practice through PDAs. The
smart contract acts as the ultimate arbiter automatically managing escrow conditions, releasing
capital upon successful funding, and seamlessly reversing transactions if funding parameters are
missed, thereby establishing "trustless" financial engineering.
2.4 EMPIRICAL REVIEW
Numerous academic studies have investigated the intersection of blockchain technology and
enterprise financing, establishing a foundation for decentralized credit markets. In a systematic
literature review analyzing 85 scholarly articles, Kumar et al. (2023) investigated how
blockchain mitigates SME financing challenges. Their methodology revealed that blockchain
effectively lowers information asymmetry and reduces transaction costs in supply chain
financing. However, a significant technical limitation in their reviewed architectures is the
primary focus on permissioned enterprise blockchains (such as Hyperledger), which ignores
public permissionless networks like Solana and fails to address the retail investor liquidity side
entirely. Similarly, Javaid et al. (2022) conducted an exploratory analysis of smart contract
applications across banking, insurance, and lending. Their findings confirmed that distributed
ledgers drastically reduce settlement times from days to seconds. Yet, the systems they reviewed
lacked advanced tokenization standards capable of handling regulatory compliance, rendering
them unfit for localized real-world asset securities.

---

In the realm of supply chain and invoice tokenization, Ioannou and Demirel (2022) evaluated the
legal and operational intersection of tokenized supply chain invoices. Their study demonstrated
that tokenizing invoices significantly improves liquidity visibility for manufacturers. Despite this,
their research highlighted a critical gap in automated yield distribution; most platforms
successfully tokenized the invoice but ultimately relied on off-chain fiat settlement to distribute
the yields, reintroducing legacy banking friction. Evaluating broader digital credit interventions,
Sharma et al. (2021) performed a qualitative assessment of digital technologies within India's
MSME ecosystem. They proved that digital underwriting and peer-to-peer lending platforms
expand credit access by 40%. Nevertheless, their proposed roadmap heavily relied on centralized
banking APIs and traditional escrow accounts, leaving investors fully exposed to centralized
custody failures.
The mechanics of Decentralized Finance (DeFi) have also been extensively mapped. Schär (2021)
introduced a quantitative framework analyzing DeFi lending and borrowing protocols, such as
Aave and Compound. The findings established that DeFi protocols achieved a 99% reduction in
administrative overhead compared to traditional banking intermediaries. However, a core
limitation of this study is its exclusive focus on crypto-native assets (over-collateralized crypto
loans), completely ignoring under-collateralized physical Real-World Assets (RWAs) like
invoices. Expanding on DeFi dynamics, Miller et al. (2022) utilized network analysis to map the
token distribution of major Web3 governance protocols. They discovered that despite the
promise of decentralized protocols, early venture capital retained centralized wealth
accumulation. Their research, while critical, focused solely on utility and governance tokens
rather than fractionalized yield-bearing assets representing physical MSME debt.

---

Addressing the governance of enterprise risk, Mutamimah et al. (2023) developed a conceptual
governance model linking smart contracts to MSME credit risk assessment. Their findings
indicated that immutable on-chain transaction histories drastically reduce the risk of fraudulent
accounting by SMEs. Unfortunately, their framework remained entirely theoretical and lacked a
functional engineering architecture (such as Solana PDAs) to practically execute trustless escrow.
From an accounting perspective, Maiti et al. (2021) proposed an applied theoretical model of
triple-entry accounting for transparent ledger reconciliation. They confirmed that smart contracts
provide real-time, cryptographically verified audit trails that prevent manual reconciliation errors.
Yet, their research did not address how micro-investors could practically utilize this framework
for fractionalized dividend claims in a high-throughput environment.
Finally, regarding corporate structure and syndication, Cong et al. (2021) conducted an empirical
study of Initial Coin Offerings (ICOs) and tokenized fundraising platforms. The study showed
that tokenization dramatically lowers the barrier to entry for retail investors, creating borderless
capital pools. A major technical limitation of the studied platforms, however, was the lack of
built-in programmable escrow safeguards, leading to massive counterparty risk when founders
failed to deliver promised products. Exploring this further, Sims (2019) provided a legal-
technical analysis of smart contract-managed syndicates (DAOs). The findings demonstrated that
programmatic logic can replace traditional corporate boards for capital allocation. Operating on
early Ethereum architecture, the models suffered from high transaction gas fees and severe
network congestion, making micro-investments mathematically unviable for retail users.

---

2.5 UNIQUENESS AND SUMMARY OF THE STUDY
S/N
Author(s)
(Year)
Key Findings
Limitations (from
literature)
How The Proposed
system (Anchor Capital)
Addresses Limitation
1
Kumar et
al. (2023)
Blockchain
effectively lowers
information
asymmetry and
reduces transaction
costs in SME
financing.
Primary focus on
permissioned enterprise
blockchains excludes
public retail investors.
The system utilizes the
public, permissionless
Solana network to
democratize retail
liquidity access.
2
Javaid et al.
(2022)
Distributed ledgers
drastically reduce
financial settlement
times from days to
seconds.
Architectures lack
advanced tokenization
standards required for
localized regulatory
compliance.
Implements the Solana
Token-2022 standard,
utilizing advanced
protocol extensions for
Real-World Assets.
3
Ioannou &
Demirel
(2022)
Tokenizing
invoices
significantly
improves liquidity
visibility for
Platforms heavily rely
on off-chain fiat
settlement to distribute
yields, reintroducing
banking friction.
Programmatically
executes fractional yield
and dividend distributions
entirely on-chain via
smart contracts.

---

manufacturers.
4
Sharma et
al. (2021)
Digital
underwriting and
peer-to-peer
lending platforms
expand credit
access by 40%.
Proposed roadmaps rely
on centralized banking
APIs and vulnerable
traditional escrow
accounts.
Replaces centralized
escrow with cryptographic
Program Derived
Addresses (PDAs) for
zero-trust custody.
5
Schär
(2021)
DeFi lending
protocols achieve a
99% reduction in
administrative
overhead vs.
traditional banks.
Exclusive focus on
over-collateralized
crypto-native assets,
ignoring under-
collateralized physical
assets.
Explicitly fractionalizes
off-chain MSME
invoices, bridging DeFi
mechanics with the real-
world economy.
6
Miller et al.
(2022)
Early decentralized
protocols allowed
centralized wealth
accumulation by
venture capital.
Research focused solely
on speculative utility
and governance tokens
lacking intrinsic
backing.
Issues substantive, yield-
bearing debt tokens
directly backed by
verified enterprise
revenue.
7
Mutamimah
et al. (2023)
Immutable on-
chain transaction
histories drastically
The governance
framework remained
entirely theoretical
Provides a fully
functional, deployed
software architecture built

---

reduce the risk of
fraudulent SME
accounting.
without functional
engineering
architecture.
in Rust to practically
execute enterprise escrow.
8
Maiti et al.
(2021)
Smart contracts
provide real-time,
cryptographically
verified audit trails
that prevent
reconciliation
errors.
Did not address how
micro-investors could
practically claim
fractional dividends in
high-traffic
environments.
Leverages Solana’s
parallel-execution
architecture, allowing
thousands of investors to
claim micro-dividends
without congestion.
9
Cong et al.
(2021)
Tokenization
dramatically lowers
the barrier to entry
for retail investors,
creating borderless
capital pools.
Lack of built-in
programmable escrow
safeguards led to
massive counterparty
risk when founders
failed.
Embeds autonomous
refund conditions into the
PDA lifecycle,
guaranteeing capital
returns if targets are
missed.
10
Sims
(2019)
Programmatic logic
can replace
traditional
corporate boards
for capital
High transaction gas
fees and network
congestion on early
Ethereum made micro-
investing unviable.
Executes exclusively on
the Solana network,
ensuring near-zero
transaction fees for
economically viable

---

allocation. micro-investments.
2.6 RESEARCH GAP
The literature reviewed reveals significant technological and functional gaps across ten distinct
areas of decentralized enterprise financing, which Anchor Capital systematically addresses.
First, Kumar et al. (2023) focused heavily on permissioned enterprise blockchains (such as
Hyperledger) for supply chain financing, which inherently excludes retail participation. Anchor
Capital addresses this by utilizing Solana, a public, permissionless network, thereby
democratizing liquidity access and allowing gig-economy retail investors to fund local
enterprises.
Second, Javaid et al. (2022) explored smart contracts in banking but noted a lack of advanced
tokenization standards capable of handling the semantic requirements of localized securities.
Anchor Capital closes this gap by implementing the Solana Token-2022 standard, utilizing
advanced protocol extensions (such as transfer fees and permanent delegates) specifically
designed to mirror the regulatory and functional needs of physical Real-World Assets.
Third, while Ioannou and Demirel (2022) successfully demonstrated the tokenization of supply
chain invoices, their reviewed architectures ultimately relied on off-chain fiat settlement to
distribute yields, reintroducing legacy banking friction. Anchor Capital eliminates this bottleneck
by programmatically executing fractional yield and dividend distributions entirely on-chain via
smart contracts, bypassing fiat rails altogether.

---

Fourth, Sharma et al. (2021) established that digital underwriting expands credit access, but their
proposed frameworks continued to rely on centralized banking APIs and traditional third-party
escrow accounts. Anchor Capital completely removes the need for centralized escrow by
utilizing Program Derived Addresses (PDAs) as zero-trust, cryptographic vaults that cannot be
manipulated by human intermediaries.
Fifth, Schär (2021) provided an extensive framework for DeFi protocols, but the study was
exclusively limited to over-collateralized, crypto-native assets. There remains a distinct lack of
functional software engineered for under-collateralized physical assets. Anchor Capital pioneers
this space by actively fractionalizing off-chain MSME invoices, bridging theoretical DeFi
mechanics with the real-world economy.
Sixth, Miller et al. (2022) criticized decentralized protocols for allowing venture capital to hoard
utility and governance tokens, which lack intrinsic backing. Anchor Capital shifts the
decentralized token model away from speculative governance and instead issues substantive,
yield-bearing debt tokens that are directly backed by verified enterprise revenue.
Seventh, Mutamimah et al. (2023) proposed a theoretical governance model linking smart
contracts to MSME credit risk but lacked a functional engineering architecture to test it. Anchor
Capital moves this research from concept to reality by providing a fully functional, deployed
software architecture built in Rust, empirically proving that trustless enterprise escrow can be
executed at scale.
Eighth, Maiti et al. (2021) confirmed the transparency of blockchain accounting but failed to
address how retail micro-investors could practically claim fractional dividends in a high-traffic
environment. Anchor Capital solves this by leveraging Solana’s high-throughput architecture,

---

allowing thousands of retail investors to simultaneously claim micro-dividends without causing
network congestion.
Ninth, Cong et al. (2021) demonstrated that tokenization lowers barriers to entry but highlighted
the severe counterparty risk in early platforms that lacked built-in programmable safeguards
when projects failed. Anchor Capital directly mitigates this risk by embedding autonomous
refund conditions directly into the PDA lifecycle; if an enterprise fails to hit its funding target,
capital is mathematically guaranteed to return to the investors.
Finally, Sims (2019) analyzed smart contract syndicates on early Ethereum architecture, proving
that exorbitant transaction gas fees rendered retail micro-investments mathematically unviable.
Anchor Capital addresses this critical performance gap by executing exclusively on the parallel-
processing Solana network, where near-zero transaction fees ensure that even the smallest retail
investments remain economically viable.

---

2.7 REFERENCES
Cong, L. W., Li, Y., & Wang, N. (2021). Token-based platform finance. Journal of Financial
Economics, 141(3), 1083-1104. https://doi.org/10.1016/j.jfineco.2021.10.002
International Finance Corporation. (2017). MSME Finance Gap: Assessment of the Shortfalls
and Opportunities in Financing Micro, Small, and Medium Enterprises in Emerging Markets.
World Bank Group.
Ioannou, I., & Demirel, G. (2022). Blockchain and supply chain finance: a critical literature
review at the intersection of operations, finance and law. Journal of Banking and Financial
Technology, 6, 21-41. https://doi.org/10.1007/s42786-022-00040-1
Javaid, M., Haleem, A., Singh, R. P., Suman, R., & Khan, S. (2022). A review of Blockchain
Technology applications for financial services. BenchCouncil Transactions on Benchmarks,
Standards and Evaluations, 2(3), 100073. https://doi.org/10.1016/j.tbench.2022.100073
Kumar, D., Phani, B.V., Chilamkurti, N., Saurabh, S., & Ratten, V. (2023). Filling the SME
credit gap: a systematic review of blockchain-based SME finance literature. Journal of
Technology and Science, 14(2), 112-135. https://doi.org/10.1108/jts-06-2023-0003
Maiti, M., Kotlyarov, I., & Lipatnikov, V. S. (2021). A future triple entry accounting framework
using blockchain technology. Blockchain: Research and Applications, 2(4), 100037.
https://doi.org/10.1016/j.bcra.2021.100037

---

Miller, D., Smith, A., & Lee, K. (2022). Decentralized finance, centralized ownership? An
iterative mapping process to measure protocol token distribution. Journal of Blockchain
Research, 3(4), 210-228.
Mutamimah, M., Alifah, S., & Adnjani, M. D. (2023). Corporate governance innovation
framework to reduce credit risk in MSMEs using blockchain technology. Cogent Business &
Management, 10(3). https://doi.org/10.1080/23311975.2023.2250504
Nigerian Senate. (2026). Factoring, Assignment and Receivables Financing Bill. National
Assembly of the Federal Republic of Nigeria.
Schär, F. (2021). Decentralized Finance: On Blockchain- and Smart Contract-Based Financial
Markets. Federal Reserve Bank of St. Louis Review, 103(2), 153-174.
https://doi.org/10.20955/r.103.153-74
Sharma, P., Gupta, S., & Singh, R. (2021). Roadmap for digital technology to foster India’s
MSME ecosystem opportunities and challenges. Journal of Asian Economics, 45, 10-25.
Sims, A. (2019). Blockchain and Decentralised Autonomous Organisations (DAOs): The
Evolution of Companies? New Zealand Universities Law Review, 28, 423-458.
https://doi.org/10.2139/ssrn.3524674