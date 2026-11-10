# Advanced mechanisms: sources and model boundaries

These lessons connect consensus with the mechanisms that move, place, timestamp, encode and execute distributed data. Each interactive model makes a specific mechanism observable. Its assumptions are available in the lesson’s details panel.

**Türkçe:** Bu dersler uzlaşmayı; veriyi taşıyan, yerleştiren, zamanlayan, kodlayan ve yürüten mekanizmalarla ilişkilendirir. Her model belirli bir mekanizmayı görünür kılar. Varsayımları dersin ayrıntılar bölümünde yer alır.

Research reviewed: **10 November 2026**. The sources below are original papers, canonical specifications or first-party documentation. A protocol described by a historical paper is not automatically represented as a current deployment.

## Consensus and committee selection

### Snowball

The scene follows one observer polling eight peers with fixed binary preferences. Samples are drawn without replacement using a reproducible seed. A successful sample increments the supported choice’s confidence; the preferred choice follows accumulated confidence. Three consecutive successful samples for the same choice trigger local acceptance.

The small network and threshold are instructional settings. They do not establish a production security probability or reproduce whole-network convergence. Peer preferences stay fixed so that the observer’s evidence is easy to inspect.

- Source: [Team Rocket et al., *Scalable and Probabilistic Leaderless BFT Consensus through Metastability*](https://arxiv.org/abs/1906.08936).
- Controls: sample size, peer preferences and sampling seed.
- Key distinction: a local poll is not a globally certified quorum.

### Snowman

A forked chain makes ancestor support visible: preferring A2 also supports A1. The model uses the same single-observer sampling mechanism at one fork; network propagation, stake weights and the complete Snowman state machine are outside its scope.

The historical Avalanche transaction DAG should not be confused with the chain model. The official architecture documentation records the X-chain’s transition to Snowman in 2023.

- Sources: [Snow consensus paper](https://arxiv.org/abs/1906.08936), [Avalanche consensus architecture](https://build.avax.network/docs/nodes/architecture/consensus).
- Controls: branch support, sample size and seed.

### Algorand cryptographic sortition

For validator stake weight \(w\), total stake \(W\), and target committee weight \(\tau\), ticket count follows a binomial distribution with \(p=\tau/W\). The implementation performs inverse-CDF selection for five validators.

The visual samples are seeded pseudorandom numbers, not real VRF outputs. VRF proofs and the subsequent Byzantine agreement protocol are not implemented. The committee’s actual weight can differ from its expectation.

- Source: [Gilad et al., *Algorand: Scaling Byzantine Agreements for Cryptocurrencies*](https://eprint.iacr.org/2017/454.pdf).
- Controls: one validator’s stake, expected committee weight and seed.
- Key distinction: committee selection does not itself choose or finalize a block.

## DAG availability and ordering

### Narwhal

Four validators form availability certificates from three distinct acknowledgments, using \(f=1\). Second-round vertices reference certified first-round parents. A second unavailable validator prevents the modeled certificate threshold from being reached.

This lesson separates dissemination from ordering. It does not mark the DAG as a finalized total order. Signatures, worker transport, retrieval and garbage collection are abstracted.

- Source: [Danezis et al., *Narwhal and Tusk: A DAG-based Mempool and Efficient BFT Consensus*](https://arxiv.org/abs/2105.11827).
- Controls: unavailable validators and batches per validator.

### Bullshark

The simulation selects the **eventually synchronous variant, Algorithm 5**, and isolates its first-leader direct-commit decision. With \(n=4\) and \(f=1\), each vertex has three strong parents. A round-three vertex inspects its round-two parents; at least \(f+1=2\) of those parents must have strong paths to the round-one leader.

Changing the observed parent set can change local evidence even when the global number of supporting vertices remains the same. This is why the scene counts specific paths instead of merely counting colored nodes.

Reliable broadcast is assumed. Later leader backtracking, timeouts and the asynchronous fallback are omitted. Ordering the first accepted leader’s ancestry is not presented as a complete multi-round Bullshark implementation.

- Source: [Spiegelman et al., *Bullshark: DAG BFT Protocols Made Practical*, §6 and Algorithm 5](https://arxiv.org/html/2201.05677v3#S6).
- Controls: supporting second-round vertices and the observer’s three-parent set.

## Encoding and availability

### Reed–Solomon erasure coding

This is an actual \((6,3)\) polynomial evaluation code over the prime field \(GF(257)\). Three data symbols become the coefficients of a degree-two polynomial; six distinct evaluations become shards. Lagrange interpolation recovers the coefficients from any three valid distinct shards.

The prime field keeps arithmetic small enough to inspect. It differs from the byte-field schemes in RFC 5510. The decoder handles known erasures, not undetected corrupted values, and refuses to reconstruct a unique message from two shards.

- Sources: [Reed & Solomon, *Polynomial Codes Over Certain Finite Fields*](https://epubs.siam.org/doi/10.1137/0108018), [RFC 5510](https://datatracker.ietf.org/doc/html/rfc5510).
- Controls: payload symbol, number of erased shards and erasure pattern.
- Verification: every three-of-six survivor combination is checked against multiple messages, including field-boundary values.

### Data availability sampling

The model contains sixteen shares and a fixed hidden subset. Samples are uniform and without replacement. For \(N\) total shares, \(h\) hidden shares and \(s\) samples, the probability of missing every hidden share is:

\[
P(\text{miss})=\frac{\binom{N-h}{s}}{\binom{N}{s}}.
\]

A missing requested share fails the check. Passing a sample does not guarantee that every unsampled share exists, nor that transaction execution is valid. Authentic commitments are assumed; erasure reconstruction, network recovery and adaptive withholding are not modeled.

- Sources: [Al-Bassam, Sonnino & Buterin, *Fraud and Data Availability Proofs*](https://arxiv.org/abs/1809.09044), [Al-Bassam, *LazyLedger*](https://arxiv.org/abs/1905.09274).
- Controls: withheld shares, sample count and seed.

## Moving transaction knowledge

### Compact block relay

The BIP 152 lesson shows shared mempool knowledge filling block slots from short identifiers. Unknown or ambiguous identifiers produce requests for the complete transaction data. The amount of required data changes with mempool overlap.

Identifiers are symbolic: SipHash, byte-level wire encoding and full block validation are omitted. Completing reconstruction means all required transaction data is available; it does not establish validity.

- Source: [Bitcoin BIP 152: Compact Block Relay](https://github.com/bitcoin/bips/blob/master/bip-0152.mediawiki).
- Controls: number of known transactions and an ambiguous short identifier.

### Erlay reconciliation

Two six-element sets produce an exact symmetric difference. A capacity bound models whether a reconciliation sketch can decode that difference. When capacity is insufficient, this trace falls back to explicit announcements; the union of known transactions remains correct.

This is a set-difference and capacity model, not an implementation of Minisketch algebra. Sketch extensions, salts and the full limited-flooding network are abstracted. The retrieved BIP 330 specification is marked Draft.

- Source: [Bitcoin BIP 330: Transaction announcements reconciliation](https://github.com/bitcoin/bips/blob/master/bip-0330.mediawiki).
- Controls: set overlap and sketch capacity.

## Time

### Hybrid logical clocks

The implementation uses real HLC local-event and receive-update equations for \((l,c)\) timestamps. Two processes exchange messages while the physical clocks may differ or jump backward. The receive timestamp exceeds both the relevant local state and the received timestamp in lexicographic order.

HLC preserves happened-before ordering, but the converse does not hold: timestamp order alone does not prove causality. This is not a vector-clock concurrency detector.

- Source: [Kulkarni et al., *Logical Physical Clocks*](https://cse.buffalo.edu/~demirbas/publications/hlc.pdf).
- Controls: receiver clock offset, message delay and clock rollback.

### NTP timestamp exchange

The scene computes the RFC 5905 measurement equations from four actual timestamps:

\[
\theta=\frac{(t_2-t_1)+(t_3-t_4)}{2},\qquad
\delta=(t_4-t_1)-(t_3-t_2).
\]

The processing interval cancels from the round-trip measurement. Unequal outbound and return transit times bias the offset estimate by half their difference. Filtering, server selection and the discipline loop are outside this single-exchange lesson.

- Source: [RFC 5905: Network Time Protocol Version 4](https://datatracker.ietf.org/doc/html/rfc5905).
- Controls: true offset and each direction’s delay.

### TrueTime and commit wait

The clock supplies an uncertainty interval. A commit timestamp is chosen beyond its latest endpoint; visibility waits until the earliest possible current time is strictly greater than that timestamp. Replication can overlap this wait, and both conditions must hold before exposure.

Integer time makes the strict inequality visible. The lesson isolates commit wait rather than implementing Spanner’s transaction or replication protocols. TrueTime alone is not a consensus algorithm.

- Source: [Corbett et al., *Spanner: Google’s Globally-Distributed Database*](https://research.google.com/archive/spanner-osdi2012.pdf).
- Controls: uncertainty and replication duration.

## Logs, state and placement

### Partitioned log

Six records are placed deterministically into independent partitions. Each has a leader log, one follower and its own consumer bookmark. Only the contiguous prefix present on both copies is readable under this lesson’s simplified policy.

Follower lag and consumer positions change actual prefix computations. Cross-partition offsets do not establish a global order. Kafka’s ISR membership changes, elections and wire protocols are not implemented.

- Source: [Apache Kafka design](https://kafka.apache.org/44/design/design/).
- Controls: partition count, follower lag and consumer progress.

### Transactional streams

A single crash occurs around one output effect and its durable input offset. Saving the offset first can lose work; saving output first can repeat the effect. Atomic mode stages both, hides uncommitted output, and recovers from each modeled crash with one visible effect.

The scope is coordinated log-to-log processing with committed-only reads. Arbitrary external side effects require coordination with the destination system.

- Source: [Apache Kafka: message delivery semantics and transactions](https://kafka.apache.org/44/design/design/).
- Controls: processing mode and crash point.

### Bloom filter

A real bit array, three deterministic noncryptographic hash functions and insertion/query operations expose both certain absence and possible membership. Collisions can produce false positives. No deletion is offered because a basic Bloom filter cannot safely clear shared bits.

- Source: [Bloom, *Space/Time Trade-offs in Hash Coding with Allowable Errors*](https://www.cs.princeton.edu/courses/archive/spr05/cos598E/bib/p422-bloom.pdf).
- Controls: bit-array size, inserted-word count and query.
- Verification: inserted values always match; a search over absent values demonstrates a real false positive.

### Rendezvous hashing

Each server receives a deterministic score from the key and server identity; the highest score wins. Removing a server changes only keys it owned. Adding a server changes only keys for which that new server becomes the winner.

The teaching implementation uses a 32-bit placement hash. Clients must share the same membership view to compute matching placement. This is not load-aware scheduling or consensus on membership.

- Source: [Thaler & Ravishankar, *Using Name-Based Mappings to Increase Hit Rates*](https://www.microsoft.com/en-us/research/publication/using-name-based-mappings-increase-hit-rates/).
- Controls: server count, key and removing its current owner.

## Verifiable computation and modular execution

### Verifiable delay arithmetic

The implementation performs repeated modular squaring and checks the Wesolowski proof relation. With \(2^T=q\ell+r\), it computes \(\pi=x^q\bmod N\) and checks:

\[
\pi^\ell x^r\equiv y\pmod N.
\]

Here \(N=77\) and \(\ell=13\) is fixed. The modulus is easily factorable, the group is tiny and the challenge is not cryptographically generated. These choices make the arithmetic observable and deliberately provide **no secure delay or proof system**. An altered claimed result fails the implemented relation.

- Source: [Wesolowski, *Efficient verifiable delay functions*](https://eprint.iacr.org/2018/623).
- Controls: squaring count, input and result tampering.

### Modular execution

A shared ordered data layer feeds two independent application interpreters. One applies balance transfers with insufficient-funds rejection; the other increments a counter. Missing an earlier required record blocks replay through that gap, even if later data is available.

The scene separates data ordering, availability and application validity. Consensus, cross-application messaging and proofs are assumed or omitted.

- Source: [Al-Bassam, *LazyLedger: A Distributed Data Availability Ledger With Client-Side Smart Contracts*](https://arxiv.org/abs/1905.09274).
- Controls: transfer amount, missing application data and inspected client.

## Teaching and verification choices

Each lesson uses a deterministic trace with six principal frames. The guided player and sandbox consume that same trace, so descriptions and visible state stay aligned. Sources and limitations remain expandable, keeping the main explanation concise.

The scenes use different structures for different mechanisms: a branch, DAG, shard grid, event rail, replicated log, bit array or scored-server field. Color communicates state alongside labels and symbols. The same nodes and links can be shown through the accessible schematic view.

Domain checks cover recovery thresholds, ordering evidence, clock inequalities, crash windows, false positives, remapping locality and proof equations. Structural checks ensure node references exist, coordinates remain within the scene, bilingual descriptions are present, and sandbox controls affect displayed state.
