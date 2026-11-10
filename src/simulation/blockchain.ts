import { bi as b, type Frame, type Localized, type Metric, type NodeKind, type Params, type SimulationTrace, type Simulator, type Status, type VisualLink, type VisualNode } from '../types';
import { bool, clamp, connect, frame, metric, num, ringPosition, rng, str } from './helpers';

type Pair = [string, string];
const N = (id: string, label: string, x: number, z: number, kind: NodeKind = 'block', value = '', status: Status = 'idle', y = 0): VisualNode => ({ id, label, position: [x, y, z], kind, value, status });
const F = (title: Pair, description: Pair, nodes: VisualNode[], links: VisualLink[] = [], metrics: Metric[] = [], focus: string[] = [], note?: Localized): Frame => frame(b(...title), b(...description), nodes, links, { metrics, focus, note });
const T = (frames: Frame[], en: string, tr: string): SimulationTrace => ({ frames, outcome: b(en, tr) });
const short = (hash: string) => hash.slice(0, 8);
const int = (p: Params, key: string, fallback: number, min: number, max: number) => Math.round(clamp(num(p, key, fallback), min, max));
const linksOf = (ns: VisualNode[], status: Status = 'idle') => ns.slice(1).map((n, i) => connect(ns[i].id, n.id, status));
const mark = (ns: VisualNode[], ids: string[], status: Status): VisualNode[] => ns.map(n => ({ ...n, status: ids.includes(n.id) ? status : n.status }));
const center = (label = 'B', value = '') => N('center', label, 0, 0, 'block', value);
const validators = (count = 4, radius = 3.8): VisualNode[] => Array.from({ length: count }, (_, i) => ({ id: `v${i}`, label: String.fromCharCode(65 + i), position: ringPosition(i, count, radius), kind: 'node', status: 'idle' }));
const allTo = (ns: VisualNode[], to: string, status: Status = 'active') => ns.map(n => connect(n.id, to, status));
const ringLinks = (ns: VisualNode[]) => ns.map((n, i) => connect(n.id, ns[(i + 1) % ns.length].id, 'muted'));

/** FIPS 180-4 SHA-256, synchronous so traces are reproducible in browsers and tests. */
export function sha256(input: string | Uint8Array): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const length = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(length);
  padded.set(bytes); padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = bytes.length * 8;
  view.setUint32(length - 8, Math.floor(bits / 0x100000000), false);
  view.setUint32(length - 4, bits >>> 0, false);
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rotate = (x: number, r: number) => (x >>> r) | (x << (32 - r));
  const w = new Uint32Array(64);
  for (let offset = 0; offset < length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotate(w[i - 15], 7) ^ rotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotate(w[i - 2], 17) ^ rotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, bb, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + s1 + ch + K[i] + w[i]) >>> 0;
      const s0 = rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22);
      const maj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (s0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    [a,bb,c,d,e,f,g,h].forEach((v, i) => H[i] = (H[i] + v) >>> 0);
  }
  return H.map(n => n.toString(16).padStart(8, '0')).join('');
}
export const hashLeaf = (value: string) => sha256(`L:${value}`);
export const hashPair = (left: string, right: string) => sha256(`N:${left}${right}`);
export interface ProofStep { hash: string; left: boolean }
export function merkleLevels(values: string[]): string[][] {
  if (!values.length) throw new Error('A Merkle tree needs at least one leaf.');
  const levels = [values.map(hashLeaf)];
  while (levels.at(-1)!.length > 1) {
    const previous = levels.at(-1)!;
    levels.push(Array.from({ length: Math.ceil(previous.length / 2) }, (_, i) => hashPair(previous[i * 2], previous[i * 2 + 1] ?? previous[i * 2])));
  }
  return levels;
}
export function merkleProof(values: string[], index: number): ProofStep[] {
  if (!Number.isInteger(index) || index < 0 || index >= values.length) throw new Error('Invalid leaf index.');
  const levels = merkleLevels(values), proof: ProofStep[] = [];
  for (let l = 0, i = index; l < levels.length - 1; l++, i = Math.floor(i / 2)) {
    proof.push({ hash: levels[l][i ^ 1] ?? levels[l][i], left: i % 2 === 1 });
  }
  return proof;
}
export function verifyMerkle(value: string, proof: ProofStep[], root: string): boolean {
  let hash = hashLeaf(value);
  for (const sibling of proof) hash = sibling.left ? hashPair(sibling.hash, hash) : hashPair(hash, sibling.hash);
  return hash === root;
}
function treeVisual(levels: string[][]): { nodes: VisualNode[]; links: VisualLink[] } {
  const nodes: VisualNode[] = [], links: VisualLink[] = [];
  levels.forEach((level, depth) => level.forEach((digest, index) => {
    const x = level.length === 1 ? 0 : (index - (level.length - 1) / 2) * (10 / level.length);
    nodes.push(N(`t${depth}-${index}`, depth === 0 ? `T${index}` : depth === levels.length - 1 ? 'R' : `H${depth}${index}`, x, 2.4 - depth * 1.6, depth === 0 ? 'data' : 'block', short(digest), 'idle', depth * 0.5));
    if (depth > 0) {
      for (const child of [index * 2, index * 2 + 1]) if (child < levels[depth - 1].length) links.push(connect(`t${depth - 1}-${child}`, `t${depth}-${index}`, 'muted'));
    }
  }));
  return { nodes, links };
}
function proofIDs(index: number, depth: number): { path: string[]; siblings: string[] } {
  const path: string[] = [], siblings: string[] = [];
  for (let l = 0, i = index; l < depth; l++, i = Math.floor(i / 2)) {
    path.push(`t${l}-${i}`);
    if (l < depth - 1) siblings.push(`t${l}-${i ^ 1}`);
  }
  return { path, siblings };
}
function hashScene(p: Params): SimulationTrace {
  const message = str(p, 'message', 'hello blockchain');
  const original = new TextEncoder().encode(message), changed = original.length ? original.slice() : new Uint8Array([1]);
  const byte = int(p, 'byte', 0, 0, 12) % Math.max(1, original.length);
  if (original.length) changed[byte] ^= 1;
  const before = sha256(original), after = sha256(changed);
  let difference = 0;
  for (let i = 0; i < 64; i++) {
    let bits = parseInt(before[i], 16) ^ parseInt(after[i], 16);
    while (bits) { difference += bits & 1; bits >>>= 1; }
  }
  const input = N('input', 'M', -4, 0, 'data', message.slice(0, 20) || '∅');
  const gate = N('sha', 'SHA-256', 0, 0, 'gate');
  const words = Array.from({ length: 8 }, (_, i) => N(`h${i}`, `H${i}`, (i % 4 - 1.5) * 2.3, i < 4 ? -2.1 : 2.1, 'data', before.slice(i * 8, i * 8 + 8)));
  const finals = words.map((n, i) => ({ ...n, value: after.slice(i * 8, i * 8 + 8), status: 'warning' as Status }));
  return T([
    F(['A message becomes bytes', 'Mesaj baytlara dönüşür'], ['The exact bytes—not their appearance—are the input.', 'Girdi, görünüş değil tam bayt dizisidir.'], [input], [], [metric('Input bytes', 'Girdi baytı', original.length)]),
    F(['Pass through SHA-256', 'SHA-256’dan geçir'], ['The same bytes always produce the same fingerprint.', 'Aynı baytlar daima aynı parmak izini üretir.'], [input, gate], [connect('input', 'sha')]),
    F(['256 output bits', '256 çıkış biti'], ['Eight words show the full digest, not eight separate hashes.', 'Sekiz sözcük tam özeti gösterir; sekiz ayrı hash değildir.'], words.map(n => ({ ...n, status: 'success' })), [], [metric('Digest bits', 'Özet biti', 256)]),
    F(original.length ? ['Flip one input bit', 'Bir giriş bitini değiştir'] : ['Add one byte to an empty message', 'Boş mesaja bir bayt ekle'], original.length ? [`Byte ${byte} changes from ${original[byte]} to ${changed[byte]}.`, `${byte}. bayt ${original[byte]} yerine ${changed[byte]} olur.`] : ['An empty message has no bit to flip; append the byte 01 instead.', 'Boş mesajda değişecek bit yok; bunun yerine 01 baytını ekle.'], [{ ...input, status: 'warning', value: `${original.length ? original[byte] : '∅'} → ${changed[byte]}` }, gate], [connect('input', 'sha', 'warning')]),
    F(['Compare the fingerprints', 'Parmak izlerini karşılaştır'], ['Many output bits changed. The new digest does not reveal the old message.', 'Çok sayıda çıkış biti değişti. Yeni özet eski mesajı açıklamaz.'], finals, [], [metric('Changed bits', 'Değişen bit', `${difference}/256`, 'warning')]),
  ], original.length ? `${difference} of 256 digest bits changed after one input-bit flip.` : `${difference} of 256 digest bits changed after appending byte 01 to the empty input.`, original.length ? `Tek giriş biti değişince 256 özet bitinin ${difference} tanesi değişti.` : `Boş girdiye 01 baytı eklenince 256 özet bitinin ${difference} tanesi değişti.`);
}
export interface ChainBlock { index: number; data: string; previous: string; hash: string }
export const blockDigest = (index: number, data: string, previous: string) => sha256(JSON.stringify({ index, data, previous }));
export function makeChain(values: string[]): ChainBlock[] {
  return values.reduce<ChainBlock[]>((chain, data, index) => {
    const previous = chain.at(-1)?.hash ?? '0'.repeat(64);
    chain.push({ index, data, previous, hash: blockDigest(index, data, previous) }); return chain;
  }, []);
}
export function validChain(chain: ChainBlock[]): boolean {
  return chain.every((block, i) => block.index === i && block.previous === (chain[i - 1]?.hash ?? '0'.repeat(64)) && block.hash === blockDigest(block.index, block.data, block.previous));
}
function chainScene(p: Params): SimulationTrace {
  const original = makeChain(['Alice pays 2', 'Bob pays 3', 'Carol pays 4', 'Dan pays 5']);
  const edit = int(p, 'edit', 1, 0, 2), data = str(p, 'data', 'Alice pays 9');
  const altered = structuredClone(original); altered[edit].data = data;
  altered[edit].hash = blockDigest(edit, data, altered[edit].previous);
  const repair = bool(p, 'repair');
  const repaired = makeChain(altered.map(x => x.data));
  const visual = (chain: ChainBlock[], showBreak = false) => chain.map((x, i) => N(`b${i}`, `#${i}`, (i - 1.5) * 3, 0, 'block', short(x.hash), showBreak && i > edit ? 'error' : 'idle'));
  const nodes = visual(original), broken = visual(altered, true), final = repair ? visual(repaired).map(n => ({ ...n, status: 'success' as Status })) : broken;
  const changed = original[edit].hash !== altered[edit].hash;
  const healthy = repair || !changed;
  if (!changed) broken.forEach(n => n.status = 'success');
  return T([
    F(['Start with one record', 'Tek kayıtla başla'], ['The first block has a fixed empty predecessor.', 'İlk bloğun öncülü sabit boş değerdir.'], nodes.slice(0, 1)),
    F(['Append, then link', 'Ekle ve bağla'], ['A new block includes the previous block’s hash.', 'Yeni blok, öncekinin hashini içerir.'], nodes.slice(0, 3), linksOf(nodes.slice(0, 3), 'active')),
    F(['A chain of commitments', 'Bağlı taahhütler'], ['Every stored link agrees with its predecessor.', 'Saklanan her bağlantı, önceki blokla eşleşir.'], nodes, linksOf(nodes, 'success'), [metric('Valid links', 'Geçerli bağlantı', '3/3', 'success')]),
    F(['Edit an earlier block', 'Önceki bloğu değiştir'], ['Rehashing that block leaves the next block pointing to the old hash.', 'Bu bloğu yeniden hashlemek, sonraki bloğu eski hashe bağlı bırakır.'], mark(broken, [`b${edit}`], 'warning'), linksOf(broken).map((l, i) => ({ ...l, status: i === edit && changed ? 'error' : 'success' })), [metric('Changed block', 'Değişen blok', `#${edit}`)]),
    F(repair ? ['Recompute the descendants', 'Sonraki blokları yeniden hesapla'] : ['The mismatch stays visible', 'Uyumsuzluk görünür kalır'], repair ? ['Local hashes now agree again. No network has accepted this rewritten history.', 'Yerel hashler yeniden eşleşir. Hiçbir ağ bu yeni geçmişi kabul etmiş değildir.'] : ['A changed predecessor makes the stored chain invalid.', 'Değişen öncül, saklanan zinciri geçersiz yapar.'], final, linksOf(final, healthy ? 'success' : 'error'), [metric('Local chain valid', 'Yerel zincir geçerli', healthy ? '✓' : '✕', healthy ? 'success' : 'error')]),
  ], healthy ? 'Local integrity holds; network agreement is a separate question.' : 'The rewritten block breaks the next stored hash link.', healthy ? 'Yerel bütünlük sağlandı; ağ uzlaşısı ayrı bir sorudur.' : 'Yeniden yazılan blok, sonraki hash bağlantısını bozdu.');
}
function merkleScene(p: Params, sparse = false): SimulationTrace {
  const selected = int(p, sparse ? 'key' : 'leaf', sparse ? 3 : 2, 0, 7);
  const inserted = bool(p, 'insert');
  const values = sparse ? Array.from({ length: 8 }, (_, i) => i === 1 || i === 6 || (inserted && i === selected) ? `${i}:42` : '') : Array.from({ length: 8 }, (_, i) => `T${i}:${i === selected ? str(p, 'payload', 'pay 5') : `pay ${i + 1}`}`);
  const levels = merkleLevels(values), root = levels.at(-1)![0], proof = merkleProof(values, selected);
  if (bool(p, 'tamper')) proof[0].hash = '0'.repeat(64);
  const valid = verifyMerkle(values[selected], proof, root), empty = values[selected] === '';
  const { nodes, links } = treeVisual(levels), { path, siblings } = proofIDs(selected, levels.length);
  const highlighted = nodes.map(n => ({ ...n, status: path.includes(n.id) ? 'active' as Status : siblings.includes(n.id) ? 'warning' as Status : 'muted' as Status }));
  if (sparse) nodes.filter(n => n.id.startsWith('t0')).forEach((n, i) => { n.value = values[i] || '∅'; n.label = i.toString(2).padStart(3, '0'); });
  const proofNodes = highlighted.filter(n => path.includes(n.id) || siblings.includes(n.id));
  if (bool(p, 'tamper')) { const corrupt = proofNodes.find(n => n.id === siblings[0]); if (corrupt) { corrupt.value = '00000000'; corrupt.status = 'error'; } }
  return T([
    F(sparse ? ['A tiny key space', 'Küçük bir anahtar uzayı'] : ['Eight transactions', 'Sekiz işlem'], sparse ? ['Most leaves are empty; identical empty hashes can be reused.', 'Çoğu yaprak boştur; aynı boş hashler yeniden kullanılır.'] : ['Each leaf gets its own hash before pairing.', 'Eşleştirmeden önce her yaprak kendi hashini alır.'], nodes.filter(n => n.id.startsWith('t0'))),
    F(['Combine neighboring hashes', 'Komşu hashleri birleştir'], ['Hash left and right in order. The order matters.', 'Sol ve sağı sırasıyla hashle. Sıra önemlidir.'], nodes.filter(n => /^t[01]-/.test(n.id)), links.filter(l => l.to.startsWith('t1')).map(l => ({ ...l, status: 'active' }))),
    F(['One root commits to everything', 'Tek kök her şeyi bağlar'], ['Changing a leaf changes the hashes along its path to the root.', 'Bir yaprağın değişimi, köke giden yoldaki hashleri değiştirir.'], nodes, links, [metric('Root', 'Kök', short(root))], [`t${levels.length - 1}-0`]),
    F(sparse ? ['Follow the key bits', 'Anahtar bitlerini izle'] : ['Keep only the sibling path', 'Yalnızca kardeş yolunu tut'], sparse ? [`Key ${selected.toString(2).padStart(3, '0')} routes to ${empty ? 'an empty' : 'a filled'} leaf.`, `${selected.toString(2).padStart(3, '0')} anahtarı ${empty ? 'boş' : 'dolu'} yaprağa gider.`] : ['Three sibling hashes replace the seven other transactions.', 'Üç kardeş hash, diğer yedi işlemin yerini alır.'], highlighted, links.map(l => ({ ...l, status: path.includes(l.to) ? 'active' : 'muted' })), [metric('Sibling hashes', 'Kardeş hash', proof.length)]),
    F(['Recompute from the leaf', 'Yapraktan yeniden hesapla'], ['The verifier uses the leaf and ordered siblings to rebuild a candidate root.', 'Doğrulayıcı, yaprak ve sıralı kardeşlerle aday kökü hesaplar.'], proofNodes, links.filter(l => proofNodes.some(n => n.id === l.from) && proofNodes.some(n => n.id === l.to)).map(l => ({ ...l, status: 'active' }))),
    F(valid ? ['The roots match', 'Kökler eşleşti'] : ['The proof fails', 'Kanıt başarısız'], valid ? sparse ? [empty ? 'This empty leaf proves absence under this root.' : 'This filled leaf proves membership under this root.', empty ? 'Bu boş yaprak, bu kök altında yokluğu kanıtlar.' : 'Bu dolu yaprak, bu kök altında üyeliği kanıtlar.'] : ['Membership is verified. Transaction validity is a separate check.', 'Üyelik doğrulandı. İşlemin geçerliliği ayrı kontroldür.'] : ['A changed sibling makes the computed root disagree.', 'Değişen kardeş, hesaplanan kökü farklılaştırır.'], proofNodes.map(n => ({ ...n, status: valid ? 'success' : 'error' })), [], [metric('Proof accepted', 'Kanıt kabulü', valid ? '✓' : '✕', valid ? 'success' : 'error')]),
  ], valid ? sparse && empty ? 'Absence is authenticated by an empty leaf under the root.' : 'The inclusion proof matches the trusted root.' : 'The corrupted proof does not match the root.', valid ? sparse && empty ? 'Yokluk, kök altındaki boş yaprakla doğrulandı.' : 'Üyelik kanıtı güvenilen kökle eşleşiyor.' : 'Bozulmuş kanıt kökle eşleşmiyor.');
}
interface Radix { id: string; prefix: string; type: 'leaf' | 'extension' | 'branch'; value?: number; children: Radix[]; digest: string }
export function buildRadix(entries: [string, number][], prefix = ''): Radix {
  const sorted = [...entries].sort(([a], [bb]) => a.localeCompare(bb));
  if (sorted.length === 1) {
    const [key, value] = sorted[0]; return { id: `leaf-${key}`, prefix: key.slice(prefix.length), type: 'leaf', value, children: [], digest: sha256(JSON.stringify(['leaf', key.slice(prefix.length), value])) };
  }
  let shared = prefix.length;
  while (sorted.every(([key]) => key[shared] === sorted[0][0][shared]) && shared < sorted[0][0].length) shared++;
  if (shared > prefix.length) {
    const child = buildRadix(sorted, sorted[0][0].slice(0, shared));
    return { id: `ext-${prefix || 'r'}`, prefix: sorted[0][0].slice(prefix.length, shared), type: 'extension', children: [child], digest: sha256(JSON.stringify(['ext', sorted[0][0].slice(prefix.length, shared), child.digest])) };
  }
  const groups = new Map<string, [string, number][]>();
  sorted.forEach(entry => { const digit = entry[0][prefix.length]; groups.set(digit, [...(groups.get(digit) ?? []), entry]); });
  const children = [...groups].map(([digit, group]) => buildRadix(group, prefix + digit));
  return { id: `branch-${prefix || 'r'}`, prefix, type: 'branch', children, digest: sha256(JSON.stringify(['branch', [...groups.keys()], children.map(c => c.digest)])) };
}
function radixVisual(root: Radix): { nodes: VisualNode[]; links: VisualLink[] } {
  const levels: Radix[][] = []; const walk = (n: Radix, depth: number) => { (levels[depth] ??= []).push(n); n.children.forEach(c => walk(c, depth + 1)); }; walk(root, 0);
  const nodes: VisualNode[] = [], links: VisualLink[] = [];
  levels.forEach((level, depth) => level.forEach((n, i) => { nodes.push(N(n.id, n.type === 'leaf' ? `0x${n.id.slice(5)}` : n.type === 'extension' ? `0x${n.prefix}` : `B${depth}`, (i - (level.length - 1) / 2) * Math.min(2.7, 10 / level.length), -3 + depth * 1.8, n.type === 'leaf' ? 'data' : 'block', n.type === 'leaf' ? String(n.value) : short(n.digest), 'idle', Math.max(0, 1.8 - depth * 0.4))); n.children.forEach(c => links.push(connect(n.id, c.id, 'muted'))); }));
  return { nodes, links };
}
function trieScene(p: Params): SimulationTrace {
  const cleaned = str(p, 'key', 'ab9').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 3).padEnd(3, '0');
  const key = bool(p, 'update') ? 'ab1' : cleaned, value = int(p, 'value', 42, 1, 99);
  const initial: [string, number][] = [['ab1', 12], ['abf', 25]];
  const map = new Map(initial); map.set(key, value);
  const first = buildRadix(initial), next = buildRadix([...map]), oldV = radixVisual(first), newV = radixVisual(next);
  const path: string[] = [];
  const visit = (n: Radix): boolean => { if (n.id === `leaf-${key}` || n.children.some(visit)) { path.push(n.id); return true; } return false; }; visit(next);
  const changed = first.digest !== next.digest;
  return T([
    F(['Keys share a route', 'Anahtarlar bir yolu paylaşır'], ['Keys ab1 and abf share the prefix ab.', 'ab1 ve abf anahtarları ab önekini paylaşır.'], initial.map(([k, v], i) => N(`leaf-${k}`, `0x${k}`, i * 4 - 2, 1, 'data', String(v)))),
    F(['Compress the shared prefix', 'Ortak öneki sıkıştır'], ['An extension stores ab once; a branch separates the last digits.', 'Uzantı ab’yi bir kez tutar; dal son haneleri ayırır.'], oldV.nodes, oldV.links),
    F(['Insert or update a key', 'Anahtar ekle veya güncelle'], [`The normalized key is ${key}; its value is ${value}.`, `Düzenlenen anahtar ${key}; değeri ${value}.`], mark(newV.nodes, [`leaf-${key}`], 'active'), newV.links, [metric('Key', 'Anahtar', `0x${key}`)]),
    F(['Follow only the relevant path', 'Yalnızca ilgili yolu izle'], ['A lookup follows shared prefixes and branch digits.', 'Arama, ortak önekleri ve dal hanelerini izler.'], newV.nodes.map(n => ({ ...n, status: path.includes(n.id) ? 'active' : 'muted' })), newV.links.map(l => ({ ...l, status: path.includes(l.from) && path.includes(l.to) ? 'active' : 'muted' }))),
    F(['Changes reach the root', 'Değişiklik köke ulaşır'], ['The authenticated root is recomputed from the changed path.', 'Doğrulanmış kök, değişen yoldan yeniden hesaplanır.'], mark(newV.nodes, path, 'success'), newV.links, [metric('Root', 'Kök', short(next.digest)), metric('Root changed', 'Kök değişti', changed ? '✓' : '—', changed ? 'success' : 'idle')]),
  ], `Key ${key} is stored with value ${value}; root ${short(next.digest)}.`, `${key} anahtarı ${value} değeriyle saklandı; kök ${short(next.digest)}.`);
}

