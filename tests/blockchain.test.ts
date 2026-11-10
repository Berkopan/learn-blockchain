import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { blockchainLessons } from '../src/content/blockchain';
import { defaultsFor, type Params, type SimulationTrace } from '../src/types';
import {
  bisectDispute, blockDigest, buildRadix, channelTransfer, chooseWork, effectiveFee,
  enumerateQuorums, ffgResult, ghostHead, ghostWeights, hotstuffCanCommit,
  htlcOutcome, makeChain, merkleLevels, merkleProof, mineNonce, nextBaseFee,
  pbftRound, retargetDifficulty, sampleTraceChecks, schnorrToy, sha256,
  simulateBlockchain, spendUTXO, tendermintCanCommit, transferAccount,
  validChain, verifyMerkle, verifyWork, weightedChoice,
} from '../src/simulation/blockchain';

function run(id: string, patch: Params = {}): SimulationTrace {
  const lesson = blockchainLessons.find(item => item.id === id);
  if (!lesson) throw new Error(`Unknown lesson: ${id}`);
  const trace = simulateBlockchain(id, { ...defaultsFor(lesson), ...patch });
  if (!trace) throw new Error(`No simulation: ${id}`);
  return trace;
}
function checkFrameIntegrity(trace: SimulationTrace) {
  expect(trace.frames.length).toBeGreaterThanOrEqual(5);
  expect(trace.frames.length).toBeLessThanOrEqual(8);
  expect(trace.outcome.en.length).toBeGreaterThan(0);
  expect(trace.outcome.tr.length).toBeGreaterThan(0);
  for (const frame of trace.frames) {
    expect(frame.title.en.length).toBeGreaterThan(0);
    expect(frame.title.tr.length).toBeGreaterThan(0);
    expect(frame.description.en.length).toBeGreaterThan(0);
    expect(frame.description.tr.length).toBeGreaterThan(0);
    const ids = new Set(frame.nodes.map(node => node.id));
    expect(ids.size).toBe(frame.nodes.length);
    for (const node of frame.nodes) {
      expect(node.label.length).toBeLessThanOrEqual(10);
      expect(node.value?.length ?? 0).toBeLessThanOrEqual(22);
      expect(node.position.every(Number.isFinite)).toBe(true);
      expect(Math.abs(node.position[0])).toBeLessThanOrEqual(6);
      expect(Math.abs(node.position[2])).toBeLessThanOrEqual(6);
      expect(node.position[1]).toBeGreaterThanOrEqual(0);
      expect(node.position[1]).toBeLessThanOrEqual(4);
    }
    for (const link of frame.links) {
      expect(ids.has(link.from), `Missing source ${link.from}`).toBe(true);
      expect(ids.has(link.to), `Missing target ${link.to}`).toBe(true);
    }
    for (const id of frame.focus ?? []) expect(ids.has(id)).toBe(true);
  }
}

