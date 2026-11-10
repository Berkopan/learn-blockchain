import { bi, type Frame, type Metric, type Params, type SimulationTrace, type Simulator, type Status, type VisualLink, type VisualNode } from '../types';
import { bool, connect, frame, hash32, metric, num, ringPosition, rng, str } from './helpers';

type Pair = [string, string];
const I = (p: Params, key: string, fallback: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(num(p, key, fallback))));
const N = (id: string, label: string, x: number, z: number, value = '', status: Status = 'idle', kind: VisualNode['kind'] = 'node', y = 0): VisualNode => ({ id, label, position: [x, y, z], value, status, kind });
const P = (count: number, radius = 3.7): VisualNode[] => Array.from({ length: count }, (_, i) => ({ id: String.fromCharCode(65 + i), label: String.fromCharCode(65 + i), position: ringPosition(i, count, radius), kind: 'node', status: 'idle' }));
const F = (title: Pair, description: Pair, nodes: VisualNode[], links: VisualLink[] = [], metrics: Metric[] = [], focus: string[] = []): Frame => frame(bi(...title), bi(...description), nodes, links, { metrics, focus });
const T = (frames: Frame[], en: string, tr: string): SimulationTrace => ({ frames, outcome: bi(en, tr) });
const M = (en: string, tr: string, value: string | number, status?: Status) => metric(en, tr, value, status);
const mark = (nodes: VisualNode[], ids: string[], status: Status) => nodes.map(n => ({ ...n, status: ids.includes(n.id) ? status : n.status }));
const sum = (values: number[]) => values.reduce((a, v) => a + v, 0);
const vec = (values: number[]) => '[' + values.join(',') + ']';

export function logAtLeastAsFresh(candidateTerm: number, candidateIndex: number, voterTerm: number, voterIndex: number): boolean { return candidateTerm > voterTerm || candidateTerm === voterTerm && candidateIndex >= voterIndex; }
export function raftOutcome(offline: number, staleCandidate: boolean, appendCurrent: boolean) {
  const available = 5 - offline, fresh = logAtLeastAsFresh(staleCandidate ? 1 : 2, staleCandidate ? 3 : 2, 2, 2), votes = 1 + (fresh ? available - 1 : 0), elected = votes >= 3;
  const currentTermCopies = elected && appendCurrent ? available : 0;
  return { available, votes, elected, currentTermCopies, commitIndex: currentTermCopies >= 3 ? 3 : 1 };
}
function raftScene(p: Params): SimulationTrace {
  const offline = I(p, 'offline', 0, 0, 3), stale = bool(p, 'staleCandidate'), append = p.appendCurrent !== false, r = raftOutcome(offline, stale, append);
  const rows = (stage: number) => Array.from({ length: 5 }, (_, i) => {
    const id = String.fromCharCode(65 + i), online = i < r.available, z = (i - 2) * 1.5;
    const cells = [N(id, id, -5, z, stage > 0 && online ? 't=3' : 't=2', online ? i === 0 && stage > 0 ? 'active' : 'idle' : 'muted'),
      N(id + '1', '#1', -2.5, z, 't1', 'success', 'block', .2),
      N(id + '2', '#2', 0, z, i === 0 && stale ? 't1' : 't2', stage >= 5 && r.commitIndex === 3 && online ? 'success' : 'warning', 'block', .2)];
    if (stale && i === 0) cells.push(N(id + '3', '#3', 2.5, z, 't1', 'warning', 'block', .2));
    if (stage >= 3 && r.elected && append && online) cells.push(N(id + '3', '#3', 2.5, z, 't3', stage >= 5 ? 'success' : 'active', 'block', .2));
    return cells;
  }).flat();
  const peers = Array.from({ length: r.available - 1 }, (_, i) => String.fromCharCode(66 + i));
  return T([
    F(['Logs carry terms and indexes', 'Günlükler dönem ve indeks taşır'], ['Index 1 is committed. The term-2 tail is not yet committed.', '1. indeks commit edilmiş. 2. dönem son kaydı henüz commit değil.'], rows(0)),
    F(['A starts a new election', 'A yeni seçim başlatır'], [stale ? 'A has an older last log term, even though its index can be larger.' : 'A’s last log is at least as up to date as its voters.', stale ? 'İndeksi daha büyük olsa da A’nın son kayıt dönemi eski.' : 'A’nın son günlüğü, oy verenler kadar güncel.'], rows(1), peers.map(id => connect('A', id)), [M('Available servers', 'Erişilebilir sunucu', r.available)]),
    F(r.elected ? ['A receives a majority', 'A çoğunluk oyu aldı'] : ['The election cannot finish', 'Seçim tamamlanamıyor'], ['Voters compare last log term first, then last log index.', 'Oy veren önce son kayıt dönemini, sonra indeksini karşılaştırır.'], rows(2), peers.map(id => connect(id, 'A', stale ? 'error' : 'success')), [M('Votes for A', 'A’nın oyu', r.votes), M('Required votes', 'Gereken oy', 3)]),
    F(['Replicate the leader’s prefix', 'Liderin öneğini çoğalt'], [r.elected ? append ? 'A appends a term-3 entry and replicates the preceding log with it.' : 'The term-2 entry can reach a majority, but direct counting cannot commit it.' : 'Without a leader, this trace does not append new entries.', r.elected ? append ? 'A, 3. dönem kaydı ekler ve önceki günlüğü onunla çoğaltır.' : '2. dönem kaydı çoğunluğa ulaşabilir; yalnız sayarak commit edilemez.' : 'Lider olmadan bu iz yeni kayıt eklemez.'], rows(3), r.elected ? peers.map(id => connect('A', id)) : []),
    F(['Count a current-term entry', 'Güncel dönem kaydını say'], ['Raft advances commitIndex by counting a current-term entry on a majority.', 'Raft, çoğunluktaki güncel dönem kaydını sayarak commitIndex ilerletir.'], rows(4), [], [M('Current-term copies', 'Güncel dönem kopyası', r.currentTermCopies), M('Required copies', 'Gereken kopya', 3)]),
    F(r.commitIndex === 3 ? ['The preceding prefix commits too', 'Önceki önek de commit edildi'] : ['The older tail remains pending', 'Eski son kayıt bekliyor'], [r.commitIndex === 3 ? 'Committing index 3 also commits the term-2 entry before it.' : 'The old committed prefix remains at index 1.', r.commitIndex === 3 ? '3. indeksi commit etmek, önceki 2. dönem kaydını da commit eder.' : 'Eski commit öneği 1. indekste kalır.'], rows(5), [], [M('Commit index', 'Commit indeksi', r.commitIndex, r.commitIndex === 3 ? 'success' : 'warning')]),
  ], r.commitIndex === 3 ? 'The current-term majority commits the complete prefix through index 3.' : 'No current-term majority: the committed prefix does not advance.', r.commitIndex === 3 ? 'Güncel dönem çoğunluğu, 3. indekse kadar tüm öneği commit etti.' : 'Güncel dönem çoğunluğu yok; commit öneği ilerlemiyor.');
}
export interface AcceptedValue { ballot: number; value: string }
export function inheritAccepted(accepted: (AcceptedValue | undefined)[], proposed: string): string {
  const highest = accepted.filter((x): x is AcceptedValue => x !== undefined).sort((a, b) => b.ballot - a.ballot)[0];
  return highest?.value ?? proposed;
}
export function paxosOutcome(oldAccepted: boolean, ballot: number, unavailable: number) {
  const active = 3 - unavailable, promises = ballot > 2 ? active : 0;
  const value = inheritAccepted(Array.from({ length: promises }, (_, i) => i === 0 && oldAccepted ? { ballot: 2, value: 'A' } : undefined), 'B');
  return { active, promises, value, chosen: promises >= 2 };
}
function paxosScene(p: Params): SimulationTrace {
  const old = p.oldAccepted !== false, ballot = I(p, 'ballot', 3, 1, 4), unavailable = I(p, 'unavailable', 0, 0, 2), r = paxosOutcome(old, ballot, unavailable);
  const proposer = N('P', 'P', 0, -2.8, 'n=' + ballot);
  const ns = Array.from({ length: 3 }, (_, i) => N('a' + i, String.fromCharCode(88 + i), (i - 1) * 3.7, 1.7, 'p2 · ' + (old && i === 0 ? '2:A' : '∅'), i < r.active ? 'idle' : 'muted'));
  const promised = ns.map((n, i) => ({ ...n, value: ballot > 2 && i < r.active ? 'p' + ballot + ' · ' + (old && i === 0 ? '2:A' : '∅') : n.value, status: ballot > 2 && i < r.active ? 'active' as Status : n.status }));
  const accepted = promised.map((n, i) => ({ ...n, value: r.chosen && i < r.active ? 'p' + ballot + ' · ' + ballot + ':' + r.value : n.value, status: r.chosen && i < r.active ? 'success' as Status : n.status }));
  const all = [...ns, proposer], promiseLinks = ns.slice(0, r.active).map(n => connect(n.id, 'P', ballot > 2 ? 'success' : 'error', ballot > 2 ? 'PROMISE' : 'p=2'));
  return T([
    F(['Acceptors remember promises', 'Kabulcüler vaatleri hatırlar'], ['The new proposer wants B; a stored acceptance may constrain that choice.', 'Yeni öneren B istiyor; saklanan kabul bu seçimi kısıtlayabilir.'], all),
    F(['Prepare a higher ballot', 'Daha yüksek tur hazırla'], ['This new ballot must exceed the remembered promise 2.', 'Bu yeni tur, hatırlanan 2 numaralı vaadi aşmalı.'], all, ns.slice(0, r.active).map(n => connect('P', n.id, ballot > 2 ? 'active' : 'error')), [M('New ballot', 'Yeni tur', ballot)]),
    F(['Read a majority of promises', 'Vaat çoğunluğunu oku'], ['A promise advances the promised ballot and reports any earlier acceptance separately.', 'Vaat, vaat edilen turu ilerletir; önceki kabulü ayrıca bildirir.'], [...promised, proposer], promiseLinks, [M('Promises', 'Vaat', r.promises), M('Required', 'Gereken', 2)]),
    F(['Inherit the highest accepted value', 'En yüksek kabul değerini devral'], [r.promises >= 2 ? old ? 'X reported (2,A), so the proposer must carry A.' : 'No promise reports an accepted value; the proposer may use B.' : 'Without a prepare majority, the proposer cannot start phase 2.', r.promises >= 2 ? old ? 'X, (2,A) bildirdi; öneren A’yı taşımalı.' : 'Hiçbir vaat kabul bildirmedi; öneren B kullanabilir.' : 'Hazırlık çoğunluğu olmadan öneren 2. aşamayı başlatamaz.'], [...promised, { ...proposer, value: r.promises >= 2 ? r.value : '∅' }], [], [M('Inherited/proposed value', 'Devralınan/önerilen değer', r.promises >= 2 ? r.value : '∅')]),
    F(['Accept one value at this ballot', 'Bu turda tek değeri kabul et'], ['Promises prevent lower ballots from overwriting these acceptances.', 'Vaatler, düşük turların bu kabullerin üzerine yazmasını önler.'], [...accepted, proposer], r.chosen ? ns.slice(0, r.active).map(n => connect('P', n.id, 'success', r.value)) : []),
    F(r.chosen ? ['A majority chooses the value', 'Çoğunluk değeri seçti'] : ['No value is chosen', 'Değer seçilmedi'], [r.chosen ? 'Chosen means accepted by a majority; both the promise and accepted value stay recorded.' : 'Insufficient promises keep phase 2 pending; individual promises still persist.', r.chosen ? 'Seçilmek çoğunlukça kabul edilmektir; vaat ve kabul edilen değer kayıtlı kalır.' : 'Yetersiz vaat 2. aşamayı bekletir; tekil vaatler yine korunur.'], [...accepted, proposer], [], [M('Chosen value', 'Seçilen değer', r.chosen ? r.value : '∅', r.chosen ? 'success' : 'warning')]),
  ], r.chosen ? 'The chosen value is ' + r.value + '; accepted-value inheritance was preserved.' : 'No value is chosen without a prepare and accept majority.', r.chosen ? 'Seçilen değer ' + r.value + '; kabul edilen değerin devri korundu.' : 'Hazırlık ve kabul çoğunluğu olmadan değer seçilmez.');
}
export function contiguousPrefix(chosen: boolean[]): number { let n = 0; while (n < chosen.length && chosen[n]) n++; return n; }
function multiPaxosScene(p: Params): SimulationTrace {
  const change = bool(p, 'leaderChange'), hole = bool(p, 'hole'), slots = I(p, 'slots', 3, 1, 3);
  const chosen = Array.from({ length: slots }, (_, i) => !(hole && i === 1)), prefix = contiguousPrefix(chosen), ballot = change ? 4 : 3;
  const ns = P(3, 4), leader = N('L', change ? 'L2' : 'L1', -4.6, 0, 'n=' + ballot);
  const blocks = Array.from({ length: slots }, (_, i) => N('s' + i, '#' + (i + 1), -1.6 + i * 2.8, 0, 'X' + (i + 1), 'idle', 'block'));
  return T([
    F(['One consensus instance per slot', 'Her konumda bir uzlaşma örneği'], ['Slot 1’s chosen value must survive any new leader.', '1. konumun seçilmiş değeri yeni liderde korunmalı.'], [leader, ...blocks]),
    F(change ? ['A new leader prepares once', 'Yeni lider bir kez hazırlanır'] : ['Reuse the established leader', 'Kurulu lideri yeniden kullan'], [change ? 'Ballot 4 gathers promises and inherits slot 1.' : 'The stable leader already completed phase 1 at ballot 3.', change ? '4. tur vaat toplar ve 1. konumu devralır.' : 'Sabit lider, 3. turda hazırlık aşamasını tamamladı.'], [...ns, leader], ns.map(n => connect(n.id, 'L')), [M('Phase-1 rounds shown', 'Gösterilen hazırlık turu', change ? 2 : 1)]),
    F(['Accept values in later slots', 'Sonraki konumlarda değer kabul et'], ['The same ballot can serve several independent log positions.', 'Aynı tur, bağımsız birden çok günlük konumuna hizmet edebilir.'], [leader, ...blocks], blocks.map(n => connect('L', n.id)), [M('Slots', 'Konum', slots)]),
    F(['Certificates can have a hole', 'Sertifikalar arasında boşluk olabilir'], [hole && slots > 1 ? 'Slot 2 gets only one acceptance; later slots can still be chosen.' : 'Every displayed slot receives a majority of acceptances.', hole && slots > 1 ? '2. konum yalnız bir kabul aldı; sonraki konum yine seçilebilir.' : 'Gösterilen her konum kabul çoğunluğu aldı.'], blocks.map((n, i) => ({ ...n, value: chosen[i] ? '3/3' : '1/3', status: chosen[i] ? 'success' : 'warning' }))),
    F(['Apply a contiguous prefix', 'Kesintisiz öneği uygula'], ['A state machine cannot skip an unknown earlier command.', 'Durum makinesi bilinmeyen önceki komutu atlayamaz.'], blocks.map((n, i) => ({ ...n, status: i < prefix ? 'success' : 'warning', value: i < prefix ? '✓' : chosen[i] ? 'QC' : '∅' })), [], [M('Applied prefix length', 'Uygulanan önek uzunluğu', prefix)]),
    F(prefix === slots ? ['The application catches up', 'Uygulama güncele ulaştı'] : ['Later work waits behind the gap', 'Sonraki iş boşluğun arkasında bekliyor'], ['Chosen and applied describe different progress.', 'Seçilmiş ve uygulanmış, farklı ilerleme durumlarıdır.'], blocks.map((n, i) => ({ ...n, status: i < prefix ? 'success' : 'warning' })), [], [M('Chosen slots', 'Seçilen konum', chosen.filter(Boolean).length), M('Applied slots', 'Uygulanan konum', prefix)]),
  ], 'Chosen slots: ' + chosen.filter(Boolean).length + '; applied prefix: ' + prefix + '.', 'Seçilen konum: ' + chosen.filter(Boolean).length + '; uygulanan önek: ' + prefix + '.');
}
function zabScene(p: Params): SimulationTrace {
  const crash = bool(p, 'crash'), followers = I(p, 'followers', 2, 0, 2), catchup = p.catchup !== false;
  const acks = crash ? 0 : 1 + (followers >= 1 ? 1 : 0) + (followers === 2 && catchup ? 1 : 0), committed = acks >= 2, newQuorum = crash && followers === 2 && catchup;
  const ns = [N('A', 'A', -4, 0, '1:1'), N('B', 'B', 0, 0, '1:1', followers >= 1 ? 'idle' : 'muted'), N('C', 'C', 4, 0, '1:0', followers === 2 ? 'idle' : 'muted')];
  const item = N('entry', 'Z', -4, -2, '1:2', 'active', 'block');
  return T([
    F(['An epoch orders the log', 'Dönem, günlüğü sıralar'], ['A and B know committed zxid 1:1. C is behind.', 'A ve B, commit edilmiş 1:1 zxid kaydını bilir. C geridedir.'], ns),
    F(['Synchronize before following', 'Takipten önce eşitle'], [catchup ? 'The lagging follower installs the committed prefix if it is reachable.' : 'C remains behind and cannot acknowledge the new ordered suffix yet.', catchup ? 'Gerideki takipçi erişilebiliyorsa commit öneğini kurar.' : 'C geride kaldı; yeni sıralı son kaydı henüz onaylayamaz.'], ns.map(n => n.id === 'C' && catchup && followers === 2 ? { ...n, value: '1:1', status: 'active' } : n), catchup && followers === 2 ? [connect('A', 'C')] : []),
    F(['Propose the next zxid', 'Sonraki zxid kaydını öner'], ['The leader writes 1:2 locally before collecting acknowledgments.', 'Lider, onay toplamadan önce 1:2 kaydını yerelde yazar.'], [...ns, item], [connect('A', 'entry')]),
    F(crash ? ['The leader fails before acknowledgments', 'Lider onaylardan önce çöktü'] : ['Collect acknowledgments', 'Onayları topla'], [crash ? 'Only the failed leader has this uncommitted tail.' : 'A majority is needed before broadcasting commit.', crash ? 'Bu commit edilmemiş son kayıt yalnız çöken liderde.' : 'Commit yayını öncesinde çoğunluk gerekir.'], [...mark(ns, ['A'], crash ? 'error' : 'active'), item], crash ? [] : ['B', ...(followers === 2 && catchup ? ['C'] : [])].slice(0, Math.max(0, acks - 1)).map(id => connect(id, 'A')), [M('Acknowledgments', 'Onay', acks), M('Required', 'Gereken', 2)]),
    F(crash ? newQuorum ? ['Install the surviving prefix', 'Yaşayan öneği kur'] : ['A synchronized quorum is missing', 'Eşitlenmiş çoğunluk eksik'] : committed ? ['Broadcast commit in order', 'Commit’i sırayla yayımla'] : ['The proposal stays pending', 'Öneri bekliyor'], [crash ? 'The old committed prefix survives; a lone unacknowledged tail is not a commit.' : 'Followers deliver only the committed ordered prefix.', crash ? 'Eski commit öneği korunur; tek onaysız son kayıt commit değildir.' : 'Takipçiler yalnız commit edilmiş sıralı öneği teslim eder.'], ns.map(n => ({ ...n, value: committed ? '1:2' : n.id === 'C' && !catchup ? '1:0' : '1:1', status: crash && n.id === 'A' ? 'muted' : committed || newQuorum ? 'success' : 'warning' })), newQuorum ? [connect('B', 'C', 'success')] : []),
    F(['Observe the delivered prefix', 'Teslim edilen öneği gözle'], ['Local storage, acknowledgment and commitment are separate milestones.', 'Yerel kayıt, onay ve commit ayrı aşamalardır.'], ns.map(n => ({ ...n, value: n.id === 'C' ? catchup && followers === 2 ? committed ? '1:2' : '1:1' : '1:0' : committed ? '1:2' : '1:1', status: crash && n.id === 'A' ? 'muted' : 'idle' })), [], [M('Last committed zxid', 'Son commit zxid', committed ? '1:2' : '1:1'), M('New epoch installed', 'Yeni dönem kuruldu', newQuorum ? '✓' : '—')]),
  ], committed ? 'The quorum commits 1:2 after the existing prefix.' : 'The committed prefix remains 1:1; the uncommitted tail is not delivered.', committed ? 'Çoğunluk mevcut önekten sonra 1:2’yi commit etti.' : 'Commit öneği 1:1 kaldı; commit edilmemiş son kayıt teslim edilmez.');
}
export interface ViewReport { id: string; view: number; log: string[]; commit: number }
export function selectViewLog(reports: ViewReport[]): ViewReport | undefined { return [...reports].sort((a, b) => b.view - a.view || b.log.length - a.log.length || a.id.localeCompare(b.id))[0]; }
function vrScene(p: Params): SimulationTrace {
  const backups = I(p, 'backups', 2, 0, 2), fail = bool(p, 'leaderFail'), stale = p.staleTail !== false, available = fail ? backups : backups + 1, enough = available >= 2;
  const reports: ViewReport[] = [{ id: 'B', view: 1, log: ['X1', 'X2'], commit: 2 }, { id: 'C', view: stale ? 0 : 1, log: stale ? ['X1', 'X2', 'Z3'] : ['X1', 'X2'], commit: 2 }];
  const selected = enough ? selectViewLog(fail ? reports.slice(0, backups) : [{ id: 'A', view: 1, log: ['X1', 'X2'], commit: 2 }, ...reports.slice(0, backups)]) : undefined;
  const ns = ['A', 'B', 'C'].map((id, i) => N(id, id, -4.4, (i - 1) * 2.2, 'v=' + (i === 2 && stale ? 0 : 1), i === 0 && fail || i > backups ? 'muted' : 'idle'));
  const cells = (installed: boolean) => ns.flatMap((n, i) => [{ ...n, value: installed && enough && n.status !== 'muted' ? 'v=' + (fail ? 2 : 1) : n.value }, N(n.id + '1', '#1', -1.6, (i - 1) * 2.2, 'X1', 'success', 'block'), N(n.id + '2', '#2', 1, (i - 1) * 2.2, 'X2', 'success', 'block'), ...(i === 2 && stale && !(installed && enough) ? [N('C3', '#3', 3.5, 2.2, 'Z3', 'warning', 'block')] : [])]);
  return T([
    F(['A committed prefix is shared', 'Commit öneği paylaşılır'], ['X1 and X2 are committed; C may also hold an uncommitted old-view tail.', 'X1 ve X2 commit edilmiş; C’de eski görünümden commit edilmemiş son kayıt da olabilir.'], cells(false)),
    F(fail ? ['The primary stops', 'Lider durdu'] : ['The current primary coordinates', 'Mevcut lider eşgüdüm sağlar'], ['A view number identifies which primary may order operations.', 'Görünüm numarası, hangi liderin işlemleri sıralayabileceğini belirler.'], cells(false), [], [M('Available replicas', 'Erişilebilir kopya', available)]),
    F(['Gather a quorum of state reports', 'Durum raporu çoğunluğu topla'], ['View change cannot safely install a log from one arbitrary replica.', 'Görünüm değişimi, rastgele tek kopyadan günlüğü güvenle kuramaz.'], ns, fail ? reports.slice(0, backups).filter(r => r.id !== 'B').map(r => connect(r.id, 'B')) : ns.slice(1, backups + 1).map(n => connect(n.id, 'A')), [M('Quorum reached', 'Çoğunluk oluştu', enough ? '✓' : '✕')]),
    F(['Compare view, then log length', 'Önce görünümü, sonra uzunluğu karşılaştır'], ['A longer old-view tail does not outrank a higher last-normal view.', 'Eski görünümün uzun son kaydı, yüksek son-normal görünümden üstün değildir.'], cells(false), [], [M('Selected report', 'Seçilen rapor', selected?.id ?? '∅'), M('Selected view', 'Seçilen görünüm', selected?.view ?? '—')]),
    F(enough ? ['Install the selected safe prefix', 'Seçilen güvenli öneği kur'] : ['Wait for another replica', 'Başka kopyayı bekle'], ['Already committed operations stay in their original order.', 'Commit edilmiş işlemler ilk sıralarını korur.'], cells(enough), [], [M('Committed prefix length', 'Commit öneği uzunluğu', 2)]),
    F(['Resume only with quorum evidence', 'Yalnız çoğunluk kanıtıyla devam et'], ['This trace preserves X1,X2 through the primary change.', 'Bu iz, lider değişimi boyunca X1,X2 öneğini korur.'], cells(enough), [], [M('New view active', 'Yeni görünüm etkin', fail && enough ? '✓' : fail ? '✕' : '—'), M('Commit index', 'Commit indeksi', 2)]),
  ], enough ? 'The selected log keeps the committed prefix X1,X2.' : 'Insufficient replicas: the model retains its previous committed prefix and waits.', enough ? 'Seçilen günlük, commit edilmiş X1,X2 öneğini korur.' : 'Kopyalar yetersiz; model önceki commit öneğini korur ve bekler.');
}

