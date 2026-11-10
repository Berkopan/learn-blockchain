# Distributed systems research map

This document records the primary-source basis and explicit boundaries of the 33 distributed-systems lessons. The lessons are deliberately small executable examples. Their equations, message order, routing decisions and state changes are inspectable; they are not production protocol implementations or substitutes for the cited proofs.

## Teaching approach

Each scene answers one operational question: which message can be delivered, which value may be chosen, which replica owns a key, or which evidence permits progress. Guided frames expose local state before the decision. Sandbox controls then change the same computation rather than switching between unrelated illustrations.

English and Turkish explanations accompany the same state transitions. Technical IDs and short values remain shared across languages. Every lesson exposes its assumptions, a prediction question and primary sources.

## Model distinctions that must remain visible

- **Consensus and atomic commit:** Raft/Paxos choose an ordered value while preserving safety; 2PC decides whether all participants can commit a transaction. A majority of yes votes is insufficient for 2PC.
- **Chosen, committed, applied:** A Paxos slot can be chosen before earlier slots are known. A state machine still applies a contiguous prefix. Raft does not directly commit an old-term entry by replica counting alone.
- **Clocks and causality:** Lamport timestamps satisfy a one-way implication. Vector comparison is componentwise and can expose concurrency. Neither is a physical clock.
- **Quorum intersection:** R+W>N establishes set overlap for fixed replicas. It does not alone establish linearizability with concurrent writers, version-order anomalies, sloppy quorums or incomplete writes.
- **Failure detection:** A timeout is a suspicion. SWIM can use indirect paths and incarnation refutation. Bully’s bounded example requires a sufficiently accurate failure detector.
- **Snapshots and termination:** A snapshot includes channel state; local idleness does not prove global termination while messages or acknowledgment obligations remain.
- **CRDT convergence:** The merge laws are associative, commutative and idempotent for valid states. Disconnected replicas do not already agree merely because a future merged value can be computed.
- **Theorem illustrations:** CAP and FLP are concepts, not runnable consensus algorithms. Their small examples illustrate an obstruction and do not constitute the general impossibility proofs.

## Sensitive boundary cases

### Raft and Paxos

Raft’s direct commit rule counts a replicated entry from the leader’s current term. When that entry commits, its prior prefix commits with it. A candidate whose last log term is older does not become eligible merely by having a larger index. Paxos phase 1 inherits the value associated with the highest accepted ballot among the promises, even when that particular acceptance was not itself known to be chosen.

### Two-phase and three-phase commit

The 2PC failure schedule places the coordinator crash before a durable decision record. Yes-voters retain their prepared state. The shown recovery policy aborts because no durable commit decision exists. Participant-to-participant termination is omitted: in a different implementation, a reachable no-voter could help other participants determine abort before coordinator recovery. The model must not suggest that every 2PC failure necessarily blocks every participant.

The 3PC example is restricted to synchronized survivor states and a communication/timing model that permits coordinated recovery. It demonstrates the difference between all survivors waiting and all survivors having received precommit. It deliberately stops without a decision guarantee when the partition/unbounded-delay control violates these assumptions.

### Routing

Chord checks the wraparound interval (current, successor] and otherwise uses the closest preceding finger. Ordinary Euclidean distance is not its routing rule. Kademlia uses XOR distance, begins with an incomplete shortlist, queries only unqueried contacts and learns candidates from their local routing tables. The failure scenario includes more than one route into the upper half of the identifier space.

### Snapshots and FLP

The snapshot conserves 16 units across recorded local balances and the B→A channel. A transfer recorded after B sent it but before A received it belongs in channel state. In the FLP illustration, C sends before potentially crashing; delivery of that in-flight message remains possible after the crash. A process stopping does not retract messages already sent.

## Lesson map

### Raft / Raft

**ID:** `raft` · **Type:** protocol · **Family:** consensus

**Mechanism:** Election safety; lexicographic last-log freshness; majority replication; current-term commit restriction.

**Bounded model:** Five servers, one election and one append. Voting checks the candidate’s last log term/index; direct commitment requires a current-term entry on a majority. Earlier entries commit with that prefix. Timers, persistence, membership changes and full AppendEntries conflict repair are omitted.

**Model sınırı:** Beş sunucu, tek seçim ve ekleme. Oyda adayın son kayıt dönemi/indeksi kontrol edilir; doğrudan commit, çoğunlukta güncel dönem kaydı ister. Önceki kayıtlar aynı önekle commit edilir. Zamanlayıcı, kalıcılık, üyelik değişimi ve tam günlük onarımı yoktur.

**Manipulations:** Offline followers (0–3); Candidate has an older log; Append in the new term.

**Prediction:** An older entry reaches a majority. Can counting replicas alone commit it? **Answer:** No; a current-term entry is needed. Raft’s leader advances commitIndex by counting a current-term entry; the earlier prefix follows.

**Primary sources:** [Ongaro & Ousterhout — In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf).

### Paxos / Paxos

**ID:** `paxos` · **Type:** protocol · **Family:** consensus

**Mechanism:** Prepare promises; accepted-value inheritance; majority acceptance of one value at one ballot.

**Bounded model:** Single-decree Paxos with three acceptors, prior promises at ballot 2, and a unique new proposer ballot. Prepare must exceed those promises. A remembered value at ballot 2 is inherited even if it was accepted by only one node. No persistence failures, concurrent proposer loop or membership changes.

**Model sınırı:** Üç kabulcü, 2 numaralı eski vaat ve benzersiz yeni öneri turuyla tek değerli Paxos. Yeni hazırlık eski vaadi aşmalıdır. Yalnız bir düğümün kabul ettiği 2 numaralı değer bile devralınır. Kalıcılık hatası, eşzamanlı öneren döngüsü veya üyelik değişimi yoktur.