function signatureScene(p: Params): SimulationTrace {
  const message = str(p, 'message', 'pay Bob 5'), tamper = bool(p, 'tamper'), wrongKey = bool(p, 'wrongKey'), accepted = !tamper && !wrongKey;
  const nodes = [N('alice', 'A', -4.5, 0, 'node'), N('sk', 'SK-A', -4.5, -2, 'token', '••••'), N('message', 'M', -1.5, 0, 'data', message.slice(0, 20)), N('sig', 'σ-A', -1.5, 2, 'token'), N('verifier', 'V', 3, 0, 'gate'), N('pk', wrongKey ? 'PK-B' : 'PK-A', 3, -2, 'token')];
  const delivered = nodes.map(n => n.id === 'message' && tamper ? { ...n, value: 'M ≠ M′', status: 'warning' as Status } : n);
  const note = b('Structural model: no elliptic-curve signing or verification runs here.', 'Yapısal model: burada eliptik eğri imzalama veya doğrulama çalışmaz.');
  return T([
    F(['Two keys, different roles', 'İki anahtar, farklı görevler'], ['Alice keeps her private key. The verifier knows a public key.', 'Alice özel anahtarını saklar. Doğrulayıcı açık anahtarı bilir.'], mark(nodes, ['sk', 'pk'], 'active'), [connect('sk', 'alice'), connect('pk', 'verifier')], [], ['sk', 'pk'], note),
    F(['Bind a signature to a message', 'İmzayı mesaja bağla'], ['The message and private key determine the signature in a real scheme.', 'Gerçek bir şemada mesaj ve özel anahtar imzayı belirler.'], mark(nodes, ['message', 'sig'], 'active'), [connect('sk', 'sig'), connect('message', 'sig')]),
    F(['Send the public evidence', 'Açık kanıtı gönder'], ['Only the message and signature travel to the verifier.', 'Doğrulayıcıya yalnızca mesaj ve imza gider.'], delivered, [connect('message', 'verifier', tamper ? 'warning' : 'active'), connect('sig', 'verifier')]),
    F(['Check with a public key', 'Açık anahtarla kontrol et'], [tamper ? 'The received message differs from the signed message.' : wrongKey ? 'This public key does not belong to Alice.' : 'The modeled signature, message and public key match.', tamper ? 'Alınan mesaj, imzalanan mesajdan farklı.' : wrongKey ? 'Bu açık anahtar Alice’e ait değil.' : 'Modelde imza, mesaj ve açık anahtar eşleşiyor.'], mark(delivered, ['pk', 'verifier'], accepted ? 'success' : 'error'), [connect('pk', 'verifier', wrongKey ? 'error' : 'active'), connect('sig', 'verifier', accepted ? 'success' : 'error')]),
    F([accepted ? 'The modeled check passes' : 'The modeled check fails', accepted ? 'Modelde kontrol başarılı' : 'Modelde kontrol başarısız'], ['A valid signature authenticates a message; it does not hide its contents.', 'Geçerli imza mesajı doğrular; içeriğini gizlemez.'], mark(delivered, ['verifier'], accepted ? 'success' : 'error'), [connect('message', 'verifier', accepted ? 'success' : 'error')], [metric('Model accepted', 'Model kabulü', accepted ? '✓' : '✕', accepted ? 'success' : 'error')], ['verifier'], note),
  ], accepted ? 'The matching message and public key pass the structural signature check.' : 'A changed message or wrong public key fails the structural check.', accepted ? 'Eşleşen mesaj ve açık anahtar yapısal imza kontrolünü geçti.' : 'Değişen mesaj veya yanlış açık anahtar yapısal kontrolden geçemedi.');
}

export function modPow(base: number, power: number, modulus: number): number {
  let result = 1; base %= modulus;
  while (power > 0) { if (power % 2 === 1) result = result * base % modulus; base = base * base % modulus; power = Math.floor(power / 2); }
  return result;
}
export function schnorrToy(secret: number, message: string, wrong = false, interactiveChallenge?: number) {
  const q = 11, p = 23, g = 2, nonce = 7, publicKey = modPow(g, secret, p), commitment = modPow(g, nonce, p);
  const challenge = interactiveChallenge === undefined ? parseInt(sha256(`${commitment}|${publicKey}|${message}`).slice(0, 8), 16) % q : interactiveChallenge % q;
  const response = (nonce + challenge * secret + (wrong ? 1 : 0)) % q;
  const left = modPow(g, response, p), right = commitment * modPow(publicKey, challenge, p) % p;
  return { q, p, g, nonce, publicKey, commitment, challenge, response, left, right, valid: left === right };
}
function schnorrScene(p: Params, interactive = false): SimulationTrace {
  const secret = int(p, 'secret', 4, 1, 10), wrong = bool(p, interactive ? 'falseResponse' : 'tamper');
  const result = schnorrToy(secret, str(p, 'message', 'send 5'), wrong, interactive ? int(p, 'challenge', 3, 1, 10) : undefined);
  const nodes = [N('prover', 'P', -4, 0, 'node', `x=${secret}`), N('commit', 'R', -1.5, -1.8, 'token', String(result.commitment)), N('challenge', 'e', 1.3, -1.8, 'token', String(result.challenge)), N('response', 's', -1.5, 1.8, 'token', String(result.response)), N('public', 'Y', 1.3, 1.8, 'token', String(result.publicKey)), N('verifier', 'V', 4, 0, 'gate')];
  const note = b('Insecure toy group: p=23, q=11, g=2 and a fixed teaching nonce. Never use this for security.', 'Güvensiz oyuncak grup: p=23, q=11, g=2 ve sabit öğretim nonce’u. Güvenlik için kullanılmaz.');
  return T([
    F(['A public value from a secret', 'Sırdan açık bir değer'], ['The prover knows x; the public value is Y = gˣ mod p.', 'Kanıtlayan x’i bilir; açık değer Y = gˣ mod p.'], mark(nodes, ['prover', 'public'], 'active'), [connect('prover', 'public')], [metric('Public value Y', 'Açık değer Y', result.publicKey)], ['public'], note),
    F(['Commit before the challenge', 'Sorudan önce taahhüt et'], ['R = gʳ mod p commits to the nonce r.', 'R = gʳ mod p, r nonce’una taahhüt verir.'], mark(nodes, ['commit'], 'active'), [connect('prover', 'commit'), connect('commit', 'verifier')], [metric('Commitment R', 'Taahhüt R', result.commitment)]),
    F([interactive ? 'The verifier sends a challenge' : 'Hash a challenge from the transcript', interactive ? 'Doğrulayıcı soru gönderir' : 'Soru değerini kaydın hashinden üret'], [interactive ? 'The challenge e arrives only after R is committed.' : 'The toy hash binds R, Y and the message into e.', interactive ? 'e sorusu ancak R taahhüdünden sonra gelir.' : 'Örnek hash, R, Y ve mesajı e değerine bağlar.'], mark(nodes, ['challenge'], 'active'), [connect(interactive ? 'verifier' : 'commit', 'challenge'), connect('challenge', 'prover')], [metric('Challenge e', 'Soru e', result.challenge)]),
    F(['Answer using the secret', 'Sırla yanıtla'], ['The honest response is s = r + e·x mod q.', 'Dürüst yanıt s = r + e·x mod q.'], mark(nodes, ['response'], wrong ? 'warning' : 'active'), [connect('prover', 'response'), connect('response', 'verifier')], [metric('Response s', 'Yanıt s', result.response)]),
    F(['Compare two sides', 'İki tarafı karşılaştır'], ['The verifier checks gˢ = R·Yᵉ mod p without receiving x.', 'Doğrulayıcı x’i almadan gˢ = R·Yᵉ mod p eşitliğini kontrol eder.'], mark(nodes, ['verifier'], result.valid ? 'success' : 'error'), [connect('response', 'verifier'), connect('public', 'verifier'), connect('commit', 'verifier')], [metric('gˢ mod p', 'gˢ mod p', result.left), metric('R·Yᵉ mod p', 'R·Yᵉ mod p', result.right)]),
    F([result.valid ? 'The relation holds' : 'The relation fails', result.valid ? 'Bağıntı sağlanıyor' : 'Bağıntı sağlanmıyor'], ['The arithmetic is real; these tiny parameters offer no privacy or security.', 'Aritmetik gerçek; bu küçük parametreler gizlilik veya güvenlik sağlamaz.'], mark(nodes, ['verifier'], result.valid ? 'success' : 'error'), [connect('response', 'verifier', result.valid ? 'success' : 'error')], [metric('Equation valid', 'Eşitlik geçerli', result.valid ? '✓' : '✕', result.valid ? 'success' : 'error')], ['verifier'], note),
  ], result.valid ? 'Both sides match in the deliberately insecure teaching group.' : 'Changing the response breaks the verification equation.', result.valid ? 'Özellikle güvensiz seçilen öğretim grubunda iki taraf eşleşti.' : 'Yanıtı değiştirmek doğrulama eşitliğini bozdu.');
}
function blsScene(p: Params): SimulationTrace {
  const count = int(p, 'signers', 4, 2, 6), invalid = bool(p, 'invalid'), omit = bool(p, 'omitKey'), accepted = !invalid && !omit;
  const vs = validators(count), sigs = vs.map((_, i) => N(`s${i}`, `σ${i + 1}`, (i - (count - 1) / 2) * 1.7, 0, 'token', '', invalid && i === 0 ? 'error' : 'active'));
  const aggregate = center('Σσ', `${count} σ`), verifier = N('verify', 'V', 4.5, 0, 'gate');
  const note = b('Structure only: no BLS curve, subgroup checks or pairing is computed.', 'Yalnızca yapı: BLS eğrisi, alt grup kontrolü veya eşleme hesaplanmaz.');
  return T([
    F(['Many independent signers', 'Birçok bağımsız imzalayan'], ['Each signer has a public key and a signature for the modeled message.', 'Her imzalayanın örnek mesaj için açık anahtarı ve imzası var.'], vs, ringLinks(vs), [metric('Signers', 'İmzalayanlar', count)], [], note),
    F(['Collect signature parts', 'İmza parçalarını topla'], ['A bad signature is still bad when placed in a group.', 'Hatalı imza, gruba konunca da hatalıdır.'], [...vs, ...sigs], sigs.map((s, i) => connect(vs[i].id, s.id, invalid && i === 0 ? 'error' : 'active'))),
    F(['Combine into one package', 'Tek pakette birleştir'], ['Aggregation reduces the signature package; signer information is still needed.', 'Birleştirme imza paketini küçültür; imzalayan bilgisi yine gerekir.'], [...vs, ...sigs, { ...aggregate, position: [0, 1.8, 1] }], allTo(sigs, 'center'), [metric('Input signatures', 'Girdi imzaları', count), metric('Aggregate signature', 'Birleşik imza', 1)]),
    F(['Bring the correct public keys', 'Doğru açık anahtarları getir'], [omit ? 'One signer key is missing from the modeled verification input.' : 'All signer keys are included in the modeled verification input.', omit ? 'Model doğrulama girdisinde bir imzalayanın anahtarı eksik.' : 'Model doğrulama girdisinde tüm imzalayanların anahtarı var.'], [...vs.map((v, i) => ({ ...v, status: omit && i === 0 ? 'error' as Status : 'active' as Status })), aggregate, verifier], [...allTo(vs.filter((_, i) => !omit || i > 0), 'verify'), connect('center', 'verify')]),
    F([accepted ? 'The structural check passes' : 'The structural check fails', accepted ? 'Yapısal kontrol başarılı' : 'Yapısal kontrol başarısız'], ['Real deployments also require rogue-key defenses and curve validation.', 'Gerçek sistemler, sahte anahtar saldırısı savunması ve eğri doğrulaması da gerektirir.'], [...vs, aggregate, { ...verifier, status: accepted ? 'success' : 'error' }], [connect('center', 'verify', accepted ? 'success' : 'error')], [metric('Model accepted', 'Model kabulü', accepted ? '✓' : '✕', accepted ? 'success' : 'error')], ['verify'], note),
  ], accepted ? 'One aggregate passes this structural model with all required keys.' : 'A bad signature or missing public key prevents model acceptance.', accepted ? 'Bir birleşik imza, gerekli tüm anahtarlarla yapısal modeli geçti.' : 'Hatalı imza veya eksik açık anahtar model kabulünü engelledi.');
}

