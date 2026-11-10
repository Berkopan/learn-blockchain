# Blockchain research map

Research date: 10 November 2026.

This map covers 38 teachable blockchain topics, from authenticated data to consensus, proof systems and scaling. It is a broad curriculum, not a claim to enumerate every blockchain algorithm. Algorithms, protocols, data structures and explanatory concepts are identified separately.

The sources are original papers, standards, protocol specifications and official project documentation. Each lesson has a concise model statement describing what the simulation computes and what it abstracts. A diagram of a cryptographic construction is not represented as a production implementation of that construction.

## Foundations and authenticated data

| Topic / lesson ID | Type and mechanism | Visible state changes and useful controls | Accuracy boundary | Sources |
| --- | --- | --- | --- | --- |
| SHA-256 / `sha256` | Hash algorithm; byte input becomes a 256-bit digest. | Input bytes, one flipped bit, digest chunks and changed-bit count. Change message and byte position. | Real FIPS 180-4 computation; an avalanche demonstration does not prove collision resistance. | S01 |
| Hash-linked chain / `hash-chain` | Authenticated append-only data structure. | Edit a block, rehash it, identify the broken descendant link, optionally rehash descendants. | Hash links expose changes relative to a trusted history; they do not themselves prevent rewriting or provide consensus. | S02, S03 |
| Merkle proofs / `merkle-tree` | Binary authenticated tree and inclusion verification. | Leaves combine into parents and root; ordered sibling path recomputes the root. Choose leaf, data and corrupted sibling. | Actual SHA-256 with explicit teaching domain separation; not Bitcoin wire encoding. Odd layers duplicate the last hash. | S02, S03 |
| Sparse Merkle tree / `sparse-merkle` | Fixed key-space tree with empty leaves. | Follow a key’s path, verify an empty slot, insert data and observe a new root. | Eight-key teaching space; real roots and proofs, without the compression needed for a huge sparse tree. | S04 |
| Merkle Patricia trie / `patricia-trie` | Authenticated compressed radix structure. | Shared hexadecimal prefixes form extensions and branches; insertion or update changes the path and root. | Actual compressed radix construction and SHA-256 authentication; Ethereum RLP, Keccak, embedded-node rules and full encoding are omitted. | S05 |
| Digital signatures / `ecdsa` | Signature roles and authenticity concept. | Private key stays with signer; message, signature and public key meet at verification. Tamper with message or key. | Structural ECDSA lesson, not elliptic-curve execution. Signing authenticates a message without encrypting it. | S06 |
| Schnorr signatures / `schnorr` | Commitment, challenge and response relation. | Compute R, Y, e and s, then compare both sides of the verification equation. | Real arithmetic in an intentionally insecure group p=23, q=11, g=2, with fixed nonce. Not BIP 340 or a secure signature implementation. | S07 |
| BLS aggregation / `bls` | Aggregate-signature concept. | Many signature tokens combine; verification still requires the appropriate signer keys. Add a bad signature or omit a key. | No curve or pairing execution. Rogue-key defenses, subgroup validation and protocol assumptions remain necessary in real implementations. | S08 |
| UTXO spending / `utxo` | Consume-once transaction state transition. | Select whole inputs, reject missing or already-spent inputs, create payment and change, account for fee. | Real value conservation and UTXO mutation; transaction scripts, signatures and full validation are outside the model. | S02, S03 |
| Accounts and nonces / `accounts` | Balance transition with replay protection. | Check balance and expected nonce, debit/credit atomically, increment nonce and reject replay. | Real balance and nonce checks; no gas, signatures or virtual machine. | S09 |
| Transaction propagation / `mempool` | Peer-to-peer relay and local pending pools. | A transaction spreads through peers with a delayed recipient; a bounded block removes included transactions. | Mempools are local views. The teaching proposer selects by ID, without production fee policy, replacement rules or network transport. | S10 |

## Consensus and chain selection

