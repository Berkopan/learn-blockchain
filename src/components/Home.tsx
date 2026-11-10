import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Search, SlidersHorizontal, X, ChevronDown, Play, Pause, Check, Sparkles, MoveUpRight, Route } from 'lucide-react';
import { categories, categoryById, lessons, lessonById, paths, searchLessons } from '../content/catalog';
import { defaultTrace } from '../simulation';
import { bi, type CategoryId, type Frame, type Language, type Lesson } from '../types';
import { ringPosition } from '../simulation/helpers';
import { t } from '../i18n';
import { CategoryIcon, LessonMeta, lessonUrl } from './Shared';
import { Projection } from './Projection';
const Scene=lazy(()=>import('./Scene'));
const curated=['hash-chain','merkle-tree','proof-of-work','raft','gossip','chord','pbft','lamport-clock','utxo','reed-solomon','optimistic-rollup','bloom-filter'];
function heroFrame(step:number):Frame{
 const nodes=Array.from({length:5},(_,i)=>({id:'n'+i,label:'N'+(i+1),position:ringPosition(i,5,3.5),kind:'node' as const,status:(step===0?'idle':step>=4?'success':i===0?'active':step>=(i===1||i===4?2:3)?'success':'idle') as 'idle'|'active'|'success'}));
 const blocks=Array.from({length:3},(_,i)=>({id:'b'+i,label:'#0'+(i+1),position:[(i-1)*1.5,.45,.4] as [number,number,number],kind:'block' as const,status:(i===2&&step<4?'active':'success') as 'active'|'success',scale:.85}));
 return{title:bi('One message, many local views','Bir mesaj, pek çok yerel görünüm'),description:bi('Follow a block as neighbors share it.','Komşular paylaştıkça bloğu izle.'),nodes:[...nodes,...blocks],links:[...Array.from({length:5},(_,i)=>({from:'n'+i,to:'n'+((i+1)%5),status:'muted' as const,directed:false})),...[[0,1,1],[0,4,1],[1,2,2],[4,3,2]].map(([from,to,wave])=>({from:'n'+from,to:'n'+to,status:(step>wave?'success':step===wave?'active':'muted') as 'success'|'active'|'muted',directed:true})),{from:'b0',to:'b1',status:'success',directed:true},{from:'b1',to:'b2',status:step>=4?'success':'active',directed:true},{from:'n0',to:'b2',status:step>0&&step<4?'active':'muted',directed:true}]};
}
function LessonCard({lesson,language,completed}:{lesson:Lesson;language:Language;completed:boolean}){
 const trace=useMemo(()=>defaultTrace(lesson),[lesson]),frame=trace.frames[Math.min(2,trace.frames.length-1)],category=categoryById.get(lesson.category)!;
 return <a className="lesson-card" href={lessonUrl(lesson.id,language)} data-lesson-id={lesson.id}>
  <div className={'card-visual category-'+lesson.category} style={{backgroundColor:category.color}}>
   <Projection frame={frame} mini/><span className="card-category"><CategoryIcon name={category.icon} size={12}/>{category.short[language]}</span><span className="card-open"><ArrowUpRight size={19}/></span>{completed&&<span className="card-completed" aria-label={t(language,'learned')}><Check size={14}/></span>}
  </div>
  <div className="card-body"><h3>{lesson.title[language]}</h3><p>{lesson.hook[language]}</p><LessonMeta lesson={lesson} language={language} completed={completed}/></div>
 </a>;
}
interface Props{language:Language;completed:string[];lastLesson:string|null;reducedMotion:boolean;route:string}
export default function Home({language,completed,lastLesson,reducedMotion,route}:Props){
 const[query,setQuery]=useState(''),[category,setCategory]=useState<CategoryId|'all'>('all'),[level,setLevel]=useState('all'),[limit,setLimit]=useState(12);
 const[heroStep,setHeroStep]=useState(0),[heroPlaying,setHeroPlaying]=useState(false),[activePath,setActivePath]=useState(paths[0].id);
 const hero=useMemo(()=>heroFrame(heroStep),[heroStep]),path=paths.find(p=>p.id===activePath)!;
 const pathLessons=path.lessons.map(id=>lessonById.get(id)).filter((l):l is Lesson=>!!l),pathNext=pathLessons.find(l=>!completed.includes(l.id))||pathLessons[0];
 const resume=lastLesson?lessonById.get(lastLesson):undefined;
 const filtered=useMemo(()=>searchLessons(query).filter(l=>(category==='all'||l.category===category)&&(level==='all'||l.level===Number(level))).sort((a,b)=>{const ai=curated.indexOf(a.id),bi=curated.indexOf(b.id);return(ai<0?999:ai)-(bi<0?999:bi);}),[query,category,level]);
 useEffect(()=>{setLimit(12);},[query,category,level]);
 useEffect(()=>{if(route==='/paths')requestAnimationFrame(()=>document.getElementById('paths')?.scrollIntoView({behavior:reducedMotion?'instant':'smooth',block:'start'}));else if(route==='/')window.scrollTo({top:0,behavior:'instant'});},[route,reducedMotion]);
 useEffect(()=>{if(!heroPlaying)return;const timer=window.setInterval(()=>setHeroStep(step=>{if(step>=4){setHeroPlaying(false);return 4;}return step+1;}),950);return()=>clearInterval(timer);},[heroPlaying]);
 const clear=()=>{setQuery('');setCategory('all');setLevel('all');};
 const sourceCount=new Set(lessons.flatMap(l=>l.sources.map(s=>s.url))).size;
 return <main id="main-content" tabIndex={-1} className="home-main">
 <section className="hero-section">
  <div className="hero-copy"><div className="eyebrow"><span className="tiny-cube"/>{t(language,'eyebrow')}</div><h1>{t(language,'hero1')}<br/><span>{t(language,'hero2')}</span></h1><p>{t(language,'heroText')}</p>
   <div className="hero-actions"><a className="button primary" href={lessonUrl('hash-chain',language)}>{t(language,'start')}<ArrowRight size={17}/></a><a className="text-link" href="#catalog" onClick={e=>{e.preventDefault();document.getElementById('catalog')?.scrollIntoView({behavior:reducedMotion?'instant':'smooth'});}}>{t(language,'atlas')}<ArrowUpRight size={16}/></a></div>
   <div className="hero-stats"><div><strong>{lessons.length}</strong><span>{t(language,'lessons')}</span></div><i/><div><strong>3D</strong><span>{language==='tr'?'canlı deneyler':'live experiments'}</span></div><i/><div><strong>EN / TR</strong><span>{language==='tr'?'iki dilde öğren':'learn in two languages'}</span></div></div>
  </div>
  <div className="hero-lab"><div className="hero-lab-top"><span className="live-badge"><i/>{language==='tr'?'ETKİLEŞİMLİ MODEL':'INTERACTIVE MODEL'}</span><span className="hero-lab-number">{language==='tr'?'DENEY 001':'EXPERIMENT 001'}</span></div>
   <Suspense fallback={<div className="scene-loading"><span/>{t(language,'loading')}</div>}><Scene frame={hero} language={language} playing={heroPlaying} reducedMotion={reducedMotion} hero/></Suspense>
   <div className="hero-lab-bottom"><div className="hero-lab-caption"><span className="small-label">{language==='tr'?'MERAKINLA BAŞLA':'START WITH CURIOSITY'}</span><strong>{t(language,'heroHint')}</strong></div>
    <button className={'hero-send '+(heroPlaying?'running':'')} onClick={()=>{if(heroPlaying)setHeroPlaying(false);else{setHeroStep(0);setHeroPlaying(true);}}} aria-label={heroPlaying?t(language,'pause'):t(language,'send')}>{heroPlaying?<Pause size={16}/>:<Play size={16} fill="currentColor"/>}<span>{heroPlaying?t(language,'pause'):t(language,'send')}</span></button>
   </div><div className="hero-floating-note"><span>01</span>{language==='tr'?'izle. değiştir. anla.':'watch. change. understand.'}</div>
  </div>
 </section>
 {resume&&<a className="resume-strip" href={lessonUrl(resume.id,language)}><span className="resume-icon"><Play size={15} fill="currentColor"/></span><span><small>{t(language,'resume')}</small><strong>{resume.title[language]}</strong></span><ArrowRight size={18}/></a>}
 <section className="catalog-section" id="catalog">
  <div className="section-heading"><div><span className="section-kicker">{language==='tr'?'FİKİR KOLEKSİYONU':'THE IDEA COLLECTION'}</span><h2>{t(language,'explore')}</h2><p>{t(language,'catalogText')}</p></div><div className="catalog-total"><strong>{String(lessons.length).padStart(2,'0')}</strong><span>{language==='tr'?'farklı bakış açısı':'ways to see it'}</span></div></div>
  <div className="catalog-toolbar"><label className="search-box"><Search size={18}/><input type="search" placeholder={t(language,'search')} aria-label={t(language,'search')} value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label={t(language,'clear')}><X size={16}/></button>}<span className="search-key">⌕</span></label><label className="level-select"><SlidersHorizontal size={16}/><select value={level} onChange={e=>setLevel(e.target.value)} aria-label={t(language,'allLevels')}><option value="all">{t(language,'allLevels')}</option><option value="1">{t(language,'beginner')}</option><option value="2">{t(language,'intermediate')}</option><option value="3">{t(language,'advanced')}</option></select><ChevronDown size={14}/></label></div>
  <div className="category-tabs" role="group" aria-label={language==='tr'?'Konu filtresi':'Topic filter'}><button className={category==='all'?'selected':''} aria-pressed={category==='all'} onClick={()=>setCategory('all')}>{t(language,'all')}<span>{lessons.length}</span></button>{categories.map(c=><button key={c.id} className={category===c.id?'selected':''} aria-pressed={category===c.id} onClick={()=>setCategory(c.id)}><CategoryIcon name={c.icon} size={14}/>{c.short[language]}<span>{lessons.filter(l=>l.category===c.id).length}</span></button>)}</div>
  <div className="results-line"><span aria-live="polite">{filtered.length} {t(language,'lessonsShort')}{query&&<> · “{query}”</>}</span><span>{language==='tr'?'Her fikirde bir deney var':'Every idea comes with an experiment'} <MoveUpRight size={12}/></span></div>
  {filtered.length>0?<><div className="lesson-grid">{filtered.slice(0,limit).map(l=><LessonCard key={l.id} lesson={l} language={language} completed={completed.includes(l.id)}/>)}</div>{limit<filtered.length&&<div className="load-more"><button className="button secondary" onClick={()=>setLimit(n=>n+16)}>{t(language,'showMore')}<span className="button-count">+{Math.min(16,filtered.length-limit)}</span><ArrowRight size={16}/></button><button className="text-link" onClick={()=>setLimit(filtered.length)}>{t(language,'showAll')} {filtered.length}</button></div>}</>:<div className="empty-results"><Search size={32}/><h3>{t(language,'emptyTitle')}</h3><p>{t(language,'emptyText')}</p><button className="button secondary" onClick={clear}>{t(language,'clear')}</button></div>}
 </section>
 <section className="paths-section" id="paths"><div className="section-heading"><div><span className="section-kicker">{t(language,'pathEyebrow')}</span><h2>{t(language,'pathTitle')}</h2><p>{t(language,'pathText')}</p></div><span className="path-doodle"><Route size={42} strokeWidth={1.1}/></span></div>
 <div className="paths-layout"><div className="path-tabs" role="tablist" aria-label={t(language,'paths')}>{paths.map((p,i)=><button role="tab" id={'path-tab-'+p.id} aria-controls="path-panel" aria-selected={activePath===p.id} className={activePath===p.id?'selected':''} key={p.id} onClick={()=>setActivePath(p.id)}><span className="path-index">0{i+1}</span><span>{p.title[language]}</span><ArrowUpRight size={16}/></button>)}</div>
 <div className="path-panel" id="path-panel" role="tabpanel" aria-labelledby={'path-tab-'+path.id} style={{backgroundColor:path.color}}><div className="path-panel-top"><span className="path-symbol"><CategoryIcon name={path.icon} size={28}/></span><span className="pill">{pathLessons.filter(l=>completed.includes(l.id)).length} / {pathLessons.length}</span></div><h3>{path.title[language]}</h3><p>{path.subtitle[language]}</p><div className="path-stops">{pathLessons.map((l,i)=><a key={l.id} href={lessonUrl(l.id,language)}><span className={'path-stop-number '+(completed.includes(l.id)?'done':'')}>{completed.includes(l.id)?<Check size={12}/>:i+1}</span><span>{l.title[language]}</span><ArrowUpRight size={13}/></a>)}</div>{pathNext&&<a className="button dark" href={lessonUrl(pathNext.id,language)}>{pathLessons.some(l=>completed.includes(l.id))?t(language,'continue'):t(language,'beginPath')}<ArrowRight size={16}/></a>}</div></div>
 </section>
 <section className="source-ribbon"><span className="ribbon-icon"><Sparkles size={22} strokeWidth={1.4}/></span><div><h3>{language==='tr'?'Görselleştirildi. Basitleştirildi. Kaynaklandırıldı.':'Visualized. Simplified. Grounded.'}</h3><p>{language==='tr'?sourceCount+' özgün kaynak. Her modelin kendi varsayımları ve sınırları var.':sourceCount+' primary sources. Every model comes with its assumptions and boundaries.'}</p></div><a href="https://github.com/Berkopan/learn-blockchain/tree/main/docs" target="_blank" rel="noreferrer">{language==='tr'?'Araştırmayı incele':'Explore the research'}<ArrowUpRight size={15}/></a></section>
 </main>;
}