export function spendUTXO(utxos: Record<string, number>, inputs: string[], amount: number, fee = 1) {
  if (new Set(inputs).size !== inputs.length || inputs.some(id => !(id in utxos)) || amount < 0 || fee < 0) return { accepted: false, remaining: { ...utxos }, payment: 0, change: 0, reason: 'input' };
  const total = inputs.reduce((sum, id) => sum + utxos[id], 0);
  if (amount + fee > total) return { accepted: false, remaining: { ...utxos }, payment: 0, change: 0, reason: 'funds' };
  const remaining = { ...utxos }; inputs.forEach(id => { delete remaining[id]; });
  const change = total - amount - fee; remaining['tx:0'] = amount; if (change > 0) remaining['tx:1'] = change;
  return { accepted: true, remaining, payment: amount, change, reason: '' };
}
function utxoScene(p: Params): SimulationTrace {
  const amount = int(p, 'amount', 7, 1, 14), second = bool(p, 'secondInput'), spent = bool(p, 'spent');
  const utxos: Record<string, number> = spent ? { u1: 5 } : { u0: 8, u1: 5 }, inputs = second ? ['u0', 'u1'] : ['u0'];
  const result = spendUTXO(utxos, inputs, amount), total = 8 + (second ? 5 : 0);
  const coins = [N('u0', 'U0', -4, -1.7, 'token', '8', spent ? 'error' : 'idle'), N('u1', 'U1', -4, 1.7, 'token', '5', second ? 'idle' : 'muted')], tx = N('tx', 'TX', 0, 0, 'gate', `${amount} + 1`);
  const outputs = [N('out0', 'U2', 4, -2, 'token', String(amount), 'success'), ...(result.change > 0 ? [N('out1', 'U3', 4, 1, 'token', String(result.change), 'success')] : []), N('fee', 'F', 1.5, 3, 'token', '1', 'success')];
  return T([
    F(['Outputs are spendable pieces', 'Çıktılar harcanabilen parçalardır'], ['Each unspent output can be consumed once.', 'Harcanmamış her çıktı bir kez tüketilebilir.'], coins, [], [metric('Selected input value', 'Seçilen girdi değeri', total)]),
    F(['Choose whole inputs', 'Girdileri bütünüyle seç'], ['The transaction names outputs; it cannot spend a fraction of an input.', 'İşlem çıktıları adlandırır; girdinin bir kısmını harcayamaz.'], [...mark(coins, inputs, 'active'), tx], inputs.map(id => connect(id, 'tx'))),
    F(['Validate before changing the set', 'Kümeyi değiştirmeden doğrula'], [result.accepted ? 'All inputs exist, and payment plus fee fits their value.' : spent ? 'U0 is already spent, so this transaction cannot use it.' : 'The selected inputs cannot cover the payment and fee.', result.accepted ? 'Tüm girdiler var; ödeme ve ücret değerlerine sığıyor.' : spent ? 'U0 zaten harcanmış; işlem onu kullanamaz.' : 'Seçilen girdiler ödeme ve ücreti karşılamıyor.'], [...coins, { ...tx, status: result.accepted ? 'success' : 'error' }], inputs.map(id => connect(id, 'tx', result.accepted ? 'success' : 'error'))),
    F([result.accepted ? 'Create new outputs' : 'Keep the UTXO set unchanged', result.accepted ? 'Yeni çıktılar üret' : 'UTXO kümesini değiştirme'], [result.accepted ? 'Payment and change become new outputs; the fee is the remaining difference.' : 'A rejected transaction creates no outputs and consumes no inputs.', result.accepted ? 'Ödeme ve para üstü yeni çıktı olur; kalan fark ücrettir.' : 'Reddedilen işlem çıktı üretmez, girdi tüketmez.'], [...coins, tx, ...(result.accepted ? outputs : [])], result.accepted ? outputs.map(n => connect('tx', n.id, 'success')) : [], [metric('Payment', 'Ödeme', result.payment), metric('Change', 'Para üstü', result.change)]),
    F([result.accepted ? 'The old inputs are consumed' : 'The spend is rejected', result.accepted ? 'Eski girdiler tüketildi' : 'Harcama reddedildi'], [result.accepted ? `${total} = ${amount} + ${result.change} + 1 fee.` : 'Only a valid spend can update the unspent-output set.', result.accepted ? `${total} = ${amount} + ${result.change} + 1 ücret.` : 'Harcanmamış çıktı kümesini yalnızca geçerli harcama günceller.'], [...coins.map(n => ({ ...n, status: result.accepted && inputs.includes(n.id) ? 'muted' as Status : n.status })), { ...tx, status: result.accepted ? 'success' : 'error' }, ...(result.accepted ? outputs : [])], result.accepted ? outputs.map(n => connect('tx', n.id, 'success')) : [], [metric('Accepted', 'Kabul', result.accepted ? '✓' : '✕', result.accepted ? 'success' : 'error'), metric('Unspent outputs', 'Harcanmamış çıktı', Object.keys(result.remaining).length)]),
  ], result.accepted ? `Payment ${amount}, change ${result.change}, fee 1: input value is conserved.` : 'The invalid spend leaves the original UTXO set unchanged.', result.accepted ? `Ödeme ${amount}, para üstü ${result.change}, ücret 1: girdi değeri korundu.` : 'Geçersiz harcama ilk UTXO kümesini değiştirmedi.');
}
export interface AccountState { alice: number; bob: number; nonce: number }
export function transferAccount(state: AccountState, amount: number, nonce: number): { accepted: boolean; state: AccountState } {
  if (nonce !== state.nonce || amount < 0 || amount > state.alice) return { accepted: false, state: { ...state } };
  return { accepted: true, state: { alice: state.alice - amount, bob: state.bob + amount, nonce: state.nonce + 1 } };
}
function accountsScene(p: Params): SimulationTrace {
  const amount = int(p, 'amount', 6, 1, 24), nonce = int(p, 'nonce', 2, 0, 3), replay = bool(p, 'replay'), initial: AccountState = { alice: 20, bob: 5, nonce: 2 };
  const first = transferAccount(initial, amount, nonce), second = transferAccount(first.state, amount, nonce);
  const scene = (state: AccountState, status: Status = 'idle') => [N('alice', 'A', -3.8, 0, 'node', String(state.alice)), N('bob', 'B', 3.8, 0, 'node', String(state.bob)), N('nonce', 'n', -3.8, -2.3, 'token', String(state.nonce)), { ...center('TX', `${amount} · n=${nonce}`), status }];
  return T([
    F(['Balances and a sequence number', 'Bakiyeler ve sıra numarası'], ['Alice has 20, Bob has 5. Alice expects nonce 2.', 'Alice’in 20, Bob’un 5 birimi var. Alice nonce 2’yi bekliyor.'], scene(initial), [connect('nonce', 'alice', 'muted')], [metric('Total balance', 'Toplam bakiye', 25)]),
    F(['Submit the next transfer', 'Sonraki transferi gönder'], ['The transaction carries both an amount and a nonce.', 'İşlem hem tutar hem nonce taşır.'], scene(initial, 'active'), [connect('alice', 'center'), connect('nonce', 'center')]),
    F(['Check funds and order', 'Bakiyeyi ve sırayı kontrol et'], [first.accepted ? 'Funds are sufficient and the nonce is exactly next.' : nonce !== 2 ? 'The nonce is stale or ahead of the expected nonce.' : 'The amount exceeds Alice’s balance.', first.accepted ? 'Bakiye yeterli ve nonce tam beklenen sırada.' : nonce !== 2 ? 'Nonce eski veya beklenen değerden ileride.' : 'Tutar Alice’in bakiyesini aşıyor.'], scene(initial, first.accepted ? 'success' : 'error'), [connect('nonce', 'center', nonce === 2 ? 'success' : 'error')]),
    F([first.accepted ? 'Apply one atomic update' : 'Reject without a partial update', first.accepted ? 'Tek atomik güncelleme uygula' : 'Kısmi güncellemeden reddet'], ['A valid transfer debits Alice, credits Bob, and increments the nonce together.', 'Geçerli transfer Alice’ten düşer, Bob’a ekler ve nonce’u birlikte artırır.'], scene(first.state, first.accepted ? 'success' : 'error'), first.accepted ? [connect('alice', 'center', 'success'), connect('center', 'bob', 'success')] : [], [metric('Alice', 'Alice', first.state.alice), metric('Bob', 'Bob', first.state.bob), metric('Next nonce', 'Sonraki nonce', first.state.nonce)]),
    F([replay ? 'Try the exact same transaction again' : 'Observe the new state', replay ? 'Aynı işlemi yeniden dene' : 'Yeni durumu gözle'], [replay ? 'An accepted transaction cannot succeed again with its old nonce.' : 'The next valid transfer must use the updated nonce.', replay ? 'Kabul edilmiş işlem eski nonce’uyla tekrar başarılı olamaz.' : 'Sonraki geçerli transfer güncellenmiş nonce’u kullanmalı.'], scene(first.state, replay ? 'error' : first.accepted ? 'success' : 'error'), replay ? [connect('center', 'nonce', 'error')] : [], [metric('First accepted', 'İlk kabul', first.accepted ? '✓' : '✕'), metric('Replay accepted', 'Tekrar kabul', replay ? second.accepted ? '✓' : '✕' : '—'), metric('Total balance', 'Toplam bakiye', first.state.alice + first.state.bob)]),
  ], first.accepted ? 'Balances changed together; the incremented nonce prevents the replay.' : 'The balance or nonce check rejected the transfer without changing state.', first.accepted ? 'Bakiyeler birlikte değişti; artan nonce tekrar gönderimi engelledi.' : 'Bakiye veya nonce kontrolü, durumu değiştirmeden transferi reddetti.');
}
function mempoolScene(p: Params): SimulationTrace {
  const delay = int(p, 'delay', 1, 0, 3), capacity = int(p, 'capacity', 2, 1, 3), invalid = bool(p, 'invalid');
  const vs = validators(5), pools = vs.map(() => new Set(['T1', 'T2']));
  const scene = (): VisualNode[] => vs.map((v, i) => ({ ...v, value: [...pools[i]].sort().join(' '), status: pools[i].has('T0') ? 'active' : 'idle' }));
  const frames: Frame[] = [F(['Every peer has a local waiting room', 'Her düğümün yerel bekleme havuzu var'], ['Pending transactions are local observations, not one global pool.', 'Bekleyen işlemler yerel gözlemlerdir; tek küresel havuz yoktur.'], scene(), ringLinks(vs))];
  if (!invalid) pools[0].add('T0');
  frames.push(F([invalid ? 'A rejects the new transaction' : 'A accepts a new transaction', invalid ? 'A yeni işlemi reddeder' : 'A yeni işlemi kabul eder'], ['Peers validate before storing and relaying a transaction.', 'Düğümler işlemi saklamadan ve iletmeden doğrular.'], scene().map((n, i) => i === 0 ? { ...n, status: invalid ? 'error' : 'active' } : n), [], [metric('New transaction accepted', 'Yeni işlem kabulü', invalid ? '✕' : '✓')]));
  if (!invalid) { pools[1].add('T0'); pools[2].add('T0'); if (delay === 0) pools[4].add('T0'); }
  frames.push(F(['Relay to neighboring peers', 'Komşu düğümlere ilet'], ['A validated transaction spreads along network links.', 'Doğrulanan işlem ağ bağlantıları boyunca yayılır.'], scene(), invalid ? [] : [connect('v0', 'v1'), connect('v0', 'v2'), ...(delay === 0 ? [connect('v0', 'v4')] : [])], [metric('Peers with T0', 'T0 bulunan düğüm', pools.filter(s => s.has('T0')).length)]));
  if (!invalid) { pools[3].add('T0'); if (delay <= 1) pools[4].add('T0'); }
  frames.push(F(['Local views can differ', 'Yerel görünümler farklı olabilir'], ['A slow peer may still be missing a transaction others already know.', 'Yavaş düğüm, diğerlerinin bildiği işlemi henüz almamış olabilir.'], scene(), invalid ? [] : [connect('v2', 'v3'), connect('v3', 'v4', delay <= 1 ? 'active' : 'warning')], [metric('Slow peer delay', 'Yavaş düğüm gecikmesi', delay)]));
  if (!invalid && delay <= 2) pools[4].add('T0');
  const selected = [...pools[0]].sort().slice(0, capacity), block = N('block', '#1', 0, 0, 'block', selected.join(' '), 'active');
  frames.push(F(['Choose a bounded batch', 'Sınırlı bir grup seç'], ['This teaching proposer sorts IDs and fills the block capacity.', 'Öğretim üreticisi kimlikleri sıralar ve blok kapasitesini doldurur.'], [...scene(), block], [connect('v0', 'block')], [metric('Included transactions', 'Dahil edilen işlem', selected.length)]));
  if (!invalid) pools.forEach(pool => pool.add('T0'));
  pools.forEach(pool => selected.forEach(tx => pool.delete(tx)));
  frames.push(F(['A block removes included transactions', 'Blok, dahil edilen işlemleri havuzdan çıkarır'], ['Once the block arrives, each peer removes its included transactions.', 'Blok geldiğinde her düğüm, içindeki işlemleri havuzundan çıkarır.'], [...scene(), { ...block, status: 'success' }], vs.map(v => connect('block', v.id, 'success')), [metric('Pending per peer', 'Düğüm başına bekleyen', pools[0].size)]));
  return T(frames, `The block included ${selected.length} transactions; ${pools[0].size} remain pending per peer.`, `Blok ${selected.length} işlem içerdi; düğüm başına ${pools[0].size} işlem bekliyor.`);
}
export function verifyWork(data: string, nonce: number, bits: number): boolean {
  return parseInt(sha256(`${data}|${nonce}`).slice(0, 8), 16) < 2 ** (32 - bits);
}
export function mineNonce(data: string, bits: number, limit = 100000): { nonce: number; hash: string; attempts: number } | undefined {
  for (let nonce = 0; nonce < limit; nonce++) { const hash = sha256(`${data}|${nonce}`); if (parseInt(hash.slice(0, 8), 16) < 2 ** (32 - bits)) return { nonce, hash, attempts: nonce + 1 }; }
  return undefined;
}
function powScene(p: Params): SimulationTrace {
  const data = str(p, 'data', 'block 1'), bits = int(p, 'bits', 7, 4, 10), tamper = bool(p, 'tamper'), found = mineNonce(data, bits), nonce = found?.nonce ?? 99999;
  const finalData = tamper ? `${data}!` : data, accepted = found !== undefined && verifyWork(finalData, nonce, bits);
  const trial = (n: number, input = data, status: Status = 'active') => [N('data', 'M', -4, 0, 'data', input.slice(0, 20)), N('hash', 'SHA256', 0, 0, 'gate', `n=${n}`), N('candidate', 'H', 4, 0, 'block', sha256(`${input}|${n}`).slice(0, 12), status)];
  const edges = [connect('data', 'hash'), connect('hash', 'candidate')];
  return T([
    F(['Set the target first', 'Önce hedefi belirle'], ['A valid hash must fall below the target. Each trial is independent.', 'Geçerli hash hedefin altında kalmalı. Her deneme bağımsızdır.'], trial(0, data, 'idle'), edges, [metric('Required leading zero bits', 'Gerekli baştaki sıfır biti', bits), metric('Chance per trial', 'Deneme başına olasılık', `1 / ${2 ** bits}`)]),
    F(['Try nonce zero', 'Nonce sıfırı dene'], ['Hash the data and nonce together; check the target.', 'Veri ve nonce’u birlikte hashle; hedefi kontrol et.'], trial(0, data, verifyWork(data, 0, bits) ? 'success' : 'warning'), edges, [metric('Nonce', 'Nonce', 0)]),
    F(['Change the nonce and try again', 'Nonce’u değiştir ve yeniden dene'], ['A nearby nonce does not produce a nearby hash.', 'Yakın nonce, yakın hash üretmez.'], trial(1, data, verifyWork(data, 1, bits) ? 'success' : 'warning'), edges, [metric('Nonce', 'Nonce', 1)]),
    F([found ? 'A qualifying hash is found' : 'The teaching search budget is exhausted', found ? 'Hedefe uyan hash bulundu' : 'Öğretim arama bütçesi tükendi'], ['The search really runs SHA-256 with this small target.', 'Arama bu küçük hedefle gerçekten SHA-256 çalıştırır.'], trial(nonce, data, found ? 'success' : 'warning'), edges, [metric('Hashes tried', 'Denenen hash', found?.attempts ?? 100000)]),
    F(['Verify with one hash', 'Tek hash ile doğrula'], [tamper ? 'The data changed after mining. The old nonce must pass the target again.' : 'A verifier recomputes the candidate hash and compares it with the target.', tamper ? 'Veri kazımdan sonra değişti. Eski nonce yeniden hedefi sağlamalı.' : 'Doğrulayıcı aday hashi yeniden hesaplayıp hedefle karşılaştırır.'], trial(nonce, finalData, accepted ? 'success' : 'error'), edges.map(l => ({ ...l, status: accepted ? 'success' : 'error' })), [metric('Proof accepted', 'İspat kabulü', accepted ? '✓' : '✕', accepted ? 'success' : 'error')]),
  ], accepted ? `Nonce ${nonce} passes the real SHA-256 target check.` : 'The supplied candidate does not pass the work check.', accepted ? `Nonce ${nonce}, gerçek SHA-256 hedef kontrolünü geçti.` : 'Verilen aday iş kontrolünü geçemedi.');
}