| Topic / lesson ID | Type and mechanism | Visible state changes and useful controls | Accuracy boundary | Sources |
| --- | --- | --- | --- | --- |
| Proof of work / `proof-of-work` | Hash-target search and inexpensive verification. | Try nonces, find an actual qualifying digest, then verify after optional data mutation. | Real SHA-256 search with 4–10 leading-zero bits and a bounded budget; no Bitcoin header, double SHA-256 or energy model. | S02, S03 |
| Forks and chainwork / `chainwork` | Compare cumulative branch work. | Build competing branches with different work per block, reveal a delayed branch and select the greater sum. | Work values are explicit toy units. Block count alone is insufficient; ties retain the incumbent in this model. | S03 |
| Difficulty adjustment / `difficulty` | Feedback from observed block interval to difficulty. | Change hash rate, observe a small window, apply bounded retargeting and compare the next expected pace. | Deterministic expected times, four teaching intervals and a quarter-to-fourfold bound. Not Bitcoin’s full 2016-block calculation. | S03 |
| Light-client proofs / `spv` | Header chain plus Merkle inclusion. | Receive headers and sibling hashes, verify a payment root, add following headers. | Inclusion is computed; header work, header validity, peer trust and full transaction validity are assumptions. Confirmations do not imply absolute finality. | S02, S03 |
| Stake-weighted selection / `proof-of-stake` | Weighted lottery component of PoS. | Stake changes lottery intervals; seeded draws select proposers; an offline proposer leaves a slot empty. | A proposer lottery is not a complete consensus protocol. Seeded PRNG draws are not cryptographic randomness. | S11 |
| LMD-GHOST / `lmd-ghost` | Latest-message, stake-weighted subtree selection. | Replace one validator’s latest vote, recompute ancestor weights and descend through the heaviest children. | Actual tree weights and traversal; no proposer boost, justified-root updates, timing rules or Ethereum’s full fork choice. | S12 |
| Casper FFG / `casper-ffg` | Supermajority checkpoint links and finalization. | First qualifying link justifies a checkpoint; the next consecutive link finalizes the earlier one. | Exact at-least-two-thirds checks for the consecutive-checkpoint case. The full Ethereum finality rules are broader. | S12 |
| Equivocation and slashing / `slashing` | Evidence from conflicting signed statements. | One vote, no vote or two incompatible target votes; evidence connects the two signatures. | Offline participation and double voting are different conditions. The model identifies evidence without computing protocol penalties. | S13 |
| PBFT / `pbft` | Pre-prepare, prepare and commit certificates. | Four replicas exchange matching messages; faulty proposals or insufficient live replicas prevent execution. | One view, f=1, one sequence number. A prepared correct replica needs a pre-prepare and two backup prepares; three commits execute. View change is omitted. | S14 |
| Tendermint / `tendermint` | Weighted proposal, prevote, lock and precommit rounds. | Offline power reduces votes; invalid proposals receive nil; a timeout advances the proposal round. | Strictly more than two thirds is required. A single-block aggregate model omits the full cross-round lock/unlock protocol. | S15 |
| Chained HotStuff / `hotstuff` | Quorum-certified block ancestry and a commit rule. | Votes form QCs; directly linked certified descendants grow a three-chain; a dummy gap blocks the direct-chain rule. | Four replicas, f=1. The ancestor commits after the final QC arrives. Pacemaker, cryptographic aggregation and the full locking proof are omitted. | S16 |
| Snowball / `snowball` | Repeated subsampled preference reinforcement. | Query sampled peers, update confidence and preferences, and compare convergence across seeds and faults. | A stochastic consensus-family model requires explicit sampling and confidence assumptions; it is not a deterministic majority vote. | S17, S18 |
| Snowman / `snowman` | Linear chain consensus in the Avalanche family. | Extend preferred blocks, sample support and track acceptance along a chain. | Distinguish the current linear-chain design from historical Avalanche DAG descriptions. Network timing and production parameters are abstracted. | S17, S18 |
| Algorand BA / `algorand` | Stake sortition and Byzantine agreement phases. | Private eligibility selects a committee; proposal and voting phases form certificates or advance a round. | Committee selection, BA voting and VRF verification are distinct mechanisms; structural draws must not be presented as genuine VRFs. | S19, S20 |
| Ouroboros Praos / `ouroboros` | Private slot eligibility under stake weighting. | Independent slot checks produce zero, one or multiple leaders; vary stake, seed and activity. | The actual teaching threshold is 1−(1−f)^stakeShare. The PRNG is not a VRF; forward security and chain selection are omitted. | S21 |
| Federated quorum slices / `stellar` | Quorums formed from local trust requirements. | Enumerate subsets, test each member’s threshold, find overlapping or disjoint quorums, remove a shared node. | Exact small-network enumeration; not the full SCP nomination and ballot protocol. Local trust does not automatically imply global quorum intersection. | S22 |
| Clique authority / `clique` | Permissioned authorization and signer rotation. | Existing signers vote to admit another signer; reject unauthorized production and rotate a producer. | Historical Clique-inspired lesson. Recent-signer limits, in/out-of-turn weighting and complete fork choice are omitted. Clique is deprecated in Geth. | S23 |

## Proof systems, scaling and fees

