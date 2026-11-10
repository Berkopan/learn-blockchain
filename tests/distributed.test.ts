import { describe, expect, it } from 'vitest';
import { distributedLessons } from '../src/content/distributed';
import { defaultsFor, type Params } from '../src/types';
import { KADEMLIA_IDS, canCausalDeliver, chordRoute, chordSuccessor, consistentOwner, contiguousPrefix, gValue, inheritAccepted, kademliaLookup, lamportReceive, linearizeRegister, mergeLWW, mergeOR, mergePN, mergeVector, merkleDifferences, orPresent, paxosOutcome, pnValue, quorumIntersection, raftOutcome, readRepairState, requestOrder, ringElection, selectViewLog, simulateDistributed, snapshotMoney, terminationState, threePCOutcome, twoPCOutcome, vectorReceive, vectorRelation } from '../src/simulation/distributed';

describe('Consensus invariants', () => {
  it('Raft counts a current-term majority and rejects a stale candidate', () => {
    for (let offline = 0; offline <= 3; offline++) {
      const fresh = raftOutcome(offline, false, true);
      expect(fresh.elected).toBe(5 - offline >= 3);
      expect(fresh.commitIndex).toBe(offline <= 2 ? 3 : 1);
      expect(raftOutcome(offline, false, false).commitIndex).toBe(1);
      expect(raftOutcome(offline, true, true).elected).toBe(false);
      expect(raftOutcome(offline, true, true).commitIndex).toBe(1);
    }
  });
  it('Paxos inherits the highest accepted value instead of the proposer’s preference', () => {
    expect(inheritAccepted([{ ballot: 4, value: 'A' }, undefined, { ballot: 9, value: 'B' }], 'C')).toBe('B');
    expect(inheritAccepted([undefined, undefined], 'C')).toBe('C');
    expect(paxosOutcome(true, 3, 0)).toMatchObject({ chosen: true, value: 'A' });
    expect(paxosOutcome(false, 3, 0)).toMatchObject({ chosen: true, value: 'B' });
    expect(paxosOutcome(true, 2, 0).chosen).toBe(false);
    expect(paxosOutcome(true, 4, 2).chosen).toBe(false);
  });
  it('Multi-Paxos cannot apply past an unchosen hole', () => {
    expect(contiguousPrefix([true, false, true])).toBe(1);
    expect(contiguousPrefix([false, true, true])).toBe(0);
    expect(contiguousPrefix([true, true, true])).toBe(3);
    const trace = simulateDistributed('multi-paxos', { slots: 3, hole: true, leaderChange: true })!;
    expect(trace.frames.at(-1)!.metrics?.find(m => m.label.en === 'Applied slots')?.value).toBe(1);
  });
  it('VR compares last-normal view before tail length and preserves the committed prefix', () => {
    const selected = selectViewLog([
      { id: 'C', view: 0, log: ['X1', 'X2', 'Z3'], commit: 2 },
      { id: 'B', view: 1, log: ['X1', 'X2'], commit: 2 },
    ])!;
    expect(selected.id).toBe('B');
    expect(selected.log.slice(0, selected.commit)).toEqual(['X1', 'X2']);
    for (const backups of [1, 2]) {
      const trace = simulateDistributed('viewstamped-replication', { backups, leaderFail: true, staleTail: true })!;
      expect(trace.frames.at(-1)!.metrics?.find(m => m.label.en === 'Commit index')?.value).toBe(2);
    }
  });
});

