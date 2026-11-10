import { describe, expect, it } from 'vitest';
import { advancedLessons } from '../src/content/advanced';
import { defaultsFor } from '../src/types';
import { binomialTickets, bloomBuild, bloomQuery, bullsharkDecision, commitWait, hlcLocal, hlcReceive, modPow, ntpMeasurement, reconcileSets, rendezvousOwner, rsEncode, rsRecover, sampleMissProbability, simulateAdvanced, snowPolls, streamRecovery, vdfProof, verifyVdf } from '../src/simulation/advanced';

describe('Reed–Solomon erasure recovery', () => {
  it('recovers all three coefficients from every three-of-six survivor combination', () => {
    for (const data of [[0, 42, 17], [25, 0, 256], [256, 256, 256]]) {
      const shards = rsEncode(data);
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 5; b++) for (let c = b + 1; c < 6; c++) expect(rsRecover([shards[a], shards[b], shards[c]])).toEqual(data);
    }
  });
  it('refuses to invent a unique polynomial from insufficient or repeated points', () => {
    const shards = rsEncode([12, 34, 56]);
    expect(rsRecover(shards.slice(0, 2))).toBeUndefined();
    expect(rsRecover([shards[0], shards[0], shards[1]])).toBeUndefined();
  });
});

describe('Clock mechanisms', () => {
  it('NTP removes symmetric transit and processing time without losing the offset', () => {
    for (const offset of [-40, 0, 20, 40]) for (const transit of [10, 30, 90]) {
      const measured = ntpMeasurement(offset, transit, transit, 37);
      expect(measured.estimate).toBe(offset);
      expect(measured.delay).toBe(transit * 2);
      expect(measured.residual).toBe(0);
    }
  });
  it('NTP exposes the half-asymmetry bias instead of pretending perfect time', () => {
    const measured = ntpMeasurement(20, 90, 10);
    expect(measured.estimate).toBe(60);
    expect(measured.residual).toBe(-40);
  });
  it('HLC survives physical clock rollback and exceeds both received/local timestamps', () => {
    expect(hlcLocal({ l: 100, c: 4 }, 20)).toEqual({ l: 100, c: 5 });
    expect(hlcReceive({ l: 100, c: 4 }, { l: 100, c: 7 }, 20)).toEqual({ l: 100, c: 8 });
    expect(hlcReceive({ l: 100, c: 4 }, { l: 105, c: 7 }, 20)).toEqual({ l: 105, c: 8 });
    expect(hlcReceive({ l: 100, c: 4 }, { l: 105, c: 7 }, 110)).toEqual({ l: 110, c: 0 });
  });
  it('commit wait never exposes a timestamp that might still be future', () => {
    for (let uncertainty = 1; uncertainty <= 8; uncertainty++) for (let replication = 1; replication <= 20; replication++) {
      const r = commitWait(uncertainty, replication);
      expect(r.visibleAt - uncertainty).toBeGreaterThan(r.timestamp);
      expect(r.visibleAt).toBeGreaterThanOrEqual(100 + replication);
      expect(r.remaining).toBe(r.visibleAt - (100 + replication));
    }
    expect(commitWait(2, 20).remaining).toBe(0);
  });
});