| Topic / lesson ID | Type and mechanism | Visible state changes and useful controls | Accuracy boundary | Sources |
| --- | --- | --- | --- | --- |
| Zero-knowledge proofs / `zk-proof` | Interactive commitment/challenge/response concept. | Commit before the challenge, respond using a secret and verify a relation without sending that secret. | Real toy-group arithmetic, deliberately insecure parameters and fixed teaching nonce. This is not a secure zero-knowledge implementation. | S07, S24 |
| Groth16 / `groth16` | Circuit-specific succinct-proof structure. | Witness flows through x²+3 constraints; proving/verifying keys and a proof token meet at verification. | Arithmetic is directly checked. No QAP, elliptic curves, pairings, ceremony or SNARK generation is executed. | S25 |
| STARK trace checks / `stark` | Trace commitment and sampled constraints. | Commit eight cells, select distinct transitions, check recurrence and reveal detected or missed corruption. | Real Merkle commitment and sampled local checks. Low-degree extension, composition polynomials and FRI are omitted, so passing checks is not a STARK proof. | S26 |
| KZG commitments / `kzg` | Polynomial evaluation opening relation. | Choose a polynomial and point; form the quotient relation and expose a nonzero remainder for a false claim. | Real polynomial arithmetic; commitment and proof are structural tokens. Trusted setup and pairings are not executed. | S27, S28 |
| Optimistic rollups / `optimistic-rollup` | Assertions, challenge windows and dispute bisection. | Reexecute a batch, compare midpoint states, isolate one invalid transition and reject the assertion. | Real counter transitions and bisection, without a production fault-proof VM. An absent honest challenger lets a bad assertion pass this model. | S29 |
| Validity rollups / `validity-rollup` | Proof-gated state update plus required batch publication. | Compute candidate state, check the modeled proof, independently test data availability and only then accept the rollup update. | Proofs are structural. A valid proof alone is insufficient here: withheld batch data keeps the prior L1-accepted state. This is not an offchain-DA validium mode. | S30 |
| Payment channels / `payment-channel` | Offchain balance updates and contested close. | Lock collateral, redistribute balances, attempt a stale close, replace it with a newer state and settle. | A generic latest-state contest model, not Lightning’s exact revocation and penalty mechanism. Collateral conservation is computed. | S31 |
| HTLC routing / `htlc` | Shared hash condition and decreasing timeouts. | Lock upstream to time 5 and downstream to time 3; disclose safely, propagate the preimage backward, or withhold a late reveal and refund. | Real SHA-256. Exclusive teaching deadlines and immediate relay; Carol never discloses at time 3 or later. Refunds are assumed confirmed. Bitcoin timeouts enable refund, but do not disable an unspent preimage branch. | S32, S35 |
| Data availability sampling / `data-availability` | Probabilistic sampling of erasure-coded data. | Withhold data shares, sample positions and observe detection likelihood across trials. | Availability, validity and inclusion are different properties. An erasure-coding/sampling model does not automatically implement PeerDAS or a production light client. | S28, S33 |
| EIP-1559 fees / `eip1559` | Base-fee feedback, fee cap and priority-fee split. | Change gas use relative to target, update integer base fees, apply a transaction cap, burn base fee and pay effective tip. | Actual integer feedback with denominator eight and minimum upward increment; simplified units, fixed gas target and no blob-fee market. | S34 |

## Accuracy and teaching criteria

1. Every visible transition follows the same deterministic state used by the narration, metrics and object inspector.
2. Hashing, Merkle verification, UTXO conservation, account nonces, work selection and explicit quorum thresholds use computed values.
3. Corrupted proofs, invalid transitions and insufficient certificates fail; animation must never imply success when the model rejects.
4. Structural cryptography lessons identify the missing construction. A green token means a modeled relation passed, not that a secure proof was generated.
5. Byzantine quorum rules retain the correct inequality. PBFT’s 2f+1 certificate, Tendermint’s strict >2/3 and FFG’s at-least-2/3 rule are not interchangeable.
6. Fork choice, proposal selection and finality are distinct steps. A block can be proposed or preferred without being finalized.
7. Negative scenarios expose assumptions: absent challengers, unavailable data, conflicting votes, delayed peers and missing preimages change outcomes.
8. HTLC timeout is not automatic destruction of a preimage spend path. The late-reveal scenario withholds the secret; refund confirmation and excluded races are explicit.
9. Rollup validity and data publication are checked separately, and both are required before accepting the modeled rollup state update.
10. Text remains short in the walkthrough. Technical boundaries and original sources remain available in the lesson’s model and source sections.

## Primary sources