**Manipulations:** An acceptor remembers A; New ballot number (1–4); Unavailable acceptors (0–2).

**Prediction:** Must a new proposer keep a value reported at the highest accepted ballot? **Answer:** Yes. Quorum intersection carries previously chosen information into future proposals.

**Primary sources:** [Lamport — Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf).

### Multi-Paxos / Multi-Paxos

**ID:** `multi-paxos` · **Type:** protocol · **Family:** consensus

**Mechanism:** Stable-leader phase-1 reuse; one consensus instance per slot; contiguous application prefix.

**Bounded model:** Three acceptors and up to three slots. A stable leader amortizes phase 1; replacement prepares a higher ballot and inherits the chosen prefix. A deliberately missing slot blocks application of later chosen slots. Network retransmission, batching and arbitrary interleavings are omitted.

**Model sınırı:** Üç kabulcü ve en fazla üç konum. Sabit lider hazırlık aşamasını paylaşır; yeni lider daha yüksek turda hazırlanır ve seçilmiş öneği devralır. Eksik konum, sonraki seçilmiş kayıtların uygulanmasını durdurur. Tekrar gönderim, gruplama ve rastgele iç içe yürütmeler yoktur.

**Manipulations:** Change the leader; Leave slot 2 unchosen; Log positions (1–3).

**Prediction:** Slot 3 is chosen, but slot 2 is missing. Apply slot 3 now? **Answer:** Wait for slot 2. The replicated state machine applies one ordered prefix.

**Primary sources:** [Lamport — Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf).

### Zab atomic broadcast / Zab atomik yayın

**ID:** `zab` · **Type:** protocol · **Family:** consensus

**Mechanism:** zxid ordering; follower synchronization; quorum acknowledgment; preservation of a committed prefix across epochs.

**Bounded model:** Three servers and zxid=(epoch,counter). A quorum acknowledges an ordered proposal. In the shown failure, an unacknowledged tail exists only on the failed leader; a synchronized new quorum preserves the old committed prefix. Full discovery, DIFF/TRUNC/SNAP mechanics and session ordering are omitted.

**Model sınırı:** Üç sunucu ve zxid=(dönem,sayaç). Çoğunluk, sıralı öneriyi onaylar. Gösterilen hatada onaysız son kayıt yalnız çöken liderdedir; eşitlenmiş yeni çoğunluk eski commit önekini korur. Tam keşif, DIFF/TRUNC/SNAP ve oturum sıralaması yoktur.

**Manipulations:** Leader fails before acknowledgments; Available followers (0–2); Synchronize the lagging follower.

**Prediction:** Does an isolated leader’s new local record prove commitment? **Answer:** No. Zab requires quorum acknowledgment and an ordered commit.