export function chooseWork(incumbent: number[], challenger: number[]): 'incumbent' | 'challenger' {
  return challenger.reduce((a, n) => a + n, 0) > incumbent.reduce((a, n) => a + n, 0) ? 'challenger' : 'incumbent';
}
function chainworkScene(p: Params): SimulationTrace {
  const count = int(p, 'blocks', 2, 1, 4), work = int(p, 'work', 2, 1, 4), release = bool(p, 'release');
  const orange = [1, 1, 1], blue = Array(count).fill(work) as number[], decision = chooseWork(orange, blue), selected = release && decision === 'challenger' ? 'challenger' : 'incumbent';
  const root = N('g', 'G', -5, 0, 'block', '0', 'success'), as = orange.map((_, i) => N(`a${i}`, `A${i + 1}`, -2.8 + i * 2.2, -2, 'block', `Σ=${i + 1}`)), bs = blue.map((_, i) => N(`b${i}`, `B${i + 1}`, -2.8 + i * 2.2, 2, 'block', `Σ=${(i + 1) * work}`));
  const aEdges = [connect('g', 'a0', 'success'), ...linksOf(as, 'success')], bEdges = [connect('g', 'b0'), ...linksOf(bs, 'active')];
  return T([
    F(['Begin with an accepted branch', 'Kabul edilen dalla başla'], ['The orange branch contains three blocks with one work unit each.', 'Turuncu dalda her biri bir iş birimi olan üç blok var.'], [root, ...mark(as, as.map(n => n.id), 'success')], aEdges, [metric('Orange chainwork', 'Turuncu toplam iş', 3)]),
    F(['A competing branch grows', 'Rakip dal büyür'], ['The blue branch may have fewer blocks with more work per block.', 'Mavi dal daha az, fakat blok başına daha fazla iş içerebilir.'], [root, ...as, ...bs], [...aEdges, ...bEdges], [metric('Blue blocks', 'Mavi blok', count), metric('Work per block', 'Blok başına iş', work)]),
    F(['Add the work, not just the blocks', 'Yalnızca blokları değil işi topla'], ['Compare cumulative work from the common ancestor.', 'Ortak atadan sonraki birikimli işi karşılaştır.'], [root, ...as, ...bs], [...aEdges, ...bEdges], [metric('Orange chainwork', 'Turuncu toplam iş', 3), metric('Blue chainwork', 'Mavi toplam iş', count * work)]),
    F([release ? 'The delayed branch arrives' : 'The delayed branch remains hidden', release ? 'Geciken dal ulaştı' : 'Geciken dal gizli kaldı'], [release ? 'A node can compare a branch only after receiving it.' : 'A node cannot adopt blocks it has not received.', release ? 'Düğüm dalı ancak aldıktan sonra karşılaştırabilir.' : 'Düğüm, almadığı blokları benimseyemez.'], [root, ...as, ...bs.map(n => ({ ...n, status: release ? 'active' as Status : 'muted' as Status }))], [...aEdges, ...bEdges.map(l => ({ ...l, status: release ? 'active' as Status : 'muted' as Status }))]),
    F([selected === 'challenger' ? 'Follow the greater-work branch' : 'Keep the current branch', selected === 'challenger' ? 'Daha çok iş içeren dalı izle' : 'Mevcut dalı koru'], ['This model keeps the incumbent on a tie; block count alone does not decide.', 'Bu model eşitlikte mevcut dalı korur; yalnız blok sayısı karar vermez.'], [root, ...as.map(n => ({ ...n, status: selected === 'incumbent' ? 'success' as Status : 'muted' as Status })), ...bs.map(n => ({ ...n, status: selected === 'challenger' ? 'success' as Status : 'muted' as Status }))], [...aEdges.map(l => ({ ...l, status: selected === 'incumbent' ? 'success' as Status : 'muted' as Status })), ...bEdges.map(l => ({ ...l, status: selected === 'challenger' ? 'success' as Status : 'muted' as Status }))], [metric('Accepted work', 'Kabul edilen iş', selected === 'challenger' ? count * work : 3)]),
  ], selected === 'challenger' ? 'The revealed blue branch wins by cumulative work.' : release ? 'The orange branch stays: blue has no strictly greater work.' : 'The node keeps orange because it has not received blue.', selected === 'challenger' ? 'Görünen mavi dal, birikimli işle kazandı.' : release ? 'Mavi dalın işi daha fazla değil; turuncu dal kaldı.' : 'Düğüm mavi dalı almadığı için turuncu dalı korudu.');
}
export function retargetDifficulty(difficulty: number, observedInterval: number, target = 10): number {
  return difficulty * clamp(target / observedInterval, 0.25, 4);
}
function difficultyScene(p: Params): SimulationTrace {
  const rate = clamp(num(p, 'hashrate', 2), 0.25, 4), difficulty = int(p, 'difficulty', 1, 1, 4), interval = 10 * difficulty / rate, next = retargetDifficulty(difficulty, interval), nextInterval = 10 * next / rate;
  const blocks = Array.from({ length: 4 }, (_, i) => N(`b${i}`, `#${i + 1}`, (i - 1.5) * 2.4, 0, 'block', `${interval.toFixed(1)} s`));
  const clock = N('clock', 'Δt', 0, -2.5, 'clock', '10 s'), gate = N('target', 'D', 0, 2.4, 'gate', `${difficulty} → ${next.toFixed(2)}`);
  return T([
    F(['Choose a target interval', 'Hedef aralığı belirle'], ['The teaching network aims for an expected 10 seconds per block.', 'Öğretim ağı, blok başına beklenen 10 saniyeyi hedefler.'], [clock, blocks[0]], [], [metric('Relative hash rate', 'Göreli hash gücü', rate), metric('Difficulty', 'Zorluk', difficulty)]),
    F(['Mining speed changes the interval', 'Kazım hızı aralığı değiştirir'], ['With more hash rate at the same difficulty, blocks arrive faster on average.', 'Aynı zorlukta daha fazla hash gücü, ortalamada daha hızlı blok getirir.'], [clock, ...blocks.slice(0, 2)], linksOf(blocks.slice(0, 2), 'active'), [metric('Expected interval', 'Beklenen aralık', interval.toFixed(2))]),
    F(['Measure a small window', 'Küçük pencereyi ölç'], ['Compare the observed teaching window with four target intervals.', 'Gözlenen öğretim penceresini dört hedef aralığıyla karşılaştır.'], [clock, ...blocks], linksOf(blocks, 'active'), [metric('Observed window', 'Gözlenen pencere', (interval * 4).toFixed(2)), metric('Target window', 'Hedef pencere', 40)]),
    F(['Retarget with bounded feedback', 'Sınırlı geri beslemeyle ayarla'], ['New difficulty = old difficulty × target / observed, with a ¼× to 4× bound.', 'Yeni zorluk = eski zorluk × hedef / gözlenen; değişim ¼× ile 4× arasında.'], [clock, ...blocks, gate], [connect('clock', 'target'), ...blocks.map(n => connect(n.id, 'target'))], [metric('Next difficulty', 'Sonraki zorluk', next.toFixed(2))]),
    F(['Observe the next expected pace', 'Sonraki beklenen hızı gözle'], ['A single bounded adjustment may not fully restore the target after a large change.', 'Büyük değişimden sonra tek sınırlı ayar hedefi tam yakalayamayabilir.'], [clock, ...blocks.map(n => ({ ...n, value: `${nextInterval.toFixed(1)} s`, status: 'success' as Status })), { ...gate, status: 'success' }], linksOf(blocks, 'success'), [metric('Next expected interval', 'Sonraki beklenen aralık', nextInterval.toFixed(2))]),
  ], `Difficulty becomes ${next.toFixed(2)}; the next expected interval is ${nextInterval.toFixed(2)} seconds.`, `Zorluk ${next.toFixed(2)} olur; sonraki beklenen aralık ${nextInterval.toFixed(2)} saniyedir.`);
}
function spvScene(p: Params): SimulationTrace {
  const leaf = int(p, 'leaf', 3, 0, 7), following = int(p, 'confirmations', 2, 0, 4), tamper = bool(p, 'tamper');
  const values = Array.from({ length: 8 }, (_, i) => `payment:${i}`), root = merkleLevels(values).at(-1)![0], proof = merkleProof(values, leaf);
  if (tamper) proof[1] = { ...proof[1], hash: '0'.repeat(64) };
  const accepted = verifyMerkle(values[leaf], proof, root), peers = [N('full', 'N', -4.5, 0, 'node', '8 TX'), N('light', 'L', 4.5, 0, 'node'), N('payment', `T${leaf}`, 0, 2.5, 'data', values[leaf])];
  const headers = Array.from({ length: following + 1 }, (_, i) => N(`h${i}`, `H${i}`, (i - following / 2) * 1.8, -2.2, 'block', i === 0 ? short(root) : `+${i}`));
  const siblings = proof.map((item, i) => N(`p${i}`, `S${i}`, (i - 1) * 2, 0.8, 'token', short(item.hash), tamper && i === 1 ? 'error' : 'active'));
  return T([
    F(['Ask for one payment', 'Tek ödemeyi sor'], ['The light client wants to check inclusion without receiving all transactions.', 'Hafif istemci tüm işlemleri almadan üyeliği kontrol etmek istiyor.'], peers, [connect('light', 'full')]),
    F(['Receive a chain of headers', 'Başlık zincirini al'], ['A header commits to a transaction root; following headers add confirmations.', 'Başlık, işlem köküne taahhüt verir; sonraki başlıklar onay ekler.'], [...peers, ...headers], [connect('full', 'h0'), ...linksOf(headers, 'active'), connect(headers.at(-1)!.id, 'light')], [metric('Following blocks', 'Sonraki bloklar', following)]),
    F(['Receive only the sibling path', 'Yalnız kardeş yolunu al'], ['For eight leaves, the proof needs three sibling hashes.', 'Sekiz yaprak için kanıt üç kardeş hash gerektirir.'], [...peers, ...headers, ...siblings], siblings.map(n => connect(n.id, 'light')), [metric('Sibling hashes', 'Kardeş hash', proof.length)]),
    F(['Recompute the committed root', 'Taahhüt edilen kökü yeniden hesapla'], ['Hash the payment with the ordered siblings and compare the header root.', 'Ödemeyi sıralı kardeşlerle hashle ve başlık köküyle karşılaştır.'], [...peers, ...headers.map(n => ({ ...n, status: n.id === 'h0' ? accepted ? 'success' as Status : 'error' as Status : 'idle' as Status })), ...siblings], [connect('payment', 'h0', accepted ? 'success' : 'error'), ...siblings.map(n => connect(n.id, 'h0', accepted ? 'success' : 'error'))], [metric('Inclusion proof valid', 'Üyelik kanıtı geçerli', accepted ? '✓' : '✕', accepted ? 'success' : 'error')]),
    F([accepted ? 'Inclusion is established' : 'The inclusion proof fails', accepted ? 'Üyelik gösterildi' : 'Üyelik kanıtı başarısız'], ['Inclusion is not full transaction validation. Header validity and chain selection remain assumptions here.', 'Üyelik, tam işlem doğrulaması değildir. Başlık geçerliliği ve zincir seçimi burada varsayılır.'], [...peers.map(n => n.id === 'light' ? { ...n, status: accepted ? 'success' as Status : 'error' as Status } : n), ...headers, ...siblings], [connect('h0', 'light', accepted ? 'success' : 'error')], [metric('Confirmed descendants', 'Onaylayan sonraki blok', following)]),
  ], accepted ? `The real Merkle proof matches the header; ${following} modeled headers follow it.` : 'The corrupted proof does not match the committed root.', accepted ? `Gerçek Merkle kanıtı başlıkla eşleşti; ardından ${following} örnek başlık geliyor.` : 'Bozuk kanıt taahhüt edilen kökle eşleşmedi.');
}
export function weightedChoice(weights: number[], draw: number): number {
  const total = weights.reduce((sum, weight) => sum + weight, 0), target = clamp(draw, 0, 1 - Number.EPSILON) * total;
  let cumulative = 0; for (let i = 0; i < weights.length; i++) { cumulative += weights[i]; if (target < cumulative) return i; }
  return weights.length - 1;
}
function stakeScene(p: Params): SimulationTrace {
  const weights = [int(p, 'stake', 4, 1, 10), 3, 2, 1], random = rng(int(p, 'seed', 3, 1, 20)), offline = bool(p, 'offline'), draws = Array.from({ length: 12 }, () => random()), winners = draws.map(draw => weightedChoice(weights, draw)), selected = winners[0], total = weights.reduce((sum, n) => sum + n, 0);
  const vs = validators().map((v, i) => ({ ...v, value: String(weights[i]), scale: 0.75 + weights[i] / 14 })), block = center('B', '#1'), counts = weights.map((_, i) => winners.filter(w => w === i).length);
  return T([
    F(['Stake sets the lottery weights', 'Pay, kura ağırlıklarını belirler'], ['These four validators have different amounts of stake.', 'Bu dört doğrulayıcının pay miktarları farklı.'], vs, ringLinks(vs), [metric('Total stake', 'Toplam pay', total), metric('Alice share', 'Alice payı', `${(weights[0] / total * 100).toFixed(1)}%`)]),
    F(['Draw one reproducible random number', 'Tek tekrarlanabilir rastgele sayı çek'], ['The seed fixes the teaching run; real randomness needs protocol safeguards.', 'Tohum öğretim akışını sabitler; gerçek rastgelelik protokol önlemleri gerektirir.'], [...vs, center('r', draws[0].toFixed(4))], allTo(vs, 'center'), [metric('Draw', 'Çekiliş', draws[0].toFixed(4))]),
    F(['Select one proposer', 'Bir üretici seç'], ['The selected stake interval contains the random draw.', 'Rastgele sayı seçilen pay aralığının içinde.'], [...vs.map((v, i) => ({ ...v, status: i === selected ? 'active' as Status : 'muted' as Status })), block], [connect(vs[selected].id, 'center')], [metric('Selected validator', 'Seçilen doğrulayıcı', vs[selected].label)]),
    F([offline ? 'The selected proposer is offline' : 'The proposer broadcasts a block', offline ? 'Seçilen üretici çevrimdışı' : 'Üretici bir blok yayımlar'], [offline ? 'Selection does not guarantee a block. This slot is empty.' : 'Proposal selection alone does not finalize the proposed block.', offline ? 'Seçim blok garantilemez. Bu slot boş kaldı.' : 'Üretici seçimi tek başına önerilen bloğu kesinleştirmez.'], [...vs.map((v, i) => ({ ...v, status: i === selected ? offline ? 'error' as Status : 'success' as Status : 'idle' as Status })), { ...block, value: offline ? '∅' : '#1', status: offline ? 'warning' : 'active' }], offline ? [] : vs.map(v => connect('center', v.id)), [metric('Block produced', 'Blok üretildi', offline ? '✕' : '✓')]),
    F(['Compare twelve selections', 'On iki seçimi karşılaştır'], ['Higher weight raises probability; a short run need not match the exact stake share.', 'Yüksek ağırlık olasılığı artırır; kısa akış pay oranını tam yansıtmayabilir.'], vs.map((v, i) => ({ ...v, value: `${counts[i]} / 12`, status: 'success' as Status })), ringLinks(vs), [metric('Alice selections', 'Alice seçimleri', counts[0]), metric('Slots sampled', 'Örneklenen slot', 12)]),
  ], `Alice was selected ${counts[0]} times in twelve seeded draws. Selection is only one part of PoS.`, `Alice tohumlu on iki kurada ${counts[0]} kez seçildi. Seçim, PoS’un yalnızca bir parçasıdır.`);
}
export interface WeightedVote { target: string; weight: number }
export function ghostWeights(parents: Record<string, string | null>, votes: Record<string, WeightedVote>): Record<string, number> {
  const weights = Object.fromEntries(Object.keys(parents).map(id => [id, 0])) as Record<string, number>;
  for (const vote of Object.values(votes)) { let current: string | null = vote.target; const visited = new Set<string>(); while (current !== null && current in parents && !visited.has(current)) { visited.add(current); weights[current] += vote.weight; current = parents[current]; } }
  return weights;
}
export function ghostHead(parents: Record<string, string | null>, votes: Record<string, WeightedVote>, root = 'g') {
  const weights = ghostWeights(parents, votes), path = [root]; let head = root;
  while (true) { const children = Object.keys(parents).filter(id => parents[id] === head).sort((a, bb) => weights[bb] - weights[a] || a.localeCompare(bb)); if (!children.length) break; head = children[0]; path.push(head); }
  return { head, path, weights };
}
function ghostScene(p: Params): SimulationTrace {
  const weight = int(p, 'weight', 4, 1, 8), vote = str(p, 'vote', 'b1') === 'a2' ? 'a2' : 'b1', move = bool(p, 'move');
  const parents: Record<string, string | null> = { g: null, a1: 'g', a2: 'a1', a3: 'a2', b1: 'g' };
  const oldVotes: Record<string, WeightedVote> = { A: { target: 'a2', weight }, B: { target: 'a2', weight: 2 }, C: { target: 'a1', weight: 1 }, D: { target: 'b1', weight: 2 } };
  const votes = { ...oldVotes, A: { target: move ? vote : 'a2', weight } }, previous = ghostHead(parents, oldVotes), result = ghostHead(parents, votes);
  const nodes = [N('g', 'G', -4.8, 0), N('a1', 'A1', -2.3, -2), N('a2', 'A2', 0.2, -2), N('a3', 'A3', 2.7, -2), N('b1', 'B1', -1, 2.4)], edges = Object.entries(parents).filter(([, parent]) => parent !== null).map(([id, parent]) => connect(parent!, id, 'muted'));
  const weighted = (weights: Record<string, number>) => nodes.map(n => ({ ...n, value: String(weights[n.id]) }));
  return T([
    F(['A tree can contain competing tips', 'Ağaç rakip uçlar içerebilir'], ['The longest-looking branch need not have the most recent voting weight.', 'En uzun görünen dal, en fazla son oy ağırlığına sahip olmayabilir.'], nodes, edges),
    F(['Count one latest vote per validator', 'Doğrulayıcı başına tek son oy say'], ['Each latest vote contributes its weight to the voted block and its ancestors.', 'Her son oy, ağırlığını oy verilen bloğa ve atalarına ekler.'], weighted(previous.weights), edges, [metric('Alice weight', 'Alice ağırlığı', weight), metric('Alice latest vote', 'Alice son oyu', 'A2')]),
    F([move ? 'Replace the old vote' : 'Keep the old vote', move ? 'Eski oyu değiştir' : 'Eski oyu koru'], ['A new latest message replaces the old one; its weight is not added twice.', 'Yeni son mesaj eskisinin yerini alır; ağırlık iki kez eklenmez.'], mark(weighted(result.weights), [votes.A.target], 'active'), edges, [metric('Alice latest vote', 'Alice son oyu', votes.A.target.toUpperCase()), metric('Total vote weight', 'Toplam oy ağırlığı', result.weights.g)]),
    F(['Choose the heaviest child at each fork', 'Her ayrımda en ağır çocuğu seç'], ['Start at the root, compare child subtrees, then descend.', 'Kökten başla, çocuk alt ağaçlarını karşılaştır ve ilerle.'], mark(weighted(result.weights), result.path, 'active'), edges.map(l => ({ ...l, status: result.path.includes(l.from) && result.path.includes(l.to) ? 'active' as Status : 'muted' as Status })), [metric('A subtree', 'A alt ağacı', result.weights.a1), metric('B subtree', 'B alt ağacı', result.weights.b1)]),
    F(['The selected leaf is the head', 'Seçilen yaprak zincir ucudur'], ['This latest-message fork choice does not itself provide finality.', 'Bu son mesaj dal seçimi tek başına kesinleşme sağlamaz.'], mark(weighted(result.weights), [result.head], 'success'), edges.map(l => ({ ...l, status: result.path.includes(l.from) && result.path.includes(l.to) ? 'success' as Status : 'muted' as Status })), [metric('Selected head', 'Seçilen uç', result.head.toUpperCase())]),
  ], `The head is ${result.head.toUpperCase()}, found by descending the latest-vote weights.`, `Son oy ağırlıkları boyunca ilerleyerek ${result.head.toUpperCase()} ucu seçildi.`);
}
export function ffgResult(first: number, second: number) {
  const justified = first * 3 >= 200; return { justified, finalized: justified && second * 3 >= 200 };
}
function casperScene(p: Params): SimulationTrace {
  const first = int(p, 'first', 80, 40, 100), secondRaw = int(p, 'second', 75, 40, 100), conflict = bool(p, 'conflict'), second = Math.max(0, secondRaw - (conflict ? 30 : 0)), result = ffgResult(first, second);
  const checkpoints = [N('c0', 'C0', -4, 0, 'block', '', 'success'), N('c1', 'C1', 0, 0), N('c2', 'C2', 4, 0)], votes = [N('votes1', 'V1', -2, -2, 'token', `${first}/100`), N('votes2', 'V2', 2, -2, 'token', `${second}/100`)];
  return T([
    F(['Checkpoints mark epochs', 'Kontrol noktaları dönemleri işaretler'], ['Begin from an already justified checkpoint C0.', 'Zaten gerekçelenmiş C0 kontrol noktasından başla.'], checkpoints, linksOf(checkpoints, 'muted')),
    F(['Vote from C0 to C1', 'C0’dan C1’e oy ver'], ['At least two thirds of the total stake must support this link.', 'Bu bağlantıyı toplam payın en az üçte ikisi desteklemeli.'], [...checkpoints, votes[0]], [connect('c0', 'votes1'), connect('votes1', 'c1', result.justified ? 'success' : 'warning')], [metric('First link weight', 'İlk bağlantı ağırlığı', `${first}/100`)]),
    F([result.justified ? 'C1 becomes justified' : 'C1 is not justified yet', result.justified ? 'C1 gerekçelendi' : 'C1 henüz gerekçelenmedi'], ['Justification alone is not finalization.', 'Gerekçelenme tek başına kesinleşme değildir.'], checkpoints.map(n => n.id === 'c1' ? { ...n, status: result.justified ? 'active' as Status : 'warning' as Status } : n), [connect('c0', 'c1', result.justified ? 'success' : 'warning')], [metric('C1 justified', 'C1 gerekçelendi', result.justified ? '✓' : '✕')]),
    F(['Vote on the next checkpoint link', 'Sonraki kontrol noktası bağlantısına oy ver'], [conflict ? 'Thirty weight units vote elsewhere and do not count toward C1 → C2.' : 'The next consecutive link also needs a supermajority.', conflict ? 'Otuz ağırlık birimi başka yere oy verir; C1 → C2’ye sayılmaz.' : 'Sonraki ardışık bağlantı da üstün çoğunluk gerektirir.'], [...checkpoints, ...votes], [connect('c0', 'c1', result.justified ? 'success' : 'warning'), connect('c1', 'votes2'), connect('votes2', 'c2', second * 3 >= 200 ? 'success' : 'warning')], [metric('Second link weight', 'İkinci bağlantı ağırlığı', `${second}/100`)]),
    F([result.finalized ? 'The earlier checkpoint becomes final' : 'Finalization must wait', result.finalized ? 'Önceki kontrol noktası kesinleşti' : 'Kesinleşme beklemeli'], ['This model shows the consecutive-checkpoint case of Casper FFG.', 'Bu model Casper FFG’nin ardışık kontrol noktası durumunu gösterir.'], checkpoints.map(n => ({ ...n, value: n.id === 'c1' && result.finalized ? '🔒' : n.value, status: n.id === 'c1' ? result.finalized ? 'success' as Status : 'warning' as Status : n.status })), linksOf(checkpoints, result.finalized ? 'success' : 'warning'), [metric('C1 justified', 'C1 gerekçelendi', result.justified ? '✓' : '✕'), metric('C1 finalized', 'C1 kesinleşti', result.finalized ? '✓' : '✕', result.finalized ? 'success' : 'warning')]),
  ], result.finalized ? 'Two qualifying consecutive links finalize C1.' : result.justified ? 'C1 is justified but the next link has insufficient weight to finalize it.' : 'Without a qualifying first link, C1 is neither justified nor finalized.', result.finalized ? 'İki yeterli ardışık bağlantı C1’i kesinleştirdi.' : result.justified ? 'C1 gerekçelendi ama sonraki bağlantı kesinleşme için yetersiz.' : 'Yeterli ilk bağlantı yok; C1 gerekçelenmedi ve kesinleşmedi.');
}
function slashingScene(p: Params): SimulationTrace {
  const behavior = str(p, 'behavior', 'double'), stake = int(p, 'stake', 40, 10, 100), double = behavior === 'double', offline = behavior === 'offline';
  const nodes = [N('v', 'V', -4, 0, 'node', String(stake)), N('a', 'A', 0, -2, 'block', 'e7'), N('b', 'B', 0, 2, 'block', 'e7'), N('evidence', 'σA + σB', 4, 0, 'gate')];
  return T([
    F(['One validator, one target epoch', 'Tek doğrulayıcı, tek hedef dönem'], ['A and B are incompatible targets for the same epoch.', 'A ve B, aynı dönem için uyumsuz hedefler.'], nodes, [], [metric('Toy stake', 'Örnek pay', stake)]),
    F([offline ? 'The validator misses its vote' : 'The validator signs A', offline ? 'Doğrulayıcı oyunu kaçırır' : 'Doğrulayıcı A’yı imzalar'], [offline ? 'No signed vote is produced while the validator is offline.' : 'The first vote by itself is not double-vote evidence.', offline ? 'Doğrulayıcı çevrimdışıyken imzalı oy üretilmez.' : 'İlk oy tek başına çift oy kanıtı değildir.'], mark(nodes, ['v', 'a'], offline ? 'muted' : 'active'), offline ? [] : [connect('v', 'a')]),
    F([double ? 'A second incompatible signature appears' : 'There is no conflicting signature', double ? 'İkinci uyumsuz imza ortaya çıkar' : 'Çelişkili imza yok'], [double ? 'The same validator also signs B for epoch 7.' : 'One vote or no vote does not prove equivocation.', double ? 'Aynı doğrulayıcı 7. dönem için B’yi de imzalar.' : 'Tek oy veya hiç oy, çelişkili oy kanıtı oluşturmaz.'], mark(nodes, double ? ['a', 'b'] : ['v'], double ? 'error' : offline ? 'muted' : 'success'), double ? [connect('v', 'a', 'error'), connect('v', 'b', 'error')] : offline ? [] : [connect('v', 'a', 'success')]),
    F(['Evidence combines incompatible signatures', 'Kanıt uyumsuz imzaları birleştirir'], ['A verifier needs both signed statements and the slashing rule they violate.', 'Doğrulayıcı iki imzalı ifadeye ve ihlal ettikleri ceza kuralına ihtiyaç duyar.'], mark(nodes, ['evidence'], double ? 'error' : 'muted'), double ? [connect('a', 'evidence', 'error'), connect('b', 'evidence', 'error')] : []),
    F([double ? 'Stake is at risk under the rule' : offline ? 'Offline is different from equivocation' : 'No double-vote evidence', double ? 'Kural gereği pay risk altında' : offline ? 'Çevrimdışı olmak, çelişkili oy değildir' : 'Çift oy kanıtı yok'], [double ? 'This lab identifies slashable evidence; it does not calculate protocol penalties.' : offline ? 'Missed participation may have other penalties, but is not this double-vote offense.' : 'One consistent vote does not satisfy the double-vote condition.', double ? 'Bu laboratuvar cezalandırılabilir kanıtı bulur; protokol cezasını hesaplamaz.' : offline ? 'Katılmamanın başka cezaları olabilir; fakat bu çift oy ihlali değildir.' : 'Tek tutarlı oy, çift oy koşulunu sağlamaz.'], mark(nodes, ['v', 'evidence'], double ? 'error' : 'success'), double ? [connect('evidence', 'v', 'error')] : [], [metric('Double-vote evidence', 'Çift oy kanıtı', double ? '✓' : '✕'), metric('Stake at risk', 'Risk altındaki pay', double ? stake : 0)]),
  ], double ? 'Two conflicting signatures form slashable double-vote evidence.' : offline ? 'Being offline does not create double-vote evidence.' : 'A single consistent vote creates no double-vote evidence.', double ? 'İki çelişkili imza, cezalandırılabilir çift oy kanıtı oluşturdu.' : offline ? 'Çevrimdışı olmak çift oy kanıtı oluşturmadı.' : 'Tek tutarlı oy çift oy kanıtı oluşturmadı.');
}