describe('real hash and authenticated-data mechanics', () => {
  it.each(['', 'abc', 'Türkçe: ağ ve zincir 🔗', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'a'.repeat(1000)])('SHA-256 agrees with node:crypto for %s', input => {
    expect(sha256(input)).toBe(createHash('sha256').update(input).digest('hex'));
  });
  it('matches the published SHA-256 abc vector', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('verifies every Merkle position and rejects altered leaves or siblings', () => {
    for (const size of [1, 2, 3, 5, 8]) {
      const values = Array.from({ length: size }, (_, i) => `transaction:${i}`);
      const root = merkleLevels(values).at(-1)![0];
      values.forEach((value, i) => {
        const proof = merkleProof(values, i);
        expect(verifyMerkle(value, proof, root)).toBe(true);
        expect(verifyMerkle(value + '!', proof, root)).toBe(false);
        if (proof.length) {
          const corrupted = proof.map((step, j) => j === 0 ? { ...step, hash: '0'.repeat(64) } : step);
          expect(verifyMerkle(value, corrupted, root)).toBe(false);
        }
      });
    }
  });
  it('rejects an empty tree and out-of-range proof positions', () => {
    expect(() => merkleLevels([])).toThrow();
    expect(() => merkleProof(['a', 'b'], -1)).toThrow();
    expect(() => merkleProof(['a', 'b'], 2)).toThrow();
  });
  it('detects a broken descendant link even after the edited block is rehashed', () => {
    const original = makeChain(['genesis', 'pay 5', 'pay 2']);
    expect(validChain(original)).toBe(true);
    const changed = original.map(block => ({ ...block }));
    changed[1].data = 'pay 9';
    changed[1].hash = blockDigest(1, changed[1].data, changed[1].previous);
    expect(validChain(changed)).toBe(false);
    expect(validChain(makeChain(changed.map(block => block.data)))).toBe(true);
  });
  it('compresses radix prefixes and authenticates updates independently of input order', () => {
    const first = buildRadix([['ab1', 12], ['abf', 25]]);
    const reordered = buildRadix([['abf', 25], ['ab1', 12]]);
    const updated = buildRadix([['ab1', 13], ['abf', 25]]);
    expect(first.type).toBe('extension');
    expect(first.prefix).toBe('ab');
    expect(reordered.digest).toBe(first.digest);
    expect(updated.digest).not.toBe(first.digest);
  });
  it('checks real toy Schnorr arithmetic without treating tiny parameters as secure', () => {
    for (let secret = 1; secret <= 10; secret++) {
      expect(schnorrToy(secret, 'pay 5').valid).toBe(true);
      expect(schnorrToy(secret, 'pay 5', true).valid).toBe(false);
      for (let challenge = 1; challenge <= 10; challenge++) expect(schnorrToy(secret, '', false, challenge).valid).toBe(true);
    }
  });
});

describe('transaction and channel invariants', () => {
  it('consumes complete UTXOs and conserves value including the fee', () => {
    const utxos = { u0: 8, u1: 5 };
    const result = spendUTXO(utxos, ['u0', 'u1'], 7);
    expect(result.accepted).toBe(true);
    expect(result.payment).toBe(7);
    expect(result.change).toBe(5);
    expect(result.remaining).toEqual({ 'tx:0': 7, 'tx:1': 5 });
    expect(result.payment + result.change + 1).toBe(13);
    expect(utxos).toEqual({ u0: 8, u1: 5 });
  });
  it('rejects duplicate, missing and overdrawn inputs without mutating the set', () => {
    const utxos = { u0: 8, u1: 5 };
    for (const result of [spendUTXO(utxos, ['u0', 'u0'], 7), spendUTXO(utxos, ['gone'], 1), spendUTXO(utxos, ['u0'], 8)]) {
      expect(result.accepted).toBe(false);
      expect(result.remaining).toEqual(utxos);
    }
  });
  it('conserves account balances and rejects replay, nonce gaps and overdraws', () => {
    const state = { alice: 20, bob: 5, nonce: 2 };
    const first = transferAccount(state, 6, 2);
    expect(first).toEqual({ accepted: true, state: { alice: 14, bob: 11, nonce: 3 } });
    expect(transferAccount(first.state, 6, 2)).toEqual({ accepted: false, state: first.state });
    expect(transferAccount(state, 21, 2)).toEqual({ accepted: false, state });
    expect(transferAccount(state, 6, 3)).toEqual({ accepted: false, state });
    expect(state).toEqual({ alice: 20, bob: 5, nonce: 2 });
  });
  it('preserves channel collateral and refuses an unaffordable update', () => {
    expect(channelTransfer(10, 5, 7)).toEqual({ valid: true, alice: 3, bob: 12 });
    expect(channelTransfer(10, 5, 11)).toEqual({ valid: false, alice: 10, bob: 5 });
  });
  it('requires a correct, timely HTLC preimage', () => {
    expect(htlcOutcome('secret', 'secret', 2).settled).toBe(true);
    expect(htlcOutcome('secret', 'wrong', 2).settled).toBe(false);
    expect(htlcOutcome('secret', 'secret', 3).settled).toBe(false);
    expect(htlcOutcome('secret', 'secret', 5).settled).toBe(false);
  });
  it('withholds late HTLC preimages instead of leaking a claimable upstream secret', () => {
    for (const time of [3, 4, 5]) {
      expect(htlcOutcome('secret', 'secret', time)).toEqual({ hashMatches: true, disclosed: false, settled: false });
      const trace = run('htlc', { secret: 'secret', wrong: false, revealAt: time });
      const attemptedReveal = trace.frames[3];
      expect(attemptedReveal.nodes.find(node => node.id === 'secret')?.value).toBe('•••');
      expect(attemptedReveal.links.some(link => link.from === 'secret' && link.to === 'bc')).toBe(false);
      expect(attemptedReveal.metrics?.find(item => item.label.en === 'Preimage disclosed')?.value).toBe('✕');
      for (const later of trace.frames.slice(3)) expect(later.nodes.find(node => node.id === 'secret')?.value).toBe('•••');
    }
    const early = run('htlc', { secret: 'secret', wrong: false, revealAt: 2 }).frames[3];
    expect(early.nodes.find(node => node.id === 'secret')?.value).toBe('secret');
    expect(early.links.some(link => link.from === 'secret' && link.to === 'bc')).toBe(true);
  });
});

describe('proof of work and weighted consensus', () => {
  it('mines real small SHA-256 targets and honors the search budget', () => {
    for (const bits of [4, 7, 10]) {
      const found = mineNonce('test block', bits)!;
      expect(found).toBeDefined();
      const expectedHash = createHash('sha256').update(`test block|${found.nonce}`).digest('hex');
      expect(found.hash).toBe(expectedHash);
      expect(parseInt(found.hash.slice(0, 8), 16)).toBeLessThan(2 ** (32 - bits));
      expect(verifyWork('test block', found.nonce, bits)).toBe(true);
      expect(found.attempts).toBe(found.nonce + 1);
    }
    expect(mineNonce('x', 10, 0)).toBeUndefined();
  });
  it('selects cumulative work and retains the incumbent on ties', () => {
    expect(chooseWork([1, 1, 1], [2, 2])).toBe('challenger');
    expect(chooseWork([4, 4], [4])).toBe('incumbent');
    expect(chooseWork([1, 1], [2])).toBe('incumbent');
  });
  it('retargets in the right direction with quarter-to-fourfold bounds', () => {
    expect(retargetDifficulty(1, 5)).toBe(2);
    expect(retargetDifficulty(2, 20)).toBe(1);
    expect(retargetDifficulty(1, 0.1)).toBe(4);
    expect(retargetDifficulty(1, 1000)).toBe(0.25);
  });
  it('maps draws into the correct weighted intervals', () => {
    expect(weightedChoice([1, 3], 0)).toBe(0);
    expect(weightedChoice([1, 3], 0.249)).toBe(0);
    expect(weightedChoice([1, 3], 0.25)).toBe(1);
    expect(weightedChoice([1, 3], 0.99)).toBe(1);
  });
  it('replaces a validator latest vote instead of counting its weight twice', () => {
    const parents = { g: null, a: 'g', a2: 'a', a3: 'a2', bb: 'g' };
    const votes = { A: { target: 'a3', weight: 4 }, B: { target: 'a2', weight: 2 }, C: { target: 'bb', weight: 2 } };
    expect(ghostHead(parents, votes).head).toBe('a3');
    const moved = { ...votes, A: { target: 'bb', weight: 4 } };
    expect(ghostHead(parents, moved).head).toBe('bb');
    expect(ghostWeights(parents, moved)).toEqual({ g: 8, a: 2, a2: 2, a3: 0, bb: 6 });
  });
  it('distinguishes justification from consecutive-link finalization', () => {
    expect(ffgResult(66, 100)).toEqual({ justified: false, finalized: false });
    expect(ffgResult(67, 66)).toEqual({ justified: true, finalized: false });
    expect(ffgResult(67, 67)).toEqual({ justified: true, finalized: true });
  });
  it('requires valid PBFT prepares and three matching commits', () => {
    expect(pbftRound(0, false).committed).toBe('A');
    expect(pbftRound(1, false).committed).toBe('A');
    expect(pbftRound(2, false).committed).toBeUndefined();
    expect(pbftRound(0, true).committed).toBeUndefined();
    expect(pbftRound(0, false, true).committed).toBeUndefined();
  });
  it('uses strictly greater than two-thirds voting power for Tendermint', () => {
    expect(tendermintCanCommit(200 / 3, true)).toBe(false);
    expect(tendermintCanCommit(67, true)).toBe(true);
    expect(tendermintCanCommit(100, false)).toBe(false);
  });
  it('requires a direct three-chain with enough votes for HotStuff commit', () => {
    expect(hotstuffCanCommit(3, 2, false)).toBe(true);
    expect(hotstuffCanCommit(2, 2, false)).toBe(false);
    expect(hotstuffCanCommit(3, 1, false)).toBe(false);
    expect(hotstuffCanCommit(3, 2, true)).toBe(false);
  });
  it('finds disjoint federated quorums and excludes unavailable members', () => {
    const quorums = enumerateQuorums([[0, 1], [0, 1], [2, 3], [2, 3]], [2, 2, 2, 2]);
    expect(quorums).toContainEqual([0, 1]);
    expect(quorums).toContainEqual([2, 3]);
    expect(enumerateQuorums([[0, 1], [0, 1]], [2, 2], [0])).toEqual([]);
  });
});

describe('scaling and fee boundaries', () => {
  it('bisects a disagreement down to the first invalid transition', () => {
    const correct = Array.from({ length: 9 }, (_, i) => i);
    const claimed = correct.map((value, i) => value + (i >= 4 ? 3 : 0));
    expect(bisectDispute(correct, claimed).at(-1)).toEqual([3, 4]);
  });
  it('samples without replacement and detects both sides of a corrupt trace cell', () => {
    const trace = Array.from({ length: 8 }, (_, i) => 2 ** (i + 1) - 1);
    expect(sampleTraceChecks(trace, 7, 3).failures).toEqual([]);
    trace[4] += 3;
    const result = sampleTraceChecks(trace, 7, 3);
    expect(new Set(result.samples).size).toBe(7);
    expect(result.failures.sort((a, b) => a - b)).toEqual([3, 4]);
  });
  it('implements integer EIP-1559 feedback and the minimum upward increment', () => {
    expect(nextBaseFee(1000, 100)).toBe(1000);
    expect(nextBaseFee(1000, 200)).toBe(1125);
    expect(nextBaseFee(1000, 0)).toBe(875);
    expect(nextBaseFee(1, 101)).toBe(2);
  });
  it('caps priority fees and excludes transactions below the base fee', () => {
    expect(effectiveFee(100, 103, 10)).toEqual({ eligible: true, tip: 3, total: 103 });
    expect(effectiveFee(100, 200, 5)).toEqual({ eligible: true, tip: 5, total: 105 });
    expect(effectiveFee(100, 99, 5)).toEqual({ eligible: false, tip: 0, total: 0 });
  });
  it('shows the honest-challenger assumption and validity/availability separation', () => {
    expect(run('optimistic-rollup', { corrupt: true, challenger: false }).outcome.en).toContain('bad assertion is accepted');
    expect(run('optimistic-rollup', { corrupt: true, challenger: true }).outcome.en).toContain('rejected');
    expect(run('validity-rollup', { withhold: true }).outcome.en).toContain('unavailable data');
    expect(run('validity-rollup', { invalid: true }).outcome.en).toContain('rejected');
  });
  it('does not accept a rollup state update on a valid proof without required data', () => {
    const withheld = run('validity-rollup', { batch: 4, invalid: false, withhold: true });
    expect(withheld.frames[3].metrics?.find(item => item.label.en === 'Model proof accepted')?.value).toBe('✓');
    const final = withheld.frames.at(-1)!;
    expect(final.metrics?.find(item => item.label.en === 'Rollup update accepted')?.value).toBe('✕');
    expect(final.nodes.find(node => node.id === 'new')?.value).toBe('10');
    const published = run('validity-rollup', { batch: 4, invalid: false, withhold: false }).frames.at(-1)!;
    expect(published.metrics?.find(item => item.label.en === 'Rollup update accepted')?.value).toBe('✓');
    expect(published.nodes.find(node => node.id === 'new')?.value).toBe('14');
    const invalid = run('validity-rollup', { batch: 4, invalid: true, withhold: false }).frames.at(-1)!;
    expect(invalid.metrics?.find(item => item.label.en === 'Rollup update accepted')?.value).toBe('✕');
    expect(invalid.nodes.find(node => node.id === 'new')?.value).toBe('10');
  });
});

describe('complete bilingual blockchain catalog', () => {
  it('has 34 unique supported lessons and rejects unknown IDs', () => {
    expect(blockchainLessons).toHaveLength(34);
    expect(new Set(blockchainLessons.map(lesson => lesson.id)).size).toBe(34);
    expect(simulateBlockchain('not-a-lesson', {})).toBeUndefined();
  });
  it.each(blockchainLessons)('$id has deterministic, valid frames and working controls', lesson => {
    const params = defaultsFor(lesson), base = run(lesson.id);
    checkFrameIntegrity(base);
    expect(run(lesson.id)).toEqual(base);
    expect(lesson.sources.length).toBeGreaterThan(0);
    expect(lesson.model.en.length).toBeGreaterThan(30);
    expect(lesson.model.tr.length).toBeGreaterThan(30);
    expect(lesson.challenge.options[lesson.challenge.correct]).toBeDefined();
    for (const control of lesson.controls) {
      let values: Params[string][];
      if (control.kind === 'toggle') values = [!control.default];
      else if (control.kind === 'range') values = [control.min, control.max];
      else if (control.kind === 'select') values = control.options.map(option => option.value);
      else values = ['değişik123', ''];
      let changed = false;
      for (const value of values) {
        const trace = simulateBlockchain(lesson.id, { ...params, [control.id]: value })!;
        checkFrameIntegrity(trace);
        if (JSON.stringify(trace) !== JSON.stringify(base)) changed = true;
      }
      expect(changed, `${lesson.id}: control ${control.id} has no visible effect`).toBe(true);
    }
  });
});