describe('Time, causality and coordination', () => {
  it('Lamport receive strictly exceeds local and received timestamps', () => {
    for (let local = 0; local < 8; local++) for (let received = 0; received < 8; received++) {
      expect(lamportReceive(local, received)).toBeGreaterThan(local);
      expect(lamportReceive(local, received)).toBeGreaterThan(received);
    }
  });
  it('vector comparison distinguishes causality, equality and concurrency', () => {
    expect(vectorRelation([2,0,0], [0,2,0])).toBe('concurrent');
    expect(vectorRelation([2,0,0], [2,1,0])).toBe('before');
    expect(vectorRelation([2,1,0], [2,0,0])).toBe('after');
    expect(vectorRelation([2,1,0], [2,1,0])).toBe('equal');
    const received = vectorReceive([0,1,0], [2,0,0], 1);
    expect(received).toEqual([2,2,0]);
    expect(vectorRelation([2,0,0], received)).toBe('before');
  });
  it('causal delivery waits for dependencies and rejects a skipped sender sequence', () => {
    expect(canCausalDeliver([0,0,0], [1,1,0], 1)).toBe(false);
    expect(canCausalDeliver([1,0,0], [1,1,0], 1)).toBe(true);
    expect(canCausalDeliver([1,0,0], [1,2,0], 1)).toBe(false);
    expect(canCausalDeliver([0,0,0], [0,1,0], 1)).toBe(true);
    const trace = simulateDistributed('causal-broadcast', { reorder: true, dependency: true })!;
    expect(trace.frames[2].metrics?.find(m => m.label.en === 'Buffered messages')?.value).toBe(1);
    expect(trace.frames[4].metrics?.find(m => m.label.en === 'Applied order')?.value).toBe('m1→m2');
  });
  it('mutual exclusion priority uses timestamp before ID, with deterministic ties', () => {
    expect(requestOrder({ time: 2, id: 'A' }, { time: 2, id: 'B' })).toBeLessThan(0);
    expect(requestOrder({ time: 3, id: 'A' }, { time: 2, id: 'B' })).toBeGreaterThan(0);
    for (const id of ['lamport-mutex', 'ricart-agrawala']) {
      const trace = simulateDistributed(id, { offline: true, concurrent: true, aTime: 2 })!;
      expect(trace.frames.filter(f => f.nodes.some(n => n.id === 'CS' && n.value !== '∅'))).toHaveLength(0);
    }
  });
  it('ring election selects the maximum from every initiator, including simultaneous elections', () => {
    for (let start = 0; start < 5; start++) for (const concurrent of [false, true]) {
      const result = ringElection([2,5,1,4,3], start, concurrent);
      expect(result.winner).toBe(5);
      expect(result.rounds.length).toBeLessThanOrEqual(15);
    }
  });
  it('snapshots conserve local money plus in-flight channel state', () => {
    for (let amount = 1; amount <= 5; amount++) for (const inFlight of [false, true]) {
      const s = snapshotMoney(amount, inFlight);
      expect(s.a + s.b + s.c + s.channel).toBe(16);
      expect(s.channel).toBe(inFlight ? amount : 0);
      expect(s.b).toBe(6 - amount);
      expect(s.a).toBe(inFlight ? 10 : 10 + amount);
    }
  });
  it('termination waits for outstanding acknowledgments even when workers are passive', () => {
    for (const extra of [false, true]) {
      expect(terminationState(true, extra).terminated).toBe(false);
      expect(terminationState(false, extra).terminated).toBe(true);
    }
  });
});

describe('Routing, placement and replica repair', () => {
  it('Chord finds the exact clockwise successor for every key, start and bounded ring', () => {
    for (const members of [[0,4,8,12], [0,4,8,10,12]]) for (const start of members) for (let key = 0; key < 16; key++) {
      const result = chordRoute(key, start, members);
      expect(result.owner, JSON.stringify({ members, start, key })).toBe(chordSuccessor(key, members));
      expect(result.path[0]).toBe(start);
      expect(new Set(result.path).size).toBe(result.path.length);
      expect(result.path.length).toBeLessThanOrEqual(members.length + 1);
    }
  });
  it('Kademlia reaches the closest responsive peer for all targets and query widths', () => {
    for (let target = 0; target < 16; target++) for (let alpha = 1; alpha <= 3; alpha++) for (const failed of [false, true]) {
      const expected = KADEMLIA_IDS.filter(id => !(failed && id === 8)).sort((a, b) => (a ^ target) - (b ^ target))[0];
      const result = kademliaLookup(target, alpha, failed);
      expect(result.nearest, JSON.stringify({ target, alpha, failed })).toBe(expected);
      expect(result.rounds.every(r => r.queries.length <= alpha)).toBe(true);
      const queried = result.rounds.flatMap(r => r.queries);
      expect(new Set(queried).size).toBe(queried.length);
      if (failed) expect(result.rounds.flatMap(r => r.responses)).not.toContain(8);
    }
  });
  it('consistent-hash addition moves changed keys only to the new server', () => {
    for (let virtual = 1; virtual <= 3; virtual++) for (let i = 0; i < 200; i++) {
      const old = consistentOwner('key-' + i, ['A','B','C'], virtual);
      const next = consistentOwner('key-' + i, ['A','B','C','D'], virtual);
      if (next !== old) expect(next).toBe('D');
    }
  });
  it('read/write sets of sizes whose sum exceeds N always intersect', () => {
    const subsets = Array.from({ length: 31 }, (_, i) => Array.from({ length: 5 }, (_, bit) => bit).filter(bit => (i + 1) & (1 << bit)));
    for (const read of subsets) for (const write of subsets) if (read.length + write.length > 5) expect(quorumIntersection(read, write).length).toBeGreaterThan(0);
    expect(quorumIntersection([0,1], [3,4])).toEqual([]);
  });
  it('read repair cannot invent a version absent from every responder', () => {
    expect(readRepairState(1, 1, true)).toMatchObject({ value: 0, after: [1,0,0] });
    expect(readRepairState(1, 3, true)).toMatchObject({ value: 1, after: [1,1,1] });
    expect(readRepairState(1, 3, false)).toMatchObject({ value: 1, after: [1,0,0] });
  });
  it('Merkle comparison finds precisely the modified leaves', () => {
    const a = Array.from({ length: 8 }, (_, i) => 10 + i);
    expect(merkleDifferences(a, a).differences).toEqual([]);
    expect(merkleDifferences(a, a).comparisons).toBe(1);
    for (let start = 0; start < 8; start++) for (let count = 1; count <= 3; count++) {
      const b = [...a], expected = Array.from({ length: count }, (_, i) => (start + i) % 8).sort((x,y) => x-y);
      expected.forEach(i => b[i] += 10);
      expect(merkleDifferences(a, b).differences).toEqual(expected);
    }
  });
});