**Primary sources:** [Apache ZooKeeper — Internals and atomic broadcast](https://zookeeper.apache.org/doc/current/zookeeperInternals.html).

### Viewstamped replication / Görünüm damgalı çoğaltma

**ID:** `viewstamped-replication` · **Type:** protocol · **Family:** consensus

**Mechanism:** Primary views; prepare quorum; new-view selection by last-normal view and log length.

**Bounded model:** Three replicas, f=1, one committed prefix and one view change. New-primary selection compares last-normal view then log length among a quorum. Only the illustrated stale tail is discarded; this is not a complete VR recovery or state-transfer implementation.

**Model sınırı:** Üç kopya, f=1, tek commit öneği ve görünüm değişimi. Yeni lider, çoğunluk raporlarında son normal görünümü, sonra günlük uzunluğunu karşılaştırır. Yalnız örnekteki eski son kayıt atılır; tam VR toparlanması veya durum aktarımı değildir.

**Manipulations:** Available backups (0–2); Fail the primary; Old-view tail at C.

**Prediction:** May a new primary erase an already committed prefix? **Answer:** No. View-change quorum evidence protects committed operations.

**Primary sources:** [Liskov & Cowling — Viewstamped Replication Revisited](https://pmg.csail.mit.edu/papers/vr-revisited.pdf).

### Lamport clocks / Lamport saatleri

**ID:** `lamport-clock` · **Type:** algorithm · **Family:** time

**Mechanism:** Increment on local/send events; max(local, received)+1 on receipt; one-way clock condition.

**Bounded model:** Three process clocks. Internal/send events increment; receive uses max(local,message)+1. Delivery delay is represented by extra local events, not physical milliseconds. Scalar timestamps cannot identify every concurrent pair.

**Model sınırı:** Üç süreç saati. Yerel/gönderim olayı artırır; alım max(yerel,mesaj)+1 kullanır. Gecikme fiziksel milisaniye yerine ek yerel olayla gösterilir. Tek sayılı damga, her eşzamanlı çifti ayıramaz.

**Manipulations:** Extra events at A (0–3); B events before delivery (0–2).

**Prediction:** Does L(a) < L(b) prove that a caused b? **Answer:** No. Independent events can also have increasing scalar timestamps.

**Primary sources:** [Lamport — Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf).

### Vector clocks / Vektör saatler

**ID:** `vector-clock` · **Type:** algorithm · **Family:** time

**Mechanism:** Per-process counters; componentwise merge; partial-order comparison and concurrency.

**Bounded model:** Three fixed processes. Local events increment their own component; receives merge componentwise maxima then increment the receiver. No process churn, compressed vectors or physical time. Vectors are compared componentwise, never by sums.

**Model sınırı:** Üç sabit süreç. Yerel olay kendi bileşenini artırır; alım bileşen bazında maksimumları birleştirip alıcıyı artırır. Süreç değişimi, sıkıştırma veya fiziksel zaman yoktur. Vektörler toplamla değil, bileşen bazında karşılaştırılır.

**Manipulations:** Keep A and B independent; Extra events at A (0–2).

**Prediction:** Neither vector is componentwise smaller. What does that mean? **Answer:** Concurrent events. Neither event includes knowledge of the other.

**Primary sources:** [Mattern — Virtual Time and Global States of Distributed Systems](https://vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf).

### Causal broadcast / Nedensel yayın

**ID:** `causal-broadcast` · **Type:** algorithm · **Family:** networking

**Mechanism:** Per-sender delivery counters; causal readiness predicate; hold-back buffer and repeated draining.

**Bounded model:** Three processes and two broadcasts with vector delivery conditions. A receiver buffers a message until its sender’s next counter and all causal dependencies are satisfied. Reliable eventual delivery is assumed; group membership and atomic total order are omitted.

**Model sınırı:** Üç süreç ve vektör teslim koşullu iki yayın. Alıcı, gönderenin sıradaki sayacı ile tüm nedensel bağımlılıklar sağlanana kadar mesajı bekletir. Güvenilir nihai teslim varsayılır; grup üyeliği ve atomik tam sıralama yoktur.

**Manipulations:** Deliver the reply first; B’s message depends on A.

**Prediction:** A reply arrives first. Must it be shown immediately? **Answer:** No; wait for its missing cause. Causal delivery can buffer a message without losing it.

**Primary sources:** [Birman, Schiper & Stephenson — Lightweight Causal and Atomic Group Multicast](https://doi.org/10.1145/128738.128742); [Mattern — Virtual Time and Global States of Distributed Systems](https://vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf).

### Lamport mutual exclusion / Lamport karşılıklı dışlama

**ID:** `lamport-mutex` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Timestamp/ID request ordering; acknowledgments from every peer; ordered queues and explicit release.

**Bounded model:** Three processes, reliable FIFO channels, ordered (timestamp,process ID) requests and explicit RELEASE. A missing peer blocks progress; there is no timeout-based safe entry or fault-tolerant membership change.

**Model sınırı:** Üç süreç, güvenilir FIFO kanallar, sıralı (damga,süreç kimliği) istekler ve açık RELEASE. Eksik eş ilerlemeyi durdurur; zaman aşımıyla güvenli giriş veya hataya dayanıklı üyelik değişimi yoktur.

**Manipulations:** B also requests access; C does not reply.

**Prediction:** A is first in the queue, but C never replies. Can A enter? **Answer:** No. Being first does not replace the required acknowledgment from every peer.

**Primary sources:** [Lamport — Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf).

### Ricart–Agrawala / Ricart–Agrawala

**ID:** `ricart-agrawala` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Pairwise request priority; deferred replies; permission from every other participant.

**Bounded model:** Three processes and simultaneous requests from A/B. Lexicographic (timestamp,ID) priority decides deferred replies. Every other process must reply. Messages are reliable; recovery and dynamic membership are outside the model.

**Model sınırı:** Üç süreç ve A/B’den eşzamanlı istek. (Damga,kimlik) sözlük sırası ertelenen yanıtı belirler. Diğer her süreç yanıtlamalıdır. Mesajlar güvenilirdir; toparlanma ve dinamik üyelik yoktur.

**Manipulations:** A’s request timestamp (1–4); C does not reply.

**Prediction:** Equal request timestamps: is the winner random? **Answer:** No; process IDs break the tie. A deterministic tie-break keeps every process’s priority consistent.

**Primary sources:** [Ricart & Agrawala — An Optimal Algorithm for Mutual Exclusion in Computer Networks](https://doi.org/10.1145/358527.358537).

### Suzuki–Kasami token / Suzuki–Kasami jetonu

**ID:** `suzuki-kasami` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Unique token; RN request counters; LN served counters; queueing outstanding requests exactly once.

**Bounded model:** Three processes, one broadcast request, one unique token, RN request counters and LN served counters. The token queue contains outstanding requests once. Lost-token recovery is deliberately absent; inventing a second token would endanger exclusion.

**Model sınırı:** Üç süreç, tek yayın isteği, tek jeton, RN istek ve LN hizmet sayaçları. Jeton kuyruğu bekleyen isteği bir kez tutar. Kayıp jeton toparlanması yoktur; ikinci jeton üretmek dışlamayı tehlikeye atar.

**Manipulations:** Next requester; Lose the unique token.

**Prediction:** The token is lost. Should every node make a replacement? **Answer:** No. Multiple tokens can let multiple processes enter at once.

**Primary sources:** [Suzuki & Kasami — A Distributed Mutual Exclusion Algorithm](https://turing.cs.hbg.psu.edu/comp512.papers/SuzukiKasami-85.pdf).

### Chang–Roberts election / Chang–Roberts seçimi

**ID:** `ring-election` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Chang–Roberts participant flags; replacement/suppression of smaller candidates; maximum-ID return.

**Bounded model:** Five unique IDs on a reliable directed ring. Larger candidates are forwarded; smaller candidates are replaced by a nonparticipant’s own ID or suppressed by a participant. No crashes or broken-ring repair.

**Model sınırı:** Güvenilir yönlü halkada beş benzersiz kimlik. Büyük aday iletilir; küçük aday, katılmamış sürecin kimliğiyle değiştirilir veya katılmış süreçte bastırılır. Çökme veya kopuk halka onarımı yoktur.

**Manipulations:** Starting position (0–4); Everyone initiates.

**Prediction:** Must the initiator become the leader? **Answer:** No; the maximum ID wins. Initiation starts the comparison; it does not grant authority.

**Primary sources:** [Chang & Roberts — An Improved Algorithm for Decentralized Extrema-Finding in Circular Configurations](https://doi.org/10.1145/359104.359108).

### Bully election / Bully seçimi

**ID:** `bully-election` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Election messages to higher IDs; OK responses; highest responsive process announces coordinator.

**Bounded model:** Five known processes and reliable messages with sufficiently accurate timeout detection. The highest responsive ID announces itself. Network partitions and false suspicions can create competing leaders and are not solved here.

**Model sınırı:** Beş bilinen süreç, güvenilir mesajlar ve yeterince doğru zaman aşımı tespiti. En yüksek yanıtlayan kimlik kendini duyurur. Ağ bölünmesi ve yanlış şüphe rakip lider yaratabilir; burada çözülmez.

**Manipulations:** Initiator ID (1–4); Process 5 is down.

**Prediction:** Highest ID is offline. Must the election wait forever? **Answer:** No; the highest responsive process can win. This bounded example assumes a working timeout failure detector.

**Primary sources:** [Garcia-Molina — Elections in a Distributed Computing System](https://doi.org/10.1109/TC.1982.1675989).

### Chandy–Lamport snapshot / Chandy–Lamport anlık görüntüsü

**ID:** `chandy-lamport` · **Type:** algorithm · **Family:** coordination

**Mechanism:** First-marker local recording; FIFO channel boundaries; recording in-flight application messages.

**Bounded model:** Three processes, 16 total units, reliable FIFO channels and one B→A transfer. Markers close each recorded incoming channel. A transfer sent before B’s snapshot and received after A’s snapshot is recorded in the channel. This is a consistent cut, not one wall-clock instant.

**Model sınırı:** Üç süreç, toplam 16 birim, güvenilir FIFO kanallar ve tek B→A aktarımı. İşaretçiler kaydedilen giriş kanallarını kapatır. B kaydından önce gönderilip A kaydından sonra alınan aktarım kanala yazılır. Bu, tek fiziksel an değil tutarlı kesittir.

**Manipulations:** B sends to A (1–5); Record A before payment arrives.

**Prediction:** A payment is between snapshots. Should its value disappear? **Answer:** No; record it in the channel. Local balances plus in-flight channel state conserve all 16 units.

**Primary sources:** [Chandy & Lamport — Distributed Snapshots: Determining Global States of Distributed Systems](https://lamport.azurewebsites.net/pubs/chandy.pdf).

### Dijkstra–Scholten termination / Dijkstra–Scholten sonlanma

**ID:** `termination-detection` · **Type:** algorithm · **Family:** coordination

**Mechanism:** Rooted diffusing computation; parent/child obligations; deferred acknowledgment until all child work completes.

**Bounded model:** A tree-shaped diffusing computation rooted at A. Parent obligations are discharged only when local work and child obligations finish. One delayed acknowledgment leaves an outstanding obligation. General reactivation graphs and process failures are omitted.

**Model sınırı:** A köklü ağaç biçimli iş yayılımı. Üst sürece borç, yerel iş ve çocuk borçları bitince kapanır. Geciken tek onay borcu açık tutar. Genel yeniden etkinleşme grafikleri ve süreç hataları yoktur.

**Manipulations:** Delay C’s acknowledgment; B creates another child job.

**Prediction:** Every worker looks idle, but an acknowledgment is in flight. Finished? **Answer:** Not yet. Termination requires accounting for communication as well as local activity.

**Primary sources:** [Dijkstra & Scholten — Termination Detection for Diffusing Computations](https://www.cs.utexas.edu/~EWD/ewd06xx/EWD687.PDF).

### Epidemic gossip / Salgın biçimli gossip

**ID:** `gossip` · **Type:** algorithm · **Family:** networking

**Mechanism:** Seeded push contacts; bounded fanout; information spreads between rounds; partition reachability.

**Bounded model:** Eight peers and five synchronous push rounds with seeded contact sampling. Only nodes informed at the start of a round transmit that round. A partition forbids cross-group contact. This finite run does not prove eventual convergence or Byzantine robustness.

**Model sınırı:** Sekiz eş ve tohumlu seçimle beş eşzamanlı itme turu. Yalnız tur başında bilgili olan düğümler o tur gönderir. Bölünme, gruplar arası iletişimi engeller. Sonlu çalışma, nihai yakınsamayı veya Bizans dayanıklılığını kanıtlamaz.

**Manipulations:** Peers contacted per round (1–3); Split the network; Contact schedule seed (1–8).

**Prediction:** Can gossip cross a completely disconnected partition? **Answer:** No. More retries cannot create a missing communication path.

**Primary sources:** [Demers et al. — Epidemic Algorithms for Replicated Database Maintenance](https://www.cs.cornell.edu/home/rvr/papers/epidemic.pdf).

### SWIM failure detection / SWIM hata algılama

**ID:** `swim` · **Type:** protocol · **Family:** networking

**Mechanism:** Direct and indirect probes; suspicion interval; refutation through a newer incarnation.

**Bounded model:** A probes B through one direct path and two helpers. A failed direct probe may succeed indirectly. A live suspect refutes with a higher incarnation; an unrefuted crashed target expires after the shown timeout. Full randomized membership dissemination and timing adaptation are omitted.

**Model sınırı:** A, B’yi bir doğrudan yol ve iki yardımcıyla yoklar. Doğrudan başarısız yoklama dolaylı başarılı olabilir. Canlı şüpheli, daha yüksek incarnation ile çürütür; çökmüş hedef gösterilen sürede silinir. Tam rastgele üyelik yayılımı ve zamanlama uyarlaması yoktur.

**Manipulations:** B has crashed; Delay the direct acknowledgment; Use indirect probes.

**Prediction:** One ping timed out. Is a crash proven? **Answer:** No; the path may be slow. Indirect probes and suspicion reduce false failure reports.

**Primary sources:** [Das, Gupta & Motivala — SWIM](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf).

### Chord lookup / Chord araması

**ID:** `chord` · **Type:** algorithm · **Family:** networking

**Mechanism:** Modulo identifier intervals; exact successor ownership; exponential fingers; closest-preceding-finger routing.

**Bounded model:** A 4-bit identifier ring with exact successor ownership and recomputed finger tables. Routing uses the closest preceding finger, then the successor when the key lies in that interval. Tables are already stabilized; churn recovery and successor lists are omitted.

**Model sınırı:** Tam ardıl sahipliği ve yeniden hesaplanan parmak tablolarıyla 4 bitlik halka. Yönlendirme en yakın önceleyen parmağı, anahtar ilgili aralıktaysa ardılı kullanır. Tablolar kararlıdır; düğüm değişimi toparlanması ve ardıl listeleri yoktur.

**Manipulations:** Starting node; Key position (0–15); Add node 10.

**Prediction:** Who owns a key with no node at exactly that position? **Answer:** The clockwise successor. Chord ownership follows identifier order, including wraparound.

**Primary sources:** [Stoica et al. — Chord: A Scalable Peer-to-peer Lookup Service](https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf).

### Kademlia lookup / Kademlia araması

**ID:** `kademlia` · **Type:** algorithm · **Family:** networking

**Mechanism:** XOR metric; local k-bucket contacts; parallel iterative queries; deduplicated shortlist and responsive result.

**Bounded model:** Eight peers in a 4-bit XOR space with deterministic k-bucket contacts, a small initial shortlist and four query rounds. An external requester asks up to α unqueried contacts per round; failed node 8 is excluded. Full bucket eviction, refresh and value replication are omitted.

**Model sınırı:** 4 bitlik XOR uzayında sekiz eş, belirli k-bucket eşleri, küçük ilk liste ve dört sorgu turu. Dış istemci tur başına en fazla α sorgulanmamış eşe sorar; yanıtlamayan 8 elenir. Tam bucket atımı, yenileme ve değer çoğaltma yoktur.

**Manipulations:** Target identifier (0–15); Parallel queries α (1–3); Node 8 does not respond.

**Prediction:** Is XOR distance the same as ordinary subtraction? **Answer:** No. Bitwise difference defines Kademlia’s metric and routing buckets.

**Primary sources:** [Maymounkov & Mazières — Kademlia](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf).

### Consistent hashing / Tutarlı hashleme

**ID:** `consistent-hashing` · **Type:** algorithm · **Family:** storage

**Mechanism:** Stable key/token positions; clockwise successor ownership; limited remapping; multiple tokens per server.

**Bounded model:** A 64-position ring, stable teaching hashes, three servers and optional D. Each server owns one to three tokens. Keys map to the next clockwise token. No replication, capacity weighting or production hash distribution guarantee.

**Model sınırı:** 64 konumlu halka, sabit öğretim hashleri, üç sunucu ve isteğe bağlı D. Sunucuda bir ila üç jeton vardır. Anahtar sonraki saat yönü jetonuna gider. Çoğaltma, kapasite ağırlığı veya gerçek hash dağılım garantisi yoktur.

**Manipulations:** Keys shown (4–12); Add server D; Tokens per server (1–3).

**Prediction:** After D joins, should a key move from A to B? **Answer:** No; changed ownership goes to D. Existing tokens keep their relative positions; the new server captures some intervals.

**Primary sources:** [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf).

### Read/write quorums / Okuma/yazma quorumları

**ID:** `quorum` · **Type:** concept · **Family:** storage

**Mechanism:** Concrete read/write response sets; intersection arithmetic; selecting the highest observed ordered version.

**Bounded model:** Five fixed replicas and one completed, versioned write. Writes reach the first W nodes; the read takes first or last R responses and picks the highest observed version. No concurrent writers, sloppy quorum or claim that intersection alone gives linearizability.

**Model sınırı:** Beş sabit kopya ve tamamlanmış tek sürümlü yazma. Yazma ilk W düğüme ulaşır; okuma ilk veya son R yanıtın en yüksek sürümünü seçer. Eşzamanlı yazan, esnek quorum veya kesişimin tek başına linearizability verdiği iddiası yoktur.

**Manipulations:** Read responses R (1–5); Write acknowledgments W (1–5); Read from the opposite end.

**Prediction:** With N=5, R=2 and W=2, can read and write sets be disjoint? **Answer:** Yes. Two sets of size two need not share a replica among five.

**Primary sources:** [Gifford — Weighted Voting for Replicated Data](https://www.cs.cmu.edu/~dga/15-712/F11/papers/gifford79.pdf); [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf).

### Read repair / Okuma sırasında onarım

**ID:** `read-repair` · **Type:** algorithm · **Family:** storage

**Mechanism:** Read multiple versions; reconcile the observed responses; propagate only to responding stale replicas.

**Bounded model:** Three replicas and a single ordered-version register. Reads contact the last R replicas, select the highest observed version, and optionally repair those responders. Conflict resolution, concurrent writes and unseen replicas are outside this trace.

**Model sınırı:** Üç kopya ve tek sıralı sürümlü yazmaç. Okuma son R kopyayı sorgular, görülen en yüksek sürümü seçer ve isteğe bağlı bu yanıtlayanları onarır. Çatışma çözümü, eşzamanlı yazma ve görülmeyen kopyalar kapsam dışıdır.

**Manipulations:** Replicas holding version 1 (1–3); Responses read (1–3); Repair responding replicas.

**Prediction:** Can a read repair a newer version that none of its responders knows? **Answer:** No. An unobserved update cannot be reconstructed from stale answers.

**Primary sources:** [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf).

### Hinted handoff / İpuçlu teslim

**ID:** `hinted-handoff` · **Type:** algorithm · **Family:** storage

**Mechanism:** Record intended destination; retain a bounded hint; replay before expiry; distinguish hints from anti-entropy.

**Bounded model:** A single versioned write and one unavailable replica C. Helper D retains the intended destination until a discrete expiry; delivery requires return strictly before expiry. Expired hints require another repair mechanism. This does not model durable hinted-handoff storage or sloppy-quorum consistency.

**Model sınırı:** Tek sürümlü yazma ve erişilemeyen C kopyası. D yardımcısı hedefi belirli süreye kadar saklar; teslim, süreden kesin önce dönüş ister. Süresi dolan ipucu başka onarım gerektirir. Kalıcı ipucu deposu veya esnek quorum tutarlılığı modellenmez.

**Manipulations:** Return time (1–3); Hint expiry (1–4); The replica returns.

**Prediction:** The hint expired before C returned. Is C automatically current? **Answer:** No; another repair is needed. Hints are a temporary delivery aid, not a permanent repair guarantee.

**Primary sources:** [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf).

### Merkle anti-entropy / Merkle anti-entropy

**ID:** `anti-entropy` · **Type:** algorithm · **Family:** storage

**Mechanism:** Bottom-up Merkle-style digests; compare roots; recursively skip equal subtrees; transfer divergent leaves.

**Bounded model:** Two eight-leaf replicas, computed deterministic teaching hashes and recursive subtree comparison. A is authoritative for this single-writer example. Hashes are noncryptographic; conflict resolution and hash-collision security are not demonstrated.

**Model sınırı:** İki sekiz yapraklı kopya, hesaplanan belirli öğretim hashleri ve özyinelemeli alt ağaç karşılaştırması. Tek yazanlı örnekte A yetkilidir. Hashler kriptografik değildir; çatışma çözümü ve çakışma güvenliği gösterilmez.

**Manipulations:** First changed leaf (0–7); Changed leaves (1–3); Copy divergent leaves.

**Prediction:** A subtree’s hashes match. Must every leaf be transferred? **Answer:** No. Matching digests let this comparison skip that subtree.

**Primary sources:** [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf); [Demers et al. — Epidemic Algorithms for Replicated Database Maintenance](https://www.cs.cornell.edu/home/rvr/papers/epidemic.pdf).

### Two-phase commit / İki aşamalı commit

**ID:** `two-phase-commit` · **Type:** protocol · **Family:** coordination

**Mechanism:** Durable yes/no preparation; unanimity for commit; durable coordinator decision; uncertainty and blocking.

**Bounded model:** Three participants and one coordinator. Failure occurs before a durable decision record; recovered coordinator conservatively aborts. Prepared yes-voters block while it is unavailable. Participant-to-participant termination is omitted: a reachable no-voter could otherwise help establish abort. Durable storage is assumed.

**Model sınırı:** Üç katılımcı ve koordinatör. Hata, kalıcı karar kaydından öncedir; toparlanan koordinatör temkinli olarak abort eder. Hazır evetçilerin beklemesi gerekir. Katılımcılar arası sonlandırma yoktur: erişilen hayırcı aksi halde abort kararını belirlemeye yardım edebilirdi. Kalıcı depo varsayılır.

**Manipulations:** C votes no; Coordinator fails before decision log; Coordinator recovers.

**Prediction:** Two participants vote yes, one votes no. Can the transaction commit? **Answer:** No; commit requires all yes. Atomic commit is not a majority vote over whether every participant can commit.

**Primary sources:** [Gray & Lamport — Consensus on Transaction Commit](https://lamport.azurewebsites.net/pubs/transaction-commit.pdf).

### Three-phase commit / Üç aşamalı commit

**ID:** `three-phase-commit` · **Type:** protocol · **Family:** coordination

**Mechanism:** Waiting/precommit separation; phase-informed recovery under stated synchrony/connectivity assumptions.

**Bounded model:** A deliberately narrow synchronous example: all surviving participants are either waiting or have received precommit, and can exchange states. Coordinator-only failure leads to abort or commit respectively. With a partition/unbounded delay, the example stops and makes no safety or liveness claim. This is not a general asynchronous replacement for 2PC.

**Model sınırı:** Dar eşzamanlı örnek: yaşayan katılımcıların hepsi ya bekliyor ya ön commit almış ve durum paylaşabiliyor. Yalnız koordinatör hatası sırasıyla abort veya commit getirir. Bölünme/sınırsız gecikmede örnek durur; güvenlik veya ilerleme iddiası yoktur. Genel asenkron 2PC alternatifi değildir.

**Manipulations:** State when the coordinator stops; Coordinator crashes; Break the timing assumptions.

**Prediction:** Does 3PC remove blocking under arbitrary partitions? **Answer:** No. Its recovery argument depends on stronger timing and connectivity assumptions.

**Primary sources:** [Skeen — Nonblocking Commit Protocols](https://doi.org/10.1145/582318.582339); [Gray & Lamport — Consensus on Transaction Commit](https://lamport.azurewebsites.net/pubs/transaction-commit.pdf).

### G-counter CRDT / G-counter CRDT

**ID:** `g-counter` · **Type:** data-structure · **Family:** storage

**Mechanism:** Replica-indexed grow-only components; max merge; sum query; idempotent replay.

**Bounded model:** A state-based grow-only counter with three fixed replica IDs. A replica increments only its own component; merge takes componentwise maximum; value is the sum. Communication can pause, but eventual convergence requires state exchange.

**Model sınırı:** Üç sabit kopya kimliğiyle durum tabanlı yalnız artan sayaç. Kopya yalnız kendi bileşenini artırır; birleştirme bileşen maksimumunu, değer toplamı kullanır. İletişim durabilir; nihai yakınsama durum paylaşımı ister.

**Manipulations:** Increments at A (1–5); Increments at B (1–5); Exchange replica states.

**Prediction:** Merge the same state twice. Does the count increase twice? **Answer:** No. The merge is idempotent: max(x,x)=x.

**Primary sources:** [Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document).

### PN-counter CRDT / PN-counter CRDT

**ID:** `pn-counter` · **Type:** data-structure · **Family:** storage

**Mechanism:** Separate positive/negative G-counters; independent max merges; difference of sums.

**Bounded model:** A state-based PN-counter uses separate positive and negative G-counters. Components never decrease; the read value may be negative. The total after a full merge is distinguished from partitioned replicas’ current local values.

**Model sınırı:** Durum tabanlı PN-counter ayrı pozitif ve negatif G-counter kullanır. Bileşenler azalmaz; okunan değer negatif olabilir. Tam birleştirme sonrası toplam, bölünmüş kopyaların mevcut yerel değerlerinden ayrılır.

**Manipulations:** A increments (1–5); B decrements (1–4); Exchange replica states.

**Prediction:** Does a decrement reduce a stored G-counter component? **Answer:** No; it grows the negative counter. Monotone internal components preserve the merge rule.

**Primary sources:** [Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document).

### Observed-remove set / Gözlenen-eklemeyi-silen küme

**ID:** `or-set` · **Type:** data-structure · **Family:** storage

**Mechanism:** Unique add tags; observed removal tags; union merge; add-wins behavior for unseen concurrent additions.

**Bounded model:** A state-based add-wins observed-remove set for one element x. Adds carry unique tags A1/B1; removes retain observed tags as tombstones; merges union both sets. Tombstone collection, replica retirement and bounded metadata are omitted.

**Model sınırı:** Tek x elemanlı durum tabanlı ekleme-kazanır küme. Eklemeler benzersiz A1/B1 etiketi taşır; silme gördüğü etiketleri mezar taşı olarak saklar; birleşme iki kümeyi de birleştirir. Mezar taşı temizliği, kopya ayrılması ve sınırlı metadata yoktur.

**Manipulations:** Add B1 concurrently with removal; Exchange add/remove sets.

**Prediction:** A removes A1 while B adds unseen B1. Is x present after merge? **Answer:** Yes. Removal targets observed tags, so B1 survives.

**Primary sources:** [Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document).

### Last-write-wins register / Son-yazan-kazanır yazmaç

**ID:** `lww-register` · **Type:** data-structure · **Family:** storage

**Mechanism:** Maximum timestamp/replica-ID merge; deterministic tie-break; convergence despite loss of a real-time-later write.

**Bounded model:** Two writes occur at real times 10 and 11. B’s physical clock has an adjustable offset. Merge selects max(timestamp,replica ID); concurrent or skewed updates can lose a value. This is a register merge policy, not a linearizable storage protocol.

**Model sınırı:** İki yazma gerçek 10 ve 11 zamanlarında olur. B’nin fiziksel saat farkı ayarlanır. Birleşme max(damga,kopya kimliği) seçer; eşzamanlı veya kaymış güncellemeler değer kaybettirebilir. Yazmaç birleştirme kuralıdır; linearizable depo protokolü değildir.

**Manipulations:** B’s clock offset (-3–3); Merge the register states.

**Prediction:** Can an earlier real-world write win because of clock skew? **Answer:** Yes. Timestamp order need not equal real-time order.

**Primary sources:** [Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document).

### CAP during a partition / Bölünme sırasında CAP

**ID:** `cap` · **Type:** concept · **Family:** foundations

**Mechanism:** A partitioned register example contrasting blocked completion with stale available responses.

**Bounded model:** Two replicas and one write followed by a read. The consistency policy refuses an unreplicated write; the available policy acknowledges locally and may return the old value elsewhere. Availability has the CAP meaning: every request to a nonfailed node eventually responds. This is an example, not a proof or a universal choose-two product taxonomy.

**Model sınırı:** İki kopya, bir yazma ve sonra okuma. Tutarlılık politikası çoğaltılmayan yazmayı bekletir; erişilebilir politika yerelde onaylar ve diğer yerde eski değer dönebilir. CAP erişilebilirliği: sağlam düğüme her istek sonunda yanıt alır. Bu örnektir; kanıt veya evrensel iki-seç ürün sınıflaması değildir.

**Manipulations:** Response policy; Disconnect the replicas.

**Prediction:** Can a disconnected replica always return the latest completed write without waiting? **Answer:** No. It cannot learn a remote write through a link that delivers no messages.

**Primary sources:** [Gilbert & Lynch — Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf).

### FLP impossibility / FLP imkânsızlığı

**ID:** `flp` · **Type:** concept · **Family:** foundations

**Mechanism:** Finite indistinguishability between delay and crash; an in-flight message can outlive its sender.

**Bounded model:** A finite indistinguishability illustration, not the FLP proof or an implemented consensus protocol. C sends before possibly crashing; that already-sent message may still arrive. A sees only delivery, so delay alone cannot identify a crash. Partial synchrony and randomized protocols change the assumptions.

**Model sınırı:** FLP kanıtı veya çalışan uzlaşma değil, sonlu ayırt-edilemezlik gösterimi. C olası çöküşten önce gönderir; gönderilmiş mesaj yine gelebilir. A yalnız teslimi görür; gecikme tek başına çöküşü belirleyemez. Kısmi eşzamanlılık ve rastgele protokoller varsayımları değiştirir.

**Manipulations:** C crashes after sending; Deliver the pending message.

**Prediction:** Does FLP say real distributed systems can never reach agreement? **Answer:** No; it rules out one universal termination guarantee. The theorem is about guarantees under precise asynchronous and failure assumptions.

**Primary sources:** [Fischer, Lynch & Paterson — Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf).

### Linearizability / Linearizability

**ID:** `linearizability` · **Type:** concept · **Family:** foundations

**Mechanism:** Operation intervals; real-time precedence; legal register serialization via bounded backtracking.

**Bounded model:** A single register initially 0, one write of 1, and one read. A bounded backtracking checker finds a legal sequential history consistent with invocation/response intervals. Concurrent reads may see old or new; a read after a completed write may not see old. Distributed implementation and failures are omitted.

**Model sınırı:** Başlangıcı 0 olan tek yazmaç, 1 yazan bir işlem ve bir okuma. Sınırlı geri izleme, çağrı/yanıt aralıklarına uygun geçerli sıralı geçmiş arar. Örtüşen okuma eski veya yeni görebilir; tamamlanmış yazma sonrası okuma eski göremez. Dağıtık uygulama ve hatalar yoktur.

**Manipulations:** Read overlaps the write; Read returns the old value.

**Prediction:** The write completed before the read began. Can the read return the old value? **Answer:** No. Real-time precedence constrains every legal linearization.

**Primary sources:** [Herlihy & Wing — Linearizability: A Correctness Condition for Concurrent Objects](https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf).

## Validation invariants

The domain tests check behavior that can be wrong even when a scene renders successfully:

- Raft current-term majority requirements and stale-candidate rejection; Paxos highest accepted-value inheritance.
- Multi-Paxos application barriers at missing slots; VR view/log selection and committed-prefix preservation.
- Lamport receive inequalities; vector partial ordering; causal delivery dependencies and per-sender sequence.
- Chang–Roberts election from every initiator and with simultaneous initiations.
- Every key/start combination in both finite Chord rings; every Kademlia target, query width and modeled node-8 failure combination.
- Consistent-hash locality when adding a server; all small fixed-replica quorum pairs whose sizes force intersection.
- Read repair’s inability to recover an unobserved version; exact divergent-leaf identification.
- Snapshot value conservation; outstanding termination obligations.
- 2PC unanimity and recovery outcomes; 3PC refusal to assert a result outside its assumptions.
- CRDT commutativity, associativity and idempotence; observed-remove add-wins behavior; LWW clock-skew consequences.
- Linearizable and non-linearizable register histories; FLP message delivery after sender failure.
- Deterministic replay, bilingual content, valid scene references, bounded coordinates, short object labels and effective controls.

## Primary-source bibliography

- [Ongaro & Ousterhout — In Search of an Understandable Consensus Algorithm](https://raft.github.io/raft.pdf) (2014).
- [Lamport — Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) (2001).
- [Apache ZooKeeper — Internals and atomic broadcast](https://zookeeper.apache.org/doc/current/zookeeperInternals.html).
- [Liskov & Cowling — Viewstamped Replication Revisited](https://pmg.csail.mit.edu/papers/vr-revisited.pdf) (2012).
- [Lamport — Time, Clocks, and the Ordering of Events in a Distributed System](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) (1978).
- [Mattern — Virtual Time and Global States of Distributed Systems](https://vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf) (1989).
- [Birman, Schiper & Stephenson — Lightweight Causal and Atomic Group Multicast](https://doi.org/10.1145/128738.128742) (1991).
- [Ricart & Agrawala — An Optimal Algorithm for Mutual Exclusion in Computer Networks](https://doi.org/10.1145/358527.358537) (1981).
- [Suzuki & Kasami — A Distributed Mutual Exclusion Algorithm](https://turing.cs.hbg.psu.edu/comp512.papers/SuzukiKasami-85.pdf) (1985).
- [Chang & Roberts — An Improved Algorithm for Decentralized Extrema-Finding in Circular Configurations](https://doi.org/10.1145/359104.359108) (1979).
- [Garcia-Molina — Elections in a Distributed Computing System](https://doi.org/10.1109/TC.1982.1675989) (1982).
- [Chandy & Lamport — Distributed Snapshots: Determining Global States of Distributed Systems](https://lamport.azurewebsites.net/pubs/chandy.pdf) (1985).
- [Dijkstra & Scholten — Termination Detection for Diffusing Computations](https://www.cs.utexas.edu/~EWD/ewd06xx/EWD687.PDF) (1980).
- [Demers et al. — Epidemic Algorithms for Replicated Database Maintenance](https://www.cs.cornell.edu/home/rvr/papers/epidemic.pdf) (1987).
- [Das, Gupta & Motivala — SWIM](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf) (2002).
- [Stoica et al. — Chord: A Scalable Peer-to-peer Lookup Service](https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf) (2001).
- [Maymounkov & Mazières — Kademlia](https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf) (2002).
- [DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) (2007).
- [Gifford — Weighted Voting for Replicated Data](https://www.cs.cmu.edu/~dga/15-712/F11/papers/gifford79.pdf) (1979).
- [Gray & Lamport — Consensus on Transaction Commit](https://lamport.azurewebsites.net/pubs/transaction-commit.pdf) (2006).
- [Skeen — Nonblocking Commit Protocols](https://doi.org/10.1145/582318.582339) (1981).
- [Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types](https://inria.hal.science/inria-00555588/document) (2011).
- [Gilbert & Lynch — Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services](https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer2.pdf) (2002).
- [Fischer, Lynch & Paterson — Impossibility of Distributed Consensus with One Faulty Process](https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf) (1985).
- [Herlihy & Wing — Linearizability: A Correctness Condition for Concurrent Objects](https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf) (1990).

## Türkçe kapsam notu

Bu bölüm, 33 dağıtık sistem konusunun araştırma dayanağını ve model sınırlarını kaydeder. Sahneler algoritmaya özgü kararları gerçekten hesaplar; üretim sistemi veya makalelerdeki güvenlik/ilerleme kanıtının tamamı olduklarını iddia etmez. Öğrenci önce küçük bir yürütmeyi izler, sonra aynı durum geçişlerini değiştiren kontrolleri kullanır. Kaynak, varsayım ve tahmin sorusu her dersin parçasıdır.