export const lamportReceive = (local: number, received: number): number => Math.max(local, received) + 1;
export function vectorReceive(local: number[], received: number[], receiver: number): number[] { const next = local.map((v, i) => Math.max(v, received[i])); next[receiver]++; return next; }
export function vectorRelation(a: number[], b: number[]): 'before' | 'after' | 'equal' | 'concurrent' {
  const le = a.every((v, i) => v <= b[i]), ge = a.every((v, i) => v >= b[i]);
  return le && ge ? 'equal' : le ? 'before' : ge ? 'after' : 'concurrent';
}
function lamportScene(p: Params): SimulationTrace {
  const extra = I(p, 'localEvents', 1, 0, 3), delay = I(p, 'delay', 1, 0, 2), sent = extra + 1, before = delay + 1, received = lamportReceive(before, sent), forwarded = received + 1, c = lamportReceive(0, forwarded);
  const clocks = (a: number, b: number, cc: number) => [N('A', 'A', -4, -2, String(a), 'idle', 'clock'), N('B', 'B', 0, 0, String(b), 'idle', 'clock'), N('C', 'C', 4, 2, String(cc), 'idle', 'clock')];
  return T([
    F(['Start with local events', 'Yerel olaylarla başla'], ['Each process advances its own logical clock.', 'Her süreç kendi mantıksal saatini ilerletir.'], clocks(extra, 0, 0), [], [M('Extra A events', 'Ek A olayı', extra)]),
    F(['Sending is an event too', 'Gönderim de bir olaydır'], ['A increments its clock and attaches that value to the message.', 'A saatini artırır ve değeri mesaja ekler.'], [...clocks(sent, 0, 0), N('m', 'm', -2.2, -1, String(sent), 'active', 'token')], [connect('A', 'm'), connect('m', 'B')]),
    F(['B keeps working during the delay', 'B gecikme sırasında çalışır'], ['Network delay need not stop local logical time.', 'Ağ gecikmesi, yerel mantıksal zamanı durdurmaz.'], clocks(sent, before, 0), [], [M('B before receive', 'Alımdan önce B', before)]),
    F(['Receive with max + 1', 'max + 1 ile al'], ['B must move beyond both its local value and the message timestamp.', 'B, hem yerel değerinin hem mesaj damgasının ötesine geçmeli.'], mark(clocks(sent, received, 0), ['B'], 'active'), [connect('A', 'B', 'success', String(sent))], [M('B after receive', 'Alımdan sonra B', received)]),
    F(['The causal chain continues', 'Nedensel zincir sürer'], ['B increments for a send; C then merges and increments on receive.', 'B gönderirken artırır; C alırken birleştirip artırır.'], clocks(sent, forwarded, c), [connect('B', 'C', 'success', String(forwarded))]),
    F(['Causality implies increasing timestamps', 'Nedensellik artan damga getirir'], ['The reverse implication does not hold: scalar order alone does not prove causation.', 'Tersi geçmez: tek sayı sırası, nedenselliği tek başına kanıtlamaz.'], clocks(sent, forwarded, c), [connect('A', 'B', 'success'), connect('B', 'C', 'success')], [M('Send < receive', 'Gönderim < alım', sent < received && forwarded < c ? '✓' : '✕')]),
  ], 'The receive rule preserves the order of this causal chain.', 'Alım kuralı bu nedensel zincirin sırasını korur.');
}
function vectorScene(p: Params): SimulationTrace {
  const independent = p.concurrent !== false, extra = I(p, 'extra', 1, 0, 2), a = [extra + 1, 0, 0], initialB = [0, 1, 0], bb = independent ? initialB : vectorReceive(initialB, a, 1), cc = vectorReceive([0, 0, 0], bb, 2), relation = vectorRelation(a, bb);
  const actors = (av: number[], bv: number[], cv: number[]) => [N('A', 'A', -4, -1, vec(av), 'idle', 'clock'), N('B', 'B', 0, -1, vec(bv), 'idle', 'clock'), N('C', 'C', 4, 1, vec(cv), 'idle', 'clock')];
  return T([
    F(['One component per process', 'Her süreç için bir bileşen'], ['A process increments only its own component for local events.', 'Süreç, yerel olayda yalnız kendi bileşenini artırır.'], actors([0,0,0], [0,0,0], [0,0,0])),
    F(['Independent events create separate knowledge', 'Bağımsız olaylar ayrı bilgi oluşturur'], ['A and B each record their local work.', 'A ile B yerel işlerini ayrı kaydeder.'], actors(a, initialB, [0,0,0]), [], [M('A local events', 'A yerel olayı', a[0])]),
    F(independent ? ['Keep the events independent', 'Olayları bağımsız tut'] : ['B receives A’s history', 'B, A’nın geçmişini alır'], [independent ? 'Neither process has observed the other event.' : 'B merges each component with max, then increments B.', independent ? 'Hiçbir süreç diğerinin olayını görmedi.' : 'B her bileşeni max ile birleştirir, sonra B’yi artırır.'], actors(a, bb, [0,0,0]), independent ? [] : [connect('A', 'B')]),
    F(['Compare component by component', 'Bileşen bileşen karşılaştır'], [relation === 'concurrent' ? 'A is larger in one component and B in another: concurrent.' : 'A’s vector is no greater in every component and smaller in at least one: A precedes B.', relation === 'concurrent' ? 'Bir bileşende A, diğerinde B büyük: eşzamanlı.' : 'A her bileşende küçük veya eşit, en az birinde küçük: A, B’den önce.'], mark(actors(a, bb, [0,0,0]), ['A','B'], 'active'), [], [M('Vector relation', 'Vektör bağıntısı', relation === 'concurrent' ? 'A ∥ B' : 'A → B')]),
    F(['C receives B’s knowledge', 'C, B’nin bilgisini alır'], ['C keeps maxima and increments its own component.', 'C maksimumları tutar ve kendi bileşenini artırır.'], actors(a, bb, cc), [connect('B','C','success')]),
    F(['The vector records what is known', 'Vektör, bilinen geçmişi kaydeder'], ['Equal sums would not imply equal histories. Compare the components.', 'Eşit toplam, eşit geçmiş demek değildir. Bileşenleri karşılaştır.'], actors(a, bb, cc), [], [M('B precedes C', 'B, C’den önce', vectorRelation(bb, cc) === 'before' ? '✓' : '✕')]),
  ], relation === 'concurrent' ? 'A and B are concurrent; C includes B’s causal history.' : 'A precedes B, and B precedes C.', relation === 'concurrent' ? 'A ile B eşzamanlı; C, B’nin nedensel geçmişini içerir.' : 'A, B’den; B de C’den önce.');
}
export function canCausalDeliver(delivered: number[], timestamp: number[], sender: number): boolean {
  return timestamp[sender] === delivered[sender] + 1 && timestamp.every((v, i) => i === sender || v <= delivered[i]);
}
function causalScene(p: Params): SimulationTrace {
  const reorder = p.reorder !== false, dependency = p.dependency !== false;
  const messages = [{ id: 'm1', sender: 0, stamp: [1,0,0] }, { id: 'm2', sender: 1, stamp: dependency ? [1,1,0] : [0,1,0] }];
  const order = reorder ? [1,0] : [0,1], delivered = [0,0,0], queue: number[] = [], applied: string[] = [];
  const ns = [N('A','A',-4,-2,'[1,0,0]'), N('B','B',0,-2,vec(messages[1].stamp)), N('C','C',4,1,'[0,0,0]')];
  const visual = () => [...ns.map(n => n.id === 'C' ? { ...n, value: vec(delivered) } : n), ...queue.map((idx, i) => N(messages[idx].id, messages[idx].id, 1 + i * 1.8, 2.8, vec(messages[idx].stamp), 'warning', 'token'))];
  const receive = (index: number) => { queue.push(index); let changed = true; while (changed) { changed = false; for (let i = 0; i < queue.length; i++) { const message = messages[queue[i]]; if (canCausalDeliver(delivered, message.stamp, message.sender)) { delivered[message.sender]++; applied.push(message.id); queue.splice(i,1); changed = true; break; } } } };
  const frames = [
    F(['A broadcasts a first message', 'A ilk mesajı yayımlar'], ['Delivery counters track broadcasts from each sender.', 'Teslim sayaçları, her gönderenin yayınlarını izler.'], ns, [connect('A','B','active','m1')]),
    F(dependency ? ['B replies after seeing m1', 'B, m1’i gördükten sonra yanıtlar'] : ['B broadcasts independently', 'B bağımsız yayın yapar'], [dependency ? 'm2 carries a dependency on A’s first broadcast.' : 'm2 does not depend on A’s broadcast.', dependency ? 'm2, A’nın ilk yayınına bağımlılık taşır.' : 'm2, A’nın yayınına bağımlı değil.'], ns, dependency ? [connect('A','B','success','m1')] : [], [M('B depends on A', 'B, A’ya bağlı', dependency ? '✓' : '✕')]),
  ];
  receive(order[0]);
  frames.push(F(['The first packet reaches C', 'İlk paket C’ye ulaştı'], [queue.length ? 'C buffers it because a causal dependency is missing.' : 'All delivery conditions hold, so C can apply it.', queue.length ? 'Nedensel bağımlılık eksik; C paketi bekletir.' : 'Teslim koşulları sağlandı; C uygulayabilir.'], visual(), [connect(messages[order[0]].sender === 0 ? 'A':'B','C',queue.length ? 'warning':'success',messages[order[0]].id)], [M('Buffered messages','Bekleyen mesaj',queue.length),M('Applied order','Uygulanan sıra',applied.join('→') || '∅')]));
  frames.push(F(['Check the dependency frontier', 'Bağımlılık sınırını kontrol et'], ['The sender counter must be next; other counters must already be known.', 'Gönderen sayacı sıradaki olmalı; diğer sayaçlar zaten bilinmeli.'], visual(), [], [M('C delivery vector','C teslim vektörü',vec(delivered))]));
  receive(order[1]);
  frames.push(F(['The remaining packet arrives', 'Kalan paket geldi'], ['After each delivery, C checks buffered messages again.', 'Her teslimden sonra C, bekleyen mesajları yeniden kontrol eder.'], visual(), [connect(messages[order[1]].sender === 0 ? 'A':'B','C','success',messages[order[1]].id)], [M('Applied order','Uygulanan sıra',applied.join('→'))]));
  frames.push(F(['Causal order is preserved', 'Nedensel sıra korundu'], [dependency ? 'm1 is applied before its dependent reply m2.' : 'Independent messages may be delivered in either order.', dependency ? 'm1, ona bağlı m2 yanıtından önce uygulanır.' : 'Bağımsız mesajlar iki sırada da teslim edilebilir.'], visual(), [], [M('Buffered messages','Bekleyen mesaj',queue.length)]));
  return T(frames,'Application order: '+applied.join(' → ')+'.','Uygulama sırası: '+applied.join(' → ')+'.');
}
export function requestOrder(a: { time: number; id: string }, b: { time: number; id: string }): number { return a.time - b.time || a.id.localeCompare(b.id); }
function lamportMutexScene(p: Params): SimulationTrace {
  const concurrent = p.concurrent !== false, offline = bool(p,'offline'), queue = concurrent ? 'A→B' : 'A', replies = offline ? 1 : 2;
  const ns = [N('A','A',-3.5,-1,'(1,A)'),N('B','B',3.5,-1,concurrent?'(1,B)':'∅'),N('C','C',0,3,'∅',offline?'muted':'idle')], resource = N('CS','CS',0,-1,'∅','idle','gate');
  const all = [...ns,resource];
  return T([
    F(['Broadcast timestamped requests','Damgalı istekleri yayımla'],['Requests use timestamp and ID to establish one order.','İstekler, tek sıra için damga ve kimlik kullanır.'],all,[connect('A','B'),connect('A','C'),...(concurrent?[connect('B','A'),connect('B','C')]:[])]),
    F(['Replicas maintain the same queue order','Kopyalar aynı kuyruk sırasını tutar'],['Equal timestamps are ordered by process ID.','Eşit damgalar süreç kimliğiyle sıralanır.'],ns.map(n=>({...n,value:queue})),[],[M('Queue','Kuyruk',queue)]),
    F(['Wait for every peer’s acknowledgment','Her eşin onayını bekle'],['A needs replies from B and C, even when A is first.','A ilk olsa bile B ve C’den yanıt gerekir.'],all,[connect('B','A','success'),connect('C','A',offline?'warning':'success')],[M('A replies','A yanıtı',replies),M('Required replies','Gereken yanıt',2)]),
    F(offline?['No entry without C','C olmadan giriş yok']:['A enters first','Önce A girer'],[offline?'A remains outside the critical section.':'A is at the queue head and has every reply.',offline?'A kritik bölgenin dışında kalır.':'A kuyruk başında ve tüm yanıtları aldı.'],[...ns,{...resource,value:offline?'∅':'A',status:offline?'warning':'success'}],offline?[]:[connect('A','CS','success')]),
    F(offline?['The queue stays blocked','Kuyruk bekliyor']:['A releases its request','A isteğini serbest bırakır'],['RELEASE removes the completed request from every local queue.','RELEASE, bitmiş isteği her yerel kuyruktan çıkarır.'],all,offline?[]:[connect('A','B','active','RELEASE'),connect('A','C','active','RELEASE')]),
    F(offline?['Missing permission stops progress','Eksik izin ilerlemeyi durdurur']:concurrent?['B can enter next','Sırada B girebilir']:['The resource is free again','Kaynak yeniden boş'],['At most one process holds the critical section.','Kritik bölgeyi en fazla bir süreç tutar.'],[...ns,{...resource,value:offline?'∅':concurrent?'B':'∅',status:offline?'warning':'success'}],!offline&&concurrent?[connect('B','CS','success')]:[],[M('Concurrent holders','Aynı andaki sahip',offline||!concurrent?0:1)]),
  ],offline?'A missing reply blocks this fault-free mutual exclusion protocol.':'Timestamp order and release keep entries exclusive.',offline?'Eksik yanıt, bu hatasız ağ varsayımlı dışlama protokolünü durdurur.':'Damga sırası ve serbest bırakma, girişleri tekil tutar.');
}
function ricartScene(p: Params): SimulationTrace {
  const aTime=I(p,'aTime',2,1,4),offline=bool(p,'offline'),winner=requestOrder({time:aTime,id:'A'},{time:2,id:'B'})<=0?'A':'B',loser=winner==='A'?'B':'A';
  const ns=[N('A','A',-3.6,-1,'('+aTime+',A)'),N('B','B',3.6,-1,'(2,B)'),N('C','C',0,3,'∅',offline?'muted':'idle')],resource=N('CS','CS',0,-1,'∅','idle','gate');
  return T([
    F(['A and B request together','A ile B birlikte ister'],['Both requests carry logical timestamps.','İki istek de mantıksal damga taşır.'],[...ns,resource],[connect('A','B'),connect('B','A')]),
    F(['Compare the request pair','İstek çiftini karşılaştır'],['The smaller (timestamp,ID) pair has priority.','Küçük (damga,kimlik) çifti önceliklidir.'],mark(ns,[winner],'active'),[],[M('First request','İlk istek',winner)]),
    F(['Reply to the earlier request','Önceki isteği yanıtla'],['The later requester grants permission; the earlier requester defers its reply.','Sonraki isteyen izin verir; önceki isteyen yanıtını erteler.'],ns,[connect(loser,winner,'success','REPLY'),connect(winner,loser,'warning','…')]),
    F(['Collect every required reply','Gereken tüm yanıtları topla'],['The neutral third process must also grant permission.','Tarafsız üçüncü süreç de izin vermeli.'],[...ns,resource],[connect('C',winner,offline?'warning':'success','REPLY')],[M('Permission replies','İzin yanıtı',offline?1:2),M('Required','Gereken',2)]),
    F(offline?['Permission remains incomplete','İzin eksik kaldı']:['The first requester enters','İlk isteyen girer'],['No majority shortcut is used in this algorithm.','Bu algoritmada çoğunluk kestirmesi yoktur.'],[...ns,{...resource,value:offline?'∅':winner,status:offline?'warning':'success'}],offline?[]:[connect(winner,'CS','success')]),
    F(offline?['Wait for C','C’yi bekle']:['Exit and send the deferred reply','Çık ve ertelenen yanıtı gönder'],[offline?'Neither requester can enter safely in this trace.':'The waiting requester can enter after the first exits.',offline?'Bu izde iki isteyen de güvenle giremez.':'İlk çıkanın ardından bekleyen isteyen girebilir.'],[...ns,{...resource,value:offline?'∅':loser,status:offline?'warning':'success'}],offline?[]:[connect(winner,loser,'success','REPLY')],[M('Concurrent holders','Aynı andaki sahip',offline?0:1)]),
  ],offline?'A missing peer blocks permission.':winner+' enters before '+loser+'; the deferred reply is released on exit.',offline?'Eksik eş izni durdurur.':winner+', '+loser+' öncesinde girer; ertelenen yanıt çıkışta verilir.');
}
function tokenScene(p: Params): SimulationTrace {
  const requester=str(p,'requester','B')==='C'?'C':'B',lost=bool(p,'tokenLost'),index=requester==='B'?1:2,rn=[0,0,0],ln=[0,0,0];rn[index]=1;
  const ns=[N('A','A',-4,0,'RN=0'),N('B','B',0,-2.5,'RN=0'),N('C','C',4,0,'RN=0')],token=N('token','T',-4,1.5,'LN=[0,0,0]','active','token');
  const heldToken:VisualNode={...token,position:lost?token.position:[requester==='B'?0:4,0,requester==='B'?-1:1.5]};
  const updated=ns.map(n=>({...n,value:n.id===requester?'RN=1':'RN=0'}));
  const frames=[
    F(['A holds the unique token','A tek jetonu tutar'],['Only the token holder can enter the critical section.','Kritik bölgeye yalnız jeton sahibi girebilir.'],[...ns,token]),
    F(['Broadcast a numbered request','Numaralı isteği yayımla'],['The requester increments its RN counter to 1.','İsteyen, RN sayacını 1’e artırır.'],updated,ns.filter(n=>n.id!==requester).map(n=>connect(requester,n.id,'active','1')),[M('Request vector','İstek vektörü',vec(rn))]),
    F(lost?['The token is lost','Jeton kayboldu']:['Queue an outstanding request','Bekleyen isteği kuyruğa al'],['RN[j]=LN[j]+1 identifies one unserved request.','RN[j]=LN[j]+1, hizmet almamış tek isteği belirler.'],[...updated,{...token,status:lost?'error':'active',value:lost?'∅':'Q=['+requester+']'}],[],[M('Live tokens','Canlı jeton',lost?0:1)]),
    F(lost?['Do not invent another token','Yeni jeton uydurma']:['Transfer the existing token','Mevcut jetonu aktar'],['Token ownership moves; it is never copied.','Jeton sahipliği taşınır; kopyalanmaz.'],[...updated,{...heldToken,status:lost?'muted':'success'}],lost?[]:[connect('A',requester,'success','T')]),
  ];
  if(!lost)ln[index]=1;
  frames.push(F(lost?['The requester waits','İsteyen bekler']:['Record the served request','Hizmet verilen isteği kaydet'],['After exit, the token records the served request in LN.','Çıkıştan sonra jeton, hizmet verilen isteği LN’de kaydeder.'],[...updated,{...heldToken,value:'LN='+vec(ln),status:lost?'muted':'success'}],[],[M('Served vector','Hizmet vektörü',vec(ln))]));
  frames.push(F(['A repeated request is not new work','Yinelenen istek yeni iş değildir'],[lost?'Lost-token recovery needs a separate safe protocol.':'RN equals LN for this requester, so replaying request 1 adds no new service.',lost?'Kayıp jeton için ayrı güvenli toparlanma protokolü gerekir.':'Bu isteyenin RN ve LN’si eşit; 1 numaralı isteği yinelemek yeni hizmet eklemez.'],[...updated,{...heldToken,value:'LN='+vec(ln),status:lost?'muted':'success'}],[],[M('Unserved requests','Hizmet almamış istek',rn[index]-ln[index])]));
  return T(frames,lost?'No token remains, so no process enters.':'One token serves request 1 exactly once.',lost?'Jeton kalmadı; hiçbir süreç girmez.':'Tek jeton, 1 numaralı isteğe tam bir kez hizmet verir.');
}
export interface RingMessage { from: number; to: number; candidate: number }
export function ringElection(ids: number[], initiator: number, concurrent=false) {
  const participant=ids.map((_,i)=>concurrent||i===initiator);
  let messages:RingMessage[]=ids.flatMap((id,i)=>participant[i]?[{from:i,to:(i+1)%ids.length,candidate:id}]:[]),winner:number|undefined;
  const rounds:RingMessage[][]=[];
  for(let round=0;round<ids.length*3&&winner===undefined;round++){
    rounds.push(messages.map(m=>({...m})));const next:RingMessage[]=[];
    for(const m of messages){const at=m.to;if(m.candidate===ids[at]){winner=ids[at];continue;}if(m.candidate>ids[at]){participant[at]=true;next.push({from:at,to:(at+1)%ids.length,candidate:m.candidate});}else if(!participant[at]){participant[at]=true;next.push({from:at,to:(at+1)%ids.length,candidate:ids[at]});}}
    messages=next;
  }
  return {winner,rounds};
}
function ringElectionScene(p:Params):SimulationTrace {
  const ids=[2,5,1,4,3],initiator=I(p,'initiator',1,0,4),concurrent=bool(p,'concurrent'),r=ringElection(ids,initiator,concurrent);
  const ns=ids.map((id,i)=>({...N('p'+i,String(id),0,0,'ID='+id),position:ringPosition(i,5,4)}));
  const ring=ns.map((n,i)=>connect(n.id,ns[(i+1)%5].id,'muted'));
  const step=(index:number)=>{const messages=r.rounds[Math.min(index,r.rounds.length-1)]??[];return F(['Identifiers move clockwise','Kimlikler saat yönünde ilerler'],['Forward a larger ID. Suppress an inferior participant’s candidate.','Büyük kimliği ilet. Katılmış sürecin küçük adayını bastır.'],ns,messages.map(m=>connect('p'+m.from,'p'+m.to,'active',String(m.candidate))),[M('Round','Tur',Math.min(index+1,r.rounds.length)),M('Messages','Mesaj',messages.length)]);};
  const winnerIndex=ids.indexOf(r.winner??-1);
  return T([
    F(['A directed ring of unique IDs','Benzersiz kimlikli yönlü halka'],[concurrent?'Every process starts an election.':'One process initiates; the others can join when a candidate arrives.',concurrent?'Her süreç seçim başlatır.':'Bir süreç başlatır; diğerleri aday geldiğinde katılabilir.'],mark(ns,concurrent?ns.map(n=>n.id):['p'+initiator],'active'),ring,[M('Initiator ID','Başlatan kimliği',ids[initiator])]),
    step(0),step(1),step(Math.floor(r.rounds.length/2)),
    F(['The maximum returns to its owner','En büyük kimlik sahibine döner'],['Receiving its own candidate after a full circuit identifies the winner.','Tam turdan sonra kendi adayını almak kazananı belirler.'],mark(ns,['p'+winnerIndex],'success'),r.rounds.at(-1)!.map(m=>connect('p'+m.from,'p'+m.to,'success',String(m.candidate))),[M('Winner','Kazanan',r.winner??'∅')]),
    F(['Announce the elected ID','Seçilen kimliği duyur'],['The ring is reliable in this model; no failure repair is implied.','Bu modelde halka güvenilirdir; hata onarımı ima edilmez.'],mark(ns,['p'+winnerIndex],'success'),ring.map(l=>({...l,status:'success',label:String(r.winner)})),[M('Leader ID','Lider kimliği',r.winner??'∅')]),
  ],'Maximum ID '+r.winner+' is elected.','En büyük '+r.winner+' kimliği seçildi.');
}
function bullyScene(p:Params):SimulationTrace {
  const initiator=I(p,'initiator',2,1,4),down=p.crashedHighest!==false,winner=down?4:5;
  const ns=Array.from({length:5},(_,i)=>N('p'+(i+1),String(i+1),(i-2)*2.2,0,'ID='+(i+1),down&&i===4?'muted':'idle'));
  const higher=ns.filter((_,i)=>i+1>initiator),responders=higher.filter((_,i)=>Number(higher[i].label)<=winner);
  return T([
    F(['Priorities are process IDs','Öncelik, süreç kimliğidir'],['Every process knows the possible higher-priority peers.','Her süreç, olası yüksek öncelikli eşleri bilir.'],mark(ns,['p'+initiator],'active'),[],[M('Initiator','Başlatan',initiator)]),
    F(['Ask every higher ID','Her yüksek kimliğe sor'],['An election message challenges all higher-priority processes.','Seçim mesajı, tüm yüksek öncelikli süreçlere gider.'],ns,higher.map(n=>connect('p'+initiator,n.id,'active','ELECT'))),
    F(['Responsive higher peers answer','Yanıtlayan yüksek eşler karşılık verir'],['An OK reply tells the initiator to yield the election.','OK yanıtı, başlatana seçimi devretmesini söyler.'],ns,responders.map(n=>connect(n.id,'p'+initiator,'success','OK')),[M('Higher replies','Yüksek eş yanıtı',responders.length)]),
    F(['Higher processes repeat the election','Yüksek süreçler seçimi yineler'],[down?'Process 5 never replies; the timeout model treats it as failed.':'Process 5 has no higher rival.',down?'5 yanıtlamaz; zaman aşımı modeli onu hatalı sayar.':'5’in daha yüksek rakibi yoktur.'],mark(ns,['p'+winner],'active'),down?[connect('p4','p5','warning','…')]:[],[M('Highest responsive ID','En yüksek yanıtlayan kimlik',winner)]),
    F(['The winner announces itself','Kazanan kendini duyurur'],['The highest responsive process becomes coordinator.','En yüksek yanıtlayan süreç koordinatör olur.'],mark(ns,['p'+winner],'success'),ns.filter(n=>Number(n.label)<winner).map(n=>connect('p'+winner,n.id,'success','COORD'))),
    F(['Timing assumptions matter','Zamanlama varsayımları önemlidir'],['False suspicions or partitions can create competing leaders; they are outside this trace.','Yanlış şüphe veya bölünme rakip lider yaratabilir; bu izin dışındadır.'],mark(ns,['p'+winner],'success'),[],[M('Coordinator','Koordinatör',winner)]),
  ],'The highest responsive ID is '+winner+'.','En yüksek yanıtlayan kimlik '+winner+'.');
}
export function snapshotMoney(amount:number,inFlight:boolean){return {a:inFlight?10:10+amount,b:6-amount,c:0,channel:inFlight?amount:0,total:16};}
function snapshotScene(p:Params):SimulationTrace {
  const amount=I(p,'amount',3,1,5),inFlight=p.inFlight!==false,s=snapshotMoney(amount,inFlight);
  const ns=(a:number,bb:number)=>[N('A','A',-4,-1,String(a)),N('B','B',4,-1,String(bb)),N('C','C',0,3,'0')];
  const transfer=N('money','m',0,-1,String(amount),'active','token'),channel=N('channel','B→A',0,-3,String(s.channel),s.channel?'active':'idle','data');
  return T([
    F(['Start with a conserved total','Korunan toplamla başla'],['A holds 10, B holds 6, C holds 0.','A’da 10, B’de 6, C’de 0 var.'],ns(10,6),[],[M('Total value','Toplam değer',16)]),
    F(['B sends a payment','B ödeme gönderir'],['B subtracts the payment before A necessarily receives it.','B, A henüz almamış olsa da ödemeyi düşer.'],[...ns(inFlight?10:10+amount,6-amount),...(inFlight?[transfer]:[])],[connect('B','A','active',String(amount))]),
    F(['A records its local state','A yerel durumunu kaydeder'],[inFlight?'A records 10 while the payment is still in flight.':'The payment already arrived, so A records its increased balance.',inFlight?'Ödeme yoldayken A, 10 kaydeder.':'Ödeme zaten geldi; A artmış bakiyesini kaydeder.'],mark(ns(s.a,s.b),['A'],'success'),[connect('A','B','active','MARK'),connect('A','C','active','MARK')],[M('Recorded A','Kaydedilen A',s.a)]),
    F(['Markers define channel boundaries','İşaretçiler kanal sınırını belirler'],['B records its balance and sends a marker after its earlier payment on the FIFO channel.','B bakiyesini kaydeder; FIFO kanalda önceki ödemeden sonra işaretçi gönderir.'],mark(ns(s.a,s.b),['A','B','C'],'success'),[connect('B','A','active','MARK')],[M('Recorded B','Kaydedilen B',s.b)]),
    F(['Record messages between the boundaries','Sınırlar arasındaki mesajları kaydet'],[inFlight?'A receives the payment after its snapshot but before B’s marker, so the channel records it.':'No payment crosses the snapshot boundary; the recorded channel is empty.',inFlight?'A, ödemeyi kendi kaydından sonra, B işaretçisinden önce alır; kanal onu kaydeder.':'Ödeme görüntü sınırını kesmez; kaydedilen kanal boş.'],[...ns(10+amount,6-amount),channel],[connect('B','channel','active'),connect('channel','A','active')],[M('Recorded channel','Kaydedilen kanal',s.channel)]),
    F(['Add local snapshots and channel state','Yerel görüntü ve kanal durumunu topla'],['The consistent snapshot preserves the total without stopping the computation.','Tutarlı görüntü, hesabı durdurmadan toplamı korur.'],[...ns(s.a,s.b).map(n=>({...n,status:'success' as Status})),{...channel,status:'success'}],[],[M('Recorded total','Kaydedilen toplam',s.a+s.b+s.c+s.channel,'success')]),
  ],'Recorded balances plus channel state equal 16.','Kaydedilen bakiyeler ile kanal durumu toplamı 16.');
}
export function terminationState(delay:boolean,extra:boolean){const obligations=delay?1:0;return {obligations,terminated:obligations===0,jobs:extra?3:2};}
function terminationScene(p:Params):SimulationTrace {
  const delay=p.delay!==false,extra=p.extraWork!==false,r=terminationState(delay,extra);
  const ns=[N('A','A',-4.5,0,'1'),N('B','B',-.8,0,'0'),N('C','C',3.8,-2,'0'),...(extra?[N('D','D',3.8,2,'0')]:[])];
  return T([
    F(['The root starts a computation','Kök hesabı başlatır'],['Delegating work creates an acknowledgment obligation.','İş devretmek, onay borcu oluşturur.'],mark(ns,['A'],'active')),
    F(['Work diffuses down a tree','İş ağaç boyunca yayılır'],['A activates B; B activates C and optionally D.','A, B’yi; B de C’yi ve isteğe bağlı D’yi etkinleştirir.'],ns.map(n=>({...n,value:'1',status:'active'})),[connect('A','B'),connect('B','C'),...(extra?[connect('B','D')]:[])],[M('Delegated jobs','Devredilen iş',r.jobs)]),
    F(['Local work can finish first','Yerel iş önce bitebilir'],['B cannot discharge its parent obligation while children remain outstanding.','Çocuk borçları sürerken B üstüne olan borcu kapatamaz.'],ns.map(n=>({...n,value:'0',status:'warning'})),[],[M('Locally active workers','Yerelde etkin çalışan',0)]),
    F(['Return child acknowledgments','Çocuk onaylarını geri gönder'],[delay?'C’s acknowledgment remains in flight.':'Every child acknowledgment arrives.',delay?'C’nin onayı yolda kalır.':'Her çocuk onayı ulaşır.'],ns,[connect('C','B',delay?'warning':'success','ACK'),...(extra?[connect('D','B','success','ACK')]:[])],[M('Unresolved child obligations','Kapanmamış çocuk borcu',r.obligations)]),
    F(delay?['B still owes its parent','B’nin üstüne borcu sürüyor']:['B acknowledges completion to A','B, A’ya tamamlanma onayı verir'],['A child acknowledges only when it is passive and its children are accounted for.','Çocuk, yalnız pasifken ve alt borçları kapanınca onaylar.'],ns,[connect('B','A',delay?'warning':'success',delay?'…':'ACK')]),
    F(r.terminated?['The root can declare termination','Kök sonlanma ilan edebilir']:['Idle does not mean terminated','Boş olmak sonlanmak değildir'],['The root must be passive with every delegated obligation discharged.','Kök pasif olmalı ve devredilen tüm borçlar kapanmalı.'],ns.map(n=>({...n,value:'0',status:r.terminated?'success':'warning'})),[],[M('Termination detected','Sonlanma tespit edildi',r.terminated?'✓':'✕',r.terminated?'success':'warning')]),
  ],r.terminated?'All work and acknowledgment obligations are complete.':'One delayed acknowledgment prevents termination detection.',r.terminated?'Tüm işler ve onay borçları tamamlandı.':'Geciken tek onay, sonlanma tespitini engelliyor.');
}