describe('Sampling and DAG evidence', () => {
  it('Snowball accepts unanimous A or B only after the configured streak and freezes confidence', () => {
    for (const support of [0, 8]) {
      const polls = snowPolls(support, 5, 3);
      expect(polls[0].accepted).toBe(false);
      expect(polls[1].accepted).toBe(false);
      expect(polls[2].accepted).toBe(true);
      expect(polls[2].preference).toBe(support ? 'A' : 'B');
      expect(polls[4].confidence).toEqual(polls[2].confidence);
      expect(new Set(polls[0].sample).size).toBe(5);
    }
  });
  it('sortition obeys binomial extremes and approximate expected weight over uniform samples', () => {
    expect(binomialTickets(7, 1, .5)).toBe(7);
    expect(binomialTickets(7, 0, .5)).toBe(0);
    const samples = Array.from({ length: 10000 }, (_, i) => binomialTickets(4, .25, (i + .5) / 10000));
    expect(samples.reduce((a, b) => a + b, 0) / samples.length).toBeCloseTo(1, 2);
  });
  it('Bullshark counts supporting paths within the observed parent set, not all known votes', () => {
    expect(bullsharkDecision(2, [0, 1, 2])).toEqual({ votes: 2, committed: true });
    expect(bullsharkDecision(2, [1, 2, 3])).toEqual({ votes: 1, committed: false });
    expect(bullsharkDecision(1, [0, 1, 2]).committed).toBe(false);
  });
  it('sampling computes the exact without-replacement miss probability', () => {
    expect(sampleMissProbability(16, 4, 2)).toBeCloseTo(12 / 16 * 11 / 15);
    expect(sampleMissProbability(16, 4, 13)).toBe(0);
    expect(sampleMissProbability(16, 0, 12)).toBe(1);
    expect(sampleMissProbability(16, 4, 8)).toBeLessThan(sampleMissProbability(16, 4, 4));
  });
});

describe('Replication, reconciliation and placement', () => {
  it('reconciliation capacity changes decoding feasibility without changing the union', () => {
    const a = [1, 2, 3], b = [2, 3, 4];
    expect(reconcileSets(a, b, 2)).toEqual({ difference: [1, 4], decoded: true, union: [1, 2, 3, 4] });
    expect(reconcileSets(a, b, 1).decoded).toBe(false);
    expect(reconcileSets(a, b, 1).union).toEqual(reconcileSets(a, b, 2).union);
  });
  it('atomic offset/output transactions survive each modeled crash with one effect', () => {
    for (const point of ['before-output', 'after-output', 'after-commit'] as const) {
      const r = streamRecovery('transaction', point);
      expect(r.finalVisible).toBe(1);
      expect(r.duplicates).toBe(0);
      expect(r.lost).toBe(0);
    }
  });
  it('exposes the lost-effect and duplicate-effect windows of non-atomic modes', () => {
    expect(streamRecovery('at-most', 'before-output').lost).toBe(1);
    expect(streamRecovery('at-least', 'after-output').duplicates).toBe(1);
    expect(streamRecovery('at-least', 'before-output').finalVisible).toBe(1);
    expect(streamRecovery('transaction', 'after-output').staged).toBe(1);
    expect(streamRecovery('transaction', 'after-output').visible).toBe(0);
  });
  it('removing a rendezvous server moves only that server’s keys; adding one only moves keys to it', () => {
    const before = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < 200; i++) {
      const key = `asset-${i}`, oldOwner = rendezvousOwner(key, before), afterRemoval = rendezvousOwner(key, ['A', 'C', 'D']), afterAddition = rendezvousOwner(key, [...before, 'E']);
      if (oldOwner !== 'B') expect(afterRemoval).toBe(oldOwner);
      if (afterAddition !== oldOwner) expect(afterAddition).toBe('E');
    }
  });
});

describe('Probabilistic membership and verifiable arithmetic', () => {
  it('Bloom queries never lose inserted words, but can produce an actual false positive', () => {
    const words = ['apple', 'banana', 'cherry', 'date', 'elder', 'fig', 'grape', 'kiwi'];
    const bits = bloomBuild(words, 16);
    words.forEach(word => expect(bloomQuery(bits, word)).toBe(true));
    const absent = Array.from({ length: 500 }, (_, i) => `absent-${i}`).find(word => bloomQuery(bits, word));
    expect(absent).toBeDefined();
    expect(words).not.toContain(absent);
    expect(bloomQuery(Array(16).fill(0), 'apple')).toBe(false);
  });
  it('Wesolowski’s arithmetic relation accepts computed results and rejects altered results', () => {
    for (const x of [4n, 9n, 16n]) for (let steps = 4; steps <= 16; steps++) {
      const r = vdfProof(x, steps);
      expect(r.result).toBe(modPow(x, 1n << BigInt(steps), 77n));
      expect(verifyVdf(x, r.result, r.proof, steps)).toBe(true);
      expect(verifyVdf(x, (r.result + 1n) % 77n, r.proof, steps)).toBe(false);
    }
  });
});