| Key | Original or official source |
| --- | --- |
| S01 | NIST, [FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), 2015. |
| S02 | Satoshi Nakamoto, [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), 2008. |
| S03 | Bitcoin Developer Guide, [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html). |
| S04 | Dahlberg, Pulls and Peeters, [Efficient Sparse Merkle Trees](https://eprint.iacr.org/2016/683), 2016. |
| S05 | Ethereum, [Merkle Patricia Trie](https://ethereum.org/developers/docs/data-structures-and-encoding/patricia-merkle-trie/). |
| S06 | NIST, [FIPS 186-5: Digital Signature Standard](https://csrc.nist.gov/pubs/fips/186-5/final), 2023. |
| S07 | Bitcoin Improvement Proposals, [BIP 340: Schnorr Signatures for secp256k1](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki), 2020. |
| S08 | IRTF CFRG, [BLS Signatures draft](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature). The document’s draft status matters when discussing standardization. |
| S09 | Ethereum, [Accounts](https://ethereum.org/developers/docs/accounts/). |
| S10 | Bitcoin Developer Guide, [P2P Network source](https://github.com/bitcoin-dot-org/developer.bitcoin.org/blob/master/devguide/p2p_network.rst). |
| S11 | Ethereum, [Consensus mechanisms](https://ethereum.org/developers/docs/consensus-mechanisms/). |
| S12 | Ethereum, [Gasper](https://ethereum.org/developers/docs/consensus-mechanisms/pos/gasper/). |
| S13 | Ethereum, [Proof-of-stake rewards and penalties](https://ethereum.org/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/). |
| S14 | Castro and Liskov, [Practical Byzantine Fault Tolerance](https://www.usenix.org/conference/osdi-99/practical-byzantine-fault-tolerance), 1999. |
| S15 | Tendermint, [Consensus specification](https://docs.tendermint.com/master/spec/consensus/consensus). |
| S16 | Yin et al., [HotStuff: BFT Consensus in the Lens of Blockchain](https://arxiv.org/abs/1803.05069), 2018. |
| S17 | Team Rocket, [Scalable and Probabilistic Leaderless BFT Consensus through Metastability](https://arxiv.org/abs/1906.08936), 2019. |
| S18 | Avalanche, [Consensus architecture](https://docs.avax.network/docs/nodes/architecture/consensus). |
| S19 | Algorand, [BA agreement concepts](https://specs.algorand.co/abft/non-normative/abft-nn-general-concepts). |
| S20 | IETF, [RFC 9381: Verifiable Random Functions](https://www.rfc-editor.org/rfc/rfc9381.html), 2023. |
| S21 | David et al., [Ouroboros Praos: An Adaptively-Secure, Semi-synchronous Proof-of-Stake Blockchain](https://eprint.iacr.org/2017/573), 2017. |
| S22 | Stellar, [The Stellar Consensus Protocol](https://stellar.org/learn/stellar-consensus-protocol), including the original paper. |
| S23 | Ethereum, [EIP-225: Clique proof-of-authority consensus protocol](https://eips.ethereum.org/EIPS/eip-225); Geth, [Private networks and Clique deprecation](https://geth.ethereum.org/docs/fundamentals/private-network). |
| S24 | Zcash, [Protocol specification](https://zips.z.cash/protocol/protocol.pdf). |
| S25 | Jens Groth, [On the Size of Pairing-based Non-interactive Arguments](https://discovery.ucl.ac.uk/id/eprint/1501201/), 2016. |
| S26 | Ben-Sasson et al., [Scalable, transparent, and post-quantum secure computational integrity](https://eprint.iacr.org/2018/046.pdf), 2018. |
| S27 | Kate, Zaverucha and Goldberg, [Constant-Size Commitments to Polynomials and Their Applications](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf), 2010. |
| S28 | Ethereum, [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844). |
| S29 | Ethereum, [Optimistic rollups](https://ethereum.org/developers/docs/scaling/optimistic-rollups/). |
| S30 | Ethereum, [Zero-knowledge rollups](https://ethereum.org/developers/docs/scaling/zk-rollups/), including data publication requirements. |
| S31 | Lightning Network, [Technical papers and documentation](https://lightning.network/docs/). |
| S32 | Lightning Labs, [Hash Time Locked Contract](https://docs.lightning.engineering/the-lightning-network/multihop-payments/hash-time-lock-contract-htlc). |
| S33 | Ethereum, [EIP-7594: PeerDAS](https://eips.ethereum.org/EIPS/eip-7594). |
| S34 | Ethereum, [EIP-1559: Fee market change for ETH 1.0 chain](https://eips.ethereum.org/EIPS/eip-1559). |
| S35 | Lightning BOLTs, [BOLT 3: Bitcoin Transaction and Script Formats](https://github.com/lightning/bolts/blob/master/03-transactions.md). Offered HTLC outputs and success/timeout transaction locktimes distinguish enabling refund from disabling a preimage claim. |