export function pbftRound(offline: number, equivocate: boolean, invalidRequest = false) {
  const active = Array.from({ length: Math.max(0, 4 - offline) }, (_, i) => i);
  const proposed = Object.fromEntries(active.map(i => [i, equivocate && i > 1 ? i === 2 ? 'B' : 'C' : 'A'])) as Record<number, string>;
  const prepares = invalidRequest ? [] : active.filter(i => i > 0).map(from => ({ from, value: proposed[from] }));
  const prepared = invalidRequest ? [] : active.filter(i => prepares.filter(message => message.value === proposed[i]).length >= 2);
  const commits = prepared.map(from => ({ from, value: proposed[from] }));
  const committed = ['A', 'B', 'C'].find(value => commits.filter(message => message.value === value).length >= 3);
  return { active, proposed, prepares, prepared, commits, committed };
}
function pbftScene(p: Params): SimulationTrace {
  const offline = int(p, 'offline', 0, 0, 2), equivocate = bool(p, 'equivocate'), invalid = bool(p, 'badClient'), result = pbftRound(offline, equivocate, invalid);
  const vs = validators().map((v, i) => ({ ...v, value: i === 0 ? 'P · v1' : 'v1', status: result.active.includes(i) ? 'idle' as Status : 'muted' as Status }));
  const request = center('C', 's+1');
  const prepareLinks = result.prepares.flatMap(message => result.active.filter(i => i !== message.from).map(i => connect(`v${message.from}`, `v${i}`, 'active', message.value)));
  const commitLinks = result.commits.flatMap(message => result.active.filter(i => i !== message.from).map(i => connect(`v${message.from}`, `v${i}`, 'success', message.value)));
  return T([
    F(['Four replicas tolerate one fault', 'Dört kopya bir hataya dayanır'], ['This view has one primary and three backups, with f=1.', 'Bu görünümde bir birincil, üç yedek ve f=1 var.'], [...vs, request], [connect('center', 'v0')], [metric('Active replicas', 'Etkin kopya', result.active.length)]),
    F(['Pre-prepare: the primary proposes', 'Pre-prepare: birincil önerir'], [invalid ? 'The client request is invalid; correct replicas do not prepare it.' : equivocate ? 'The primary sends different values for the same sequence number.' : 'The primary sends the same value A for this sequence number.', invalid ? 'İstemci isteği geçersiz; doğru kopyalar onu hazırlamaz.' : equivocate ? 'Birincil aynı sıra numarası için farklı değerler gönderir.' : 'Birincil bu sıra numarası için aynı A değerini gönderir.'], [...vs.map((v, i) => ({ ...v, value: result.proposed[i] ?? '∅', status: !result.active.includes(i) ? 'muted' as Status : invalid || equivocate ? 'warning' as Status : 'active' as Status })), request], result.active.filter(i => i > 0).map(i => connect('v0', `v${i}`, invalid || equivocate ? 'warning' : 'active', result.proposed[i]))),
    F(['Prepare: backups echo the digest', 'Prepare: yedekler özeti tekrarlar'], ['Backups multicast prepares for the value they received.', 'Yedekler aldıkları değer için prepare mesajını herkese yollar.'], [...vs, request], prepareLinks, [metric('Prepare messages', 'Prepare mesajı', result.prepares.length)]),
    F(['Prepared requires matching evidence', 'Hazırlık eşleşen kanıt gerektirir'], ['A correct replica needs its pre-prepare and two matching backup prepares.', 'Doğru kopya kendi pre-prepare’ına ve eşleşen iki yedek prepare’a ihtiyaç duyar.'], [...vs.map((v, i) => ({ ...v, status: result.prepared.includes(i) ? 'success' as Status : result.active.includes(i) ? 'warning' as Status : 'muted' as Status })), request], prepareLinks, [metric('Prepared replicas', 'Hazır kopya', result.prepared.length)]),
    F(['Commit: share prepared evidence', 'Commit: hazır olma kanıtını paylaş'], ['Only prepared replicas send commits for that value.', 'Yalnız hazır kopyalar o değer için commit gönderir.'], [...vs, request], commitLinks, [metric('Matching commits', 'Eşleşen commit', result.commits.filter(m => m.value === 'A').length)]),
    F([result.committed ? 'Three commits allow execution' : 'No execution without a certificate', result.committed ? 'Üç commit yürütmeye izin verir' : 'Kanıt olmadan yürütme yok'], [result.committed ? 'Correct replicas execute the same ordered request.' : 'This view stalls safely; view change is outside this trace.', result.committed ? 'Doğru kopyalar aynı sıralanmış isteği yürütür.' : 'Bu görünüm güvenle bekler; görünüm değişimi bu izin dışında.'], [...vs.map((v, i) => ({ ...v, status: result.active.includes(i) ? result.committed ? 'success' as Status : 'warning' as Status : 'muted' as Status })), { ...request, label: 's=1', value: result.committed ?? '∅', status: result.committed ? 'success' : 'warning' }], result.committed ? allTo(vs.filter((_, i) => result.active.includes(i)), 'center', 'success') : [], [metric('Executed', 'Yürütüldü', result.committed ? '✓' : '✕', result.committed ? 'success' : 'warning')]),
  ], result.committed ? 'A matching prepare and commit certificate allows A to execute.' : 'No matching commit certificate forms; this view does not execute.', result.committed ? 'Eşleşen prepare ve commit kanıtı, A’nın yürütülmesini sağladı.' : 'Eşleşen commit kanıtı oluşmadı; bu görünüm yürütme yapmadı.');
}
export function tendermintCanCommit(onlinePower: number, valid: boolean): boolean {
  return valid && onlinePower * 3 > 200;
}
function tendermintScene(p: Params): SimulationTrace {
  const offline = int(p, 'offline', 20, 0, 60), invalid = bool(p, 'invalid'), timeout = bool(p, 'timeout'), online = 100 - offline, accepted = tendermintCanCommit(online, !invalid);
  const weights = [40, 30, 20, 10], available = [...weights]; let left = offline;
  for (let i = 3; i >= 0; i--) { const removed = Math.min(left, available[i]); available[i] -= removed; left -= removed; }
  const vs = validators().map((v, i) => ({ ...v, value: `${available[i]}/${weights[i]}`, status: available[i] > 0 ? 'idle' as Status : 'muted' as Status })), block = center('B', 'h1');
  const active = vs.filter((_, i) => available[i] > 0), proposer = timeout ? active.find(v => v.id !== 'v0') ?? vs[0] : vs[0];
  return T([
    F(['Voting power has weight', 'Oy gücü ağırlıklıdır'], ['Only online voting power can participate in this round.', 'Bu turda yalnız çevrimiçi oy gücü katılabilir.'], [...vs, block], ringLinks(vs), [metric('Online power', 'Çevrimiçi güç', `${online}/100`)]),
    F([timeout ? 'A timeout advances the proposal round' : 'A proposer sends a block', timeout ? 'Zaman aşımı öneri turunu ilerletir' : 'Üretici blok gönderir'], [timeout ? 'The first proposal times out; an available proposer supplies the next proposal.' : 'Validators check the proposed block before voting.', timeout ? 'İlk öneri zaman aşımına uğrar; uygun üretici sonraki öneriyi sağlar.' : 'Doğrulayıcılar oy vermeden önce önerilen bloğu kontrol eder.'], [...vs, { ...block, value: timeout ? 'r1 · h1' : 'r0 · h1', status: invalid ? 'error' : 'active' }], [connect(proposer.id, 'center', invalid ? 'error' : 'active')], [metric('Round', 'Tur', timeout ? 1 : 0)]),
    F(['Prevote for a valid block or nil', 'Geçerli blok veya nil için ön oy ver'], [invalid ? 'Correct validators prevote nil for this invalid proposal.' : 'Online validators prevote the valid proposal.', invalid ? 'Doğru doğrulayıcılar geçersiz öneri için nil ön oyu verir.' : 'Çevrimiçi doğrulayıcılar geçerli öneriye ön oy verir.'], [...vs, { ...block, value: invalid ? 'nil' : 'B', status: invalid ? 'error' : 'active' }], allTo(active, 'center', invalid ? 'warning' : 'active'), [metric('Prevote for B', 'B ön oyu', invalid ? 0 : online)]),
    F([accepted ? 'A supermajority locks the block' : 'No block lock forms', accepted ? 'Üstün çoğunluk bloğu kilitler' : 'Blok kilidi oluşmadı'], ['The threshold is strictly more than two thirds of total power.', 'Eşik, toplam gücün kesin olarak üçte ikisinden fazlasıdır.'], [...vs, { ...block, value: accepted ? 'B · 🔒' : '∅', status: accepted ? 'success' : 'warning' }], allTo(active, 'center', accepted ? 'success' : 'warning'), [metric('Lock formed', 'Kilit oluştu', accepted ? '✓' : '✕')]),
    F(['Precommit the locked block', 'Kilitli bloğa ön commit ver'], ['A lock supported by the required prevotes leads to precommits for B.', 'Gerekli ön oylarla desteklenen kilit, B için ön commitlere yol açar.'], [...vs, { ...block, value: accepted ? 'B · 🔒' : 'nil', status: accepted ? 'active' : 'warning' }], allTo(active, 'center', accepted ? 'active' : 'warning'), [metric('Precommit for B', 'B ön commit', accepted ? online : 0)]),
    F([accepted ? 'Commit one block' : 'Wait for another round', accepted ? 'Tek bloğu commit et' : 'Sonraki turu bekle'], [accepted ? 'More than two thirds precommit B, so this height commits.' : 'Insufficient precommit power cannot commit a block.', accepted ? 'Üçte ikiden fazlası B’ye ön commit verdi; bu yükseklik commit edilir.' : 'Yetersiz ön commit gücü bir bloğu commit edemez.'], [...vs, { ...block, value: accepted ? 'B · 🔒' : '∅', status: accepted ? 'success' : 'warning' }], accepted ? vs.map(v => connect('center', v.id, 'success')) : [], [metric('Committed', 'Commit edildi', accepted ? '✓' : '✕', accepted ? 'success' : 'warning')]),
  ], accepted ? 'The valid proposal reaches the strict voting-power threshold and commits.' : 'The proposal does not meet the validity and voting-power conditions for commit.', accepted ? 'Geçerli öneri kesin oy gücü eşiğini aşıp commit edildi.' : 'Öneri, commit için geçerlilik ve oy gücü koşullarını sağlamadı.');
}
export function hotstuffCanCommit(votes: number, descendants: number, broken: boolean): boolean {
  return votes >= 3 && descendants >= 2 && !broken;
}
function hotstuffScene(p: Params): SimulationTrace {
  const votes = int(p, 'votes', 3, 1, 4), descendants = int(p, 'certified', 2, 0, 2), broken = bool(p, 'skipView'), certified = votes >= 3, accepted = hotstuffCanCommit(votes, descendants, broken);
  const vs = validators().map((v, i) => ({ ...v, position: [v.position[0], 0, v.position[2] * 0.65 + 2] as [number, number, number], status: i < votes ? 'active' as Status : 'muted' as Status }));
  const blocks = [N('b0', 'B0', -4.5, -2, 'block', 'v1'), N('b1', 'B1', 0.5, -2, 'block', broken ? 'v3' : 'v2'), N('b2', 'B2', 4.5, -2, 'block', broken ? 'v4' : 'v3')], displayed = blocks.slice(0, descendants + 1);
  if (broken && descendants > 0) displayed.splice(1, 0, { ...N('gap', 'X', -2, -2, 'data', 'QC=∅', 'warning'), scale: 0.6 });
  const edges = linksOf(displayed, certified ? 'success' : 'warning').map(l => ({ ...l, status: l.from === 'gap' || l.to === 'gap' ? 'warning' as Status : l.status }));
  const withCertificates = displayed.map(n => ({ ...n, value: n.id === 'gap' ? 'QC=∅' : certified ? `QC${n.id.slice(1)}` : 'QC=∅', status: n.id === 'gap' || !certified ? 'warning' as Status : 'active' as Status }));
  return T([
    F(['A leader proposes the first block', 'Lider ilk bloğu önerir'], ['Replicas vote on one proposal for the current view.', 'Kopyalar mevcut görünüm için tek öneriye oy verir.'], [...vs, blocks[0]], [connect('v0', 'b0')]),
    F(['Collect votes for a quorum certificate', 'Quorum sertifikası için oy topla'], ['With four replicas and f=1, three votes form a QC.', 'Dört kopya ve f=1 için üç oy bir QC oluşturur.'], [...vs, blocks[0]], vs.slice(0, votes).map(v => connect(v.id, 'b0')), [metric('Votes', 'Oy', `${votes}/4`)]),
    F([certified ? 'The first QC is progress, not commit' : 'No first QC forms', certified ? 'İlk QC ilerlemedir; henüz commit yok' : 'İlk QC oluşmadı'], ['A single certified block does not satisfy the chained commit rule.', 'Tek sertifikalı blok, zincirli commit kuralını sağlamaz.'], [...vs, { ...blocks[0], value: certified ? 'QC0' : 'QC=∅', status: certified ? 'active' : 'warning' }], vs.slice(0, votes).map(v => connect(v.id, 'b0', certified ? 'success' : 'warning')), [metric('First QC', 'İlk QC', certified ? '✓' : '✕')]),
    F(['Extend through certified descendants', 'Sertifikalı sonraki bloklarla uzat'], [broken ? 'An uncertified dummy parent interrupts the direct certified chain.' : 'Each descendant needs its own quorum certificate.', broken ? 'Sertifikasız boş ata, doğrudan sertifikalı zinciri keser.' : 'Sonraki her blok kendi quorum sertifikasını gerektirir.'], [...vs, ...withCertificates], edges, [metric('Certified descendants', 'Sertifikalı sonraki blok', certified ? descendants : 0)]),
    F(['Check the direct three-chain', 'Doğrudan üçlü zinciri kontrol et'], ['The final QC must reach the replica before it applies this commit rule.', 'Kopya bu commit kuralını uygulamadan önce son QC’yi almalı.'], withCertificates, edges, [metric('Direct certified chain', 'Doğrudan sertifikalı zincir', certified && !broken ? descendants + 1 : 0), metric('Required length', 'Gerekli uzunluk', 3)]),
    F([accepted ? 'Commit the oldest block' : 'The ancestor remains uncommitted', accepted ? 'En eski bloğu commit et' : 'Ata blok commit edilmedi'], [accepted ? 'The direct certified three-chain commits B0 when the final QC is delivered.' : 'Votes, descendants, and direct ancestry must all satisfy the rule.', accepted ? 'Son QC gelince doğrudan sertifikalı üçlü zincir B0’ı commit eder.' : 'Oylar, sonraki bloklar ve doğrudan ata ilişkisi kuralı birlikte sağlamalı.'], withCertificates.map(n => n.id === 'b0' ? { ...n, value: accepted ? 'QC0 · 🔒' : n.value, status: accepted ? 'success' as Status : 'warning' as Status } : n), edges, [metric('B0 committed', 'B0 commit edildi', accepted ? '✓' : '✕', accepted ? 'success' : 'warning')]),
  ], accepted ? 'B0 commits after a direct certified three-chain and delivery of the final QC.' : 'B0 cannot commit without all three-chain prerequisites.', accepted ? 'Doğrudan sertifikalı üçlü zincir ve son QC’nin gelişiyle B0 commit edildi.' : 'Üçlü zincirin tüm önkoşulları olmadan B0 commit edilemez.');
}
function ouroborosScene(p: Params): SimulationTrace {
  const stake = int(p, 'stake', 4, 1, 7), seed = int(p, 'seed', 5, 1, 30), activity = int(p, 'activity', 60, 10, 90) / 100, shares = [stake / 10, (10 - stake) / 20, (10 - stake) / 20];
  const thresholds = shares.map(share => 1 - (1 - activity) ** share), random = rng(seed), draws = Array.from({ length: 6 }, () => shares.map(() => random())), winners = draws.map(slot => slot.map((draw, i) => draw < thresholds[i] ? i : -1).filter(i => i >= 0));
  const vs = validators(3).map((v, i) => ({ ...v, value: `${(shares[i] * 100).toFixed(0)}%` })), slots = winners.map((win, i) => N(`s${i}`, `S${i + 1}`, (i - 2.5) * 1.9, 0, 'block', win.map(index => vs[index].label).join('+') || '∅', win.length === 0 ? 'muted' : win.length > 1 ? 'warning' : 'success'));
  return T([
    F(['Divide time into slots', 'Zamanı slotlara böl'], ['A validator privately checks eligibility for each slot.', 'Doğrulayıcı her slot için uygunluğunu gizlice kontrol eder.'], slots.map(n => ({ ...n, value: '?', status: 'idle' as Status })), linksOf(slots, 'muted'), [metric('Epoch seed', 'Dönem tohumu', seed)]),
    F(['Compute each stake threshold', 'Her pay eşiğini hesapla'], ['The teaching rule is 1 − (1 − f)^stakeShare.', 'Öğretim kuralı 1 − (1 − f)^payOranı.'], vs.map((v, i) => ({ ...v, value: thresholds[i].toFixed(4), status: 'active' as Status })), ringLinks(vs), [metric('Slot activity f', 'Slot etkinliği f', activity)]),
    F(['Run independent eligibility checks', 'Bağımsız uygunluk kontrolü yap'], ['Each random draw is compared with that validator’s own threshold.', 'Her rastgele sayı, kendi doğrulayıcısının eşiğiyle karşılaştırılır.'], [...vs.map((v, i) => ({ ...v, value: draws[0][i].toFixed(4), status: winners[0].includes(i) ? 'success' as Status : 'muted' as Status })), { ...slots[0], position: [0, 0, 0] }], winners[0].map(i => connect(vs[i].id, 's0')), [metric('Slot 1 leaders', 'Slot 1 lideri', winners[0].length)]),
    F(['Reveal eligible slot leaders', 'Uygun slot liderlerini göster'], ['Eligibility is independent, so some slots can be empty or have competitors.', 'Uygunluk bağımsızdır; bazı slotlar boş veya rakipli olabilir.'], slots.map((n, i) => i < 3 ? n : { ...n, value: '?', status: 'idle' as Status }), linksOf(slots, 'muted')),
    F(['Inspect all six slots', 'Altı slotu incele'], ['These seeded draws show eligibility only; they are not cryptographic VRF proofs.', 'Tohumlu sayılar yalnız uygunluğu gösterir; kriptografik VRF kanıtı değildir.'], slots, linksOf(slots, 'muted'), [metric('Empty slots', 'Boş slot', winners.filter(win => win.length === 0).length), metric('Multiple-leader slots', 'Birden çok liderli slot', winners.filter(win => win.length > 1).length)]),
  ], `Six seeded slots contain ${winners.filter(win => win.length === 0).length} empty and ${winners.filter(win => win.length > 1).length} multiple-leader slots.`, `Altı tohumlu slotta ${winners.filter(win => win.length === 0).length} boş ve ${winners.filter(win => win.length > 1).length} çok liderli slot var.`);
}
export function enumerateQuorums(sets: number[][], thresholds: number[], offline: number[] = []): number[][] {
  const quorums: number[][] = [];
  for (let mask = 1; mask < 2 ** sets.length; mask++) {
    const group = sets.map((_, i) => i).filter(i => (mask & 1 << i) !== 0);
    if (!group.some(i => offline.includes(i)) && group.every(i => sets[i].filter(other => group.includes(other)).length >= thresholds[i])) quorums.push(group);
  }
  return quorums;
}
function stellarScene(p: Params): SimulationTrace {
  const bridge = bool(p, 'bridge'), threshold = int(p, 'threshold', 2, 1, 3), offline = bool(p, 'offline');
  const sets = bridge ? [[0, 1, 2], [0, 1, 2], [0, 1, 2, 3, 4], [2, 3, 4], [2, 3, 4]] : [[0, 1], [0, 1], [0, 1, 2, 3, 4], [3, 4], [3, 4]];
  const thresholds = sets.map((set, i) => bridge && i !== 2 ? 3 : Math.min(threshold, set.length)), quorums = enumerateQuorums(sets, thresholds, offline ? [2] : []);
  let split: [number[], number[]] | undefined;
  for (let i = 0; i < quorums.length; i++) for (let j = i + 1; j < quorums.length; j++) if (!split && !quorums[i].some(n => quorums[j].includes(n))) split = [quorums[i], quorums[j]];
  const vs = validators(5).map((v, i) => ({ ...v, value: `${thresholds[i]}/${sets[i].length}`, status: offline && i === 2 ? 'muted' as Status : 'idle' as Status })), edges = sets.flatMap((set, i) => set.filter(j => j !== i).map(j => connect(`v${i}`, `v${j}`, 'muted')));
  const first = quorums[0] ?? [];
  return T([
    F(['Each node chooses whom to trust', 'Her düğüm kime güveneceğini seçer'], ['A local threshold set describes acceptable slices for that node.', 'Yerel eşik kümesi, düğüm için kabul edilebilir dilimleri tanımlar.'], vs, edges, [metric('Local threshold control', 'Yerel eşik kontrolü', threshold)]),
    F([bridge ? 'Require the shared validator' : 'Allow independent trust groups', bridge ? 'Ortak doğrulayıcıyı zorunlu kıl' : 'Bağımsız güven gruplarına izin ver'], [bridge ? 'Both outer groups require all three of their members, including C.' : 'The left and right pairs can satisfy their local thresholds independently.', bridge ? 'İki dış grup, C dahil üç üyesinin tamamını gerektirir.' : 'Sol ve sağ çift kendi yerel eşiklerini bağımsız sağlayabilir.'], mark(vs, ['v2'], offline ? 'muted' : 'active'), edges, [metric('C online', 'C çevrimiçi', offline ? '✕' : '✓')]),
    F(['A quorum satisfies every member', 'Quorum her üyesini tatmin eder'], ['A candidate group is a quorum only if each member has a sufficient slice inside it.', 'Aday grup, yalnız her üyenin içinde yeterli dilimi varsa quorumdur.'], vs.map((v, i) => ({ ...v, status: first.includes(i) ? 'active' as Status : 'muted' as Status })), edges.filter(l => first.includes(Number(l.from.slice(1))) && first.includes(Number(l.to.slice(1)))), [metric('Example quorum size', 'Örnek quorum boyutu', first.length)]),
    F(['Enumerate the possible quorums', 'Olası quorumları tara'], ['This small network checks every nonempty subset exactly.', 'Bu küçük ağ, boş olmayan her alt kümeyi tam olarak kontrol eder.'], vs, edges, [metric('Quorums found', 'Bulunan quorum', quorums.length), metric('Disjoint pair exists', 'Ayrık çift var', split ? '✓' : '✕')]),
    F([split ? 'Disjoint quorums threaten agreement' : quorums.length ? 'Every quorum pair intersects' : 'No live quorum remains', split ? 'Ayrık quorumlar uzlaşmayı tehdit eder' : quorums.length ? 'Her quorum çifti kesişiyor' : 'Canlı quorum kalmadı'], [split ? 'Two groups can satisfy themselves without sharing any member.' : quorums.length ? 'The enumerated configuration has no pair of disjoint quorums.' : 'The offline node prevents every configured quorum from forming.', split ? 'İki grup hiçbir üyeyi paylaşmadan kendi koşullarını sağlayabilir.' : quorums.length ? 'Taranan ayarda ayrık quorum çifti yok.' : 'Çevrimdışı düğüm, ayarlanan tüm quorumların oluşmasını engeller.'], vs.map((v, i) => ({ ...v, status: split ? split[0].includes(i) ? 'active' as Status : split[1].includes(i) ? 'error' as Status : 'muted' as Status : quorums.length ? 'success' as Status : 'warning' as Status })), edges, [metric('Live quorums', 'Canlı quorum', quorums.length), metric('Disjoint pair', 'Ayrık çift', split ? '✓' : '✕', split ? 'error' : 'success')]),
  ], split ? 'A disjoint quorum pair exists: local trust does not guarantee global agreement.' : quorums.length ? 'All enumerated quorums intersect under this trust configuration.' : 'No live quorum can form with the current trust and availability settings.', split ? 'Ayrık quorum çifti var: yerel güven küresel uzlaşmayı garantilemez.' : quorums.length ? 'Bu güven ayarında taranan tüm quorumlar kesişiyor.' : 'Mevcut güven ve erişilebilirlik ayarıyla canlı quorum oluşamıyor.');
}
function cliqueScene(p: Params): SimulationTrace {
  const votes = int(p, 'votes', 2, 0, 3), early = bool(p, 'unauthorized'), offline = bool(p, 'offline'), authorized = votes > 1;
  const vs = validators().map((v, i) => ({ ...v, value: i < 3 ? '✓' : '∅', status: i < 3 ? 'idle' as Status : 'muted' as Status })), block = center('#1');
  return T([
    F(['Begin with a known signer set', 'Bilinen imzalayan kümesiyle başla'], ['A, B and C are authorized; D is not yet authorized.', 'A, B ve C yetkili; D henüz yetkili değil.'], [...vs, block], ringLinks(vs), [metric('Authorized signers', 'Yetkili imzalayan', 3)]),
    F([early ? 'D tries to produce too early' : 'An authorized signer produces', early ? 'D erken üretmeyi deniyor' : 'Yetkili imzalayan üretir'], [early ? 'The current signer set rejects D’s block.' : 'A’s signature belongs to the current authorized set.', early ? 'Mevcut imzalayan kümesi D’nin bloğunu reddeder.' : 'A’nın imzası mevcut yetkili kümeye ait.'], [...vs, { ...block, status: early ? 'error' : 'success' }], [connect(early ? 'v3' : 'v0', 'center', early ? 'error' : 'success')], [metric('Early block accepted', 'Erken blok kabulü', early ? '✕' : '✓')]),
    F(['Existing signers vote on authorization', 'Mevcut imzalayanlar yetki için oy verir'], ['Adding D requires a majority of the three current signers.', 'D’nin eklenmesi mevcut üç imzalayanın çoğunluğunu gerektirir.'], [...vs, block], vs.slice(0, votes).map(v => connect(v.id, 'v3')), [metric('Authorization votes', 'Yetkilendirme oyu', `${votes}/3`)]),
    F([authorized ? 'D joins the signer set' : 'D remains outside the signer set', authorized ? 'D imzalayan kümesine katıldı' : 'D imzalayan kümesi dışında kaldı'], ['The signer set changes only when the authorization threshold is met.', 'İmzalayan kümesi yalnız yetkilendirme eşiği sağlanınca değişir.'], vs.map((v, i) => i === 3 ? { ...v, value: authorized ? '✓' : '∅', status: authorized ? 'success' as Status : 'muted' as Status } : v), ringLinks(vs), [metric('Authorized signers', 'Yetkili imzalayan', authorized ? 4 : 3)]),
    F([offline ? 'Another authorized signer can take a turn' : 'Rotate the next signer', offline ? 'Başka yetkili imzalayan sıra alabilir' : 'Sonraki imzalayana geç'], [offline ? 'B is offline; this simplified rotation uses C as the fallback.' : 'The teaching rotation selects B for the next block.', offline ? 'B çevrimdışı; bu basit sıra C’yi yedek olarak kullanır.' : 'Öğretim sırası sonraki blok için B’yi seçer.'], [...vs.map((v, i) => ({ ...v, value: i === 3 ? authorized ? '✓' : '∅' : v.value, status: i === (offline ? 2 : 1) ? 'active' as Status : offline && i === 1 ? 'muted' as Status : i === 3 && !authorized ? 'muted' as Status : 'idle' as Status })), { ...block, label: '#2', status: 'success' }], [connect(offline ? 'v2' : 'v1', 'center', 'success')], [metric('Next producer', 'Sonraki üretici', offline ? 'C' : 'B')]),
  ], authorized ? 'A majority authorizes D; future production uses the updated signer set.' : 'D stays unauthorized because the majority threshold was not reached.', authorized ? 'Çoğunluk D’yi yetkilendirdi; sonraki üretim güncellenen kümeyi kullanır.' : 'Çoğunluk eşiği aşılmadığı için D yetkisiz kaldı.');
}