describe('Atomic commit model boundaries', () => {
  it('2PC commits only with unanimity and blocks prepared voters before unknown decision recovery', () => {
    for (const no of [false, true]) for (const crash of [false, true]) for (const recover of [false, true]) {
      const result = twoPCOutcome(no, crash, recover);
      expect(result.decision === 'commit').toBe(!no && !crash);
      if (crash && !recover) expect(result.decision).toBe('blocked');
      if (crash && recover) expect(result.decision).toBe('abort');
      if (no) expect(result.prepared).toEqual([true, true, false]);
    }
    const model = distributedLessons.find(l => l.id === 'two-phase-commit')!.model.en;
    expect(model).toContain('Participant-to-participant termination is omitted');
  });
  it('3PC refuses to assert a decision outside its synchrony and connectivity assumptions', () => {
    for (const phase of ['wait', 'precommit'] as const) for (const crash of [false, true]) expect(threePCOutcome(phase, crash, true)).toBe('outside-model');
    expect(threePCOutcome('wait', true, false)).toBe('abort');
    expect(threePCOutcome('precommit', true, false)).toBe('commit');
    expect(threePCOutcome('wait', false, false)).toBe('commit');
  });
});

describe('CRDT merge laws', () => {
  it('G-counter merge is associative, commutative and idempotent', () => {
    const a = [2,0,4], b = [1,3,2], c = [5,2,0];
    expect(mergeVector(a, a)).toEqual(a);
    expect(mergeVector(a, b)).toEqual(mergeVector(b, a));
    expect(mergeVector(mergeVector(a,b),c)).toEqual(mergeVector(a,mergeVector(b,c)));
    expect(gValue(mergeVector([3,0,0],[0,2,0]))).toBe(5);
    expect(gValue(mergeVector(mergeVector([3,0,0],[0,2,0]),[0,2,0]))).toBe(5);
  });
  it('PN-counter separately merges positive and negative components', () => {
    const a = { p: [3,0], n: [0,0] }, b = { p: [0,0], n: [0,4] }, c = { p: [1,2], n: [1,1] };
    expect(pnValue(mergePN(a,b))).toBe(-1);
    expect(mergePN(a,b)).toEqual(mergePN(b,a));
    expect(mergePN(a,a)).toEqual(a);
    expect(mergePN(mergePN(a,b),c)).toEqual(mergePN(a,mergePN(b,c)));
  });
  it('OR-set remove covers observed tags but preserves an unseen concurrent add', () => {
    const removeA = { adds: ['A1'], removed: ['A1'] }, addB = { adds: ['A1','B1'], removed: [] };
    expect(orPresent(mergeOR(removeA,addB))).toBe(true);
    expect(orPresent(mergeOR({ adds:['A1','B1'], removed:['A1','B1'] },addB))).toBe(false);
    expect(mergeOR(removeA,addB)).toEqual(mergeOR(addB,removeA));
    expect(mergeOR(removeA,removeA)).toEqual(removeA);
    const c = { adds: ['C1'], removed: [] };
    expect(mergeOR(mergeOR(removeA,addB),c)).toEqual(mergeOR(removeA,mergeOR(addB,c)));
  });
  it('LWW merges deterministically by timestamp then replica ID, without a real-time guarantee', () => {
    const a = { value:'a', timestamp:10, id:'A' }, b = { value:'b', timestamp:10, id:'B' }, skewed = { value:'b', timestamp:8, id:'B' };
    expect(mergeLWW(a,b)).toEqual(b);
    expect(mergeLWW(b,a)).toEqual(b);
    expect(mergeLWW(a,a)).toEqual(a);
    expect(mergeLWW(a,skewed)).toEqual(a);
  });
});

