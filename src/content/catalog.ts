import { blockchainLessons } from './blockchain';
import { distributedLessons } from './distributed';
import { advancedLessons } from './advanced';
import { bi, type CategoryId, type Lesson, type Localized } from '../types';

export const categories: { id: CategoryId; title: Localized; short: Localized; color: string; icon: string }[] = [
 {id:'foundations',title:bi('Blocks & foundations','Bloklar ve temeller'),short:bi('Foundations','Temeller'),color:'#e7dfef',icon:'box'},
 {id:'consensus',title:bi('Reaching agreement','Ortak karara varmak'),short:bi('Consensus','Uzlaşma'),color:'#f1e0d2',icon:'network'},
 {id:'coordination',title:bi('Working together','Birlikte çalışmak'),short:bi('Coordination','Koordinasyon'),color:'#dbe8e2',icon:'git'},
 {id:'time',title:bi('Time & causality','Zaman ve nedensellik'),short:bi('Time','Zaman'),color:'#e3e5f1',icon:'clock'},
 {id:'networking',title:bi('Finding the way','Ağda yolunu bulmak'),short:bi('Networks','Ağlar'),color:'#dfeae9',icon:'route'},
 {id:'storage',title:bi('Keeping data together','Veriyi bir arada tutmak'),short:bi('Data','Veri'),color:'#ebe7d9',icon:'database'},
 {id:'scaling',title:bi('Beyond one chain','Bir zincirin ötesi'),short:bi('Scaling','Ölçekleme'),color:'#e2def2',icon:'layers'},
 {id:'cryptography',title:bi('Trust through proofs','Kanıtlarla güven'),short:bi('Cryptography','Kriptografi'),color:'#eddfe5',icon:'shield'},
];
export const lessons: Lesson[] = [...blockchainLessons,...distributedLessons,...advancedLessons];
export const lessonById=new Map(lessons.map(l=>[l.id,l]));
export const categoryById=new Map(categories.map(c=>[c.id,c]));
export interface LearningPath { id:string;title:Localized;subtitle:Localized;color:string;lessons:string[];icon:string }
export const paths:LearningPath[]=[
 {id:'first-block',title:bi('Your first block','İlk bloğun'),subtitle:bi('From a fingerprint to a shared history.','Bir parmak izinden ortak geçmişe.'),color:'#e9e1f1',icon:'box',lessons:['sha256','hash-chain','merkle-tree','utxo','proof-of-work','chainwork']},
 {id:'agreement',title:bi('How nodes agree','Düğümler nasıl anlaşır?'),subtitle:bi('A leader, a vote, a decision.','Bir lider, bir oy, bir karar.'),color:'#f3e3d5',icon:'network',lessons:['raft','paxos','pbft','tendermint','hotstuff','casper-ffg']},
 {id:'time-failure',title:bi('When things go wrong','İşler ters gittiğinde'),subtitle:bi('Time, crashes, and what survives.','Zaman, arızalar ve ayakta kalanlar.'),color:'#dfeae4',icon:'clock',lessons:['lamport-clock','vector-clock','chandy-lamport','swim','two-phase-commit','cap']},
 {id:'find-data',title:bi('A world of connections','Bir bağlantılar dünyası'),subtitle:bi('Find, share, and repair data.','Veriyi bul, paylaş, onar.'),color:'#dfe8f0',icon:'route',lessons:['gossip','consistent-hashing','chord','kademlia','anti-entropy','g-counter']},
 {id:'beyond',title:bi('Beyond the blockchain','Zincirin ötesinde'),subtitle:bi('More data. Smaller proofs.','Daha çok veri. Daha küçük kanıtlar.'),color:'#e5e0f3',icon:'layers',lessons:['reed-solomon','data-availability','optimistic-rollup','validity-rollup','narwhal','bullshark']},
];
export function searchLessons(query:string):Lesson[]{
 const normalize=(s:string)=>s.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return lessons.filter(l=>words.every(w=>normalize([l.id,l.category,categoryById.get(l.category)?.short.en,categoryById.get(l.category)?.short.tr,l.title.en,l.title.tr,l.hook.en,l.hook.tr,...l.tags,categoryById.get(l.category)?.title.en,categoryById.get(l.category)?.title.tr].join(' ')).includes(w)));
}
