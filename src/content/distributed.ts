import type { Lesson } from '../types';

/** Bounded, source-backed lessons. Model limitations are part of every lesson. */
export const distributedLessons: Lesson[] = [
  {
    "id": "raft",
    "title": {
      "en": "Raft",
      "tr": "Raft"
    },
    "hook": {
      "en": "Elect a leader. Replicate a log. Commit safely.",
      "tr": "Lider seç. Günlüğü çoğalt. Güvenle commit et."
    },
    "category": "consensus",
    "kind": "protocol",
    "level": 2,
    "minutes": 6,
    "tags": [
      "leader",
      "log",
      "lider",
      "günlük",
      "raft"
    ],
    "controls": [
      {
        "id": "offline",
        "label": {
          "en": "Offline followers",
          "tr": "Çevrimdışı takipçi"
        },
        "kind": "range",
        "min": 0,
        "max": 3,
        "default": 0,
        "step": 1
      },
      {
        "id": "staleCandidate",
        "label": {
          "en": "Candidate has an older log",
          "tr": "Adayın günlüğü eski"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "appendCurrent",
        "label": {
          "en": "Append in the new term",
          "tr": "Yeni dönemde kayıt ekle"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "A majority alone cannot directly commit an older-term entry.",
      "tr": "Çoğunluk tek başına eski dönem kaydını doğrudan commit edemez."
    },
    "model": {
      "en": "Five servers, one election and one append. Voting checks the candidate’s last log term/index; direct commitment requires a current-term entry on a majority. Earlier entries commit with that prefix. Timers, persistence, membership changes and full AppendEntries conflict repair are omitted.",
      "tr": "Beş sunucu, tek seçim ve ekleme. Oyda adayın son kayıt dönemi/indeksi kontrol edilir; doğrudan commit, çoğunlukta güncel dönem kaydı ister. Önceki kayıtlar aynı önekle commit edilir. Zamanlayıcı, kalıcılık, üyelik değişimi ve tam günlük onarımı yoktur."
    },
    "challenge": {
      "question": {
        "en": "An older entry reaches a majority. Can counting replicas alone commit it?",
        "tr": "Eski dönem kaydı çoğunluğa ulaştı. Yalnız kopya sayısı commit için yeterli mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; a current-term entry is needed",
          "tr": "Hayır; güncel dönem kaydı gerekir"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Raft’s leader advances commitIndex by counting a current-term entry; the earlier prefix follows.",
        "tr": "Raft lideri, güncel dönem kaydını sayarak commitIndex ilerletir; önceki önek onu izler."
      }
    },
    "sources": [
      {
        "title": "Ongaro & Ousterhout — In Search of an Understandable Consensus Algorithm",
        "url": "https://raft.github.io/raft.pdf",
        "year": 2014
      }
    ],
    "related": [
      "paxos",
      "multi-paxos"
    ]
  },
  {
    "id": "paxos",
    "title": {
      "en": "Paxos",
      "tr": "Paxos"
    },
    "hook": {
      "en": "A new proposal may have to carry an old value.",
      "tr": "Yeni öneri, eski değeri taşımak zorunda kalabilir."
    },
    "category": "consensus",
    "kind": "protocol",
    "level": 3,
    "minutes": 7,
    "tags": [
      "paxos"
    ],
    "controls": [
      {
        "id": "oldAccepted",
        "label": {
          "en": "An acceptor remembers A",
          "tr": "Bir kabulcü A’yı hatırlıyor"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "ballot",
        "label": {
          "en": "New ballot number",
          "tr": "Yeni tur numarası"
        },
        "kind": "range",
        "min": 1,
        "max": 4,
        "default": 3,
        "step": 1
      },
      {
        "id": "unavailable",
        "label": {
          "en": "Unavailable acceptors",
          "tr": "Erişilemeyen kabulcü"
        },
        "kind": "range",
        "min": 0,
        "max": 2,
        "default": 0,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "A proposer inherits the highest accepted ballot in its prepare quorum.",
      "tr": "Öneren, hazırlık çoğunluğundaki en yüksek kabul turunun değerini devralır."
    },
    "model": {
      "en": "Single-decree Paxos with three acceptors, prior promises at ballot 2, and a unique new proposer ballot. Prepare must exceed those promises. A remembered value at ballot 2 is inherited even if it was accepted by only one node. No persistence failures, concurrent proposer loop or membership changes.",
      "tr": "Üç kabulcü, 2 numaralı eski vaat ve benzersiz yeni öneri turuyla tek değerli Paxos. Yeni hazırlık eski vaadi aşmalıdır. Yalnız bir düğümün kabul ettiği 2 numaralı değer bile devralınır. Kalıcılık hatası, eşzamanlı öneren döngüsü veya üyelik değişimi yoktur."
    },
    "challenge": {
      "question": {
        "en": "Must a new proposer keep a value reported at the highest accepted ballot?",
        "tr": "Yeni öneren, bildirilen en yüksek kabul turunun değerini korumalı mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "It can always replace it",
          "tr": "Her zaman değiştirebilir"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Quorum intersection carries previously chosen information into future proposals.",
        "tr": "Çoğunluk kesişimi, önceki seçim bilgisini sonraki önerilere taşır."
      }
    },
    "sources": [
      {
        "title": "Lamport — Paxos Made Simple",
        "url": "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf",
        "year": 2001
      }
    ],
    "related": [
      "raft",
      "multi-paxos"
    ]
  },
  {
    "id": "multi-paxos",
    "title": {
      "en": "Multi-Paxos",
      "tr": "Multi-Paxos"
    },
    "hook": {
      "en": "Reuse a leader. Fill many log positions.",
      "tr": "Lideri yeniden kullan. Çok sayıda günlük konumunu doldur."
    },
    "category": "consensus",
    "kind": "protocol",
    "level": 3,
    "minutes": 7,
    "tags": [
      "multi-paxos"
    ],
    "controls": [
      {
        "id": "leaderChange",
        "label": {
          "en": "Change the leader",
          "tr": "Lideri değiştir"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "hole",
        "label": {
          "en": "Leave slot 2 unchosen",
          "tr": "2. konumu seçilmeden bırak"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "slots",
        "label": {
          "en": "Log positions",
          "tr": "Günlük konumu"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 3,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "Slots may be chosen out of order; application waits for a contiguous prefix.",
      "tr": "Konumlar sıra dışı seçilebilir; uygulama kesintisiz öneği bekler."
    },
    "model": {
      "en": "Three acceptors and up to three slots. A stable leader amortizes phase 1; replacement prepares a higher ballot and inherits the chosen prefix. A deliberately missing slot blocks application of later chosen slots. Network retransmission, batching and arbitrary interleavings are omitted.",
      "tr": "Üç kabulcü ve en fazla üç konum. Sabit lider hazırlık aşamasını paylaşır; yeni lider daha yüksek turda hazırlanır ve seçilmiş öneği devralır. Eksik konum, sonraki seçilmiş kayıtların uygulanmasını durdurur. Tekrar gönderim, gruplama ve rastgele iç içe yürütmeler yoktur."
    },
    "challenge": {
      "question": {
        "en": "Slot 3 is chosen, but slot 2 is missing. Apply slot 3 now?",
        "tr": "3. konum seçildi; 2. konum eksik. 3 hemen uygulanır mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "Wait for slot 2",
          "tr": "2. konumu bekle"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "The replicated state machine applies one ordered prefix.",
        "tr": "Çoğaltılmış durum makinesi tek sıralı önek uygular."
      }
    },
    "sources": [
      {
        "title": "Lamport — Paxos Made Simple",
        "url": "https://lamport.azurewebsites.net/pubs/paxos-simple.pdf",
        "year": 2001
      }
    ],
    "related": [
      "paxos",
      "raft",
      "replicated-log"
    ]
  },
  {
    "id": "zab",
    "title": {
      "en": "Zab atomic broadcast",
      "tr": "Zab atomik yayın"
    },
    "hook": {
      "en": "An epoch change preserves the agreed prefix.",
      "tr": "Dönem değişimi, uzlaşılan öneği korur."
    },
    "category": "consensus",
    "kind": "protocol",
    "level": 3,
    "minutes": 7,
    "tags": [
      "zab"
    ],
    "controls": [
      {
        "id": "crash",
        "label": {
          "en": "Leader fails before acknowledgments",
          "tr": "Lider onaylardan önce çöksün"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "followers",
        "label": {
          "en": "Available followers",
          "tr": "Erişilebilir takipçi"
        },
        "kind": "range",
        "min": 0,
        "max": 2,
        "default": 2,
        "step": 1
      },
      {
        "id": "catchup",
        "label": {
          "en": "Synchronize the lagging follower",
          "tr": "Gerideki takipçiyi eşitle"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "A leader’s local proposal is not yet a committed broadcast.",
      "tr": "Liderin yerel önerisi henüz commit edilmiş yayın değildir."
    },
    "model": {
      "en": "Three servers and zxid=(epoch,counter). A quorum acknowledges an ordered proposal. In the shown failure, an unacknowledged tail exists only on the failed leader; a synchronized new quorum preserves the old committed prefix. Full discovery, DIFF/TRUNC/SNAP mechanics and session ordering are omitted.",
      "tr": "Üç sunucu ve zxid=(dönem,sayaç). Çoğunluk, sıralı öneriyi onaylar. Gösterilen hatada onaysız son kayıt yalnız çöken liderdedir; eşitlenmiş yeni çoğunluk eski commit önekini korur. Tam keşif, DIFF/TRUNC/SNAP ve oturum sıralaması yoktur."
    },
    "challenge": {
      "question": {
        "en": "Does an isolated leader’s new local record prove commitment?",
        "tr": "Yalıtılmış liderin yeni yerel kaydı commit kanıtı mı?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Zab requires quorum acknowledgment and an ordered commit.",
        "tr": "Zab, çoğunluk onayı ve sıralı commit gerektirir."
      }
    },
    "sources": [
      {
        "title": "Apache ZooKeeper — Internals and atomic broadcast",
        "url": "https://zookeeper.apache.org/doc/current/zookeeperInternals.html"
      }
    ],
    "related": [
      "raft",
      "viewstamped-replication"
    ]
  },
  {
    "id": "viewstamped-replication",
    "title": {
      "en": "Viewstamped replication",
      "tr": "Görünüm damgalı çoğaltma"
    },
    "hook": {
      "en": "Move leadership without forgetting committed work.",
      "tr": "Commit edilmiş işi unutmadan liderliği değiştir."
    },
    "category": "consensus",
    "kind": "protocol",
    "level": 3,
    "minutes": 7,
    "tags": [
      "viewstamped-replication"
    ],
    "controls": [
      {
        "id": "backups",
        "label": {
          "en": "Available backups",
          "tr": "Erişilebilir yedek"
        },
        "kind": "range",
        "min": 0,
        "max": 2,
        "default": 2,
        "step": 1
      },
      {
        "id": "leaderFail",
        "label": {
          "en": "Fail the primary",
          "tr": "Lideri çökert"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "staleTail",
        "label": {
          "en": "Old-view tail at C",
          "tr": "C’de eski görünüm kaydı"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "View change installs a safe log before processing new work.",
      "tr": "Görünüm değişimi yeni işten önce güvenli günlüğü kurar."
    },
    "model": {
      "en": "Three replicas, f=1, one committed prefix and one view change. New-primary selection compares last-normal view then log length among a quorum. Only the illustrated stale tail is discarded; this is not a complete VR recovery or state-transfer implementation.",
      "tr": "Üç kopya, f=1, tek commit öneği ve görünüm değişimi. Yeni lider, çoğunluk raporlarında son normal görünümü, sonra günlük uzunluğunu karşılaştırır. Yalnız örnekteki eski son kayıt atılır; tam VR toparlanması veya durum aktarımı değildir."
    },
    "challenge": {
      "question": {
        "en": "May a new primary erase an already committed prefix?",
        "tr": "Yeni lider commit edilmiş öneği silebilir mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No",
          "tr": "Hayır"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "View-change quorum evidence protects committed operations.",
        "tr": "Görünüm değişiminin çoğunluk kanıtı, commit edilmiş işlemleri korur."
      }
    },
    "sources": [
      {
        "title": "Liskov & Cowling — Viewstamped Replication Revisited",
        "url": "https://pmg.csail.mit.edu/papers/vr-revisited.pdf",
        "year": 2012
      }
    ],
    "related": [
      "zab",
      "raft"
    ]
  },
  {
    "id": "lamport-clock",
    "title": {
      "en": "Lamport clocks",
      "tr": "Lamport saatleri"
    },
    "hook": {
      "en": "Messages move logical time forward.",
      "tr": "Mesajlar mantıksal zamanı ilerletir."
    },
    "category": "time",
    "kind": "algorithm",
    "level": 1,
    "minutes": 5,
    "tags": [
      "lamport-clock"
    ],
    "controls": [
      {
        "id": "localEvents",
        "label": {
          "en": "Extra events at A",
          "tr": "A’da ek olay"
        },
        "kind": "range",
        "min": 0,
        "max": 3,
        "default": 1,
        "step": 1
      },
      {
        "id": "delay",
        "label": {
          "en": "B events before delivery",
          "tr": "Teslimden önce B olayı"
        },
        "kind": "range",
        "min": 0,
        "max": 2,
        "default": 1,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "If a causes b, its Lamport timestamp is smaller; the converse need not hold.",
      "tr": "a, b’ye neden olursa a’nın Lamport damgası küçüktür; tersi zorunlu değildir."
    },
    "model": {
      "en": "Three process clocks. Internal/send events increment; receive uses max(local,message)+1. Delivery delay is represented by extra local events, not physical milliseconds. Scalar timestamps cannot identify every concurrent pair.",
      "tr": "Üç süreç saati. Yerel/gönderim olayı artırır; alım max(yerel,mesaj)+1 kullanır. Gecikme fiziksel milisaniye yerine ek yerel olayla gösterilir. Tek sayılı damga, her eşzamanlı çifti ayıramaz."
    },
    "challenge": {
      "question": {
        "en": "Does L(a) < L(b) prove that a caused b?",
        "tr": "L(a) < L(b), a’nın b’ye neden olduğunu kanıtlar mı?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Independent events can also have increasing scalar timestamps.",
        "tr": "Bağımsız olayların tek sayılı damgaları da artan sırada olabilir."
      }
    },
    "sources": [
      {
        "title": "Lamport — Time, Clocks, and the Ordering of Events in a Distributed System",
        "url": "https://lamport.azurewebsites.net/pubs/time-clocks.pdf",
        "year": 1978
      }
    ],
    "related": [
      "vector-clock",
      "lamport-mutex"
    ]
  },
  {
    "id": "vector-clock",
    "title": {
      "en": "Vector clocks",
      "tr": "Vektör saatler"
    },
    "hook": {
      "en": "Keep one counter for each process.",
      "tr": "Her süreç için bir sayaç tut."
    },
    "category": "time",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "vector-clock"
    ],
    "controls": [
      {
        "id": "concurrent",
        "label": {
          "en": "Keep A and B independent",
          "tr": "A ile B bağımsız kalsın"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "extra",
        "label": {
          "en": "Extra events at A",
          "tr": "A’da ek olay"
        },
        "kind": "range",
        "min": 0,
        "max": 2,
        "default": 1,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "Incomparable vectors identify concurrency in this model.",
      "tr": "Karşılaştırılamayan vektörler bu modelde eşzamanlılığı belirler."
    },
    "model": {
      "en": "Three fixed processes. Local events increment their own component; receives merge componentwise maxima then increment the receiver. No process churn, compressed vectors or physical time. Vectors are compared componentwise, never by sums.",
      "tr": "Üç sabit süreç. Yerel olay kendi bileşenini artırır; alım bileşen bazında maksimumları birleştirip alıcıyı artırır. Süreç değişimi, sıkıştırma veya fiziksel zaman yoktur. Vektörler toplamla değil, bileşen bazında karşılaştırılır."
    },
    "challenge": {
      "question": {
        "en": "Neither vector is componentwise smaller. What does that mean?",
        "tr": "Hiçbir vektör bileşen bazında küçük değil. Bu ne demek?"
      },
      "options": [
        {
          "en": "Concurrent events",
          "tr": "Eşzamanlı olaylar"
        },
        {
          "en": "Broken clocks",
          "tr": "Bozuk saatler"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Neither event includes knowledge of the other.",
        "tr": "Hiçbir olay diğerinin bilgisini içermiyor."
      }
    },
    "sources": [
      {
        "title": "Mattern — Virtual Time and Global States of Distributed Systems",
        "url": "https://vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf",
        "year": 1989
      }
    ],
    "related": [
      "lamport-clock",
      "causal-broadcast",
      "hlc"
    ]
  },
  {
    "id": "causal-broadcast",
    "title": {
      "en": "Causal broadcast",
      "tr": "Nedensel yayın"
    },
    "hook": {
      "en": "A reply can arrive before its cause. Hold it.",
      "tr": "Yanıt nedeninden önce gelebilir. Beklet."
    },
    "category": "networking",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "causal-broadcast"
    ],
    "controls": [
      {
        "id": "reorder",
        "label": {
          "en": "Deliver the reply first",
          "tr": "Önce yanıt ulaşsın"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "dependency",
        "label": {
          "en": "B’s message depends on A",
          "tr": "B’nin mesajı A’ya bağlı"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Arrival order and safe application delivery order can differ.",
      "tr": "Ağa geliş sırası ile güvenli uygulama teslim sırası farklı olabilir."
    },
    "model": {
      "en": "Three processes and two broadcasts with vector delivery conditions. A receiver buffers a message until its sender’s next counter and all causal dependencies are satisfied. Reliable eventual delivery is assumed; group membership and atomic total order are omitted.",
      "tr": "Üç süreç ve vektör teslim koşullu iki yayın. Alıcı, gönderenin sıradaki sayacı ile tüm nedensel bağımlılıklar sağlanana kadar mesajı bekletir. Güvenilir nihai teslim varsayılır; grup üyeliği ve atomik tam sıralama yoktur."
    },
    "challenge": {
      "question": {
        "en": "A reply arrives first. Must it be shown immediately?",
        "tr": "Yanıt önce geldi. Hemen gösterilmeli mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; wait for its missing cause",
          "tr": "Hayır; eksik nedeni bekle"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Causal delivery can buffer a message without losing it.",
        "tr": "Nedensel teslim, mesajı kaybetmeden bekletebilir."
      }
    },
    "sources": [
      {
        "title": "Birman, Schiper & Stephenson — Lightweight Causal and Atomic Group Multicast",
        "url": "https://doi.org/10.1145/128738.128742",
        "year": 1991
      },
      {
        "title": "Mattern — Virtual Time and Global States of Distributed Systems",
        "url": "https://vs.inf.ethz.ch/publ/papers/VirtTimeGlobStates.pdf",
        "year": 1989
      }
    ],
    "related": [
      "vector-clock",
      "gossip"
    ]
  },
  {
    "id": "lamport-mutex",
    "title": {
      "en": "Lamport mutual exclusion",
      "tr": "Lamport karşılıklı dışlama"
    },
    "hook": {
      "en": "An ordered queue decides who enters.",
      "tr": "Sıralı kuyruk, kimin gireceğini belirler."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "lamport-mutex"
    ],
    "controls": [
      {
        "id": "concurrent",
        "label": {
          "en": "B also requests access",
          "tr": "B de erişim istesin"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "offline",
        "label": {
          "en": "C does not reply",
          "tr": "C yanıt vermesin"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Queue priority and replies from all peers are both needed.",
      "tr": "Hem kuyruk önceliği hem tüm eşlerden yanıt gerekir."
    },
    "model": {
      "en": "Three processes, reliable FIFO channels, ordered (timestamp,process ID) requests and explicit RELEASE. A missing peer blocks progress; there is no timeout-based safe entry or fault-tolerant membership change.",
      "tr": "Üç süreç, güvenilir FIFO kanallar, sıralı (damga,süreç kimliği) istekler ve açık RELEASE. Eksik eş ilerlemeyi durdurur; zaman aşımıyla güvenli giriş veya hataya dayanıklı üyelik değişimi yoktur."
    },
    "challenge": {
      "question": {
        "en": "A is first in the queue, but C never replies. Can A enter?",
        "tr": "A kuyrukta ilk, ama C yanıt vermiyor. A girebilir mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Being first does not replace the required acknowledgment from every peer.",
        "tr": "İlk olmak, her eşten gereken onayın yerini tutmaz."
      }
    },
    "sources": [
      {
        "title": "Lamport — Time, Clocks, and the Ordering of Events in a Distributed System",
        "url": "https://lamport.azurewebsites.net/pubs/time-clocks.pdf",
        "year": 1978
      }
    ],
    "related": [
      "ricart-agrawala",
      "suzuki-kasami"
    ]
  },
  {
    "id": "ricart-agrawala",
    "title": {
      "en": "Ricart–Agrawala",
      "tr": "Ricart–Agrawala"
    },
    "hook": {
      "en": "Delay a reply to protect your earlier request.",
      "tr": "Önceki isteğini korumak için yanıtı beklet."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "ricart-agrawala"
    ],
    "controls": [
      {
        "id": "aTime",
        "label": {
          "en": "A’s request timestamp",
          "tr": "A isteğinin damgası"
        },
        "kind": "range",
        "min": 1,
        "max": 4,
        "default": 2,
        "step": 1
      },
      {
        "id": "offline",
        "label": {
          "en": "C does not reply",
          "tr": "C yanıt vermesin"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "The earlier request receives permission; the other reply is deferred.",
      "tr": "Önceki istek izin alır; diğer yanıt ertelenir."
    },
    "model": {
      "en": "Three processes and simultaneous requests from A/B. Lexicographic (timestamp,ID) priority decides deferred replies. Every other process must reply. Messages are reliable; recovery and dynamic membership are outside the model.",
      "tr": "Üç süreç ve A/B’den eşzamanlı istek. (Damga,kimlik) sözlük sırası ertelenen yanıtı belirler. Diğer her süreç yanıtlamalıdır. Mesajlar güvenilirdir; toparlanma ve dinamik üyelik yoktur."
    },
    "challenge": {
      "question": {
        "en": "Equal request timestamps: is the winner random?",
        "tr": "İstek damgaları eşitse kazanan rastgele mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; process IDs break the tie",
          "tr": "Hayır; kimlikler eşitliği bozar"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "A deterministic tie-break keeps every process’s priority consistent.",
        "tr": "Belirli eşitlik kuralı, süreçlerin öncelik sırasını tutarlı tutar."
      }
    },
    "sources": [
      {
        "title": "Ricart & Agrawala — An Optimal Algorithm for Mutual Exclusion in Computer Networks",
        "url": "https://doi.org/10.1145/358527.358537",
        "year": 1981
      }
    ],
    "related": [
      "lamport-mutex",
      "suzuki-kasami"
    ]
  },
  {
    "id": "suzuki-kasami",
    "title": {
      "en": "Suzuki–Kasami token",
      "tr": "Suzuki–Kasami jetonu"
    },
    "hook": {
      "en": "Only one token can open the shared resource.",
      "tr": "Paylaşılan kaynağı yalnız tek jeton açar."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "suzuki-kasami"
    ],
    "controls": [
      {
        "id": "requester",
        "label": {
          "en": "Next requester",
          "tr": "Sonraki istekte bulunan"
        },
        "kind": "select",
        "options": [
          {
            "value": "B",
            "label": {
              "en": "B",
              "tr": "B"
            }
          },
          {
            "value": "C",
            "label": {
              "en": "C",
              "tr": "C"
            }
          }
        ],
        "default": "B"
      },
      {
        "id": "tokenLost",
        "label": {
          "en": "Lose the unique token",
          "tr": "Tek jetonu kaybet"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Request numbers and the token’s served counters prevent duplicate service.",
      "tr": "İstek numaraları ve jetondaki sayaçlar yinelenen hizmeti önler."
    },
    "model": {
      "en": "Three processes, one broadcast request, one unique token, RN request counters and LN served counters. The token queue contains outstanding requests once. Lost-token recovery is deliberately absent; inventing a second token would endanger exclusion.",
      "tr": "Üç süreç, tek yayın isteği, tek jeton, RN istek ve LN hizmet sayaçları. Jeton kuyruğu bekleyen isteği bir kez tutar. Kayıp jeton toparlanması yoktur; ikinci jeton üretmek dışlamayı tehlikeye atar."
    },
    "challenge": {
      "question": {
        "en": "The token is lost. Should every node make a replacement?",
        "tr": "Jeton kayboldu. Her düğüm yenisini üretmeli mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Multiple tokens can let multiple processes enter at once.",
        "tr": "Birden çok jeton, birden çok sürecin aynı anda girmesine yol açabilir."
      }
    },
    "sources": [
      {
        "title": "Suzuki & Kasami — A Distributed Mutual Exclusion Algorithm",
        "url": "https://turing.cs.hbg.psu.edu/comp512.papers/SuzukiKasami-85.pdf",
        "year": 1985
      }
    ],
    "related": [
      "lamport-mutex",
      "ricart-agrawala"
    ]
  },
  {
    "id": "ring-election",
    "title": {
      "en": "Chang–Roberts election",
      "tr": "Chang–Roberts seçimi"
    },
    "hook": {
      "en": "Let identifiers travel around the ring.",
      "tr": "Kimlikleri halka boyunca dolaştır."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "ring-election"
    ],
    "controls": [
      {
        "id": "initiator",
        "label": {
          "en": "Starting position",
          "tr": "Başlangıç konumu"
        },
        "kind": "range",
        "min": 0,
        "max": 4,
        "default": 1,
        "step": 1
      },
      {
        "id": "concurrent",
        "label": {
          "en": "Everyone initiates",
          "tr": "Herkes seçimi başlatsın"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "The greatest identifier eventually returns to its owner.",
      "tr": "En büyük kimlik sonunda sahibine geri döner."
    },
    "model": {
      "en": "Five unique IDs on a reliable directed ring. Larger candidates are forwarded; smaller candidates are replaced by a nonparticipant’s own ID or suppressed by a participant. No crashes or broken-ring repair.",
      "tr": "Güvenilir yönlü halkada beş benzersiz kimlik. Büyük aday iletilir; küçük aday, katılmamış sürecin kimliğiyle değiştirilir veya katılmış süreçte bastırılır. Çökme veya kopuk halka onarımı yoktur."
    },
    "challenge": {
      "question": {
        "en": "Must the initiator become the leader?",
        "tr": "Başlatan süreç lider olmak zorunda mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; the maximum ID wins",
          "tr": "Hayır; en büyük kimlik kazanır"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Initiation starts the comparison; it does not grant authority.",
        "tr": "Başlatmak karşılaştırmayı başlatır; yetki kazandırmaz."
      }
    },
    "sources": [
      {
        "title": "Chang & Roberts — An Improved Algorithm for Decentralized Extrema-Finding in Circular Configurations",
        "url": "https://doi.org/10.1145/359104.359108",
        "year": 1979
      }
    ],
    "related": [
      "bully-election",
      "raft"
    ]
  },
  {
    "id": "bully-election",
    "title": {
      "en": "Bully election",
      "tr": "Bully seçimi"
    },
    "hook": {
      "en": "Ask higher IDs. The highest live process answers.",
      "tr": "Yüksek kimliklere sor. En yüksek canlı süreç yanıtlar."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "bully-election"
    ],
    "controls": [
      {
        "id": "initiator",
        "label": {
          "en": "Initiator ID",
          "tr": "Başlatan kimliği"
        },
        "kind": "range",
        "min": 1,
        "max": 4,
        "default": 2,
        "step": 1
      },
      {
        "id": "crashedHighest",
        "label": {
          "en": "Process 5 is down",
          "tr": "5 numaralı süreç kapalı"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Higher-priority live processes take over the election.",
      "tr": "Daha yüksek öncelikli canlı süreçler seçimi devralır."
    },
    "model": {
      "en": "Five known processes and reliable messages with sufficiently accurate timeout detection. The highest responsive ID announces itself. Network partitions and false suspicions can create competing leaders and are not solved here.",
      "tr": "Beş bilinen süreç, güvenilir mesajlar ve yeterince doğru zaman aşımı tespiti. En yüksek yanıtlayan kimlik kendini duyurur. Ağ bölünmesi ve yanlış şüphe rakip lider yaratabilir; burada çözülmez."
    },
    "challenge": {
      "question": {
        "en": "Highest ID is offline. Must the election wait forever?",
        "tr": "En yüksek kimlik çevrimdışı. Seçim sonsuza kadar mı bekler?"
      },
      "options": [
        {
          "en": "No; the highest responsive process can win",
          "tr": "Hayır; en yüksek yanıtlayan kazanabilir"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "This bounded example assumes a working timeout failure detector.",
        "tr": "Bu sınırlı örnek çalışan zaman aşımı hata algılayıcısı varsayar."
      }
    },
    "sources": [
      {
        "title": "Garcia-Molina — Elections in a Distributed Computing System",
        "url": "https://doi.org/10.1109/TC.1982.1675989",
        "year": 1982
      }
    ],
    "related": [
      "ring-election",
      "swim"
    ]
  },
  {
    "id": "chandy-lamport",
    "title": {
      "en": "Chandy–Lamport snapshot",
      "tr": "Chandy–Lamport anlık görüntüsü"
    },
    "hook": {
      "en": "Count money even while it is in flight.",
      "tr": "Parayı aktarım sırasında bile say."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "chandy-lamport"
    ],
    "controls": [
      {
        "id": "amount",
        "label": {
          "en": "B sends to A",
          "tr": "B’den A’ya aktarım"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 3,
        "step": 1
      },
      {
        "id": "inFlight",
        "label": {
          "en": "Record A before payment arrives",
          "tr": "Ödeme gelmeden A’yı kaydet"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "A global snapshot includes process states and channel states.",
      "tr": "Küresel görüntü, süreç durumlarıyla kanal durumlarını içerir."
    },
    "model": {
      "en": "Three processes, 16 total units, reliable FIFO channels and one B→A transfer. Markers close each recorded incoming channel. A transfer sent before B’s snapshot and received after A’s snapshot is recorded in the channel. This is a consistent cut, not one wall-clock instant.",
      "tr": "Üç süreç, toplam 16 birim, güvenilir FIFO kanallar ve tek B→A aktarımı. İşaretçiler kaydedilen giriş kanallarını kapatır. B kaydından önce gönderilip A kaydından sonra alınan aktarım kanala yazılır. Bu, tek fiziksel an değil tutarlı kesittir."
    },
    "challenge": {
      "question": {
        "en": "A payment is between snapshots. Should its value disappear?",
        "tr": "Ödeme iki kayıt arasında kaldı. Değeri kaybolmalı mı?"
      },
      "options": [
        {
          "en": "No; record it in the channel",
          "tr": "Hayır; kanala kaydet"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Local balances plus in-flight channel state conserve all 16 units.",
        "tr": "Yerel bakiyeler ve yoldaki kanal durumu toplam 16 birimi korur."
      }
    },
    "sources": [
      {
        "title": "Chandy & Lamport — Distributed Snapshots: Determining Global States of Distributed Systems",
        "url": "https://lamport.azurewebsites.net/pubs/chandy.pdf",
        "year": 1985
      }
    ],
    "related": [
      "lamport-clock",
      "termination-detection"
    ]
  },
  {
    "id": "termination-detection",
    "title": {
      "en": "Dijkstra–Scholten termination",
      "tr": "Dijkstra–Scholten sonlanma"
    },
    "hook": {
      "en": "Idle workers are not enough. Track unfinished messages.",
      "tr": "Boş çalışanlar yetmez. Bitmemiş mesajları izle."
    },
    "category": "coordination",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "termination-detection"
    ],
    "controls": [
      {
        "id": "delay",
        "label": {
          "en": "Delay C’s acknowledgment",
          "tr": "C’nin onayını geciktir"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "extraWork",
        "label": {
          "en": "B creates another child job",
          "tr": "B ek çocuk işi oluştursun"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "The root finishes only after all delegated work has been acknowledged.",
      "tr": "Kök, dağıttığı tüm işler onaylanınca tamamlanır."
    },
    "model": {
      "en": "A tree-shaped diffusing computation rooted at A. Parent obligations are discharged only when local work and child obligations finish. One delayed acknowledgment leaves an outstanding obligation. General reactivation graphs and process failures are omitted.",
      "tr": "A köklü ağaç biçimli iş yayılımı. Üst sürece borç, yerel iş ve çocuk borçları bitince kapanır. Geciken tek onay borcu açık tutar. Genel yeniden etkinleşme grafikleri ve süreç hataları yoktur."
    },
    "challenge": {
      "question": {
        "en": "Every worker looks idle, but an acknowledgment is in flight. Finished?",
        "tr": "Her çalışan boş görünüyor; bir onay yolda. Bitti mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "Not yet",
          "tr": "Henüz değil"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Termination requires accounting for communication as well as local activity.",
        "tr": "Sonlanma, yerel etkinliğin yanında iletişimin de hesabını gerektirir."
      }
    },
    "sources": [
      {
        "title": "Dijkstra & Scholten — Termination Detection for Diffusing Computations",
        "url": "https://www.cs.utexas.edu/~EWD/ewd06xx/EWD687.PDF",
        "year": 1980
      }
    ],
    "related": [
      "chandy-lamport",
      "gossip"
    ]
  },
  {
    "id": "gossip",
    "title": {
      "en": "Epidemic gossip",
      "tr": "Salgın biçimli gossip"
    },
    "hook": {
      "en": "One informed peer becomes a spreading wave.",
      "tr": "Bilgili tek eş, yayılan bir dalgaya dönüşür."
    },
    "category": "networking",
    "kind": "algorithm",
    "level": 1,
    "minutes": 5,
    "tags": [
      "gossip"
    ],
    "controls": [
      {
        "id": "fanout",
        "label": {
          "en": "Peers contacted per round",
          "tr": "Tur başına ulaşılan eş"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 1,
        "step": 1
      },
      {
        "id": "partition",
        "label": {
          "en": "Split the network",
          "tr": "Ağı böl"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "seed",
        "label": {
          "en": "Contact schedule seed",
          "tr": "İletişim planı tohumu"
        },
        "kind": "range",
        "min": 1,
        "max": 8,
        "default": 3,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "Repeated peer exchanges spread information without a central broadcaster.",
      "tr": "Tekrarlanan eş paylaşımları, merkezi yayıncı olmadan bilgiyi yayar."
    },
    "model": {
      "en": "Eight peers and five synchronous push rounds with seeded contact sampling. Only nodes informed at the start of a round transmit that round. A partition forbids cross-group contact. This finite run does not prove eventual convergence or Byzantine robustness.",
      "tr": "Sekiz eş ve tohumlu seçimle beş eşzamanlı itme turu. Yalnız tur başında bilgili olan düğümler o tur gönderir. Bölünme, gruplar arası iletişimi engeller. Sonlu çalışma, nihai yakınsamayı veya Bizans dayanıklılığını kanıtlamaz."
    },
    "challenge": {
      "question": {
        "en": "Can gossip cross a completely disconnected partition?",
        "tr": "Gossip, tamamen kopmuş ağ bölünmesini aşabilir mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes, automatically",
          "tr": "Evet, kendiliğinden"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "More retries cannot create a missing communication path.",
        "tr": "Daha çok deneme, olmayan iletişim yolunu yaratamaz."
      }
    },
    "sources": [
      {
        "title": "Demers et al. — Epidemic Algorithms for Replicated Database Maintenance",
        "url": "https://www.cs.cornell.edu/home/rvr/papers/epidemic.pdf",
        "year": 1987
      }
    ],
    "related": [
      "swim",
      "anti-entropy"
    ]
  },
  {
    "id": "swim",
    "title": {
      "en": "SWIM failure detection",
      "tr": "SWIM hata algılama"
    },
    "hook": {
      "en": "Ask a friend before declaring a peer missing.",
      "tr": "Bir eşi kayıp ilan etmeden başka eşe sor."
    },
    "category": "networking",
    "kind": "protocol",
    "level": 2,
    "minutes": 6,
    "tags": [
      "swim"
    ],
    "controls": [
      {
        "id": "crash",
        "label": {
          "en": "B has crashed",
          "tr": "B çöktü"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "delay",
        "label": {
          "en": "Delay the direct acknowledgment",
          "tr": "Doğrudan onayı geciktir"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "indirect",
        "label": {
          "en": "Use indirect probes",
          "tr": "Dolaylı yoklama kullan"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Suspicion is evidence about reachability, not proof of a crash.",
      "tr": "Şüphe, erişim hakkında bilgidir; çöküş kanıtı değildir."
    },
    "model": {
      "en": "A probes B through one direct path and two helpers. A failed direct probe may succeed indirectly. A live suspect refutes with a higher incarnation; an unrefuted crashed target expires after the shown timeout. Full randomized membership dissemination and timing adaptation are omitted.",
      "tr": "A, B’yi bir doğrudan yol ve iki yardımcıyla yoklar. Doğrudan başarısız yoklama dolaylı başarılı olabilir. Canlı şüpheli, daha yüksek incarnation ile çürütür; çökmüş hedef gösterilen sürede silinir. Tam rastgele üyelik yayılımı ve zamanlama uyarlaması yoktur."
    },
    "challenge": {
      "question": {
        "en": "One ping timed out. Is a crash proven?",
        "tr": "Bir ping zaman aşımına uğradı. Çöküş kanıtlandı mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; the path may be slow",
          "tr": "Hayır; yol yavaş olabilir"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Indirect probes and suspicion reduce false failure reports.",
        "tr": "Dolaylı yoklama ve şüphe aşaması yanlış hata bildirimini azaltır."
      }
    },
    "sources": [
      {
        "title": "Das, Gupta & Motivala — SWIM",
        "url": "https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf",
        "year": 2002
      }
    ],
    "related": [
      "gossip",
      "bully-election"
    ]
  },
  {
    "id": "chord",
    "title": {
      "en": "Chord lookup",
      "tr": "Chord araması"
    },
    "hook": {
      "en": "Jump clockwise toward the key’s successor.",
      "tr": "Anahtarın ardılına doğru saat yönünde sıçra."
    },
    "category": "networking",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "chord"
    ],
    "controls": [
      {
        "id": "start",
        "label": {
          "en": "Starting node",
          "tr": "Başlangıç düğümü"
        },
        "kind": "select",
        "options": [
          {
            "value": "0",
            "label": {
              "en": "0",
              "tr": "0"
            }
          },
          {
            "value": "4",
            "label": {
              "en": "4",
              "tr": "4"
            }
          },
          {
            "value": "8",
            "label": {
              "en": "8",
              "tr": "8"
            }
          },
          {
            "value": "12",
            "label": {
              "en": "12",
              "tr": "12"
            }
          }
        ],
        "default": "0"
      },
      {
        "id": "key",
        "label": {
          "en": "Key position",
          "tr": "Anahtar konumu"
        },
        "kind": "range",
        "min": 0,
        "max": 15,
        "default": 11,
        "step": 1
      },
      {
        "id": "join",
        "label": {
          "en": "Add node 10",
          "tr": "10 numaralı düğümü ekle"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Finger jumps approach the key; its clockwise successor owns it.",
      "tr": "Parmak sıçramaları anahtara yaklaşır; saat yönündeki ardıl ona sahiptir."
    },
    "model": {
      "en": "A 4-bit identifier ring with exact successor ownership and recomputed finger tables. Routing uses the closest preceding finger, then the successor when the key lies in that interval. Tables are already stabilized; churn recovery and successor lists are omitted.",
      "tr": "Tam ardıl sahipliği ve yeniden hesaplanan parmak tablolarıyla 4 bitlik halka. Yönlendirme en yakın önceleyen parmağı, anahtar ilgili aralıktaysa ardılı kullanır. Tablolar kararlıdır; düğüm değişimi toparlanması ve ardıl listeleri yoktur."
    },
    "challenge": {
      "question": {
        "en": "Who owns a key with no node at exactly that position?",
        "tr": "Tam o konumda düğüm yoksa anahtar kime ait?"
      },
      "options": [
        {
          "en": "The clockwise successor",
          "tr": "Saat yönündeki ardıla"
        },
        {
          "en": "The closest by straight-line distance",
          "tr": "Düz çizgide en yakına"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Chord ownership follows identifier order, including wraparound.",
        "tr": "Chord sahipliği, halka başına dönüş dahil kimlik sırasını izler."
      }
    },
    "sources": [
      {
        "title": "Stoica et al. — Chord: A Scalable Peer-to-peer Lookup Service",
        "url": "https://pdos.csail.mit.edu/papers/chord:sigcomm01/chord_sigcomm.pdf",
        "year": 2001
      }
    ],
    "related": [
      "kademlia",
      "consistent-hashing"
    ]
  },
  {
    "id": "kademlia",
    "title": {
      "en": "Kademlia lookup",
      "tr": "Kademlia araması"
    },
    "hook": {
      "en": "Find closer contacts with XOR distance.",
      "tr": "XOR uzaklığıyla daha yakın eşler bul."
    },
    "category": "networking",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "kademlia"
    ],
    "controls": [
      {
        "id": "target",
        "label": {
          "en": "Target identifier",
          "tr": "Hedef kimlik"
        },
        "kind": "range",
        "min": 0,
        "max": 15,
        "default": 10,
        "step": 1
      },
      {
        "id": "alpha",
        "label": {
          "en": "Parallel queries α",
          "tr": "Paralel sorgu α"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 2,
        "step": 1
      },
      {
        "id": "failed",
        "label": {
          "en": "Node 8 does not respond",
          "tr": "8 numaralı düğüm yanıtlamasın"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "A lookup improves a shortlist by asking contacts for closer contacts.",
      "tr": "Arama, eşlerden daha yakın eşleri öğrenerek aday listesini iyileştirir."
    },
    "model": {
      "en": "Eight peers in a 4-bit XOR space with deterministic k-bucket contacts, a small initial shortlist and four query rounds. An external requester asks up to α unqueried contacts per round; failed node 8 is excluded. Full bucket eviction, refresh and value replication are omitted.",
      "tr": "4 bitlik XOR uzayında sekiz eş, belirli k-bucket eşleri, küçük ilk liste ve dört sorgu turu. Dış istemci tur başına en fazla α sorgulanmamış eşe sorar; yanıtlamayan 8 elenir. Tam bucket atımı, yenileme ve değer çoğaltma yoktur."
    },
    "challenge": {
      "question": {
        "en": "Is XOR distance the same as ordinary subtraction?",
        "tr": "XOR uzaklığı sıradan çıkarma ile aynı mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No",
          "tr": "Hayır"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Bitwise difference defines Kademlia’s metric and routing buckets.",
        "tr": "Bit bazındaki fark, Kademlia metriğini ve yönlendirme bucket’larını belirler."
      }
    },
    "sources": [
      {
        "title": "Maymounkov & Mazières — Kademlia",
        "url": "https://pdos.csail.mit.edu/~petar/papers/maymounkov-kademlia-lncs.pdf",
        "year": 2002
      }
    ],
    "related": [
      "chord",
      "gossip"
    ]
  },
  {
    "id": "consistent-hashing",
    "title": {
      "en": "Consistent hashing",
      "tr": "Tutarlı hashleme"
    },
    "hook": {
      "en": "Add a server. Move only the keys it takes.",
      "tr": "Sunucu ekle. Yalnız aldığı anahtarları taşı."
    },
    "category": "storage",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "consistent-hashing"
    ],
    "controls": [
      {
        "id": "keys",
        "label": {
          "en": "Keys shown",
          "tr": "Gösterilen anahtar"
        },
        "kind": "range",
        "min": 4,
        "max": 12,
        "default": 8,
        "step": 1
      },
      {
        "id": "join",
        "label": {
          "en": "Add server D",
          "tr": "D sunucusunu ekle"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "virtual",
        "label": {
          "en": "Tokens per server",
          "tr": "Sunucu başına jeton"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 1,
        "step": 1
      }
    ],
    "takeaway": {
      "en": "Ring placement limits remapping when membership changes.",
      "tr": "Halka yerleşimi, üyelik değişince yeniden eşlemeyi sınırlar."
    },
    "model": {
      "en": "A 64-position ring, stable teaching hashes, three servers and optional D. Each server owns one to three tokens. Keys map to the next clockwise token. No replication, capacity weighting or production hash distribution guarantee.",
      "tr": "64 konumlu halka, sabit öğretim hashleri, üç sunucu ve isteğe bağlı D. Sunucuda bir ila üç jeton vardır. Anahtar sonraki saat yönü jetonuna gider. Çoğaltma, kapasite ağırlığı veya gerçek hash dağılım garantisi yoktur."
    },
    "challenge": {
      "question": {
        "en": "After D joins, should a key move from A to B?",
        "tr": "D katılınca bir anahtar A’dan B’ye taşınmalı mı?"
      },
      "options": [
        {
          "en": "No; changed ownership goes to D",
          "tr": "Hayır; değişen sahiplik D’ye gider"
        },
        {
          "en": "Yes; all keys reshuffle",
          "tr": "Evet; tüm anahtarlar karışır"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Existing tokens keep their relative positions; the new server captures some intervals.",
        "tr": "Mevcut jetonların göreli konumları korunur; yeni sunucu bazı aralıkları alır."
      }
    },
    "sources": [
      {
        "title": "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store",
        "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
        "year": 2007
      }
    ],
    "related": [
      "chord",
      "rendezvous"
    ]
  },
  {
    "id": "quorum",
    "title": {
      "en": "Read/write quorums",
      "tr": "Okuma/yazma quorumları"
    },
    "hook": {
      "en": "Make the read touch at least one completed write.",
      "tr": "Okuma, tamamlanmış yazmanın en az bir kopyasına değsin."
    },
    "category": "storage",
    "kind": "concept",
    "level": 2,
    "minutes": 6,
    "tags": [
      "quorum"
    ],
    "controls": [
      {
        "id": "read",
        "label": {
          "en": "Read responses R",
          "tr": "Okuma yanıtı R"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 3,
        "step": 1
      },
      {
        "id": "write",
        "label": {
          "en": "Write acknowledgments W",
          "tr": "Yazma onayı W"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 3,
        "step": 1
      },
      {
        "id": "opposite",
        "label": {
          "en": "Read from the opposite end",
          "tr": "Karşı uçtan oku"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "R + W > N guarantees set intersection, not a complete consistency protocol.",
      "tr": "R + W > N, küme kesişimini garantiler; tam tutarlılık protokolü değildir."
    },
    "model": {
      "en": "Five fixed replicas and one completed, versioned write. Writes reach the first W nodes; the read takes first or last R responses and picks the highest observed version. No concurrent writers, sloppy quorum or claim that intersection alone gives linearizability.",
      "tr": "Beş sabit kopya ve tamamlanmış tek sürümlü yazma. Yazma ilk W düğüme ulaşır; okuma ilk veya son R yanıtın en yüksek sürümünü seçer. Eşzamanlı yazan, esnek quorum veya kesişimin tek başına linearizability verdiği iddiası yoktur."
    },
    "challenge": {
      "question": {
        "en": "With N=5, R=2 and W=2, can read and write sets be disjoint?",
        "tr": "N=5, R=2, W=2 iken okuma/yazma kümeleri ayrık olabilir mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No",
          "tr": "Hayır"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Two sets of size two need not share a replica among five.",
        "tr": "Beş içindeki ikişer elemanlı kümeler ortak kopya içermek zorunda değildir."
      }
    },
    "sources": [
      {
        "title": "Gifford — Weighted Voting for Replicated Data",
        "url": "https://www.cs.cmu.edu/~dga/15-712/F11/papers/gifford79.pdf",
        "year": 1979
      },
      {
        "title": "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store",
        "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
        "year": 2007
      }
    ],
    "related": [
      "read-repair",
      "cap"
    ]
  },
  {
    "id": "read-repair",
    "title": {
      "en": "Read repair",
      "tr": "Okuma sırasında onarım"
    },
    "hook": {
      "en": "A read can heal a stale replica.",
      "tr": "Okuma, eski kalmış kopyayı onarabilir."
    },
    "category": "storage",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "read-repair"
    ],
    "controls": [
      {
        "id": "updated",
        "label": {
          "en": "Replicas holding version 1",
          "tr": "1. sürümü tutan kopya"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 1,
        "step": 1
      },
      {
        "id": "read",
        "label": {
          "en": "Responses read",
          "tr": "Okunan yanıt"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 3,
        "step": 1
      },
      {
        "id": "repair",
        "label": {
          "en": "Repair responding replicas",
          "tr": "Yanıtlayan kopyaları onar"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Repair can only use versions observed by this read.",
      "tr": "Onarım, yalnız bu okumada görülen sürümleri kullanabilir."
    },
    "model": {
      "en": "Three replicas and a single ordered-version register. Reads contact the last R replicas, select the highest observed version, and optionally repair those responders. Conflict resolution, concurrent writes and unseen replicas are outside this trace.",
      "tr": "Üç kopya ve tek sıralı sürümlü yazmaç. Okuma son R kopyayı sorgular, görülen en yüksek sürümü seçer ve isteğe bağlı bu yanıtlayanları onarır. Çatışma çözümü, eşzamanlı yazma ve görülmeyen kopyalar kapsam dışıdır."
    },
    "challenge": {
      "question": {
        "en": "Can a read repair a newer version that none of its responders knows?",
        "tr": "Hiçbir yanıtlayanın bilmediği yeni sürüm okuma sırasında onarılabilir mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "An unobserved update cannot be reconstructed from stale answers.",
        "tr": "Görülmeyen güncelleme, eski yanıtlardan yeniden oluşturulamaz."
      }
    },
    "sources": [
      {
        "title": "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store",
        "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
        "year": 2007
      }
    ],
    "related": [
      "quorum",
      "anti-entropy"
    ]
  },
  {
    "id": "hinted-handoff",
    "title": {
      "en": "Hinted handoff",
      "tr": "İpuçlu teslim"
    },
    "hook": {
      "en": "Keep a delivery note for a temporarily missing replica.",
      "tr": "Geçici kayıp kopya için teslim notu sakla."
    },
    "category": "storage",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "hinted-handoff"
    ],
    "controls": [
      {
        "id": "downtime",
        "label": {
          "en": "Return time",
          "tr": "Geri dönüş zamanı"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 2,
        "step": 1
      },
      {
        "id": "ttl",
        "label": {
          "en": "Hint expiry",
          "tr": "İpucunun son zamanı"
        },
        "kind": "range",
        "min": 1,
        "max": 4,
        "default": 3,
        "step": 1
      },
      {
        "id": "recover",
        "label": {
          "en": "The replica returns",
          "tr": "Kopya geri dönsün"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "A hint can replay a missed write, but it has a lifetime.",
      "tr": "İpucu kaçan yazmayı iletebilir; fakat bir ömrü vardır."
    },
    "model": {
      "en": "A single versioned write and one unavailable replica C. Helper D retains the intended destination until a discrete expiry; delivery requires return strictly before expiry. Expired hints require another repair mechanism. This does not model durable hinted-handoff storage or sloppy-quorum consistency.",
      "tr": "Tek sürümlü yazma ve erişilemeyen C kopyası. D yardımcısı hedefi belirli süreye kadar saklar; teslim, süreden kesin önce dönüş ister. Süresi dolan ipucu başka onarım gerektirir. Kalıcı ipucu deposu veya esnek quorum tutarlılığı modellenmez."
    },
    "challenge": {
      "question": {
        "en": "The hint expired before C returned. Is C automatically current?",
        "tr": "C dönmeden ipucu silindi. C kendiliğinden güncel mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; another repair is needed",
          "tr": "Hayır; başka onarım gerekir"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Hints are a temporary delivery aid, not a permanent repair guarantee.",
        "tr": "İpuçları geçici teslim yardımıdır; kalıcı onarım garantisi değildir."
      }
    },
    "sources": [
      {
        "title": "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store",
        "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
        "year": 2007
      }
    ],
    "related": [
      "anti-entropy",
      "read-repair"
    ]
  },
  {
    "id": "anti-entropy",
    "title": {
      "en": "Merkle anti-entropy",
      "tr": "Merkle anti-entropy"
    },
    "hook": {
      "en": "Equal hashes skip work. Unequal hashes narrow the search.",
      "tr": "Eşit hash işi atlar. Farklı hash aramayı daraltır."
    },
    "category": "storage",
    "kind": "algorithm",
    "level": 2,
    "minutes": 6,
    "tags": [
      "anti-entropy"
    ],
    "controls": [
      {
        "id": "leaf",
        "label": {
          "en": "First changed leaf",
          "tr": "İlk değişen yaprak"
        },
        "kind": "range",
        "min": 0,
        "max": 7,
        "default": 5,
        "step": 1
      },
      {
        "id": "changes",
        "label": {
          "en": "Changed leaves",
          "tr": "Değişen yaprak"
        },
        "kind": "range",
        "min": 1,
        "max": 3,
        "default": 1,
        "step": 1
      },
      {
        "id": "repair",
        "label": {
          "en": "Copy divergent leaves",
          "tr": "Farklı yaprakları kopyala"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Compare subtrees before transferring whole datasets.",
      "tr": "Tüm veriyi taşımadan önce alt ağaçları karşılaştır."
    },
    "model": {
      "en": "Two eight-leaf replicas, computed deterministic teaching hashes and recursive subtree comparison. A is authoritative for this single-writer example. Hashes are noncryptographic; conflict resolution and hash-collision security are not demonstrated.",
      "tr": "İki sekiz yapraklı kopya, hesaplanan belirli öğretim hashleri ve özyinelemeli alt ağaç karşılaştırması. Tek yazanlı örnekte A yetkilidir. Hashler kriptografik değildir; çatışma çözümü ve çakışma güvenliği gösterilmez."
    },
    "challenge": {
      "question": {
        "en": "A subtree’s hashes match. Must every leaf be transferred?",
        "tr": "Alt ağacın hashleri eşleşiyor. Her yaprak aktarılmalı mı?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Matching digests let this comparison skip that subtree.",
        "tr": "Eşleşen özetler, bu karşılaştırmada alt ağacın atlanmasını sağlar."
      }
    },
    "sources": [
      {
        "title": "DeCandia et al. — Dynamo: Amazon's Highly Available Key-value Store",
        "url": "https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf",
        "year": 2007
      },
      {
        "title": "Demers et al. — Epidemic Algorithms for Replicated Database Maintenance",
        "url": "https://www.cs.cornell.edu/home/rvr/papers/epidemic.pdf",
        "year": 1987
      }
    ],
    "related": [
      "merkle-tree",
      "read-repair"
    ]
  },
  {
    "id": "two-phase-commit",
    "title": {
      "en": "Two-phase commit",
      "tr": "İki aşamalı commit"
    },
    "hook": {
      "en": "Everyone prepares. One durable decision follows.",
      "tr": "Herkes hazırlanır. Tek kalıcı karar izler."
    },
    "category": "coordination",
    "kind": "protocol",
    "level": 2,
    "minutes": 6,
    "tags": [
      "two-phase-commit"
    ],
    "controls": [
      {
        "id": "no",
        "label": {
          "en": "C votes no",
          "tr": "C hayır oyu versin"
        },
        "kind": "toggle",
        "default": false
      },
      {
        "id": "crash",
        "label": {
          "en": "Coordinator fails before decision log",
          "tr": "Koordinatör karar kaydından önce çöksün"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "recover",
        "label": {
          "en": "Coordinator recovers",
          "tr": "Koordinatör toparlansın"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Commit needs unanimity; a prepared participant cannot invent the decision.",
      "tr": "Commit oybirliği ister; hazırlanmış katılımcı kararı uyduramaz."
    },
    "model": {
      "en": "Three participants and one coordinator. Failure occurs before a durable decision record; recovered coordinator conservatively aborts. Prepared yes-voters block while it is unavailable. Participant-to-participant termination is omitted: a reachable no-voter could otherwise help establish abort. Durable storage is assumed.",
      "tr": "Üç katılımcı ve koordinatör. Hata, kalıcı karar kaydından öncedir; toparlanan koordinatör temkinli olarak abort eder. Hazır evetçilerin beklemesi gerekir. Katılımcılar arası sonlandırma yoktur: erişilen hayırcı aksi halde abort kararını belirlemeye yardım edebilirdi. Kalıcı depo varsayılır."
    },
    "challenge": {
      "question": {
        "en": "Two participants vote yes, one votes no. Can the transaction commit?",
        "tr": "İki katılımcı evet, biri hayır dedi. İşlem commit edilebilir mi?"
      },
      "options": [
        {
          "en": "Yes; a majority is enough",
          "tr": "Evet; çoğunluk yeterli"
        },
        {
          "en": "No; commit requires all yes",
          "tr": "Hayır; herkes evet demeli"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Atomic commit is not a majority vote over whether every participant can commit.",
        "tr": "Atomik commit, her katılımcının commit edebilirliği hakkında çoğunluk oyu değildir."
      }
    },
    "sources": [
      {
        "title": "Gray & Lamport — Consensus on Transaction Commit",
        "url": "https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf",
        "year": 2006
      }
    ],
    "related": [
      "three-phase-commit",
      "paxos"
    ]
  },
  {
    "id": "three-phase-commit",
    "title": {
      "en": "Three-phase commit",
      "tr": "Üç aşamalı commit"
    },
    "hook": {
      "en": "Add a precommit state. Examine the assumptions.",
      "tr": "Ön commit durumu ekle. Varsayımları incele."
    },
    "category": "coordination",
    "kind": "protocol",
    "level": 3,
    "minutes": 7,
    "tags": [
      "three-phase-commit"
    ],
    "controls": [
      {
        "id": "phase",
        "label": {
          "en": "State when the coordinator stops",
          "tr": "Koordinatör durduğunda durum"
        },
        "kind": "select",
        "options": [
          {
            "value": "wait",
            "label": {
              "en": "Waiting after yes",
              "tr": "Evetten sonra bekleme"
            }
          },
          {
            "value": "precommit",
            "label": {
              "en": "All received precommit",
              "tr": "Herkes ön commit aldı"
            }
          }
        ],
        "default": "precommit"
      },
      {
        "id": "crash",
        "label": {
          "en": "Coordinator crashes",
          "tr": "Koordinatör çöksün"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "partition",
        "label": {
          "en": "Break the timing assumptions",
          "tr": "Zamanlama varsayımlarını boz"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Nonblocking recovery depends on the network and failure model.",
      "tr": "Beklemeden toparlanma, ağ ve hata modeline bağlıdır."
    },
    "model": {
      "en": "A deliberately narrow synchronous example: all surviving participants are either waiting or have received precommit, and can exchange states. Coordinator-only failure leads to abort or commit respectively. With a partition/unbounded delay, the example stops and makes no safety or liveness claim. This is not a general asynchronous replacement for 2PC.",
      "tr": "Dar eşzamanlı örnek: yaşayan katılımcıların hepsi ya bekliyor ya ön commit almış ve durum paylaşabiliyor. Yalnız koordinatör hatası sırasıyla abort veya commit getirir. Bölünme/sınırsız gecikmede örnek durur; güvenlik veya ilerleme iddiası yoktur. Genel asenkron 2PC alternatifi değildir."
    },
    "challenge": {
      "question": {
        "en": "Does 3PC remove blocking under arbitrary partitions?",
        "tr": "3PC, her türlü ağ bölünmesinde beklemeyi kaldırır mı?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Its recovery argument depends on stronger timing and connectivity assumptions.",
        "tr": "Toparlanma savı, daha güçlü zamanlama ve bağlantı varsayımlarına bağlıdır."
      }
    },
    "sources": [
      {
        "title": "Skeen — Nonblocking Commit Protocols",
        "url": "https://doi.org/10.1145/582318.582339",
        "year": 1981
      },
      {
        "title": "Gray & Lamport — Consensus on Transaction Commit",
        "url": "https://lamport.azurewebsites.net/video/consensus-on-transaction-commit.pdf",
        "year": 2006
      }
    ],
    "related": [
      "two-phase-commit",
      "cap"
    ]
  },
  {
    "id": "g-counter",
    "title": {
      "en": "G-counter CRDT",
      "tr": "G-counter CRDT"
    },
    "hook": {
      "en": "Count locally. Merge with maxima.",
      "tr": "Yerelde say. Maksimumlarla birleştir."
    },
    "category": "storage",
    "kind": "data-structure",
    "level": 1,
    "minutes": 5,
    "tags": [
      "g-counter"
    ],
    "controls": [
      {
        "id": "a",
        "label": {
          "en": "Increments at A",
          "tr": "A’daki artış"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 2,
        "step": 1
      },
      {
        "id": "b",
        "label": {
          "en": "Increments at B",
          "tr": "B’deki artış"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 3,
        "step": 1
      },
      {
        "id": "merge",
        "label": {
          "en": "Exchange replica states",
          "tr": "Kopya durumlarını paylaş"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Per-replica maxima prevent replayed state from double-counting.",
      "tr": "Kopya başına maksimum, yinelenen durumun çift sayılmasını önler."
    },
    "model": {
      "en": "A state-based grow-only counter with three fixed replica IDs. A replica increments only its own component; merge takes componentwise maximum; value is the sum. Communication can pause, but eventual convergence requires state exchange.",
      "tr": "Üç sabit kopya kimliğiyle durum tabanlı yalnız artan sayaç. Kopya yalnız kendi bileşenini artırır; birleştirme bileşen maksimumunu, değer toplamı kullanır. İletişim durabilir; nihai yakınsama durum paylaşımı ister."
    },
    "challenge": {
      "question": {
        "en": "Merge the same state twice. Does the count increase twice?",
        "tr": "Aynı durumu iki kez birleştir. Sayaç iki kez artar mı?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "The merge is idempotent: max(x,x)=x.",
        "tr": "Birleştirme idempotenttir: max(x,x)=x."
      }
    },
    "sources": [
      {
        "title": "Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types",
        "url": "https://inria.hal.science/inria-00555588/document",
        "year": 2011
      }
    ],
    "related": [
      "pn-counter",
      "or-set"
    ]
  },
  {
    "id": "pn-counter",
    "title": {
      "en": "PN-counter CRDT",
      "tr": "PN-counter CRDT"
    },
    "hook": {
      "en": "Keep increments and decrements in separate counters.",
      "tr": "Artış ve azalışı ayrı sayaçlarda tut."
    },
    "category": "storage",
    "kind": "data-structure",
    "level": 2,
    "minutes": 6,
    "tags": [
      "pn-counter"
    ],
    "controls": [
      {
        "id": "plus",
        "label": {
          "en": "A increments",
          "tr": "A artırır"
        },
        "kind": "range",
        "min": 1,
        "max": 5,
        "default": 3,
        "step": 1
      },
      {
        "id": "minus",
        "label": {
          "en": "B decrements",
          "tr": "B azaltır"
        },
        "kind": "range",
        "min": 1,
        "max": 4,
        "default": 2,
        "step": 1
      },
      {
        "id": "merge",
        "label": {
          "en": "Exchange replica states",
          "tr": "Kopya durumlarını paylaş"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Merge two growing vectors; subtract their totals to read the value.",
      "tr": "İki artan vektörü birleştir; değeri okumak için toplamlarını çıkar."
    },
    "model": {
      "en": "A state-based PN-counter uses separate positive and negative G-counters. Components never decrease; the read value may be negative. The total after a full merge is distinguished from partitioned replicas’ current local values.",
      "tr": "Durum tabanlı PN-counter ayrı pozitif ve negatif G-counter kullanır. Bileşenler azalmaz; okunan değer negatif olabilir. Tam birleştirme sonrası toplam, bölünmüş kopyaların mevcut yerel değerlerinden ayrılır."
    },
    "challenge": {
      "question": {
        "en": "Does a decrement reduce a stored G-counter component?",
        "tr": "Azaltma, saklanan G-counter bileşenini düşürür mü?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; it grows the negative counter",
          "tr": "Hayır; negatif sayacı artırır"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Monotone internal components preserve the merge rule.",
        "tr": "Tek yönde artan iç bileşenler birleştirme kuralını korur."
      }
    },
    "sources": [
      {
        "title": "Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types",
        "url": "https://inria.hal.science/inria-00555588/document",
        "year": 2011
      }
    ],
    "related": [
      "g-counter",
      "lww-register"
    ]
  },
  {
    "id": "or-set",
    "title": {
      "en": "Observed-remove set",
      "tr": "Gözlenen-eklemeyi-silen küme"
    },
    "hook": {
      "en": "Remove the tags you saw. A new concurrent tag survives.",
      "tr": "Gördüğün etiketleri sil. Yeni eşzamanlı etiket yaşar."
    },
    "category": "storage",
    "kind": "data-structure",
    "level": 2,
    "minutes": 6,
    "tags": [
      "or-set"
    ],
    "controls": [
      {
        "id": "concurrent",
        "label": {
          "en": "Add B1 concurrently with removal",
          "tr": "B1 eklemesi silmeyle eşzamanlı"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "merge",
        "label": {
          "en": "Exchange add/remove sets",
          "tr": "Ekleme/silme kümelerini paylaş"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "An observed remove cannot erase an unseen concurrent add.",
      "tr": "Gözlenen silme, görülmeyen eşzamanlı eklemeyi silemez."
    },
    "model": {
      "en": "A state-based add-wins observed-remove set for one element x. Adds carry unique tags A1/B1; removes retain observed tags as tombstones; merges union both sets. Tombstone collection, replica retirement and bounded metadata are omitted.",
      "tr": "Tek x elemanlı durum tabanlı ekleme-kazanır küme. Eklemeler benzersiz A1/B1 etiketi taşır; silme gördüğü etiketleri mezar taşı olarak saklar; birleşme iki kümeyi de birleştirir. Mezar taşı temizliği, kopya ayrılması ve sınırlı metadata yoktur."
    },
    "challenge": {
      "question": {
        "en": "A removes A1 while B adds unseen B1. Is x present after merge?",
        "tr": "A, A1’i silerken B görülmeyen B1’i ekler. Birleşince x var mı?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No",
          "tr": "Hayır"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "Removal targets observed tags, so B1 survives.",
        "tr": "Silme, görülen etiketleri hedefler; B1 yaşar."
      }
    },
    "sources": [
      {
        "title": "Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types",
        "url": "https://inria.hal.science/inria-00555588/document",
        "year": 2011
      }
    ],
    "related": [
      "g-counter",
      "vector-clock"
    ]
  },
  {
    "id": "lww-register",
    "title": {
      "en": "Last-write-wins register",
      "tr": "Son-yazan-kazanır yazmaç"
    },
    "hook": {
      "en": "A timestamp wins. Was it really the latest write?",
      "tr": "Bir damga kazanır. Gerçekten son yazma mıydı?"
    },
    "category": "storage",
    "kind": "data-structure",
    "level": 2,
    "minutes": 6,
    "tags": [
      "lww-register"
    ],
    "controls": [
      {
        "id": "skew",
        "label": {
          "en": "B’s clock offset",
          "tr": "B’nin saat farkı"
        },
        "kind": "range",
        "min": -3,
        "max": 3,
        "default": 2,
        "step": 1
      },
      {
        "id": "merge",
        "label": {
          "en": "Merge the register states",
          "tr": "Yazmaç durumlarını birleştir"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "Deterministic timestamp choice gives convergence, not perfect real-time order.",
      "tr": "Belirli damga seçimi yakınsama sağlar; kusursuz gerçek zaman sırası sağlamaz."
    },
    "model": {
      "en": "Two writes occur at real times 10 and 11. B’s physical clock has an adjustable offset. Merge selects max(timestamp,replica ID); concurrent or skewed updates can lose a value. This is a register merge policy, not a linearizable storage protocol.",
      "tr": "İki yazma gerçek 10 ve 11 zamanlarında olur. B’nin fiziksel saat farkı ayarlanır. Birleşme max(damga,kopya kimliği) seçer; eşzamanlı veya kaymış güncellemeler değer kaybettirebilir. Yazmaç birleştirme kuralıdır; linearizable depo protokolü değildir."
    },
    "challenge": {
      "question": {
        "en": "Can an earlier real-world write win because of clock skew?",
        "tr": "Saat farkı yüzünden gerçekte önceki yazma kazanabilir mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Timestamp order need not equal real-time order.",
        "tr": "Damga sırası, gerçek zaman sırası olmak zorunda değildir."
      }
    },
    "sources": [
      {
        "title": "Shapiro et al. — A Comprehensive Study of Convergent and Commutative Replicated Data Types",
        "url": "https://inria.hal.science/inria-00555588/document",
        "year": 2011
      }
    ],
    "related": [
      "vector-clock",
      "linearizability"
    ]
  },
  {
    "id": "cap",
    "title": {
      "en": "CAP during a partition",
      "tr": "Bölünme sırasında CAP"
    },
    "hook": {
      "en": "The missing link makes a guarantee impossible.",
      "tr": "Kopan bağlantı, bir garantiyi imkânsız kılar."
    },
    "category": "foundations",
    "kind": "concept",
    "level": 1,
    "minutes": 5,
    "tags": [
      "cap"
    ],
    "controls": [
      {
        "id": "mode",
        "label": {
          "en": "Response policy",
          "tr": "Yanıt politikası"
        },
        "kind": "select",
        "options": [
          {
            "value": "cp",
            "label": {
              "en": "Wait for consistency",
              "tr": "Tutarlılık için bekle"
            }
          },
          {
            "value": "ap",
            "label": {
              "en": "Answer locally",
              "tr": "Yerelden yanıtla"
            }
          }
        ],
        "default": "cp"
      },
      {
        "id": "partition",
        "label": {
          "en": "Disconnect the replicas",
          "tr": "Kopyaları ayır"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "During a partition, availability and linearizable consistency cannot both be guaranteed.",
      "tr": "Bölünme sırasında erişilebilirlik ve linearizable tutarlılık birlikte garanti edilemez."
    },
    "model": {
      "en": "Two replicas and one write followed by a read. The consistency policy refuses an unreplicated write; the available policy acknowledges locally and may return the old value elsewhere. Availability has the CAP meaning: every request to a nonfailed node eventually responds. This is an example, not a proof or a universal choose-two product taxonomy.",
      "tr": "İki kopya, bir yazma ve sonra okuma. Tutarlılık politikası çoğaltılmayan yazmayı bekletir; erişilebilir politika yerelde onaylar ve diğer yerde eski değer dönebilir. CAP erişilebilirliği: sağlam düğüme her istek sonunda yanıt alır. Bu örnektir; kanıt veya evrensel iki-seç ürün sınıflaması değildir."
    },
    "challenge": {
      "question": {
        "en": "Can a disconnected replica always return the latest completed write without waiting?",
        "tr": "Kopmuş kopya, beklemeden her zaman son tamamlanan yazmayı dönebilir mi?"
      },
      "options": [
        {
          "en": "No",
          "tr": "Hayır"
        },
        {
          "en": "Yes",
          "tr": "Evet"
        }
      ],
      "correct": 0,
      "explanation": {
        "en": "It cannot learn a remote write through a link that delivers no messages.",
        "tr": "Mesaj iletmeyen bağlantıdan uzaktaki yazmayı öğrenemez."
      }
    },
    "sources": [
      {
        "title": "Gilbert & Lynch — Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services",
        "url": "https://groups.csail.mit.edu/tds/papers/Gilbert/Brewer6.pdf",
        "year": 2002
      }
    ],
    "related": [
      "quorum",
      "linearizability",
      "flp"
    ]
  },
  {
    "id": "flp",
    "title": {
      "en": "FLP impossibility",
      "tr": "FLP imkânsızlığı"
    },
    "hook": {
      "en": "A slow process can look exactly like a failed one.",
      "tr": "Yavaş süreç, çökmüş süreçle aynı görünebilir."
    },
    "category": "foundations",
    "kind": "concept",
    "level": 3,
    "minutes": 7,
    "tags": [
      "flp"
    ],
    "controls": [
      {
        "id": "crashed",
        "label": {
          "en": "C crashes after sending",
          "tr": "C gönderdikten sonra çöksün"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "deliver",
        "label": {
          "en": "Deliver the pending message",
          "tr": "Bekleyen mesajı teslim et"
        },
        "kind": "toggle",
        "default": false
      }
    ],
    "takeaway": {
      "en": "Deterministic consensus cannot guarantee termination in every asynchronous execution with one possible crash.",
      "tr": "Tek olası çöküşle asenkron her yürütmede deterministik uzlaşmanın sonlanması garanti edilemez."
    },
    "model": {
      "en": "A finite indistinguishability illustration, not the FLP proof or an implemented consensus protocol. C sends before possibly crashing; that already-sent message may still arrive. A sees only delivery, so delay alone cannot identify a crash. Partial synchrony and randomized protocols change the assumptions.",
      "tr": "FLP kanıtı veya çalışan uzlaşma değil, sonlu ayırt-edilemezlik gösterimi. C olası çöküşten önce gönderir; gönderilmiş mesaj yine gelebilir. A yalnız teslimi görür; gecikme tek başına çöküşü belirleyemez. Kısmi eşzamanlılık ve rastgele protokoller varsayımları değiştirir."
    },
    "challenge": {
      "question": {
        "en": "Does FLP say real distributed systems can never reach agreement?",
        "tr": "FLP, gerçek dağıtık sistemlerin hiç uzlaşamayacağını mı söyler?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No; it rules out one universal termination guarantee",
          "tr": "Hayır; belirli evrensel sonlanma garantisini dışlar"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "The theorem is about guarantees under precise asynchronous and failure assumptions.",
        "tr": "Teorem, belirli asenkron ve hata varsayımları altındaki garantiler hakkındadır."
      }
    },
    "sources": [
      {
        "title": "Fischer, Lynch & Paterson — Impossibility of Distributed Consensus with One Faulty Process",
        "url": "https://groups.csail.mit.edu/tds/papers/Lynch/jacm85.pdf",
        "year": 1985
      }
    ],
    "related": [
      "raft",
      "cap"
    ]
  },
  {
    "id": "linearizability",
    "title": {
      "en": "Linearizability",
      "tr": "Linearizability"
    },
    "hook": {
      "en": "Place each operation at one instant inside its interval.",
      "tr": "Her işlemi kendi aralığında tek bir ana yerleştir."
    },
    "category": "foundations",
    "kind": "concept",
    "level": 2,
    "minutes": 6,
    "tags": [
      "linearizability"
    ],
    "controls": [
      {
        "id": "overlap",
        "label": {
          "en": "Read overlaps the write",
          "tr": "Okuma yazmayla örtüşsün"
        },
        "kind": "toggle",
        "default": true
      },
      {
        "id": "stale",
        "label": {
          "en": "Read returns the old value",
          "tr": "Okuma eski değeri döndürsün"
        },
        "kind": "toggle",
        "default": true
      }
    ],
    "takeaway": {
      "en": "A valid sequential order must respect completed-before-started operations.",
      "tr": "Geçerli sıralı düzen, biri bitince başlayan işlemlerin sırasına uymalıdır."
    },
    "model": {
      "en": "A single register initially 0, one write of 1, and one read. A bounded backtracking checker finds a legal sequential history consistent with invocation/response intervals. Concurrent reads may see old or new; a read after a completed write may not see old. Distributed implementation and failures are omitted.",
      "tr": "Başlangıcı 0 olan tek yazmaç, 1 yazan bir işlem ve bir okuma. Sınırlı geri izleme, çağrı/yanıt aralıklarına uygun geçerli sıralı geçmiş arar. Örtüşen okuma eski veya yeni görebilir; tamamlanmış yazma sonrası okuma eski göremez. Dağıtık uygulama ve hatalar yoktur."
    },
    "challenge": {
      "question": {
        "en": "The write completed before the read began. Can the read return the old value?",
        "tr": "Yazma, okuma başlamadan bitti. Okuma eski değeri döndürebilir mi?"
      },
      "options": [
        {
          "en": "Yes",
          "tr": "Evet"
        },
        {
          "en": "No",
          "tr": "Hayır"
        }
      ],
      "correct": 1,
      "explanation": {
        "en": "Real-time precedence constrains every legal linearization.",
        "tr": "Gerçek zaman önceliği, her geçerli sıralamayı sınırlar."
      }
    },
    "sources": [
      {
        "title": "Herlihy & Wing — Linearizability: A Correctness Condition for Concurrent Objects",
        "url": "https://cs.brown.edu/~mph/HerlihyW90/p463-herlihy.pdf",
        "year": 1990
      }
    ],
    "related": [
      "cap",
      "quorum"
    ]
  }
];