function grothScene(p: Params): SimulationTrace {
  const witness = int(p, 'witness', 4, 1, 9), claim = int(p, 'claim', 19, 4, 84), wrongKey = bool(p, 'badSetup'), actual = witness * witness + 3, accepted = actual === claim && !wrongKey;
  const nodes = [N('w', 'x', -4.5, 0, 'token', '•••'), N('mul', '×', -2, -1.5, 'gate', 'x²'), N('add', '+3', 0.5, -1.5, 'gate'), N('y', 'y', 3, -1.5, 'data', String(claim)), N('pk', 'PK', -2, 2, 'token'), N('proof', 'π', 0.5, 2, 'token'), N('vk', wrongKey ? 'VK′' : 'VK', 3, 2, 'token'), N('verify', 'V', 5, 0, 'gate')];
  const circuit = [connect('w', 'mul'), connect('mul', 'add'), connect('add', 'y')], note = b('Structural Groth16 model: the arithmetic constraint is checked directly. No QAP, pairing or SNARK is generated.', 'Yapısal Groth16 modeli: aritmetik kısıt doğrudan kontrol edilir. QAP, eşleme veya SNARK üretilmez.');
  return T([
    F(['Describe the computation as constraints', 'Hesabı kısıtlarla tanımla'], ['The private witness x must satisfy the public claim y = x² + 3.', 'Özel tanık x, açık y = x² + 3 iddiasını sağlamalı.'], nodes, circuit, [], ['mul', 'add'], note),
    F(['Use keys for this circuit', 'Bu devrenin anahtarlarını kullan'], ['The structural setup provides a proving key and a matching verification key.', 'Yapısal kurulum, kanıt üretim anahtarı ve eşleşen doğrulama anahtarı sağlar.'], mark(nodes, ['pk', 'vk'], 'active'), [connect('mul', 'pk'), connect('add', 'vk')]),
    F(['Compute with the private witness', 'Özel tanıkla hesapla'], ['Inside this teaching model, the witness is evaluated to check the relation.', 'Bu öğretim modelinin içinde bağıntıyı kontrol etmek için tanık hesaplanır.'], mark(nodes, ['w', 'mul', 'add'], 'active'), circuit, [metric('Computed x² + 3', 'Hesaplanan x² + 3', actual), metric('Public claim', 'Açık iddia', claim)]),
    F(['Package a proof-shaped message', 'Kanıt biçimli mesaj hazırla'], ['The diagram represents the proof role; it does not execute proof generation.', 'Şema kanıtın görevini gösterir; kanıt üretimini çalıştırmaz.'], mark(nodes, ['proof'], 'active'), [connect('w', 'proof'), connect('pk', 'proof'), connect('add', 'proof')], [], ['proof'], note),
    F(['Verify the public input with the right key', 'Açık girdiyi doğru anahtarla doğrula'], [wrongKey ? 'A mismatched verification key fails this structural check.' : 'The modeled verifier checks the claim against the intended circuit.', wrongKey ? 'Eşleşmeyen doğrulama anahtarı yapısal kontrolü geçemez.' : 'Model doğrulayıcı iddiayı hedef devreye göre kontrol eder.'], mark(nodes, ['verify', 'vk'], accepted ? 'success' : 'error'), [connect('proof', 'verify'), connect('vk', 'verify', wrongKey ? 'error' : 'active'), connect('y', 'verify')]),
    F([accepted ? 'The modeled relation is satisfied' : 'The modeled check rejects', accepted ? 'Modelde bağıntı sağlandı' : 'Model kontrolü reddetti'], ['A real proof system needs the full cryptographic construction and setup assumptions.', 'Gerçek kanıt sistemi, tam kriptografik yapı ve kurulum varsayımlarını gerektirir.'], mark(nodes, ['verify'], accepted ? 'success' : 'error'), [connect('proof', 'verify', accepted ? 'success' : 'error')], [metric('Model accepted', 'Model kabulü', accepted ? '✓' : '✕', accepted ? 'success' : 'error')], ['verify'], note),
  ], accepted ? 'The witness satisfies the claim and the structural verification key matches.' : 'The claim or verification key fails the structural check.', accepted ? 'Tanık iddiayı sağladı ve yapısal doğrulama anahtarı eşleşti.' : 'İddia veya doğrulama anahtarı yapısal kontrolü geçemedi.');
}
export function sampleTraceChecks(trace: number[], count: number, seed: number) {
  const indices = Array.from({ length: Math.max(0, trace.length - 1) }, (_, i) => i), random = rng(seed);
  for (let i = indices.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
  const samples = indices.slice(0, count), failures = samples.filter(i => trace[i + 1] !== trace[i] * 2 + 1);
  return { samples, failures };
}
function starkScene(p: Params): SimulationTrace {
  const count = int(p, 'samples', 4, 1, 7), seed = int(p, 'seed', 2, 1, 20), corrupt = bool(p, 'corrupt'), trace = Array.from({ length: 8 }, (_, i) => 2 ** (i + 1) - 1);
  if (corrupt) trace[4] += 3;
  const result = sampleTraceChecks(trace, count, seed), root = merkleLevels(trace.map(String)).at(-1)![0], checked = new Set(result.samples.flatMap(i => [i, i + 1]));
  const nodes = trace.map((value, i) => N(`t${i}`, `t${i}`, (i % 4 - 1.5) * 2.6, i < 4 ? -1.7 : 1.7, 'data', String(value))), edges = linksOf(nodes, 'muted'), commitment = N('root', 'R', 0, 0, 'block', short(root));
  return T([
    F(['Write an execution trace', 'Yürütme izini yaz'], ['Each step should satisfy next = 2 × current + 1.', 'Her adım sonraki = 2 × mevcut + 1 kuralını sağlamalı.'], nodes, edges),
    F(['Commit before choosing queries', 'Sorguları seçmeden taahhüt et'], ['A real SHA-256 Merkle root commits to these eight cells.', 'Gerçek SHA-256 Merkle kökü bu sekiz hücreye taahhüt verir.'], [...nodes, commitment], nodes.map(n => connect(n.id, 'root')), [metric('Committed root', 'Taahhüt kökü', short(root))]),
    F(['Select unpredictable positions', 'Öngörülemeyen konumları seç'], ['This teaching seed chooses distinct transition indices after the commitment.', 'Öğretim tohumu taahhütten sonra farklı geçiş indislerini seçer.'], nodes.map((n, i) => ({ ...n, status: checked.has(i) ? 'active' as Status : 'muted' as Status })), result.samples.map(i => connect(`t${i}`, `t${i + 1}`)), [metric('Sampled transitions', 'Örneklenen geçiş', count), metric('Sampling seed', 'Örnekleme tohumu', seed)]),
    F(['Check the sampled transitions', 'Örneklenen geçişleri kontrol et'], ['Compare neighboring cells against the recurrence relation.', 'Komşu hücreleri yineleme bağıntısıyla karşılaştır.'], nodes.map((n, i) => ({ ...n, status: result.failures.some(f => i === f || i === f + 1) ? 'error' as Status : checked.has(i) ? 'success' as Status : 'muted' as Status })), result.samples.map(i => connect(`t${i}`, `t${i + 1}`, result.failures.includes(i) ? 'error' : 'success')), [metric('Failed checks', 'Başarısız kontrol', result.failures.length)]),
    F([result.failures.length ? 'A bad transition is detected' : corrupt ? 'The sampled checks missed the error' : 'The sampled checks pass', result.failures.length ? 'Hatalı geçiş yakalandı' : corrupt ? 'Örnek kontroller hatayı kaçırdı' : 'Örnek kontroller geçti'], ['Sampling raw cells is not a full STARK: low-degree encoding and FRI are omitted.', 'Ham hücreleri örneklemek tam STARK değildir: düşük derece kodlama ve FRI yoktur.'], [...nodes.map((n, i) => ({ ...n, status: corrupt && i === 4 ? result.failures.length ? 'error' as Status : 'warning' as Status : 'idle' as Status })), commitment], edges, [metric('Detected violation', 'Saptanan ihlal', result.failures.length ? '✓' : '✕', result.failures.length ? 'error' : corrupt ? 'warning' : 'success'), metric('Full STARK proof', 'Tam STARK kanıtı', '—')]),
  ], result.failures.length ? 'The sampled recurrence checks detected the corrupted trace.' : corrupt ? 'These samples missed the corruption; passing raw checks is not a full proof.' : 'The sampled recurrence checks pass; this remains a structural STARK lesson.', result.failures.length ? 'Örnek bağıntı kontrolleri bozuk izi yakaladı.' : corrupt ? 'Bu örnekler bozulmayı kaçırdı; ham kontrollerden geçmek tam kanıt değildir.' : 'Örnek bağıntı kontrolleri geçti; bu yine de yapısal STARK dersidir.');
}
function kzgScene(p: Params): SimulationTrace {
  const a = int(p, 'coefficient', 2, 1, 5), z = int(p, 'point', 3, 0, 5), wrong = bool(p, 'falseClaim'), polynomial = (x: number) => a * x * x + 2 * x + 1, actual = polynomial(z), claim = actual + (wrong ? 1 : 0), remainder = actual - claim;
  const points = Array.from({ length: 6 }, (_, x) => N(`p${x}`, `x=${x}`, (x - 2.5) * 1.9, -2.4, 'data', String(polynomial(x)), 'idle', polynomial(x) / 170));
  const extra = [N('commit', 'C', -3, 1.5, 'token', `a=${a}`), N('proof', 'π', 0, 1.5, 'token', `q(x)=${a}x+${a * z + 2}`), N('verifier', 'V', 3, 1.5, 'gate')];
  const note = b('Polynomial arithmetic is real. Commitment and proof tokens are structural; no trusted setup or pairing runs.', 'Polinom aritmetiği gerçektir. Taahhüt ve kanıt nesneleri yapısaldır; güvenilir kurulum veya eşleme çalışmaz.');
  return T([
    F(['Start with a polynomial', 'Polinomla başla'], [`p(x) = ${a}x² + 2x + 1 defines all shown points.`, `p(x) = ${a}x² + 2x + 1, gösterilen noktaları tanımlar.`], points, linksOf(points, 'muted'), [], [], note),
    F(['Commit to the whole polynomial', 'Bütün polinoma taahhüt et'], ['A real KZG commitment binds the polynomial in one group element.', 'Gerçek KZG taahhüdü polinomu tek grup elemanına bağlar.'], [...points, extra[0]], points.map(n => connect(n.id, 'commit'))),
    F(['Claim a value at one point', 'Tek noktada değer iddia et'], [`The claimed evaluation is p(${z}) = ${claim}.`, `İddia edilen değerlendirme p(${z}) = ${claim}.`], [...mark(points, [`p${z}`], 'active'), ...extra], [connect(`p${z}`, 'verifier')], [metric('Point z', 'Nokta z', z), metric('Claimed value', 'İddia edilen değer', claim)]),
    F(['Factor out the evaluation point', 'Değerlendirme noktasını çarpanlaştır'], ['For a correct claim, p(x) − value is divisible by x − z.', 'Doğru iddiada p(x) − değer, x − z ile tam bölünür.'], [...points, ...mark(extra, ['proof'], wrong ? 'error' : 'active')], [connect('commit', 'proof'), connect('proof', 'verifier')], [metric('Remainder', 'Kalan', remainder, remainder === 0 ? 'success' : 'error')]),
    F([remainder === 0 ? 'The polynomial relation holds' : 'The claimed opening is inconsistent', remainder === 0 ? 'Polinom bağıntısı sağlanıyor' : 'İddia edilen açılım tutarsız'], ['A real KZG verifier checks the encoded relation with pairings; this lab checks the polynomial relation directly.', 'Gerçek KZG doğrulayıcısı kodlanmış bağıntıyı eşlemeyle; bu laboratuvar polinom bağıntısını doğrudan kontrol eder.'], [...points, ...mark(extra, ['verifier'], remainder === 0 ? 'success' : 'error')], [connect('proof', 'verifier', remainder === 0 ? 'success' : 'error')], [metric('Relation valid', 'Bağıntı geçerli', remainder === 0 ? '✓' : '✕', remainder === 0 ? 'success' : 'error')], ['verifier'], note),
  ], remainder === 0 ? 'The claimed point has zero remainder in the opening relation.' : 'The false claim leaves a nonzero remainder and fails the relation.', remainder === 0 ? 'İddia edilen nokta açılım bağıntısında sıfır kalan verdi.' : 'Yanlış iddia sıfır olmayan kalan verdi ve bağıntıyı sağlayamadı.');
}
export function bisectDispute(correct: number[], claimed: number[]): [number, number][] {
  let low = 0, high = correct.length - 1; const ranges: [number, number][] = [[low, high]];
  while (high - low > 1) { const mid = Math.floor((low + high) / 2); if (correct[mid] === claimed[mid]) low = mid; else high = mid; ranges.push([low, high]); }
  return ranges;
}
function optimisticScene(p: Params): SimulationTrace {
  const batch = num(p, 'batch', 8) <= 4 ? 4 : 8, corrupt = bool(p, 'corrupt'), challenger = bool(p, 'challenger'), fraudAt = batch / 2;
  const truth = Array.from({ length: batch + 1 }, (_, i) => i), claimed = truth.map((n, i) => n + (corrupt && i >= fraudAt ? 3 : 0)), ranges = bisectDispute(truth, claimed), challenged = corrupt && challenger, accepted = !challenged;
  const txs = Array.from({ length: batch }, (_, i) => N(`tx${i}`, `T${i + 1}`, (i % 4 - 1.5) * 2.4, i < 4 ? -2 : 0, 'data', corrupt && i === fraudAt - 1 ? '+4' : '+1', corrupt && i === fraudAt - 1 ? 'warning' : 'idle'));
  const assertion = N('assert', 'L1', 0, 2.5, 'gate', `0 → ${claimed.at(-1)}`), watcher = N('watcher', 'V', 4.8, 2.5, 'node', '', challenger ? 'active' : 'muted');
  const states = claimed.map((value, i) => N(`s${i}`, `S${i}`, (i - batch / 2) * 9.5 / batch, 0, 'block', String(value)));
  const [lo, hi] = ranges.at(-1)!;
  return T([
    F(['Execute a batch offchain', 'İşlem grubunu zincir dışında yürüt'], ['Each valid teaching transaction increments the counter by one.', 'Geçerli her öğretim işlemi sayacı bir artırır.'], txs, linksOf(txs, 'active'), [metric('Batch size', 'Grup boyutu', batch)]),
    F(['Post an assertion on L1', 'L1’e iddia gönder'], ['The claimed end state waits through a challenge window.', 'İddia edilen son durum, itiraz süresini bekler.'], [...txs, assertion, watcher], [connect(txs.at(-1)!.id, 'assert')], [metric('Claimed state', 'İddia edilen durum', claimed.at(-1)!)]),
    F([challenger ? 'An honest challenger reexecutes' : 'No honest challenger is watching', challenger ? 'Dürüst itirazcı yeniden yürütür' : 'Dürüst itirazcı izlemiyor'], [challenger ? 'The challenger compares local execution with the posted assertion.' : 'Without a challenger, a bad assertion can pass the teaching window.', challenger ? 'İtirazcı yerel yürütmeyi yayımlanan iddiayla karşılaştırır.' : 'İtirazcı yoksa hatalı iddia öğretim süresini geçebilir.'], [...states, assertion, watcher], challenger ? [connect('assert', 'watcher', challenged ? 'error' : 'success')] : [], [metric('Watcher online', 'İtirazcı çevrimiçi', challenger ? '✓' : '✕'), metric('Correct end state', 'Doğru son durum', batch)]),
    F([challenged ? 'Bisect the disputed interval' : 'No dispute is opened', challenged ? 'İtiraz edilen aralığı ikiye böl' : 'İtiraz açılmadı'], [challenged ? 'Compare midpoint states and keep the half containing the first disagreement.' : 'An unchallenged assertion continues through the timeout window.', challenged ? 'Orta durumları karşılaştır; ilk uyuşmazlığı içeren yarıyı tut.' : 'İtirazsız iddia zaman aşımı sürecine devam eder.'], states.map((n, i) => ({ ...n, status: challenged ? i >= lo && i <= hi ? 'active' as Status : 'muted' as Status : 'idle' as Status })), linksOf(states, challenged ? 'active' : 'muted'), [metric('Bisection rounds', 'İkiye bölme turu', challenged ? ranges.length - 1 : 0), metric('Disputed interval', 'İtiraz aralığı', challenged ? `${lo} → ${hi}` : '—')]),
    F([challenged ? 'Check one disputed transition' : 'The challenge window expires', challenged ? 'Tek itiraz geçişini kontrol et' : 'İtiraz süresi doldu'], [challenged ? 'One step fails next = current + 1, so the asserted transition is invalid.' : 'Acceptance now depends on the absence of a successful challenge.', challenged ? 'Bir adım sonraki = mevcut + 1 kuralını bozuyor; iddia geçersiz.' : 'Kabul artık başarılı itirazın bulunmamasına bağlı.'], [...states.map((n, i) => ({ ...n, status: challenged && (i === lo || i === hi) ? 'error' as Status : 'idle' as Status })), assertion], challenged ? [connect(`s${lo}`, `s${hi}`, 'error'), connect(`s${hi}`, 'assert', 'error')] : [], [metric('Successful challenge', 'Başarılı itiraz', challenged ? '✓' : '✕')]),
    F([accepted ? 'The assertion is accepted' : 'The assertion is rejected', accepted ? 'İddia kabul edildi' : 'İddia reddedildi'], [corrupt && !challenger ? 'The bad assertion is accepted: this exposes the honest-challenger assumption.' : challenged ? 'The failed transition prevents the bad asserted state from being accepted.' : 'The correct assertion passes the modeled challenge window.', corrupt && !challenger ? 'Hatalı iddia kabul edildi: bu, dürüst itirazcı varsayımını gösterir.' : challenged ? 'Hatalı geçiş, yanlış durum iddiasının kabulünü engeller.' : 'Doğru iddia, modelde itiraz süresini geçti.'], [...states, { ...assertion, status: challenged ? 'error' : corrupt ? 'warning' : 'success' }, watcher], [connect(states.at(-1)!.id, 'assert', challenged ? 'error' : corrupt ? 'warning' : 'success')], [metric('Assertion accepted', 'İddia kabulü', accepted ? '✓' : '✕', challenged ? 'error' : corrupt ? 'warning' : 'success')]),
  ], corrupt && !challenger ? 'The bad assertion is accepted because no honest challenger responds.' : challenged ? 'The bad assertion is rejected after bisection isolates the invalid transition.' : 'The valid assertion is accepted after the challenge window.', corrupt && !challenger ? 'Dürüst itirazcı yanıt vermediği için hatalı iddia kabul edildi.' : challenged ? 'İkiye bölme geçersiz geçişi buldu; hatalı iddia reddedildi.' : 'Geçerli iddia itiraz süresinden sonra kabul edildi.');
}
function validityScene(p: Params): SimulationTrace {
  const batch = int(p, 'batch', 4, 2, 6), invalid = bool(p, 'invalid'), withhold = bool(p, 'withhold'), before = 10, expected = before + batch, claimed = expected + (invalid ? 3 : 0), rollupAccepted = !invalid && !withhold;
  const root = merkleLevels(Array.from({ length: batch }, (_, i) => `add:${i}`)).at(-1)![0], txs = Array.from({ length: batch }, (_, i) => N(`tx${i}`, `T${i + 1}`, (i - (batch - 1) / 2) * 1.6, -2.3, 'data', '+1'));
  const state = [N('old', 'S₀', -4, 1, 'block', String(before)), N('new', 'S₁', 4, 1, 'block', String(claimed)), N('prover', 'P', -1.3, 1, 'node'), N('proof', 'π', 1.2, 1, 'token'), N('l1', 'L1', 0, 3.2, 'gate')];
  const note = b('The proof is structural: this lab checks the arithmetic relation directly. A rollup update also requires batch publication.', 'Kanıt yapısaldır: laboratuvar aritmetik bağıntıyı doğrudan kontrol eder. Rollup güncellemesi ayrıca grubun yayımlanmasını gerektirir.');
  return T([
    F(['Bundle the transactions', 'İşlemleri grupla'], ['The batch is executed offchain, while L1 will enforce the update conditions.', 'Grup zincir dışında yürütülür; L1 güncelleme koşullarını uygular.'], [...txs, state[0]], txs.map(n => connect(n.id, 'old')), [metric('Batch size', 'Grup boyutu', batch)]),
    F(['Compute a candidate state', 'Aday durum hesapla'], ['The batch should add one per transaction to the prior state.', 'Grup, önceki duruma işlem başına bir eklemeli.'], [...txs, ...state], [connect('old', 'prover'), connect('prover', 'new', invalid ? 'warning' : 'active')], [metric('Expected state', 'Beklenen durum', expected), metric('Claimed state', 'İddia edilen durum', claimed), metric('Batch root', 'Grup kökü', short(root))]),
    F(['Attach a proof of the transition', 'Geçiş kanıtını ekle'], ['The proof role binds the old state, batch and claimed new state.', 'Kanıt görevi, eski durumu, grubu ve iddia edilen yeni durumu bağlar.'], [...txs, ...mark(state, ['proof'], 'active')], [connect('prover', 'proof'), connect('old', 'proof'), connect('new', 'proof')], [], ['proof'], note),
    F(['Check validity on L1', 'L1 üzerinde geçerliliği kontrol et'], [invalid ? 'The claimed transition fails the modeled proof check.' : 'The transition passes the modeled validity check; publication is a separate prerequisite.', invalid ? 'İddia edilen geçiş, model kanıt kontrolünü geçemiyor.' : 'Geçiş, model geçerlilik kontrolünü geçiyor; yayım ayrı bir önkoşul.'], [...txs, ...mark(state, ['proof', 'l1'], invalid ? 'error' : 'success')], [connect('proof', 'l1', invalid ? 'error' : 'success')], [metric('Model proof accepted', 'Model kanıt kabulü', invalid ? '✕' : '✓', invalid ? 'error' : 'success')], ['l1'], note),
    F([rollupAccepted ? 'Accept the rollup state update' : withhold ? 'Missing batch data blocks acceptance' : 'Reject the invalid update', rollupAccepted ? 'Rollup durum güncellemesini kabul et' : withhold ? 'Eksik grup verisi kabulü engeller' : 'Geçersiz güncellemeyi reddet'], [withhold ? 'Without required batch publication, this rollup keeps its previous accepted state—even with a valid proof.' : invalid ? 'Published data cannot make an invalid transition pass verification.' : 'Both the valid transition and required batch publication are present.', withhold ? 'Gerekli grup yayımı olmadan rollup, geçerli kanıt olsa bile önceki kabul edilmiş durumunu korur.' : invalid ? 'Yayımlanan veri, geçersiz geçişi doğrulamadan geçiremez.' : 'Hem geçerli geçiş hem gerekli grup yayımı mevcut.'], [...txs.map(n => ({ ...n, status: withhold ? 'muted' as Status : 'success' as Status })), ...state.map(n => n.id === 'new' ? { ...n, value: String(rollupAccepted ? claimed : before), status: rollupAccepted ? 'success' as Status : invalid ? 'error' as Status : 'warning' as Status } : n.id === 'l1' ? { ...n, status: rollupAccepted ? 'success' as Status : invalid ? 'error' as Status : 'warning' as Status } : n)], [connect('proof', 'l1', invalid ? 'error' : 'success'), ...(withhold ? [] : txs.map(n => connect(n.id, 'l1', 'success'))), connect('l1', 'new', rollupAccepted ? 'success' : invalid ? 'error' : 'warning')], [metric('Batch data available', 'Grup verisi erişilebilir', withhold ? '✕' : '✓', withhold ? 'warning' : 'success'), metric('Rollup update accepted', 'Rollup güncellemesi kabulü', rollupAccepted ? '✓' : '✕', rollupAccepted ? 'success' : invalid ? 'error' : 'warning')]),
  ], invalid ? 'The invalid transition is rejected by the modeled validity check.' : withhold ? 'Validity passes, but unavailable data blocks the rollup update.' : 'The valid transition and published batch allow the rollup state update.', invalid ? 'Geçersiz geçiş, model geçerlilik kontrolünde reddedildi.' : withhold ? 'Geçerlilik sağlandı ama erişilemeyen veri rollup güncellemesini engelledi.' : 'Geçerli geçiş ve yayımlanan grup, rollup durum güncellemesine izin verdi.');
}
export function channelTransfer(alice: number, bob: number, amount: number) {
  const valid = amount >= 0 && amount <= alice;
  return { valid, alice: valid ? alice - amount : alice, bob: valid ? bob + amount : bob };
}
function channelScene(p: Params): SimulationTrace {
  const amount = int(p, 'amount', 4, 1, 12), stale = bool(p, 'stale'), watcher = bool(p, 'watcher'), update = channelTransfer(10, 5, amount), staleAttempt = stale && update.valid, caught = staleAttempt && watcher, finalAlice = staleAttempt && !watcher ? 10 : update.alice, finalBob = 15 - finalAlice;
  const base = [N('alice', 'A', -4, 0, 'node', '10'), N('vault', 'L1', 0, -2.3, 'gate', '15'), N('bob', 'B', 4, 0, 'node', '5')], state = (sequence: number, alice: number, bob: number) => N('state', `S${sequence}`, 0, 1.8, 'block', `${alice} | ${bob}`);
  return T([
    F(['Lock funds in one channel', 'Fonları bir kanala kilitle'], ['Alice and Bob lock a total of 15 units onchain.', 'Alice ve Bob zincirde toplam 15 birim kilitler.'], [...base, state(0, 10, 5)], [connect('alice', 'vault'), connect('bob', 'vault')], [metric('Locked total', 'Kilitli toplam', 15)]),
    F(['Agree on a newer balance split', 'Yeni bakiye dağılımında anlaş'], [update.valid ? 'Both parties accept a newer state that moves value from Alice to Bob.' : 'Alice cannot pay more than her channel balance.', update.valid ? 'İki taraf Alice’ten Bob’a değer taşıyan yeni durumu kabul eder.' : 'Alice kanal bakiyesinden fazlasını ödeyemez.'], [...base, { ...state(update.valid ? 1 : 0, update.alice, update.bob), status: update.valid ? 'active' : 'error' }], [connect('alice', 'state', update.valid ? 'active' : 'error'), connect('bob', 'state', update.valid ? 'active' : 'error')], [metric('Update accepted', 'Güncelleme kabulü', update.valid ? '✓' : '✕')]),
    F(['Keep the latest agreed state', 'Son anlaşılan durumu tut'], ['Offchain updates redistribute the same locked total.', 'Zincir dışı güncellemeler aynı kilitli toplamı yeniden dağıtır.'], [...base, state(update.valid ? 1 : 0, update.alice, update.bob)], [connect('state', 'alice', 'success'), connect('state', 'bob', 'success')], [metric('Channel total', 'Kanal toplamı', update.alice + update.bob)]),
    F([staleAttempt ? 'Try closing an older state' : 'Close the current state', staleAttempt ? 'Eski durumla kapatmayı dene' : 'Mevcut durumla kapat'], [staleAttempt ? 'The old state favors Alice and omits the latest payment.' : 'The close submits the most recent valid teaching state.', staleAttempt ? 'Eski durum Alice’i kayırır ve son ödemeyi içermez.' : 'Kapanış en son geçerli öğretim durumunu gönderir.'], [...base, state(staleAttempt ? 0 : update.valid ? 1 : 0, staleAttempt ? 10 : update.alice, staleAttempt ? 5 : update.bob)], [connect('state', 'vault', staleAttempt ? 'warning' : 'active')], [metric('Stale close attempted', 'Eski kapanış denendi', staleAttempt ? '✓' : '✕')]),
    F([caught ? 'Contest with the newer state' : staleAttempt ? 'The contest window is missed' : 'The contest window passes', caught ? 'Yeni durumla itiraz et' : staleAttempt ? 'İtiraz süresi kaçırıldı' : 'İtiraz süresi geçti'], [caught ? 'Bob supplies the newer agreed state before the teaching deadline.' : staleAttempt ? 'Without a watcher, this generic contest model settles the old state.' : 'No stale state needs to be replaced.', caught ? 'Bob öğretim süresi dolmadan yeni anlaşılan durumu sağlar.' : staleAttempt ? 'İzleyici yoksa bu genel itiraz modeli eski durumu kapatır.' : 'Değiştirilmesi gereken eski durum yok.'], [...base, state(caught || !staleAttempt ? update.valid ? 1 : 0 : 0, finalAlice, finalBob)], caught ? [connect('bob', 'state', 'success'), connect('state', 'vault', 'success')] : [], [metric('Watcher online', 'İzleyici çevrimiçi', watcher ? '✓' : '✕'), metric('Stale close stopped', 'Eski kapanış durduruldu', caught ? '✓' : '✕')]),
    F(['Settle the final balances', 'Son bakiyeleri kapat'], ['The generic contest model pays out exactly the locked total.', 'Genel itiraz modeli tam kilitli toplamı öder.'], [N('alice', 'A', -4, 0, 'node', String(finalAlice), 'success'), { ...base[1], value: '0', status: 'success' }, N('bob', 'B', 4, 0, 'node', String(finalBob), staleAttempt && !watcher ? 'warning' : 'success'), state(caught || !staleAttempt ? update.valid ? 1 : 0 : 0, finalAlice, finalBob)], [connect('vault', 'alice', 'success'), connect('vault', 'bob', staleAttempt && !watcher ? 'warning' : 'success')], [metric('Alice payout', 'Alice ödemesi', finalAlice), metric('Bob payout', 'Bob ödemesi', finalBob), metric('Total payout', 'Toplam ödeme', finalAlice + finalBob)]),
  ], staleAttempt && !watcher ? 'The old state settles because no watcher contests it in time.' : caught ? 'The newer state defeats the stale close and preserves the latest payment.' : 'The current valid state settles with the channel total conserved.', staleAttempt && !watcher ? 'İzleyici zamanında itiraz etmediği için eski durum kapandı.' : caught ? 'Yeni durum eski kapanışı engelledi ve son ödemeyi korudu.' : 'Mevcut geçerli durum, kanal toplamını koruyarak kapandı.');
}
export function htlcOutcome(secret: string, revealed: string, revealAt: number) {
  // Teaching recipient refuses disclosure after the downstream safety deadline.
  // Bitcoin CLTV enables refunds; it does not disable an unspent preimage branch.
  const hashMatches = sha256(secret) === sha256(revealed), disclosed = revealAt < 3;
  return { hashMatches, disclosed, settled: hashMatches && disclosed };
}
function htlcScene(p: Params): SimulationTrace {
  const secret = str(p, 'secret', 'open-sesame'), wrong = bool(p, 'wrong'), revealAt = int(p, 'revealAt', 2, 1, 5), revealed = wrong ? `${secret}!` : secret, hash = sha256(secret), result = htlcOutcome(secret, revealed, revealAt);
  const base = [N('alice', 'A', -4.5, 0, 'node'), N('bob', 'B', 0, 0, 'node'), N('carol', 'C', 4.5, 0, 'node'), N('ab', 'H · t<5', -2.3, 2.1, 'gate', short(hash)), N('bc', 'H · t<3', 2.3, 2.1, 'gate', short(hash)), N('secret', 'r', 4.5, -2.2, 'token', '•••')];
  const displayed = base.map(n => n.id === 'secret' ? { ...n, value: !result.disclosed ? '•••' : wrong ? 'r′ ≠ r' : secret.slice(0, 20), status: !result.disclosed ? 'muted' as Status : result.hashMatches ? 'success' as Status : 'error' as Status } : n);
  const note = b('Exclusive teaching deadlines at 3 and 5; late disclosure is withheld and refunds are assumed confirmed. Bitcoin timeouts enable refunds without disabling an unspent preimage branch.', 'Öğretimde 3 ve 5 zaman sınırları dışlanır; geç sır açıklanmaz ve iadeler onaylanmış varsayılır. Bitcoin zaman aşımı, harcanmamış sır dalını kapatmadan iadeye izin verir.');
  return T([
    F(['Carol keeps a secret and shares its hash', 'Carol sırrı saklar, hashini paylaşır'], ['Alice learns H(r), while the preimage r remains with Carol.', 'Alice H(r)’yi öğrenir; ön görüntü r, Carol’da kalır.'], base, [connect('carol', 'secret', 'muted'), connect('carol', 'alice')], [metric('Payment hash', 'Ödeme hashi', short(hash))]),
    F(['Lock the upstream payment', 'Önceki ödemeyi kilitle'], ['Alice offers Bob a hash-locked payment with the longer teaching deadline.', 'Alice, Bob’a daha uzun öğretim süresi olan hash kilitli ödeme sunar.'], mark(base, ['ab'], 'active'), [connect('alice', 'ab'), connect('ab', 'bob')], [metric('Upstream deadline', 'Önceki son zaman', 5)]),
    F(['Use a shorter downstream deadline', 'Sonraki ödeme süresini kısalt'], ['Bob forwards to Carol with time to claim upstream if the secret is safely revealed.', 'Bob, sır güvenle açıklanırsa önceki ödemeyi alabilecek süreyle Carol’a iletir.'], mark(base, ['ab', 'bc'], 'active'), [connect('alice', 'ab'), connect('bob', 'bc'), connect('bc', 'carol')], [metric('Downstream deadline', 'Sonraki son zaman', 3)], [], note),
    F([result.disclosed ? wrong ? 'An incorrect preimage is revealed' : 'Reveal the matching preimage in time' : 'Withhold the secret on an expired route', result.disclosed ? wrong ? 'Yanlış ön görüntü açıklandı' : 'Eşleşen ön görüntüyü zamanında açıkla' : 'Süresi dolan yolda sırrı sakla'], [result.disclosed ? wrong ? 'The disclosed value does not hash to the agreed payment hash.' : 'Carol discloses r while the downstream claim is still inside the teaching deadline.' : 'The attempted reveal is too late. Carol keeps the preimage secret; Bob never learns it.', result.disclosed ? wrong ? 'Açıklanan değer, anlaşılan ödeme hashini vermiyor.' : 'Carol, sonraki alacak öğretim süresi içindeyken r’yi açıklar.' : 'Açıklama denemesi çok geç. Carol ön görüntüyü saklar; Bob onu öğrenmez.'], displayed, result.disclosed ? [connect('secret', 'bc', result.hashMatches ? 'success' : 'error')] : [], [metric('Attempted reveal time', 'Açıklama denemesi zamanı', revealAt), metric('Preimage disclosed', 'Ön görüntü açıklandı', result.disclosed ? '✓' : '✕'), metric('Hash matches', 'Hash eşleşiyor', result.disclosed ? result.hashMatches ? '✓' : '✕' : '—')]),
    F([result.settled ? 'The secret travels backward' : 'No matching preimage reaches the live route', result.settled ? 'Sır geriye doğru yayılır' : 'Canlı yola eşleşen ön görüntü ulaşmadı'], [result.settled ? 'Bob learns r from the downstream claim and claims the upstream payment.' : 'Without a matching disclosed preimage, the modeled claims do not succeed.', result.settled ? 'Bob, sonraki alacaktan r’yi öğrenip önceki ödemeyi alır.' : 'Açıklanan eşleşen ön görüntü olmadan modelde alacaklar başarılı olmaz.'], mark(displayed, ['ab', 'bc'], result.settled ? 'success' : 'warning'), result.settled ? [connect('bc', 'bob', 'success'), connect('bob', 'ab', 'success')] : [], [metric('Route settled', 'Yol ödendi', result.settled ? '✓' : '✕')]),
    F([result.settled ? 'Both legs settle with the same secret' : 'Assume timeout refunds confirm', result.settled ? 'İki ödeme aynı sırla tamamlandı' : 'Zaman aşımı iadelerinin onayını varsay'], [result.settled ? 'One hash condition coordinates both transfers; the deadlines decrease along the route.' : 'No matching preimage was disclosed. This trace assumes each timeout refund is confirmed.', result.settled ? 'Tek hash koşulu iki transferi bağlar; süreler yol boyunca azalır.' : 'Eşleşen ön görüntü açıklanmadı. Bu iz, her zaman aşımı iadesinin onaylandığını varsayar.'], displayed.map(n => ({ ...n, value: n.id === 'alice' ? result.settled ? '−1' : '0' : n.id === 'bob' ? '0' : n.id === 'carol' ? result.settled ? '+1' : '0' : n.value, status: n.id === 'ab' || n.id === 'bc' ? result.settled ? 'success' as Status : 'muted' as Status : n.status })), result.settled ? [connect('ab', 'bob', 'success'), connect('bc', 'carol', 'success')] : [connect('ab', 'alice', 'warning'), connect('bc', 'bob', 'warning')], [metric('Payment completed', 'Ödeme tamamlandı', result.settled ? '✓' : '✕'), metric('Refund time in model', 'Modelde iade zamanı', result.settled ? '—' : 5)], [], note),
  ], result.settled ? 'The timely matching preimage settles both legs of the route.' : result.disclosed ? 'The wrong preimage unlocks neither leg; the modeled timeout refunds confirm.' : 'Carol withholds the late preimage; the modeled timeout refunds confirm.', result.settled ? 'Zamanında eşleşen ön görüntü, yolun iki ödemesini tamamladı.' : result.disclosed ? 'Yanlış ön görüntü iki kilidi de açmadı; modelde zaman aşımı iadeleri onaylandı.' : 'Carol geç ön görüntüyü sakladı; modelde zaman aşımı iadeleri onaylandı.');
}
export function nextBaseFee(base: number, used: number, target = 100): number {
  if (used === target) return base;
  if (used > target) return base + Math.max(1, Math.floor(base * (used - target) / target / 8));
  return base - Math.floor(base * (target - used) / target / 8);
}
export function effectiveFee(base: number, maxFee: number, maxTip: number) {
  const eligible = maxFee >= base, tip = eligible ? Math.min(maxTip, maxFee - base) : 0;
  return { eligible, tip, total: eligible ? base + tip : 0 };
}
function feeScene(p: Params): SimulationTrace {
  const load = int(p, 'load', 150, 0, 200), cap = int(p, 'maxFee', 140, 50, 200), tip = int(p, 'tip', 5, 0, 20), fees = [100];
  for (let i = 0; i < 3; i++) fees.push(nextBaseFee(fees.at(-1)!, load));
  const base = fees.at(-1)!, payment = effectiveFee(base, cap, tip), blocks = fees.map((fee, i) => N(`b${i}`, `B${i}`, (i - 1.5) * 2.7, -1, 'block', String(fee), 'idle', load / 150));
  const extra = [N('tx', 'TX', -3, 2, 'token', `max=${cap}`), N('burn', '∅', 0, 2, 'gate', String(payment.eligible ? base : 0)), N('proposer', 'P', 3.5, 2, 'node', String(payment.tip))];
  return T([
    F(['Start from a known base fee', 'Bilinen taban ücretten başla'], ['The base fee is burned; the optional priority fee rewards the proposer.', 'Taban ücret yakılır; isteğe bağlı öncelik ücreti üreticiye gider.'], [blocks[0]], [], [metric('Starting base fee', 'Başlangıç taban ücreti', 100)]),
    F(['Compare gas use with the target', 'Gaz kullanımını hedefle karşılaştır'], ['Above-target blocks raise the next base fee; below-target blocks lower it.', 'Hedef üstü bloklar sonraki taban ücreti artırır; altındakiler düşürür.'], blocks.slice(0, 2), linksOf(blocks.slice(0, 2), 'active'), [metric('Gas used / target', 'Kullanılan gaz / hedef', `${load}%`), metric('Target', 'Hedef', '100%')]),
    F(['Apply integer feedback over three blocks', 'Üç blok boyunca tam sayılı geri besleme uygula'], ['The modeled update uses the EIP-1559 denominator of eight.', 'Model güncellemesi EIP-1559’un sekiz paydasını kullanır.'], mark(blocks, blocks.map(n => n.id), 'active'), linksOf(blocks, 'active'), [metric('Current base fee', 'Mevcut taban ücreti', base)]),
    F(['Respect the transaction fee cap', 'İşlem ücret sınırını koru'], [payment.eligible ? 'The cap covers the base fee; the remaining room limits the tip.' : 'The cap is below the base fee, so the transaction must wait.', payment.eligible ? 'Sınır taban ücreti karşılıyor; kalan alan bahşişi sınırlar.' : 'Sınır taban ücretin altında; işlem beklemeli.'], [...blocks, ...extra], [connect('tx', blocks.at(-1)!.id, payment.eligible ? 'success' : 'error')], [metric('Max fee', 'En yüksek ücret', cap), metric('Max tip', 'En yüksek bahşiş', tip), metric('Eligible', 'Uygun', payment.eligible ? '✓' : '✕')]),
    F([payment.eligible ? 'Separate the burn and the tip' : 'No inclusion at this fee cap', payment.eligible ? 'Yakılan tutarı ve bahşişi ayır' : 'Bu ücret sınırıyla dahil edilmez'], ['Effective tip = min(max tip, max fee − base fee) when the cap is sufficient.', 'Sınır yeterliyse etkin bahşiş = min(en yüksek bahşiş, ücret sınırı − taban ücret).'], [...blocks, ...extra.map(n => ({ ...n, status: payment.eligible ? 'success' as Status : 'muted' as Status }))], payment.eligible ? [connect('tx', 'burn', 'success'), connect('tx', 'proposer', 'success')] : [], [metric('Burn per gas', 'Gaz başına yakım', payment.eligible ? base : 0), metric('Tip per gas', 'Gaz başına bahşiş', payment.tip), metric('Paid per gas', 'Gaz başına ödeme', payment.total)]),
  ], payment.eligible ? `The transaction pays ${payment.total} per gas: ${base} burned and ${payment.tip} tip.` : `The cap ${cap} is below the base fee ${base}; the transaction waits.`, payment.eligible ? `İşlem gaz başına ${payment.total} öder: ${base} yakılır, ${payment.tip} bahşiş olur.` : `${cap} sınırı, ${base} taban ücretin altında; işlem bekler.`);
}

const engines: Record<string, (params: Params) => SimulationTrace> = {
  sha256: hashScene,
  'hash-chain': chainScene,
  'merkle-tree': p => merkleScene(p),
  'sparse-merkle': p => merkleScene(p, true),
  'patricia-trie': trieScene,
  ecdsa: signatureScene,
  schnorr: p => schnorrScene(p),
  bls: blsScene,
  utxo: utxoScene,
  accounts: accountsScene,
  mempool: mempoolScene,
  'proof-of-work': powScene,
  chainwork: chainworkScene,
  difficulty: difficultyScene,
  spv: spvScene,
  'proof-of-stake': stakeScene,
  'lmd-ghost': ghostScene,
  'casper-ffg': casperScene,
  slashing: slashingScene,
  pbft: pbftScene,
  tendermint: tendermintScene,
  hotstuff: hotstuffScene,
  ouroboros: ouroborosScene,
  stellar: stellarScene,
  clique: cliqueScene,
  'zk-proof': p => schnorrScene(p, true),
  groth16: grothScene,
  stark: starkScene,
  kzg: kzgScene,
  'optimistic-rollup': optimisticScene,
  'validity-rollup': validityScene,
  'payment-channel': channelScene,
  htlc: htlcScene,
  eip1559: feeScene,
};
export const simulateBlockchain: Simulator = (id, params) => engines[id]?.(params);