function gossipScene(p:Params):SimulationTrace {
  const fanout=I(p,'fanout',1,1,3),partition=bool(p,'partition'),random=rng(I(p,'seed',3,1,8)),ns=P(8,4.2),known=new Set([0]);
  const visual=()=>ns.map((n,i)=>({...n,value:known.has(i)?'v1':'∅',status:known.has(i)?'success' as Status:'idle' as Status}));
  const frames:Frame[]=[F(['One peer knows the update','Güncellemeyi tek eş biliyor'],['Each round starts from the information already received.','Her tur, önceden alınmış bilgiden başlar.'],visual(),[],[M('Informed peers','Bilgili eş',1),M('Disconnected groups','Kopuk grup',partition?2:1)])];
  for(let round=1;round<=5;round++){
    const senders=[...known],links:VisualLink[]=[];
    for(const sender of senders){
      const candidates=ns.map((_,i)=>i).filter(i=>i!==sender&&(!partition||Math.floor(i/4)===Math.floor(sender/4)));
      for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
      for(const target of candidates.slice(0,fanout)){known.add(target);links.push(connect(ns[sender].id,ns[target].id,'active','v1'));}
    }
    frames.push(F(['Push round '+round,'İtme turu '+round],[round===5?partition?'The other component remains unreachable.':'This finite sample shows spread, not a convergence proof.':'Informed peers contact a seeded selection of neighbors.',round===5?partition?'Diğer bileşene hâlâ erişilemiyor.':'Bu sonlu örnek yayılımı gösterir; yakınsama kanıtı değildir.':'Bilgili eşler, tohumla seçilen komşulara ulaşır.'],visual(),links,[M('Informed peers','Bilgili eş',known.size),M('Contacts per sender','Gönderen başına iletişim',fanout)]));
  }
  return T(frames,known.size+'/8 peers know the update after five rounds.', 'Beş tur sonunda '+known.size+'/8 eş güncellemeyi biliyor.');
}
function swimScene(p:Params):SimulationTrace {
  const crashed=bool(p,'crash'),delayed=p.delay!==false,indirect=p.indirect!==false,directOK=!crashed&&!delayed,indirectOK=!crashed&&!directOK&&indirect,suspect=!directOK&&!indirectOK;
  const ns=P(4,3.7).map(n=>({...n,value:'i=1'}));
  return T([
    F(['Probe one member','Tek üyeyi yokla'],['A sends a direct ping to B.','A, B’ye doğrudan ping gönderir.'],ns,[connect('A','B','active','PING')]),
    F(directOK?['The direct acknowledgment arrives','Doğrudan onay geldi']:['The direct probe times out','Doğrudan yoklama zaman aşımında'],['A timeout cannot distinguish a slow path from a crashed process.','Zaman aşımı, yavaş yolu çöken süreçten ayıramaz.'],ns,[connect('B','A',directOK?'success':'warning',directOK?'ACK':'…')],[M('Direct acknowledgment','Doğrudan onay',directOK?'✓':'✕')]),
    F(['Try independent helpers','Bağımsız yardımcıları dene'],[indirect&&!directOK?'C and D probe B through other paths.':'This trace does not need or enable an indirect probe.',indirect&&!directOK?'C ve D, B’yi başka yollardan yoklar.':'Bu iz dolaylı yoklamayı gerektirmiyor veya etkinleştirmiyor.'],ns,indirect&&!directOK?[connect('A','C','active','PING-REQ'),connect('A','D','active','PING-REQ'),connect('C','B'),connect('D','B')]:[],[M('Indirect probing enabled','Dolaylı yoklama etkin',indirect?'✓':'✕')]),
    F(suspect?['Mark B as suspected','B’yi şüpheli işaretle']:['B remains reachable','B erişilebilir kaldı'],['Suspicion is temporary and can be refuted.','Şüphe geçicidir ve çürütülebilir.'],mark(ns,['B'],suspect?'warning':'success'),indirectOK?[connect('B','C','success','ACK'),connect('C','A','success','ACK')]:[],[M('Suspected','Şüpheli',suspect?'✓':'✕')]),
    F(suspect&&!crashed?['B refutes with a newer incarnation','B yeni incarnation ile çürütür']:crashed?['No refutation arrives','Çürütme gelmedi']:['No suspicion needs refutation','Çürütülecek şüphe yok'],[suspect&&!crashed?'B is alive; its later i=2 message overrides stale i=1 suspicion.':crashed?'The crashed process cannot send a refutation.':'A direct or indirect response confirmed reachability.',suspect&&!crashed?'B canlı; sonraki i=2 mesajı eski i=1 şüphesini geçersiz kılar.':crashed?'Çöken süreç çürütme gönderemez.':'Doğrudan veya dolaylı yanıt erişimi doğruladı.'],ns.map(n=>n.id==='B'?{...n,value:suspect&&!crashed?'i=2':'i=1',status:crashed?'warning':'success'}:n),suspect&&!crashed?[connect('B','A','success','i=2')]:[]),
    F(crashed?['The suspicion period expires','Şüphe süresi doldu']:['B is retained as alive','B canlı olarak tutuldu'],['This is a bounded failure-detector example, not proof that every timeout is accurate.','Bu sınırlı hata algılayıcı örneğidir; her zaman aşımının doğru olduğunun kanıtı değildir.'],mark(ns.map(n=>n.id==='B'?{...n,value:suspect&&!crashed?'i=2':'i=1'}:n),['B'],crashed?'error':'success'),[],[M('B reachable in this schedule','Bu planda B erişilebilir',crashed?'✕':'✓')]),
  ],crashed?'B is marked failed after an unrefuted suspicion timeout.':suspect?'B refutes the false suspicion with a higher incarnation.':'A probe response keeps B alive.',crashed?'B, çürütülmeyen şüphe süresi sonunda hatalı işaretlenir.':suspect?'B, yanlış şüpheyi yüksek incarnation ile çürütür.':'Yoklama yanıtı B’yi canlı tutar.');
}
export const clockwiseDistance=(from:number,to:number,size=16)=>(to-from+size)%size;
export function chordSuccessor(key:number,members:number[]):number{return [...members].sort((a,b)=>a-b).find(n=>n>=key)??Math.min(...members);}
export function chordFingers(node:number,members:number[]):number[]{return [1,2,4,8].map(offset=>chordSuccessor((node+offset)%16,members));}
export function chordRoute(key:number,start:number,members:number[]):{path:number[];owner:number}{
  const sorted=[...members].sort((a,b)=>a-b),path=[start];let current=start;
  for(let step=0;step<sorted.length+2;step++){
    if(current===key)break;
    const next=sorted[(sorted.indexOf(current)+1)%sorted.length],distance=clockwiseDistance(current,key);
    if(distance>0&&distance<=clockwiseDistance(current,next)){path.push(next);current=next;break;}
    const preceding=chordFingers(current,sorted).filter(n=>clockwiseDistance(current,n)>0&&clockwiseDistance(current,n)<distance).sort((a,b)=>clockwiseDistance(current,b)-clockwiseDistance(current,a))[0]??next;
    if(path.includes(preceding))break;current=preceding;path.push(current);
  }
  return {path,owner:current};
}
function chordScene(p:Params):SimulationTrace {
  const members=bool(p,'join')?[0,4,8,10,12]:[0,4,8,12],raw=Number(str(p,'start','0')),start=members.includes(raw)?raw:0,key=I(p,'key',11,0,15),r=chordRoute(key,start,members),fingers=chordFingers(start,members);
  const ns=members.map(id=>({...N('n'+id,String(id),0,0,String(id)),position:ringPosition(id,16,4.2)})),k=N('key','k',0,0,String(key),'active','data');
  const ring=members.map((id,i)=>connect('n'+id,'n'+members[(i+1)%members.length],'muted'));
  const routeLinks=r.path.slice(1).map((id,i)=>connect('n'+r.path[i],'n'+id,'active',String(key)));
  return T([
    F(['Place nodes on the identifier ring','Düğümleri kimlik halkasına koy'],['Ownership goes to the first node clockwise from the key, including an exact match.','Sahiplik, tam eşleşme dahil anahtardan saat yönündeki ilk düğüme gider.'],[...ns,k],ring,[M('Key','Anahtar',key),M('Nodes','Düğüm',members.length)]),
    F(['Build exponentially spaced fingers','Üstel aralıklı parmakları kur'],['Finger i points to successor(node + 2ⁱ).','i parmağı successor(düğüm + 2ⁱ) konumuna gider.'],[...ns,k],[...new Set(fingers)].map(id=>connect('n'+start,'n'+id,'active')),[M('Start fingers','Başlangıç parmakları',fingers.join(','))]),
    F(['Choose the closest preceding finger','En yakın önceleyen parmağı seç'],['A jump must move clockwise toward the key without passing it.','Sıçrama, anahtarı geçmeden saat yönünde ona yaklaşmalı.'],mark([...ns,k],['n'+start],'active'),routeLinks.slice(0,1),[M('Start','Başlangıç',start)]),
    F(['Repeat at the next node','Sonraki düğümde yinele'],['When the key lies before or at the immediate successor, use that successor.','Anahtar doğrudan ardıla kadarki aralıktaysa o ardılı kullan.'],[...ns,k],routeLinks.slice(0,2),[M('Hops','Sıçrama',Math.min(2,r.path.length-1))]),
    F(['Complete the lookup path','Arama yolunu tamamla'],['The finite ring uses exact stabilized finger tables.','Sonlu halka, tam ve kararlı parmak tablolarını kullanır.'],mark([...ns,k],r.path.map(id=>'n'+id),'active'),routeLinks,[M('Route','Yol',r.path.join('→'))]),
    F(['The successor owns the key','Ardıl anahtara sahip'],['Wraparound is part of the same clockwise rule.','Halka başına dönüş, aynı saat yönü kuralının parçasıdır.'],mark([...ns,k],['n'+r.owner],'success'),[connect('key','n'+r.owner,'success')],[M('Owner','Sahip',r.owner),M('Total hops','Toplam sıçrama',r.path.length-1)]),
  ],'Key '+key+' belongs to node '+r.owner+'.','Anahtar '+key+', '+r.owner+' düğümüne ait.');
}
export const KADEMLIA_IDS=[0,1,3,4,7,8,12,15];
export function kademliaContacts(id:number):number[]{
  const buckets=new Map<number,number[]>();for(const other of KADEMLIA_IDS){if(other===id)continue;const bit=Math.floor(Math.log2(id^other));buckets.set(bit,[...(buckets.get(bit)??[]),other]);}
  return [...buckets.values()].flatMap(bucket=>bucket.sort((a,b)=>(id^a)-(id^b)).slice(0,2));
}
export function kademliaLookup(target:number,alpha:number,failed:boolean){
  const known=new Set([0,1,8,12]),queried=new Set<number>(),responsive=new Set<number>();
  const rounds:{queries:number[];responses:number[];known:number[];responsive:number[]}[]=[];
  for(let round=0;round<4;round++){
    const queries=[...known].filter(id=>!queried.has(id)).sort((a,b)=>(a^target)-(b^target)).slice(0,alpha),responses:number[]=[];
    for(const id of queries){queried.add(id);if(failed&&id===8)continue;responsive.add(id);responses.push(id);for(const peer of kademliaContacts(id).sort((a,b)=>(a^target)-(b^target)).slice(0,3))known.add(peer);}
    rounds.push({queries,responses,known:[...known],responsive:[...responsive]});
  }
  const nearest=[...responsive].sort((a,b)=>(a^target)-(b^target))[0];
  return {nearest,rounds};
}
function kademliaScene(p:Params):SimulationTrace {
  const target=I(p,'target',10,0,15),alpha=I(p,'alpha',2,1,3),failed=bool(p,'failed'),r=kademliaLookup(target,alpha,failed),ns=KADEMLIA_IDS.map((id,i)=>({...N('n'+id,id.toString(2).padStart(4,'0'),0,0,'d='+(id^target)),position:ringPosition(i,KADEMLIA_IDS.length,4.3)})),requester=N('requester','Q',0,0,target.toString(2).padStart(4,'0'),'active','node');
  const frames:Frame[]=[F(['Order contacts by XOR distance','Eşleri XOR uzaklığına göre sırala'],['The requester begins with four contacts, not complete knowledge of the network.','İstemci tüm ağı değil, dört başlangıç eşini bilir.'],[...ns.map(n=>({...n,status:[0,1,8,12].some(id=>n.id==='n'+id)?'active' as Status:'muted' as Status})),requester],[],[M('Target','Hedef',target),M('Parallel queries','Paralel sorgu',alpha)])];
  r.rounds.forEach((round,i)=>frames.push(F(['Lookup round '+(i+1),'Arama turu '+(i+1)],['Ask unqueried close contacts; their local buckets reveal additional candidates.','Sorgulanmamış yakın eşlere sor; yerel bucket’ları ek adayları gösterir.'],[...ns.map(n=>{const id=Number(n.id.slice(1));return {...n,status:failed&&id===8&&r.rounds.slice(0,i+1).some(previous=>previous.queries.includes(id))?'error' as Status:round.responses.includes(id)?'success' as Status:round.known.includes(id)?'active' as Status:'muted' as Status};}),requester],round.queries.map(id=>connect('requester','n'+id,failed&&id===8?'warning':'active','FIND')),[M('Queries this round','Bu tur sorgu',round.queries.length),M('Known contacts','Bilinen eş',round.known.length)])));
  frames.push(F(['Keep the closest responsive peer','En yakın yanıtlayan eşi tut'],['A failed contact does not become a successful lookup result.','Yanıtlamayan eş, başarılı arama sonucu olamaz.'],[...mark(ns.map(n=>failed&&n.id==='n8'&&r.rounds.some(round=>round.queries.includes(8))?{...n,status:'error' as Status}:n),['n'+r.nearest],'success'),requester],[connect('requester','n'+r.nearest,'success')],[M('Closest responsive ID','En yakın yanıtlayan kimlik',r.nearest),M('XOR distance','XOR uzaklığı',r.nearest^target)]));
  return T(frames,'Closest responsive peer: '+r.nearest+' at XOR distance '+(r.nearest^target)+'.','En yakın yanıtlayan eş: '+r.nearest+'; XOR uzaklığı '+(r.nearest^target)+'.');
}
export interface HashToken { owner:string; position:number }
export function hashTokens(servers:string[],virtual:number):HashToken[]{const bases:Record<string,number>={A:2,B:24,C:45,D:14};return servers.flatMap(owner=>Array.from({length:virtual},(_,i)=>({owner,position:(bases[owner]+Math.floor(64/virtual)*i)%64}))).sort((a,b)=>a.position-b.position||a.owner.localeCompare(b.owner));}
export const keyPosition=(key:string)=>hash32(key)%64;
export function consistentOwner(key:string,servers:string[],virtual=1):string {const tokens=hashTokens(servers,virtual),position=keyPosition(key);return (tokens.find(t=>t.position>=position)??tokens[0]).owner;}
function hashingScene(p:Params):SimulationTrace {
  const count=I(p,'keys',8,4,12),join=p.join!==false,virtual=I(p,'virtual',1,1,3),before=['A','B','C'],after=join?[...before,'D']:before,keys=Array.from({length:count},(_,i)=>'k'+i),old=keys.map(k=>consistentOwner(k,before,virtual)),next=keys.map(k=>consistentOwner(k,after,virtual)),moved=keys.filter((_,i)=>old[i]!==next[i]);
  const servers=(names:string[])=>names.map((id,i)=>({...N(id,id,0,0,String(next.filter(owner=>owner===id).length),'idle','node',.8),position:ringPosition(i,names.length,4,.8)}));
  const particles=(owners:string[])=>keys.map((key,i)=>({...N(key,key,0,0,owners[i],'idle','data'),position:ringPosition(keyPosition(key),64,2.5)}));
  const tokens=(names:string[])=>hashTokens(names,virtual).map((t,i)=>({...N('v'+i,t.owner+':'+t.position,0,0,t.owner,'muted','token'),position:ringPosition(t.position,64,5)}));
  return T([
    F(['Hash keys onto a stable ring','Anahtarları sabit halkaya hashle'],['Hash positions do not change when a server joins.','Sunucu katılınca hash konumları değişmez.'],[...servers(before),...particles(old)],[],[M('Keys','Anahtar',count)]),
    F(['Assign clockwise token ownership','Saat yönü jeton sahipliğini ata'],['Each key belongs to the next clockwise token.','Her anahtar sonraki saat yönü jetonuna aittir.'],[...servers(before),...particles(old),...tokens(before)],[],[M('Tokens per server','Sunucu başına jeton',virtual)]),
    F(join?['D adds its tokens','D jetonlarını ekler']:['Keep the membership unchanged','Üyeliği aynı tut'],['Existing tokens retain their positions.','Mevcut jetonlar konumlarını korur.'],[...servers(after),...particles(old),...tokens(after)]),
    F(['Recompute only ownership','Yalnız sahipliği yeniden hesapla'],['The same hash positions now see the updated successor tokens.','Aynı hash konumları, güncel ardıl jetonlarını görür.'],[...servers(after),...particles(next)],moved.map(key=>connect(key,'D','active')),[M('Moved keys','Taşınan anahtar',moved.length)]),
    F(['Inspect the moved intervals','Taşınan aralıkları incele'],['Adding D can move a key to D; it does not move a key from A to B.','D eklemek anahtarı D’ye taşıyabilir; A’dan B’ye taşımaz.'],[...servers(after),...particles(next).map(n=>({...n,status:moved.includes(n.id)?'warning' as Status:'success' as Status}))],[],[M('Unchanged keys','Değişmeyen anahtar',count-moved.length)]),
    F(['Virtual tokens distribute ownership','Sanal jetonlar sahipliği dağıtır'],['More tokens can smooth placement; this tiny example is not a load-balance guarantee.','Çok jeton yerleşimi dengeleyebilir; küçük örnek yük dengesi garantisi değildir.'],[...servers(after),...particles(next)],[],after.map(id=>M(id+' keys',id+' anahtarı',next.filter(owner=>owner===id).length))),
  ],moved.length+' keys move; every changed owner is the joining server D.',moved.length+' anahtar taşınır; değişen her sahip yeni D sunucusudur.');
}
export function quorumIntersection(read:number[],write:number[]):number[]{return read.filter(id=>write.includes(id));}
function quorumScene(p:Params):SimulationTrace {
  const read=I(p,'read',3,1,5),write=I(p,'write',3,1,5),opposite=bool(p,'opposite'),writes=Array.from({length:write},(_,i)=>i),reads=Array.from({length:read},(_,i)=>opposite?5-read+i:i),common=quorumIntersection(reads,writes),guaranteed=read+write>5,returned=common.length?1:0;
  const ns=P(5,4).map((n,i)=>({...n,value:writes.includes(i)?'v1':'v0'})),client=N('Q','Q',0,0,'?','active');
  return T([
    F(['One key, five replicas','Tek anahtar, beş kopya'],['Every replica begins at version 0.','Her kopya 0. sürümle başlar.'],ns.map(n=>({...n,value:'v0'}))),
    F(['Complete a write at W replicas','W kopyada yazmayı tamamla'],['The first W replicas acknowledge version 1 in this example.','Bu örnekte ilk W kopya 1. sürümü onaylar.'],[...ns,client],writes.map(i=>connect('Q',ns[i].id,'success','v1')),[M('Write acknowledgments W','Yazma onayı W',write)]),
    F(['Collect R read responses','R okuma yanıtı topla'],['A read sees only the selected responders.','Okuma yalnız seçilen yanıtlayanları görür.'],[...ns,client],reads.map(i=>connect(ns[i].id,'Q','active',ns[i].value)),[M('Read responses R','Okuma yanıtı R',read)]),
    F(['Find the actual intersection','Gerçek kesişimi bul'],['Common replicas connect this read to the completed write.','Ortak kopyalar, okumayı tamamlanmış yazmaya bağlar.'],mark(ns,common.map(i=>ns[i].id),'success'),[],[M('Shared replicas','Ortak kopya',common.length)]),
    F(['Choose the newest observed version','Görülen en yeni sürümü seç'],['Ordered version metadata is assumed for this single-writer example.','Tek yazanlı örnek için sıralı sürüm bilgisi varsayılır.'],[...ns,{...client,value:'v'+returned,status:returned?'success':'warning'}],[],[M('Read version','Okunan sürüm',returned),M('R + W > N','R + W > N',guaranteed?'✓':'✕')]),
    F(['Separate arithmetic from a full protocol','Aritmetiği tam protokolden ayır'],[guaranteed?'Every possible R/W set pair intersects at these sizes.':'These sizes permit a disjoint pair, even if this particular read happened to intersect.',guaranteed?'Bu boyutlarda her olası R/W küme çifti kesişir.':'Bu okuma kesişse bile bu boyutlar ayrık çifte izin verir.'],[...ns,client],[],[M('Intersection guaranteed','Kesişim garantili',guaranteed?'✓':'✕',guaranteed?'success':'warning')]),
  ],'The read observes v'+returned+'. Set intersection alone is not a complete linearizability guarantee.','Okuma v'+returned+' gördü. Küme kesişimi tek başına tam linearizability garantisi değildir.');
}
export function readRepairState(updated:number,read:number,repair:boolean){const before=Array.from({length:3},(_,i)=>i<updated?1:0),responders=Array.from({length:read},(_,i)=>3-read+i),value=Math.max(...responders.map(i=>before[i])),after=before.map((v,i)=>repair&&responders.includes(i)?value:v);return {before,responders,value,after};}
function repairScene(p:Params):SimulationTrace {
  const r=readRepairState(I(p,'updated',1,1,3),I(p,'read',3,1,3),p.repair!==false),repair=p.repair!==false;
  const nodes=(values:number[])=>values.map((v,i)=>N(String.fromCharCode(65+i),String.fromCharCode(65+i),(i-1)*4,0,'v'+v)),reader=N('Q','Q',0,3,'?');
  return T([
    F(['Replicas can hold different versions','Kopyalar farklı sürüm tutabilir'],['Some replicas missed the latest update.','Bazı kopyalar son güncellemeyi kaçırdı.'],nodes(r.before)),
    F(['Read from selected responders','Seçilen yanıtlayanlardan oku'],['The read contacts the last R replicas in this model.','Bu modelde okuma son R kopyaya ulaşır.'],[...nodes(r.before),reader],r.responders.map(i=>connect(String.fromCharCode(65+i),'Q','active')),[M('Responses','Yanıt',r.responders.length)]),
    F(['Compare observed versions','Görülen sürümleri karşılaştır'],['The largest returned version wins this single-writer comparison.','Tek yazanlı karşılaştırmada dönen en büyük sürüm kazanır.'],[...nodes(r.before),{...reader,value:'v'+r.value,status:'active'}],[],[M('Highest observed version','Görülen en yüksek sürüm',r.value)]),
    F(repair?['Send the observed winner back','Görülen kazananı geri gönder']:['Return without repairing','Onarmadan dön'],['Uncontacted replicas are not repaired by this read.','Sorgulanmayan kopyalar bu okumayla onarılmaz.'],[...nodes(r.before),reader],repair?r.responders.filter(i=>r.before[i]<r.value).map(i=>connect('Q',String.fromCharCode(65+i),'success','v'+r.value)):[]),
    F(['Inspect the replica states','Kopya durumlarını incele'],['Only stale responding replicas receive the repair.','Onarımı yalnız eski yanıtlayan kopyalar alır.'],nodes(r.after),[],[M('Replicas at v1','v1 kopyası',r.after.filter(v=>v===1).length)]),
    F(['A read cannot recover an unseen update','Okuma görülmeyen güncellemeyi bulamaz'],['If all responders were stale, the read had no newer version to repair.','Tüm yanıtlayanlar eskiyse okumanın onaracak yeni sürümü yoktur.'],[...nodes(r.after),{...reader,value:'v'+r.value,status:r.value?'success':'warning'}],[],[M('Returned version','Dönen sürüm',r.value),M('Repair enabled','Onarım etkin',repair?'✓':'✕')]),
  ],'The read returns v'+r.value+'; replica versions end at '+r.after.join(',')+'.','Okuma v'+r.value+' döner; kopya sürümleri '+r.after.join(',')+' olur.');
}
function handoffScene(p:Params):SimulationTrace {
  const time=I(p,'downtime',2,1,3),ttl=I(p,'ttl',3,1,4),recover=p.recover!==false,delivered=recover&&time<ttl;
  const ns=[N('A','A',-4,-1,'v1'),N('B','B',0,-1,'v1'),N('C','C',4,-1,'v0','muted'),N('D','D',0,3,'∅')],hint=N('hint','→C',2,2,'v1 · t<'+ttl,'warning','data');
  return T([
    F(['One intended replica is missing','Hedef kopyalardan biri kayıp'],['C is unavailable when version 1 arrives.','1. sürüm geldiğinde C erişilemiyor.'],ns,[connect('A','B','success','v1'),connect('A','C','warning','…')]),
    F(['Store a hint with its destination','İpucunu hedefiyle sakla'],['D keeps the missed value and the intended replica C.','D, kaçan değeri ve hedef C kopyasını saklar.'],[...ns,hint],[connect('A','D','active'),connect('D','hint','active')]),
    F(['Advance the bounded clock','Sınırlı saati ilerlet'],['The hint has a discrete expiry, independent of C’s return.','İpucunun süresi, C’nin dönüşünden bağımsızdır.'],[...ns,hint,N('clock','t',-3.5,2,String(time),'active','clock')],[],[M('Return/observation time','Dönüş/gözlem zamanı',time),M('Hint expires at','İpucunun son zamanı',ttl)]),
    F(recover?['C reconnects','C yeniden bağlandı']:['C stays unavailable','C erişilemez kaldı'],[delivered?'C returns before expiry, so D can replay the missed write.':recover?'The hint has expired; another repair mechanism is needed.':'D cannot deliver to a still-unavailable destination.',delivered?'C süreden önce döner; D kaçan yazmayı iletebilir.':recover?'İpucunun süresi doldu; başka onarım gerekir.':'D, hâlâ erişilemeyen hedefe teslim edemez.'],[...ns.map(n=>n.id==='C'?{...n,status:recover?'active' as Status:'muted' as Status}:n),{...hint,status:time>=ttl?'muted':'warning'}],delivered?[connect('D','C','success','v1')]:[]),
    F(delivered?['Acknowledge the handoff','Teslimi onayla']:['The replica remains stale','Kopya eski kaldı'],['Successful delivery permits removing this hint.','Başarılı teslim, bu ipucunun silinmesini sağlar.'],ns.map(n=>n.id==='C'?{...n,value:delivered?'v1':'v0',status:delivered?'success':'warning'}:n),delivered?[connect('C','D','success','ACK')]:[]),
    F(['Hints are temporary delivery aids','İpuçları geçici teslim yardımıdır'],['Anti-entropy can repair misses that outlive the hint window.','Anti-entropy, ipucu süresini aşan eksikleri onarabilir.'],ns.map(n=>n.id==='C'?{...n,value:delivered?'v1':'v0',status:delivered?'success':'warning'}:n),[],[M('C updated by hint','C ipucuyla güncellendi',delivered?'✓':'✕',delivered?'success':'warning')]),
  ],delivered?'C receives v1 before the hint expires.':'C is not repaired by this expired or undeliverable hint.',delivered?'C, ipucu süresi dolmadan v1 alır.':'Süresi dolmuş veya teslim edilemeyen ipucu C’yi onarmadı.');
}
export function merkleTeachingLevels(values:number[]):number[][]{const levels=[values.map(v=>hash32('leaf:'+v))];while(levels.at(-1)!.length>1){const prev=levels.at(-1)!,next:number[]=[];for(let i=0;i<prev.length;i+=2)next.push(hash32('node:'+prev[i]+':'+prev[i+1]));levels.push(next);}return levels;}
export function merkleDifferences(a:number[],b:number[]){const aa=merkleTeachingLevels(a),bb=merkleTeachingLevels(b),differences:number[]=[];let comparisons=0;const visit=(level:number,index:number)=>{comparisons++;if(aa[level][index]===bb[level][index])return;if(level===0){differences.push(index);return;}visit(level-1,index*2);visit(level-1,index*2+1);};visit(aa.length-1,0);return {differences,comparisons,a:aa,b:bb};}
function antiEntropyScene(p:Params):SimulationTrace {
  const first=I(p,'leaf',5,0,7),count=I(p,'changes',1,1,3),repair=p.repair!==false,a=Array.from({length:8},(_,i)=>i+10),b=[...a];for(let i=0;i<count;i++)b[(first+i)%8]+=10;const r=merkleDifferences(a,b),after=repair?[...a]:b;
  const tree=(prefix:string,values:number[])=>{const levels=merkleTeachingLevels(values),nodes:VisualNode[]=[],links:VisualLink[]=[];levels.forEach((level,depth)=>level.forEach((h,i)=>{const center=prefix==='a'?-3:3,x=center+(i-(level.length-1)/2)*(5/level.length),z=2.4-depth*1.8;nodes.push(N(prefix+depth+'_'+i,depth===0?String(i):'H'+depth,x,z,depth===0?String(values[i]):h.toString(16).slice(0,6),'idle',depth===0?'data':'block',depth*.35));if(depth>0){links.push(connect(prefix+(depth-1)+'_'+(i*2),prefix+depth+'_'+i,'muted'));links.push(connect(prefix+(depth-1)+'_'+(i*2+1),prefix+depth+'_'+i,'muted'));}}));return {nodes,links};};
  const ta=tree('a',a),tb=tree('b',b),tf=tree('b',after),ns=[...ta.nodes,...tb.nodes],edges=[...ta.links,...tb.links],leafIDs=r.differences.flatMap(i=>['a0_'+i,'b0_'+i]);
  return T([
    F(['Two replicas, a few different leaves','İki kopya, birkaç farklı yaprak'],['A is the authoritative single-writer state in this example.','Bu örnekte A, tek yazanlı yetkili durumdur.'],ns.filter(n=>n.id.includes('0_'))),
    F(['Build hashes bottom up','Hashleri aşağıdan yukarı kur'],['Each parent hashes its ordered pair of child digests.','Her ata, sıralı iki çocuk özetini hashler.'],ns,edges),
    F(['Compare roots, then differing subtrees','Kökleri, sonra farklı alt ağaçları karşılaştır'],['Matching subtree hashes stop recursion for that region.','Eşleşen alt ağaç hashi o bölgede özyinelemeyi durdurur.'],mark(ns,['a3_0','b3_0'],'warning'),edges,[M('Hash comparisons','Hash karşılaştırması',r.comparisons)]),
    F(['Locate the exact divergent leaves','Farklı yaprakları tam bul'],['Only mismatching subtrees are descended into.','Yalnız uyuşmayan alt ağaçlara inilir.'],ns.map(n=>({...n,status:leafIDs.includes(n.id)?'error':'muted'})),[],[M('Divergent leaves','Farklı yaprak',r.differences.length)]),
    F(repair?['Transfer the divergent values','Farklı değerleri aktar']:['Inspect without repair','Onarmadan incele'],['Conflict resolution is separate; A wins here by the stated single-writer assumption.','Çatışma çözümü ayrıdır; belirtilen tek yazan varsayımıyla burada A kazanır.'],[...ta.nodes,...tf.nodes],repair?r.differences.map(i=>connect('a0_'+i,'b0_'+i,'success')):[]),
    F(repair?['The rebuilt roots match','Yenilenen kökler eşleşti']:['The roots still differ','Kökler hâlâ farklı'],['These teaching hashes demonstrate comparison, not cryptographic collision resistance.','Öğretim hashleri karşılaştırmayı gösterir; kriptografik çakışma direnci değildir.'],[...ta.nodes,...tf.nodes].filter(n=>n.id.includes('3_')||n.id.includes('0_')).map(n=>({...n,status:repair?'success':'warning'})),[],[M('Matching roots','Eşleşen kökler',merkleTeachingLevels(a)[3][0]===merkleTeachingLevels(after)[3][0]?'✓':'✕')]),
  ],repair?r.differences.length+' divergent leaves repaired; the roots match.':'Divergent leaves were located but not repaired.',repair?r.differences.length+' farklı yaprak onarıldı; kökler eşleşti.':'Farklı yapraklar bulundu; onarılmadı.');
}