describe('Consistency and impossibility illustrations', () => {
  it('linearizability allows overlapping old reads but rejects old reads after a completed write', () => {
    const write = { id:'W', kind:'write' as const, value:1, start:1, end:4 };
    expect(linearizeRegister([write,{ id:'R',kind:'read',value:0,start:2,end:6 }])).toEqual(['R','W']);
    expect(linearizeRegister([write,{ id:'R',kind:'read',value:1,start:2,end:6 }])).toEqual(['W','R']);
    expect(linearizeRegister([write,{ id:'R',kind:'read',value:0,start:5,end:6 }])).toBeUndefined();
    expect(linearizeRegister([write,{ id:'R',kind:'read',value:1,start:5,end:6 }])).toEqual(['W','R']);
  });
  it('an already-sent FLP example message may arrive after the sender crashes', () => {
    for (const crashed of [false, true]) {
      const trace = simulateDistributed('flp', { crashed, deliver:true })!;
      expect(trace.frames[3].metrics?.find(m => m.label.en === 'Already-sent message delivered')?.value).toBe('✓');
      expect(trace.frames[3].nodes.find(n => n.id === 'A')?.value).toBe('0');
    }
  });
});

describe('Distributed teaching traces', () => {
  it('all 33 lessons have deterministic bilingual frames and valid bounded geometry', () => {
    expect(distributedLessons).toHaveLength(33);
    expect(new Set(distributedLessons.map(l => l.id)).size).toBe(33);
    for (const lesson of distributedLessons) {
      const params = defaultsFor(lesson), trace = simulateDistributed(lesson.id, params)!;
      expect(trace, lesson.id).toBeDefined();
      expect(trace).toEqual(simulateDistributed(lesson.id, params));
      expect(trace.frames.length).toBeGreaterThanOrEqual(5);
      expect(trace.frames.length).toBeLessThanOrEqual(8);
      expect(lesson.controls.length).toBeGreaterThanOrEqual(2);
      expect(lesson.controls.length).toBeLessThanOrEqual(3);
      expect(lesson.sources.length).toBeGreaterThan(0);
      for (const scene of trace.frames) {
        expect(scene.title.en.length).toBeGreaterThan(0); expect(scene.title.tr.length).toBeGreaterThan(0);
        expect(scene.description.en.length).toBeGreaterThan(0); expect(scene.description.tr.length).toBeGreaterThan(0);
        const ids = new Set(scene.nodes.map(n => n.id));
        expect(ids.size, lesson.id).toBe(scene.nodes.length);
        for (const link of scene.links) { expect(ids.has(link.from), lesson.id + '/' + link.from).toBe(true); expect(ids.has(link.to), lesson.id + '/' + link.to).toBe(true); }
        for (const id of scene.focus ?? []) expect(ids.has(id), lesson.id + '/' + id).toBe(true);
        for (const node of scene.nodes) {
          expect(node.label.length, lesson.id).toBeLessThanOrEqual(10); expect((node.value ?? '').length, lesson.id).toBeLessThanOrEqual(22);
          expect(node.position[0]).toBeGreaterThanOrEqual(-6); expect(node.position[0]).toBeLessThanOrEqual(6);
          expect(node.position[1]).toBeGreaterThanOrEqual(0); expect(node.position[1]).toBeLessThanOrEqual(4);
          expect(node.position[2]).toBeGreaterThanOrEqual(-6); expect(node.position[2]).toBeLessThanOrEqual(6);
        }
      }
    }
  });
  it('each control changes actual scene state or computed metrics', () => {
    for (const lesson of distributedLessons) {
      const defaults = defaultsFor(lesson);
      const visual = (params: Params) => JSON.stringify(simulateDistributed(lesson.id, params)!.frames.map(f => ({ nodes:f.nodes, links:f.links, metrics:f.metrics })));
      for (const control of lesson.controls) {
        const alternative = control.kind === 'range' ? control.default === control.min ? control.max : control.min : control.kind === 'toggle' ? !control.default : control.kind === 'text' ? 'changed' : control.options.find(o => o.value !== control.default)!.value;
        expect(visual({ ...defaults, [control.id]:alternative }), lesson.id + '/' + control.id).not.toBe(visual(defaults));
      }
    }
  });
});
