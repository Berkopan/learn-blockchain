# Block Atlas

### Explore blockchain and distributed systems in motion.

**85 visual lessons · 8 categories · 5 learning paths · English / Türkçe**

Watch messages move between nodes, follow a block into a chain, and see what changes when a participant fails. Block Atlas turns algorithms into small, interactive worlds: a short guided explanation first, then a sandbox you can control.

[Türkçe](README.tr.md) · [Architecture](docs/architecture.md) · [Validation record](docs/validation.md)

## Learn by changing the system

- **See the mechanism.** Orbit a real 3D scene, inspect nodes and blocks, and move through the explanation one step at a time.
- **Try a scenario.** Change lesson-specific inputs such as delays, failures, votes, shards, or transaction overlap. The scene shows the resulting state.
- **Choose your view.** Three.js powers the WebGL view. A software 3D renderer projects the same world when WebGL is unavailable; an explicit 2D schematic offers a flat view.
- **Keep your place.** Search and filter the catalog, follow a learning path, and resume using progress stored in your browser.
- **Follow the evidence.** Each lesson includes original sources, a model boundary, and a small challenge. English and Turkish are available throughout.

## A broad library, small lessons

| Category | A few things to explore |
| --- | --- |
| Foundations | Hash links, Merkle trees, transactions, and chain structure |
| Consensus | Proof of Work, Raft, Byzantine agreement, and sampled consensus |
| Coordination | Leader election, atomic commit, and distributed snapshots |
| Time | Logical clocks, vector clocks, HLC, NTP, and bounded uncertainty |
| Networking | Gossip, routing, compact blocks, and transaction reconciliation |
| Storage | Replication, CRDTs, Bloom filters, and erasure coding |
| Scaling | Data availability, DAGs, and modular execution |
| Cryptography | Commitments, proofs, and verifiable delay |

Five curated paths each connect six lessons:

**Your first block** · **How nodes agree** · **When things go wrong** · **A world of connections** · **Beyond the blockchain**

Start with a path or go directly to a topic. The primary screen keeps explanations short; object details and source notes provide more depth when you need it.

## Run locally

Use **Node.js 24** and npm.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite.

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`. The application uses relative assets and hash-based lesson URLs, so the output can be served from a static hosting subdirectory.

## Built for inspection

React, TypeScript, Vite, and Three.js form the application. Lesson content is separate from deterministic simulation functions; the renderers read the same frames. No account, backend, wallet, or live blockchain connection is required.

The simulations are deliberately small teaching models. Their assumptions are part of each lesson: an illustrative cryptographic calculation is identified as such, and a partial protocol does not claim to implement the complete system.

- [Architecture and extension guide](docs/architecture.md)
- [Validation status and acceptance criteria](docs/validation.md)
- [Blockchain research notes](docs/research-blockchain.md)
- [Distributed systems research notes](docs/research-distributed.md)
- [Advanced topics research notes](docs/research-advanced.md)

When adding a lesson, include both languages, primary sources, effective controls, a precise model boundary, and tests for the mechanism being taught.