export function twoPCOutcome(no:boolean,crash:boolean,recover:boolean){const votes=[true,true,!no],prepared=[true,true,!no];const decision:'commit'|'abort'|'blocked'=crash?recover?'abort':'blocked':no?'abort':'commit';return {votes,prepared,decision};}
function twoPCScene(p:Params):SimulationTrace {
  const no=bool(p,'no'),crash=p.crash!==false,recover=bool(p,'recover'),r=twoPCOutcome(no,crash,recover);
  const ns=[N('A','A',-4,1,'∅'),N('B','B',0,1,'∅'),N('C','C',4,1,'∅')],co=N('co','K',0,-2.6,'∅');
  const prepared=ns.map((n,i)=>({...n,value:r.votes[i]?'YES':'NO',status:r.votes[i]?'active' as Status:'error' as Status}));
  const finalNodes=prepared.map((n,i)=>({...n,value:!r.votes[i]?'A':r.decision==='commit'?'C':r.decision==='abort'?'A':'?',status:r.decision==='blocked'&&r.votes[i]?'warning' as Status:r.decision==='commit'?'success' as Status:'error' as Status}));
  return T([
    F(['Ask every participant to prepare','Her katılımcıdan hazırlık iste'],['Preparing promises that a yes-voter can follow a later commit or abort decision.','Hazırlık, evetçinin sonraki commit veya abort kararını izleyebilmesini vaat eder.'],[...ns,co],ns.map(n=>connect('co',n.id,'active','PREPARE'))),
    F(['Record durable votes','Kalıcı oyları kaydet'],['One no vote rules out commit. Yes is not yet commit.','Tek hayır oyu commit’i dışlar. Evet henüz commit değildir.'],[...prepared,co],prepared.map((n,i)=>connect(n.id,'co',r.votes[i]?'success':'error',r.votes[i]?'YES':'NO')),[M('Yes votes','Evet oyu',r.votes.filter(Boolean).length),M('Required yes votes','Gereken evet',3)]),
    F(['Prepared voters retain their obligations','Hazır oy verenler yükümlülüğünü korur'],['A participant that voted yes must not independently forget the pending transaction.','Evet diyen katılımcı bekleyen işlemi bağımsızca unutamaz.'],[...prepared,co],[],[M('Prepared participants','Hazır katılımcı',r.prepared.filter(Boolean).length)]),
    F(crash?['Coordinator fails before decision logging','Koordinatör karar kaydından önce çöker']:['The coordinator logs its decision','Koordinatör kararı kaydeder'],[crash?'No durable commit decision exists in this failure schedule.':no?'Unanimity failed, so the decision is abort.':'All three voted yes, so the coordinator can record commit.',crash?'Bu hata planında kalıcı commit kararı yoktur.':no?'Oybirliği sağlanmadı; karar abort.':'Üçü de evet dedi; koordinatör commit kaydedebilir.'],[...prepared,{...co,value:crash?'∅':no?'A':'C',status:crash?'error':'active'}]),
    F(crash&&!recover?['Yes-voters remain in doubt','Evetçiler belirsizlikte kalır']:crash?['Recovery conservatively aborts','Toparlanma temkinli olarak abort eder']:['Broadcast the durable decision','Kalıcı kararı yayımla'],[crash&&!recover?'Peer-to-peer termination is omitted; a reachable no-voter could otherwise establish abort.':crash?'There was no logged decision, so this recovery policy aborts.':'Participants apply the same recorded outcome.',crash&&!recover?'Katılımcılar arası sonlandırma yoktur; erişilen hayırcı aksi halde abort’u belirleyebilirdi.':crash?'Kaydedilmiş karar yoktu; bu toparlanma kuralı abort eder.':'Katılımcılar aynı kayıtlı sonucu uygular.'],[...finalNodes,{...co,status:crash&&!recover?'muted':'active',value:r.decision==='blocked'?'∅':r.decision==='commit'?'C':'A'}],r.decision==='blocked'?[]:ns.map(n=>connect('co',n.id,r.decision==='commit'?'success':'warning',r.decision==='commit'?'COMMIT':'ABORT'))),
    F(r.decision==='blocked'?['Atomicity can require waiting','Atomiklik beklemeyi gerektirebilir']:['One transaction outcome','Tek işlem sonucu'],['Unanimous preparation and a durable decision have different roles.','Oybirliğiyle hazırlık ve kalıcı karar farklı görevler taşır.'],finalNodes,[],[M('Committed participants','Commit eden katılımcı',r.decision==='commit'?3:0),M('Blocked prepared participants','Bekleyen hazır katılımcı',r.decision==='blocked'?r.prepared.filter(Boolean).length:0)]),
  ],r.decision==='commit'?'All participants commit.':r.decision==='abort'?'No participant commits; the transaction aborts.':'Prepared yes-voters wait for coordinator recovery in this bounded model.',r.decision==='commit'?'Tüm katılımcılar commit eder.':r.decision==='abort'?'Hiçbiri commit etmez; işlem abort olur.':'Sınırlı modelde hazır evetçiler koordinatör toparlanmasını bekler.');
}
export function threePCOutcome(phase:'wait'|'precommit',crash:boolean,partition:boolean):'commit'|'abort'|'outside-model'{return partition?'outside-model':!crash||phase==='precommit'?'commit':'abort';}
function threePCScene(p:Params):SimulationTrace {
  const phase=str(p,'phase','precommit')==='wait'?'wait':'precommit',crash=p.crash!==false,partition=bool(p,'partition'),outcome=threePCOutcome(phase,crash,partition);
  const ns=[N('A','A',-4,1,'YES'),N('B','B',0,1,'YES'),N('C','C',4,1,'YES')],co=N('co','K',0,-2.6,'∅'),value=phase==='wait'?'W':'PC';
  return T([
    F(['Start with unanimous yes votes','Oybirliğiyle evetten başla'],['The example begins after all participants vote yes.','Örnek, tüm katılımcıların evet oyundan sonra başlar.'],[...ns,co],ns.map(n=>connect(n.id,'co','success','YES'))),
    F(['Add a precommit state','Ön commit durumu ekle'],['Precommit separates waiting from the final commit decision.','Ön commit, beklemeyi son commit kararından ayırır.'],[...ns.map(n=>({...n,value})),{...co,value}],phase==='precommit'?ns.map(n=>connect('co',n.id,'active','PRECOMMIT')):[],[M('Reached precommit everywhere','Her yerde ön commit alındı',phase==='precommit'?'✓':'✕')]),
    F(crash?['The coordinator crashes','Koordinatör çöktü']:['The coordinator continues','Koordinatör devam ediyor'],['The displayed participants share the same phase in this narrow example.','Bu dar örnekte gösterilen katılımcılar aynı aşamayı paylaşır.'],[...ns.map(n=>({...n,value})),{...co,status:crash?'error':'active',value}]),
    F(partition?['The timing model no longer applies','Zamanlama modeli artık geçmiyor']:['Exchange survivor states','Yaşayanların durumunu paylaş'],[partition?'Unbounded delay or a partition invalidates this recovery argument.':'Survivors communicate and reliably distinguish the stopped coordinator.',partition?'Sınırsız gecikme veya bölünme, toparlanma savını geçersiz kılar.':'Yaşayanlar iletişim kurar ve durmuş koordinatörü güvenilir ayırt eder.'],ns.map(n=>({...n,value,status:partition?'warning':'active'})),[connect('A','B',partition?'warning':'active'),connect('B','C',partition?'warning':'active')]),
    F(outcome==='outside-model'?['Stop without a decision guarantee','Karar garantisi olmadan dur']:outcome==='commit'?['Proceed to commit','Commit’e ilerle']:['Abort the waiting transaction','Bekleyen işlemi abort et'],[outcome==='outside-model'?'This simulator does not guess a safe outcome outside its assumptions.':outcome==='commit'?'The normal coordinator, or synchronized precommitted survivors, finish the transaction.':'All survivors were waiting before precommit; this recovery aborts.',outcome==='outside-model'?'Simülatör varsayımları dışında güvenli sonucu tahmin etmez.':outcome==='commit'?'Normal koordinatör veya eşitlenmiş ön-commit katılımcılar işlemi bitirir.':'Tüm yaşayanlar ön commit öncesinde bekliyordu; bu toparlanma abort eder.'],ns.map(n=>({...n,value:outcome==='commit'?'C':outcome==='abort'?'A':'?',status:outcome==='outside-model'?'warning':outcome==='commit'?'success':'error'}))),
    F(['Nonblocking has conditions','Beklememenin koşulları vardır'],['This is not a partition-tolerant replacement for asynchronous consensus.','Bu, asenkron uzlaşmanın bölünmeye dayanıklı alternatifi değildir.'],ns.map(n=>({...n,value:outcome==='commit'?'C':outcome==='abort'?'A':'?',status:outcome==='outside-model'?'warning':outcome==='commit'?'success':'error'})),[],[M('Assumptions satisfied','Varsayımlar sağlandı',partition?'✕':'✓'),M('Commit','Commit',outcome==='commit'?'✓':outcome==='abort'?'✕':'?')]),
  ],outcome==='outside-model'?'Partition/unbounded delay: no decision guarantee is asserted.':outcome==='commit'?'The bounded synchronous execution commits.':'The bounded synchronous recovery aborts.',outcome==='outside-model'?'Bölünme/sınırsız gecikme: karar garantisi ileri sürülmez.':outcome==='commit'?'Sınırlı eşzamanlı yürütme commit eder.':'Sınırlı eşzamanlı toparlanma abort eder.');
}
export function mergeVector(a:number[],b:number[]):number[]{return a.map((v,i)=>Math.max(v,b[i]));}
export const gValue=(state:number[])=>sum(state);
function gCounterScene(p:Params):SimulationTrace {
  const aa=I(p,'a',2,1,5),bb=I(p,'b',3,1,5),merge=p.merge!==false,a=[aa,0,0],b=[0,bb,0],zero=[0,0,0],joined=mergeVector(a,b);
  const replicas=(states:number[][])=>states.map((v,i)=>N(String.fromCharCode(65+i),String.fromCharCode(65+i),(i-1)*4,0,vec(v),'idle','data'));
  return T([
    F(['Give each replica one component','Her kopyaya bir bileşen ver'],['Every replica starts with the zero vector.','Her kopya sıfır vektörüyle başlar.'],replicas([zero,zero,zero])),
    F(['Increment only your own component','Yalnız kendi bileşenini artır'],['A and B can increment without contacting each other.','A ve B birbirine ulaşmadan artırabilir.'],replicas([a,b,zero]),[],[M('A increments','A artışı',aa),M('B increments','B artışı',bb)]),
    F(['Exchange complete states','Tam durumları paylaş'],[merge?'Both states become available for merging.':'The replicas remain separated in this run.',merge?'İki durum birleştirme için erişilebilir olur.':'Bu çalışmada kopyalar ayrı kalır.'],replicas([a,b,zero]),merge?[connect('A','B'),connect('B','A')]:[]),
    F(['Merge with componentwise maximum','Bileşen maksimumuyla birleştir'],['Adding whole vectors would count previously seen increments again.','Tüm vektörleri toplamak, görülen artışları yeniden sayardı.'],replicas(merge?[joined,joined,zero]:[a,b,zero]),[],[M('Value after full merge','Tam birleşme sonrası değer',gValue(joined))]),
    F(['Replay the same state','Aynı durumu yeniden gönder'],['max(max(A,B),B) equals max(A,B).','max(max(A,B),B), max(A,B)’ye eşittir.'],replicas(merge?[mergeVector(joined,b),joined,joined]:[a,b,zero]),merge?[connect('B','A','success'),connect('A','C','success')]:[],[M('Duplicate merge adds value','Yinelenen birleşme değer ekler',0)]),
    F(merge?['All replicas converge','Tüm kopyalar yakınsar']:['Local values still differ','Yerel değerler hâlâ farklı'],['Convergence requires the missing state to arrive eventually.','Yakınsama, eksik durumun sonunda ulaşmasını gerektirir.'],replicas(merge?[joined,joined,joined]:[a,b,zero]),[],[M('A local value','A yerel değeri',merge?gValue(joined):aa),M('B local value','B yerel değeri',merge?gValue(joined):bb)]),
  ],merge?'All replicas read '+gValue(joined)+' without double-counting replayed state.':'The full-merge value is '+gValue(joined)+', but separated replicas have not converged.',merge?'Tüm kopyalar, yinelemeyi çift saymadan '+gValue(joined)+' okur.':'Tam birleşme değeri '+gValue(joined)+'; ayrı kopyalar henüz yakınsamadı.');
}
export interface PNState {p:number[];n:number[]}
export function mergePN(a:PNState,b:PNState):PNState{return {p:mergeVector(a.p,b.p),n:mergeVector(a.n,b.n)};}
export const pnValue=(state:PNState)=>sum(state.p)-sum(state.n);
function pnScene(p:Params):SimulationTrace {
  const plus=I(p,'plus',3,1,5),minus=I(p,'minus',2,1,4),merge=p.merge!==false,a:PNState={p:[plus,0],n:[0,0]},b:PNState={p:[0,0],n:[0,minus]},joined=mergePN(a,b);
  const replicas=(states:PNState[])=>states.flatMap((s,i)=>[N(i?'B':'A',i?'B':'A',i?3.5:-3.5,-1,'P'+vec(s.p),'idle','data'),N(i?'Bn':'An','N',i?3.5:-3.5,1,'N'+vec(s.n),'idle','data')]);
  return T([
    F(['Keep two growing vectors','İki artan vektör tut'],['Positive increments and negative increments are stored separately.','Pozitif artışlar ve negatif artışlar ayrı tutulur.'],replicas([{p:[0,0],n:[0,0]},{p:[0,0],n:[0,0]}])),
    F(['A increments the positive side','A pozitif tarafı artırır'],['Only A’s positive component changes.','Yalnız A’nın pozitif bileşeni değişir.'],replicas([a,{p:[0,0],n:[0,0]}]),[],[M('Positive increments','Pozitif artış',plus)]),
    F(['B increments the negative side','B negatif tarafı artırır'],['A decrement grows N; it does not decrease a component.','Azaltma N’yi büyütür; bileşeni küçültmez.'],replicas([a,b]),[],[M('Negative increments','Negatif artış',minus)]),
    F(merge?['Merge P and N separately','P ve N’yi ayrı birleştir']:['Keep each local state','Her yerel durumu tut'],['Each internal vector merges by maximum.','Her iç vektör maksimumla birleşir.'],replicas(merge?[joined,joined]:[a,b]),merge?[connect('A','B','success'),connect('Bn','An','success')]:[]),
    F(['Read sum(P) minus sum(N)','sum(P) eksi sum(N) oku'],['A negative visible value is compatible with growing internal components.','Negatif görünen değer, artan iç bileşenlerle uyumludur.'],replicas(merge?[joined,joined]:[a,b]),[],[M('Value after full merge','Tam birleşme sonrası değer',pnValue(joined))]),
    F(merge?['Both replicas agree','İki kopya aynı değerde']:['Local views remain separated','Yerel görünümler ayrı kaldı'],['The potential full-merge total is not a claim that disconnected replicas already agree.','Olası tam birleşme toplamı, kopuk kopyaların zaten uzlaştığı iddiası değildir.'],replicas(merge?[joined,joined]:[a,b]),[],[M('A local value','A yerel değeri',pnValue(merge?joined:a)),M('B local value','B yerel değeri',pnValue(merge?joined:b))]),
  ],merge?'Both replicas read '+pnValue(joined)+'.':'A reads '+pnValue(a)+' and B reads '+pnValue(b)+' until states are exchanged.',merge?'İki kopya '+pnValue(joined)+' okur.':'Durumlar paylaşılana kadar A '+pnValue(a)+', B '+pnValue(b)+' okur.');
}
export interface ORState {adds:string[];removed:string[]}
const unionStrings=(a:string[],b:string[])=>[...new Set([...a,...b])].sort();
export function mergeOR(a:ORState,b:ORState):ORState{return {adds:unionStrings(a.adds,b.adds),removed:unionStrings(a.removed,b.removed)};}
export const orPresent=(state:ORState)=>state.adds.some(tag=>!state.removed.includes(tag));
function orSetScene(p:Params):SimulationTrace {
  const concurrent=p.concurrent!==false,merge=p.merge!==false,initial:ORState={adds:['A1'],removed:[]},a:ORState={adds:concurrent?['A1']:['A1','B1'],removed:concurrent?['A1']:['A1','B1']},b:ORState={adds:['A1','B1'],removed:[]},joined=mergeOR(a,b);
  const display=(id:string,state:ORState,x:number)=>N(id,id,x,0,'{'+state.adds.filter(tag=>!state.removed.includes(tag)).join(',')+'}',orPresent(state)?'active':'muted','data');
  const tags=[N('A1','A1',-2,-2,'x','active','token'),N('B1','B1',2,-2,'x','active','token')],aTomb=N('tomb','− tags',0,2.4,a.removed.join(','),'error','data');
  return T([
    F(['Add x with a unique tag','x’i benzersiz etiketle ekle'],['Both replicas initially know tag A1 for x.','İki kopya başlangıçta x için A1 etiketini bilir.'],[display('A',initial,-4),display('B',initial,4),tags[0]]),
    F(concurrent?['B adds a new tag concurrently','B eşzamanlı yeni etiket ekler']:['A observes B’s new tag first','A önce B’nin yeni etiketini görür'],['A new add uses B1 instead of reusing A1.','Yeni ekleme A1’i yinelemek yerine B1 kullanır.'],[display('A',concurrent?initial:b,-4),display('B',b,4),...tags],concurrent?[]:[connect('B','A','active','B1')]),
    F(['Remove only observed add tags','Yalnız görülen ekleme etiketlerini sil'],[concurrent?'A removes A1; it has not observed B1.':'A has observed A1 and B1, so its remove covers both.',concurrent?'A, A1’i siler; B1’i görmedi.':'A, A1 ile B1’i gördü; silme ikisini kapsar.'],[display('A',a,-4),display('B',b,4),...tags,aTomb],[],[M('Removed tags','Silinen etiket',a.removed.length)]),
    F(merge?['Union adds and tombstones','Ekleme ve mezar taşlarını birleştir']:['Pause state exchange','Durum paylaşımını duraklat'],['Merge retains both the add history and observed removal history.','Birleşme hem ekleme hem gözlenen silme geçmişini korur.'],[display('A',merge?joined:a,-4),display('B',merge?joined:b,4),aTomb],merge?[connect('A','B'),connect('B','A')]:[]),
    F(['An unseen concurrent add survives','Görülmeyen eşzamanlı ekleme yaşar'],['x is present whenever at least one add tag is not removed.','Silinmemiş en az bir ekleme etiketi varsa x mevcuttur.'],[display('A',merge?joined:a,-4),display('B',merge?joined:b,4),...tags.map(n=>({...n,status:joined.removed.includes(n.id)?'error' as Status:'success' as Status}))],[],[M('x after full merge','Tam birleşme sonrası x',orPresent(joined)?'✓':'✕')]),
    F(merge?['Both replicas apply the same rule','İki kopya aynı kuralı uygular']:['Convergence still needs exchange','Yakınsama hâlâ paylaşım ister'],['Tombstone collection requires additional causal knowledge and is not shown.','Mezar taşı temizliği ek nedensel bilgi ister; burada gösterilmez.'],[display('A',merge?joined:a,-4),display('B',merge?joined:b,4)],[],[M('A contains x','A, x içeriyor',orPresent(merge?joined:a)?'✓':'✕'),M('B contains x','B, x içeriyor',orPresent(merge?joined:b)?'✓':'✕')]),
  ],merge?orPresent(joined)?'The unseen concurrent B1 add survives.':'The remove observed both tags; x is absent.':'Separated replicas have not merged their add/remove histories.',merge?orPresent(joined)?'Görülmeyen eşzamanlı B1 eklemesi yaşar.':'Silme iki etiketi gördü; x yok.':'Ayrı kopyalar ekleme/silme geçmişini birleştirmedi.');
}
export interface LWWState {value:string;timestamp:number;id:string}
export function mergeLWW(a:LWWState,b:LWWState):LWWState{return a.timestamp>b.timestamp||a.timestamp===b.timestamp&&a.id.localeCompare(b.id)>0?{...a}:{...b};}
function lwwScene(p:Params):SimulationTrace {
  const skew=I(p,'skew',2,-3,3),merge=p.merge!==false,a:LWWState={value:'a',timestamp:10,id:'A'},b:LWWState={value:'b',timestamp:11+skew,id:'B'},winner=mergeLWW(a,b);
  const display=(id:string,state:LWWState,x:number)=>N(id,id,x,0,state.value+' @'+state.timestamp+':'+state.id,'idle','data'),local=[display('A',a,-4),display('B',b,4)];
  return T([
    F(['A writes at real time 10','A gerçek 10 zamanında yazar'],['Its clock also reads 10.','Saati de 10 gösterir.'],[display('A',a,-4),N('B','B',4,0,'∅')]),
    F(['B writes later at real time 11','B daha sonra gerçek 11’de yazar'],['B attaches its local clock, including the selected offset.','B, seçilen fark dahil yerel saatini ekler.'],local,[],[M('B clock offset','B saat farkı',skew),M('B stored timestamp','B’nin saklanan damgası',b.timestamp)]),
    F(['Order by timestamp and replica ID','Damga ve kopya kimliğiyle sırala'],['Replica IDs break equal-timestamp ties deterministically.','Kopya kimlikleri eşit damgayı belirli biçimde çözer.'],mark(local,[winner.id],'active'),[],[M('Winner after full merge','Tam birleşme sonrası kazanan',winner.value)]),
    F(merge?['Propagate the maximum state','En büyük durumu yay']:['Pause the merge','Birleşmeyi duraklat'],['The merge is deterministic and idempotent.','Birleşme belirli ve idempotenttir.'],merge?[display('A',winner,-4),display('B',winner,4)]:local,merge?[connect('A','B'),connect('B','A')]:[]),
    F(winner.id==='B'?['Metadata and real order happen to agree','Metadata ve gerçek sıra burada uyumlu']:['The later real write loses','Gerçekte sonraki yazma kaybeder'],['Clock order is not a guarantee of real-time write order.','Saat sırası, gerçek yazma sırasının garantisi değildir.'],merge?[display('A',winner,-4),display('B',winner,4)]:local,[],[M('Later real write wins after merge','Gerçekte sonraki yazma birleşmede kazanır',winner.id==='B'?'✓':'✕',winner.id==='B'?'success':'warning')]),
    F(['Convergence does not preserve every update','Yakınsama her güncellemeyi korumaz'],['Only one value remains after the LWW merge.','LWW birleşmesinden sonra yalnız tek değer kalır.'],merge?[display('A',winner,-4),display('B',winner,4)]:local,[],[M('A local value','A yerel değeri',merge?winner.value:a.value),M('B local value','B yerel değeri',merge?winner.value:b.value)]),
  ],merge?'Both replicas converge to '+winner.value+' according to timestamp/ID order.':'A and B keep their local values until they merge.',merge?'İki kopya damga/kimlik sırasıyla '+winner.value+' değerine yakınsar.':'A ile B, birleşene kadar yerel değerini tutar.');
}
function capScene(p:Params):SimulationTrace {
  const mode=str(p,'mode','cp')==='ap'?'ap':'cp',partition=p.partition!==false,ack=!partition||mode==='ap',a=ack?1:0,b=partition?0:1,violation=ack&&b===0;
  const ns=(av:number,bv:number)=>[N('A','A',-3.8,0,String(av)),N('B','B',3.8,0,String(bv)),N('W','W',-3.8,-2.5,'1','active','token'),N('R','R',3.8,-2.5,'?','active','token')];
  return T([
    F(['Two replicas share value 0','İki kopya 0 değerini paylaşır'],['A later read will follow this example’s write request.','Bu örnekteki yazma isteğini sonra bir okuma izleyecek.'],ns(0,0),[connect('A','B','muted')]),
    F(partition?['Messages cannot cross the partition','Mesajlar bölünmeyi aşamaz']:['Replication is available','Çoğaltma erişilebilir'],['The connection determines which updates the other replica can learn.','Bağlantı, diğer kopyanın hangi güncellemeyi öğrenebileceğini belirler.'],ns(0,0),[connect('A','B',partition?'error':'active')],[M('Partition','Bölünme',partition?'✓':'✕')]),
    F(ack?['A acknowledges the write','A yazmayı onaylar']:['A waits before acknowledging','A onaydan önce bekler'],[ack?'The local policy permits the displayed write to complete.':'This consistency policy will not complete an unreplicated write.',ack?'Yerel politika, gösterilen yazmanın tamamlanmasına izin verir.':'Bu tutarlılık politikası, çoğaltılmayan yazmayı tamamlamaz.'],ns(a,b),[connect('W','A',ack?'success':'warning'),...(partition?[]:[connect('A','B','success')])],[M('Write completed','Yazma tamamlandı',ack?'✓':'✕')]),
    F(['Read at the other replica','Diğer kopyadan oku'],['B can answer only from the state it knows.','B yalnız bildiği durumdan yanıt verebilir.'],ns(a,b).map(n=>n.id==='R'?{...n,value:String(b)}:n),[connect('B','R',violation?'warning':'success')],[M('Read value','Okunan değer',b)]),
    F(violation?['A completed write is missing from this read','Tamamlanan yazma bu okumada eksik']:ack?['The read observes the write','Okuma yazmayı görüyor']:['Consistency is kept by waiting','Bekleyerek tutarlılık korunur'],[violation?'The available local answers violate this register’s real-time order.':ack?'Messages delivered the update before the read.':'The write has not completed; availability is the sacrificed guarantee.',violation?'Erişilebilir yerel yanıtlar, yazmacın gerçek zaman sırasını bozuyor.':ack?'Mesajlar, güncellemeyi okumadan önce iletti.':'Yazma bitmedi; vazgeçilen garanti erişilebilirlik.'],ns(a,b).map(n=>n.id==='R'?{...n,value:String(b)}:n),[],[M('Stale read after completed write','Bitmiş yazma sonrası eski okuma',violation?'✓':'✕')]),
    F(['The impossibility is conditional','İmkânsızlık koşulludur'],['During a partition, this example cannot guarantee both always answering and linearizable results.','Bölünme sırasında bu örnek hem her zaman yanıtı hem linearizable sonucu garantileyemez.'],ns(a,b).map(n=>n.id==='R'?{...n,value:String(b)}:n),[],[M('Write acknowledged','Yazma onaylandı',ack?'✓':'✕'),M('Read sees latest completed write','Okuma son bitmiş yazmayı görüyor',violation?'✕':'✓')]),
  ],violation?'Local availability returns a stale read after an acknowledged write.':ack?'With communication, this write and read satisfy real-time order.':'The consistent policy waits for replication, losing availability during the partition.',violation?'Yerel erişilebilirlik, onaylı yazmadan sonra eski okuma döndürür.':ack?'İletişimle bu yazma ve okuma gerçek zaman sırasına uyar.':'Tutarlı politika çoğaltmayı bekler; bölünmede erişilebilirlik kaybolur.');
}
function flpScene(p:Params):SimulationTrace {
  const crashed=p.crashed!==false,deliver=bool(p,'deliver'),ns=[N('A','A',-4,0,'?'),N('B','B',0,2,'?'),N('C','C',4,0,'0')],message=N('m','m',2,-2,'0','active','token');
  return T([
    F(['One process sends a message','Bir süreç mesaj gönderir'],['C sends before the possible crash. The message is already in the network.','C olası çöküşten önce gönderir. Mesaj zaten ağdadır.'],[...ns,message],[connect('C','m')]),
    F(crashed?['C stops after sending','C gönderdikten sonra durur']:['C remains alive','C canlı kalır'],['The learner can see C’s state; A does not receive a magic failure signal.','Öğrenen C’nin durumunu görür; A sihirli hata sinyali almaz.'],[...mark(ns,['C'],crashed?'error':'idle'),message],[],[M('C crashed','C çöktü',crashed?'✓':'✕')]),
    F(['A observes silence','A sessizlik gözler'],['Unbounded message delay can produce the same local observation as a crash.','Sınırsız mesaj gecikmesi, çöküşle aynı yerel gözlemi yaratabilir.'],[...mark(ns,['C'],crashed?'error':'idle'),{...message,status:'warning'}],[connect('m','A','warning','…')]),
    F(deliver?['The pending message arrives','Bekleyen mesaj geldi']:['The adversarial delay continues','Karşıt gecikme sürer'],[deliver?'A message sent before a crash can still arrive after its sender stops.':'A still cannot tell whether the sender stopped or its packet is delayed.',deliver?'Çöküşten önce gönderilmiş mesaj, gönderen durduktan sonra da gelebilir.':'A, gönderenin durduğunu mu paketin geciktiğini mi hâlâ ayıramaz.'],[...mark(ns,['C'],crashed?'error':'idle').map(n=>n.id==='A'?{...n,value:deliver?'0':'?',status:deliver?'active' as Status:'warning' as Status}:n),{...message,status:deliver?'success':'warning'}],[connect('m','A',deliver?'success':'warning')],[M('Already-sent message delivered','Önceden gönderilen mesaj teslim edildi',deliver?'✓':'✕')]),
    F(['This finite prefix is an illustration','Bu sonlu önek bir gösterimdir'],['Receiving more information is not itself a proof of a consensus decision.','Ek bilgi almak, tek başına uzlaşma kararının kanıtı değildir.'],mark(ns,['C'],crashed?'error':'idle').map(n=>n.id==='A'?{...n,value:deliver?'0':'?'}:n),[],[M('Message observed by A','A’nın gördüğü mesaj',deliver?1:0)]),
    F(['FLP limits a universal termination guarantee','FLP evrensel sonlanma garantisini sınırlar'],['Deterministic consensus cannot promise termination in every fully asynchronous execution with one possible crash.','Deterministik uzlaşma, tek olası çöküşle tamamen asenkron her yürütmede sonlanma vaat edemez.'],mark(ns,['C'],crashed?'error':'idle').map(n=>n.id==='A'?{...n,value:deliver?'0':'?'}:n),[],[M('Finite messages delivered here','Burada teslim edilen sonlu mesaj',deliver?1:0)]),
  ],deliver?'The in-flight message arrives, even if C has crashed; no universal termination guarantee follows.':'A sees only a delayed message, not proof of a failure.',deliver?'Yoldaki mesaj C çökmüş olsa da gelir; evrensel sonlanma garantisi çıkmaz.':'A yalnız geciken mesajı görür; hata kanıtı görmez.');
}
export interface RegisterOperation {id:string;kind:'read'|'write';value:number;start:number;end:number}
export function linearizeRegister(operations:RegisterOperation[],initial=0):string[]|undefined {
  const search=(remaining:RegisterOperation[],value:number,order:string[]):string[]|undefined=>{
    if(!remaining.length)return order;
    for(const op of remaining){
      if(remaining.some(other=>other.id!==op.id&&other.end<op.start))continue;
      if(op.kind==='read'&&op.value!==value)continue;
      const result=search(remaining.filter(other=>other.id!==op.id),op.kind==='write'?op.value:value,[...order,op.id]);if(result)return result;
    }
    return undefined;
  };
  return search(operations,initial,[]);
}
function linearScene(p:Params):SimulationTrace {
  const overlap=p.overlap!==false,stale=p.stale!==false,readStart=overlap?2:5,readValue=stale?0:1,operations:RegisterOperation[]=[{id:'W',kind:'write',value:1,start:1,end:4},{id:'R',kind:'read',value:readValue,start:readStart,end:6}],order=linearizeRegister(operations),valid=order!==undefined;
  const x=(time:number)=>(time-3.5)*1.5,ns=[N('ws','W₀',x(1),-1.4,'t=1','active','data'),N('we','W₁',x(4),-1.4,'t=4','active','data'),N('rs','R₀',x(readStart),1.4,'t='+readStart,'active','data'),N('re','R₁',x(6),1.4,'v='+readValue,'active','data')],links=[connect('ws','we','active','write 1'),connect('rs','re','active','read')];
  const writeAt=order?.[0]==='R'?3:2,readAt=order?.[0]==='R'?2.5:overlap?3:5.5;
  return T([
    F(['Operations occupy intervals','İşlemler zaman aralığı kaplar'],['A call starts at invocation and finishes when its response returns.','Çağrı, istekle başlar ve yanıt dönünce biter.'],ns,links),
    F(['The register begins at 0','Yazmaç 0 ile başlar'],['One operation writes 1; the other reads a value.','Bir işlem 1 yazar; diğeri değer okur.'],ns,links,[M('Read result','Okuma sonucu',readValue)]),
    F(overlap?['These operations overlap','Bu işlemler örtüşüyor']:['The write finishes before the read begins','Yazma, okuma başlamadan biter'],['Nonoverlapping real-time order must be respected by every legal serialization.','Örtüşmeyen gerçek zaman sırasına her geçerli sıralama uymalıdır.'],ns,links,[M('Overlapping intervals','Örtüşen aralık',overlap?'✓':'✕')]),
    F(['Search for a legal sequential history','Geçerli sıralı geçmiş ara'],['A read must return the last preceding write in the candidate order.','Okuma, aday sıradaki önceki son yazmayı döndürmeli.'],ns,links,[M('Valid order','Geçerli sıra',order?.join('→')??'∅')]),
    F(valid?['Place one point inside each interval','Her aralığa bir nokta yerleştir']:['No placement can explain the old value','Eski değeri açıklayan yerleşim yok'],[valid?'The chosen points give the same observations while respecting real-time precedence.':'A completed write of 1 must precede this read, so returning 0 is impossible.',valid?'Seçilen noktalar, gerçek zaman önceliğine uyarak aynı gözlemleri verir.':'Tamamlanmış 1 yazması bu okumadan önce olmalı; 0 dönmesi imkânsız.'],[...ns,...(valid?[N('wp','W',x(writeAt),-1.4,'1','success','token',1),N('rp','R',x(readAt),1.4,String(readValue),'success','token',1)]:[])],links),
    F(valid?['This history is linearizable','Bu geçmiş linearizable']:['This history violates linearizability','Bu geçmiş linearizability’yi ihlal ediyor'],['Concurrency permits multiple orders; completed-before-started operations constrain them.','Eşzamanlılık birden çok sıraya izin verir; bitişten sonra başlayan işlemler sınırlar.'],ns.map(n=>({...n,status:valid?'success':'error'})),links,[M('Linearizable history','Linearizable geçmiş',valid?'✓':'✕',valid?'success':'error')]),
  ],valid?'A legal sequential order is '+order.join(' → ')+'.':'No sequential register history respects both the observed read and real-time order.',valid?'Geçerli sıralı düzen '+order.join(' → ')+'.':'Görülen okumaya ve gerçek zaman sırasına uyan sıralı yazmaç geçmişi yok.');
}
const engines:Record<string,(p:Params)=>SimulationTrace>={
  'raft':raftScene,'paxos':paxosScene,'multi-paxos':multiPaxosScene,'zab':zabScene,'viewstamped-replication':vrScene,
  'lamport-clock':lamportScene,'vector-clock':vectorScene,'causal-broadcast':causalScene,'lamport-mutex':lamportMutexScene,
  'ricart-agrawala':ricartScene,'suzuki-kasami':tokenScene,'ring-election':ringElectionScene,'bully-election':bullyScene,
  'chandy-lamport':snapshotScene,'termination-detection':terminationScene,'gossip':gossipScene,'swim':swimScene,
  'chord':chordScene,'kademlia':kademliaScene,'consistent-hashing':hashingScene,'quorum':quorumScene,'read-repair':repairScene,
  'hinted-handoff':handoffScene,'anti-entropy':antiEntropyScene,'two-phase-commit':twoPCScene,'three-phase-commit':threePCScene,
  'g-counter':gCounterScene,'pn-counter':pnScene,'or-set':orSetScene,'lww-register':lwwScene,'cap':capScene,'flp':flpScene,'linearizability':linearScene
};
export const simulateDistributed:Simulator=(id,params)=>engines[id]?.(params);
