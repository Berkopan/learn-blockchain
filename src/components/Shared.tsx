import { useEffect, useRef, type ReactNode } from 'react';
import { Box, Network, Clock3, GitBranch, Route, Database, Layers3, ShieldCheck, X, ArrowUpRight, Code2, Check } from 'lucide-react';
import type { Language, Lesson } from '../types';
import { categoryById } from '../content/catalog';
import { kindName, levelName, t } from '../i18n';
export const lessonUrl=(id:string,language:Language)=>'#/lesson/'+encodeURIComponent(id)+'?lang='+language;
export const homeUrl=(language:Language)=>'#/?lang='+language;
export function CategoryIcon({name,size=18}:{name?:string;size?:number}){
 const icons:Record<string,typeof Box>={box:Box,network:Network,clock:Clock3,git:GitBranch,route:Route,database:Database,layers:Layers3,shield:ShieldCheck};
 const Icon=icons[name||'box']||Box;return <Icon size={size} strokeWidth={1.7}/>;
}
export function Brand({language}:{language:Language}){return <a className="brand" href={homeUrl(language)} aria-label="Block Atlas"><span className="brand-mark"><Box size={23} strokeWidth={1.7}/></span><span>block<span className="brand-light">atlas</span><span className="brand-dot">.</span></span></a>;}
export function Header({language,onLanguage,onAbout,completed}:{language:Language;onLanguage:()=>void;onAbout:()=>void;completed:number}){
 return <header className="site-header"><div className="header-inner"><Brand language={language}/><nav className="main-nav" aria-label={language==='tr'?'Ana menü':'Main navigation'}><a href={homeUrl(language)}>{language==='tr'?'Atlas':'The atlas'}</a><a href={'#/paths?lang='+language}>{t(language,'paths')}</a></nav><div className="header-actions"><button className="progress-pill" onClick={onAbout} aria-label={t(language,'progress')+': '+completed}><span className="progress-dot"/>{completed}<span className="progress-label">{t(language,'learned')}</span></button><button className="language-switch" onClick={onLanguage} aria-label={t(language,'language')}><span className={language==='en'?'active':''}>EN</span><span className="language-separator">/</span><span className={language==='tr'?'active':''}>TR</span></button><a className="github-link icon-button" href="https://github.com/Berkopan/learn-blockchain" target="_blank" rel="noreferrer" aria-label={t(language,'viewSource')}><Code2 size={19}/></a></div></div></header>;
}
export function Dialog({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;el?.showModal();const original=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{el?.close();document.body.style.overflow=original;};},[]);
 return <dialog ref={ref} className={'dialog '+(wide?'wide':'')} onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}} aria-labelledby="dialog-title"><div className="dialog-shell"><div className="dialog-header"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close / Kapat"><X size={22}/></button></div>{children}</div></dialog>;
}
export function LessonMeta({lesson,language,completed=false}:{lesson:Lesson;language:Language;completed?:boolean}){
 return <div className="lesson-meta"><span className={'level-bars level-'+lesson.level} aria-hidden="true"><i/><i/><i/></span><span>{levelName(language,lesson.level)}</span><span className="meta-separator">·</span><span>{lesson.minutes} {t(language,'min')}</span>{completed&&<Check size={14} className="completed-check"/>}</div>;
}
export function SourceDialog({lesson,language,onClose}:{lesson:Lesson;language:Language;onClose:()=>void}){
 return <Dialog title={t(language,'sources')} onClose={onClose}><div className="source-lesson"><span className="pill">{kindName(language,lesson.kind)}</span><h3>{lesson.title[language]}</h3><p>{categoryById.get(lesson.category)?.title[language]}</p></div><section className="model-section"><h4>{t(language,'model')}</h4><p>{lesson.model[language]}</p></section><section className="source-section"><h4>{t(language,'primarySources')}</h4>{lesson.sources.map((s,i)=><a className="source-link" key={s.url} href={s.url} target="_blank" rel="noreferrer"><span className="source-number">{String(i+1).padStart(2,'0')}</span><span>{s.title}{s.year&&<small>{s.year}</small>}</span><ArrowUpRight size={17}/></a>)}</section></Dialog>;
}
export function Footer({language,onAbout}:{language:Language;onAbout:()=>void}){
 return <footer className="site-footer"><div><Brand language={language}/><p>{t(language,'footer')}</p></div><div className="footer-links"><button onClick={onAbout}>{t(language,'about')}</button><a href="https://github.com/Berkopan/learn-blockchain" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13}/></a><span>{t(language,'madeFor')}</span></div></footer>;
}
