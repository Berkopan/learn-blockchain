# Validation

## Verified code revision

The complete application passed the checks below on **10 November 2026**.

| Evidence | Result |
| --- | --- |
| Code revision | [35b5a8c4e061b9f2710435224eea43a4706eecd4](https://github.com/Berkopan/learn-blockchain/commit/35b5a8c4e061b9f2710435224eea43a4706eecd4) |
| GitHub Actions | [Successful CI run](https://github.com/Berkopan/learn-blockchain/actions/runs/42800010728) |
| Environment | GitHub-hosted Ubuntu runner, Node.js 24, committed npm lockfile |
| Automated tests | **289 passed / 289 total**, across four suites |
| TypeScript | **Passed**, through the production build command |
| Production bundle | **Passed**, Vite generated the static application in `dist/` |
| Complete browser acceptance on this revision | **Not recorded** |

The linked commit identifies the tested application source. A later documentation-only commit can update this record without changing that source. Current branch checks remain visible in [GitHub Actions](https://github.com/Berkopan/learn-blockchain/actions/workflows/ci.yml).

## What the tests establish

These tests exercise bounded teaching models. They check computed behavior, trace integrity and regression cases; they are not formal verification of complete production protocols.

| Suite | Tests | Coverage |
| --- | ---: | --- |
| Catalog | 172 | All 85 lessons, eight categories, five six-lesson paths, related-topic references, both languages, search normalization, control defaults and boundaries, deterministic traces, finite geometry and valid object/link references |
| Blockchain | 70 | SHA-256 reference comparisons, Merkle proofs, hash links, UTXO conservation, account nonces, PoW, chainwork, GHOST and checkpoint rules, quorum thresholds, disputes, channels, HTLC disclosure, rollup publication and fee arithmetic |
| Distributed systems | 28 | Consensus safety rules, clocks and causality, mutual exclusion, snapshots, termination, routing, replica repair, atomic commit, CRDT merge laws, consistency illustrations, effective controls and persistent scene state |
| Advanced topics | 19 | Sampled consensus, scoped DAG decisions, finite-field reconstruction, availability sampling, compact relay and reconciliation, physical/logical time, replication and transactional crash windows, Bloom filters, rendezvous placement and toy VDF relations |

Several checks exhaust the model's small input domain. Examples include Chord lookup across the supported rings and every ring key, Kademlia's supported targets/query widths/failure cases, and small erasure-code reconstruction combinations. This establishes behavior in those domains, not arbitrary network sizes or failure schedules.

### Regression cases worth retaining

- A malformed or altered Merkle path does not verify against the original root.
- UTXO outputs conserve value, and replayed account nonces are refused.
- A longer branch does not win merely because it contains more blocks when another branch has more cumulative work.
- Raft respects the current-term commit condition and compares the candidate's last log term before its last log index.
- Paxos carries promises and accepted records forward; a newly proposed value must respect the highest accepted value learned from the prepare quorum.
- Chord may legitimately finish at its starting node when that node owns the wraparound key interval. Intermediate routing states must not loop.
- A 2PC participant's prepared state can remain blocked while the coordinator's decision is unknown. The lesson explicitly omits the peer termination protocol.
- Terminal 3PC decisions, token location, SWIM incarnation, replicated state and FLP observations remain visible in later frames.
- An FLP example message sent before a crash may still arrive afterward.
- In the HTLC lesson, a recipient withholds a late preimage. The model distinguishes its safety deadlines from Bitcoin's refund-enabling timeout semantics.
- A valid modeled rollup proof with withheld required batch data does not advance the accepted rollup state.

The [blockchain](research-blockchain.md), [distributed systems](research-distributed.md) and [advanced](research-advanced.md) notes describe the assumptions and primary sources behind these cases.

## Browser evidence and its limit

**A complete manual browser acceptance pass has not been recorded for the verified code revision.**

Earlier development smoke checks covered the desktop homepage, opening and stepping through a hash-chain lesson, and orbiting the software 3D fallback in a browser without WebGL. Those observations predate the final source revision and do not substitute for acceptance of the current build. The hardware WebGL presentation, the full responsive viewport matrix and every touch/keyboard flow still require a final browser pass.

Source review separately checked several presentation properties and led to concrete corrections: matching transmission edges to the homepage's propagation wave, consistent arrow semantics between renderers, screen-sized WebGL labels, disclosure keyboard handling, tab navigation, translated accessible names, reduced-motion fitting, and persistent protocol states. These are source-review findings, not a claim of browser certification or complete accessibility conformance.

### Acceptance checklist for the current build

Record the revision, browser, viewport, language and renderer used.

- Inspect the homepage and representative lessons at narrow mobile, tablet and desktop widths. Confirm labels and controls do not overlap.
- Compare the same frame in WebGL 3D, software 3D and the explicit 2D schematic.
- Orbit, inspect an object, open its details, step backward and forward, pause, restart and change playback speed.
- Follow a guided lesson into its sandbox. Change each control and confirm the visible result matches its label.
- Exercise navigation, mode/path tabs, disclosures, scenario controls, dialogs and object inspection with the keyboard.
- Verify reduced motion, language changes, readable status indicators and focus visibility.
- Mark progress, reload, resume and reset. Repeat with browser storage unavailable.
- Load a lesson directly, reload its hash route and follow related lessons from a static-host subdirectory.

For comprehension, ask whether a newcomer can identify the participants and explain what changed, why it changed, and which participant knows it. Revise the scene if that requires reading a long paragraph.

## Reproducing automated checks

Use Node.js 24 and the committed lockfile.

~~~bash
npm ci
npm test
npm run build
npm run preview
~~~

The CI workflow runs installation, tests and the production build on pushes and pull requests. When dependency installation succeeds, it collects build results even if a test fails; either failure still fails the job.

The separate Pages workflow is manual. It runs tests and the production build before uploading the site. The application uses relative assets and hash routes; a live Pages deployment has not been performed as part of this verification.