describe('Advanced teaching traces', () => {
  it('all lessons provide deterministic, bilingual scenes with valid references and bounded geometry', () => {
    expect(advancedLessons).toHaveLength(18);
    for (const lesson of advancedLessons) {
      const params = defaultsFor(lesson), trace = simulateAdvanced(lesson.id, params)!;
      expect(trace, lesson.id).toBeDefined();
      expect(trace).toEqual(simulateAdvanced(lesson.id, params));
      expect(trace.frames.length).toBeGreaterThanOrEqual(5);
      expect(trace.frames.length).toBeLessThanOrEqual(8);
      for (const scene of trace.frames) {
        expect(scene.title.en.length).toBeGreaterThan(0);
        expect(scene.title.tr.length).toBeGreaterThan(0);
        expect(scene.description.en.length).toBeGreaterThan(0);
        expect(scene.description.tr.length).toBeGreaterThan(0);
        const ids = new Set(scene.nodes.map(n => n.id));
        expect(ids.size, `${lesson.id}: duplicate node IDs`).toBe(scene.nodes.length);
        for (const link of scene.links) { expect(ids.has(link.from), `${lesson.id}: missing ${link.from}`).toBe(true); expect(ids.has(link.to), `${lesson.id}: missing ${link.to}`).toBe(true); }
        for (const n of scene.nodes) {
          expect(n.label.length, `${lesson.id}: label too long`).toBeLessThanOrEqual(10);
          expect((n.value ?? '').length, `${lesson.id}: value too long`).toBeLessThanOrEqual(22);
          expect(n.position[0]).toBeGreaterThanOrEqual(-6); expect(n.position[0]).toBeLessThanOrEqual(6);
          expect(n.position[1]).toBeGreaterThanOrEqual(0); expect(n.position[1]).toBeLessThanOrEqual(4);
          expect(n.position[2]).toBeGreaterThanOrEqual(-6); expect(n.position[2]).toBeLessThanOrEqual(6);
        }
      }
    }
  });
  it('each sandbox control changes rendered state or computed metrics', () => {
    for (const lesson of advancedLessons) {
      const defaults = defaultsFor(lesson);
      const visual = (params: typeof defaults) => JSON.stringify(simulateAdvanced(lesson.id, params)!.frames.map(f => ({ nodes: f.nodes, links: f.links, metrics: f.metrics })));
      for (const control of lesson.controls) {
        const value = control.kind === 'range' ? (control.default === control.min ? control.max : control.min) : control.kind === 'toggle' ? !control.default : control.kind === 'text' ? 'changed-input' : control.options.find(o => o.value !== control.default)!.value;
        expect(visual({ ...defaults, [control.id]: value }), `${lesson.id}/${control.id} has no effect`).not.toBe(visual(defaults));
      }
    }
  });
  it('critical scenario controls actually change acceptance, recovery and visibility', () => {
    const last = (id: string, p: Record<string, number | string | boolean>) => simulateAdvanced(id, p)!.frames.at(-1)!;
    expect(last('narwhal', { withheld: 2 }).metrics?.[0].value).toBe(0);
    expect(last('reed-solomon', { missing: 4 }).nodes.find(n => n.id === 'o0')?.value).toBe('?');
    expect(last('bullshark', { support: 2, parents: 'BCD' }).nodes.find(n => n.id === 'output')?.status).toBe('muted');
    expect(last('modular-execution', { amount: 14, withhold: false, client: 'A' }).metrics?.[0].value).toBe('12');
    expect(last('modular-execution', { amount: 14, withhold: true, client: 'A' }).metrics?.[0].value).toBe('10 · …');
    expect(last('modular-execution', { amount: 14, withhold: true, client: 'B' }).metrics?.[0].value).toBe(4);
  });
});
