# Validation record

## Current evidence status

**Fresh validation of the recovered source is pending.** This record separates observations from the earlier local workspace from checks still needed for the final repository revision.

| Check | Recorded evidence | What it establishes |
| --- | --- | --- |
| Earlier local production build | Completed successfully before the development environment became unavailable | The earlier workspace snapshot compiled and bundled |
| Last recorded full local test run | **279 passed / 280 total**; one search-normalization test failed | The earlier snapshot still had a known failing search case |
| Search correction | Prepared after that run; no subsequent execution was recorded | A proposed fix exists, with verification pending |
| Recovered repository source | Reconstructed and reviewed; byte-for-byte identity with the earlier snapshot is not guaranteed | Prior build and test results cannot validate the recovered revision |
| CI on the final recovered revision | Pending | No current passing result is claimed |
| Complete browser acceptance pass on the recovered revision | Pending | Rendering, accessibility, responsiveness, and static-host behavior still need final verification |

The earlier result must not be presented as a passing result for the recovered source. A completed CI run should be associated with its exact commit SHA and workflow URL before this record is updated.

## Automated checks

The test suite exercises bounded teaching models. It checks computational and presentation invariants; it is not a formal verification of the full production protocols.

| Area | Properties exercised |
| --- | --- |
| Catalog and localization | Stable lesson identifiers, bilingual required fields, valid references, control defaults, and coherent lesson metadata |
| Search | Catalog matching and normalization across English and Turkish inputs, including the outstanding regression case |
| Trace integrity | Reproducible output, meaningful frame sequences, stable object references, links to existing nodes, and bounded readable scenes |
| Scenario controls | Changes to controls affect relevant computed or displayed state |
| Consensus and DAGs | Quorum conditions, sampled decisions, modeled support thresholds, and explicitly scoped leader decisions |
| Distributed coordination | Routing and wraparound behavior, snapshot accounting, atomic-commit states, and replica convergence properties |
| Coding and probabilistic structures | Finite-field reconstruction, insufficient-shard cases, Bloom membership and false positives, and seeded sampling probabilities |
| Time | Logical-clock behavior, HLC updates, NTP offset and asymmetry calculations, and bounded-uncertainty commit waiting |
| Storage and streams | Replicated-prefix behavior, transactional crash windows, and the distinction between loss, duplicate effects, and atomic output/offset updates |
| Cryptographic teaching arithmetic | The modeled hash or proof relations and relevant rejection cases within explicitly small parameter spaces |
| Production build | TypeScript checking and bundling of the complete static application |

Some small domains support exhaustive checks, such as shard-subset recovery or routing in a small ring. Larger protocols use targeted examples and invariants. Passing those tests does not establish correctness outside the model's documented assumptions.

## Commands

Use Node.js 24 and the committed dependency lockfile.

```bash
npm ci
npm test
npm run build
```

`npm run build` includes the TypeScript project build. `npm run preview` serves the generated production output for manual inspection.

The CI workflow runs these installation, test, and build steps on pushes and pull requests, and also supports manual dispatch. The Pages workflow repeats the same checks before uploading the production artifact. Pages publication is manual.

## Browser acceptance

Record the browser, viewport, renderer, language, and revision for each acceptance pass. A useful minimum covers a narrow mobile viewport, a tablet viewport, and a wide desktop viewport.

### Lesson comprehension

- Can a new learner identify the participants, messages, blocks, or data pieces in the scene?
- Does each step make the relevant state change visible?
- Does the text explain why the change occurs without requiring a long prerequisite explanation?
- Does each sandbox control produce the effect promised by its label?
- Can the challenge be completed using the displayed mechanism?
- Are uncertainty, failure, incomplete knowledge, and model limits represented accurately?

### Rendering and interaction

- Check the same lesson, parameters, and frame in WebGL 3D, software 3D, and the 2D schematic.
- Orbit, inspect objects, step backward and forward, and restart playback.
- Verify labels remain readable and selected objects retain the correct details.
- Trigger the software fallback by testing without WebGL.
- Confirm renderer changes preserve the simulation state.
- Open a lesson directly, reload it, use browser history, and follow a related lesson.
- Verify relative assets and hash routes under a static-host subdirectory.

### Keyboard, motion, and layout

- Reach primary navigation, playback, scenario controls, disclosures, and object inspection by keyboard.
- Verify visible focus, coherent focus order, and usable dialog dismissal.
- Ensure a keyboard action does not trigger both an object action and an unrelated player shortcut.
- Test reduced motion and manual playback.
- Confirm statuses remain understandable without color alone.
- Check that labels, menus, controls, and explanations do not overlap at narrow widths.

### Language and persistence

- Repeat representative lessons in English and Turkish, including long labels and explanations.
- Test Turkish dotted and dotless letter variants in search where relevant.
- Change language while a lesson is open and verify the displayed content updates consistently.
- Mark progress, reload, and resume.
- Repeat with browser storage unavailable; the lesson must remain usable.

## Updating this record

After the recovered revision has completed CI and browser acceptance, add the exact evidence here:

| Field | Value |
| --- | --- |
| Commit SHA | Pending |
| CI workflow run | Pending |
| Automated test result | Pending |
| Production build result | Pending |
| Browser and viewport matrix | Pending |
| Remaining known issues | Pending final validation |

Retain a clear distinction between automated checks, manual observations, and source review. The [research notes](research-advanced.md) describe model assumptions; runtime validation confirms that the implementation follows those assumptions in the exercised scenarios.
