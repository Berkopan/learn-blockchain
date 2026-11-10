import { Component, useCallback, useEffect, useMemo, useState, type ErrorInfo, type ReactNode } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw, Undo2 } from 'lucide-react';
import Home from './components/Home';
import Lab from './components/Lab';
import { Dialog, Footer, Header, homeUrl } from './components/Shared';
import { lessons, lessonById } from './content/catalog';
import { t } from './i18n';
import { loadPreferences, savePreferences } from './storage';
import type { Language } from './types';
function readRoute(){const raw=window.location.hash.slice(1)||'/';const[path,search='']=raw.split('?');return{path,params:new URLSearchParams(search)};}
class ErrorBoundary extends Component<{children:ReactNode;language:Language},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return{failed:true};}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('Block Atlas scene error',error,info.componentStack);}
 render(){const l=this.props.language;if(this.state.failed)return <main id="main-content" tabIndex={-1} className="error-page"><BookOpen size={36}/><h1>{t(l,'errorTitle')}</h1><p>{t(l,'errorText')}</p><button className="button dark" onClick={()=>window.location.reload()}>{t(l,'reload')}<RotateCcw size={16}/></button><a href={homeUrl(l)} onClick={()=>this.setState({failed:false})}>{t(l,'back')}</a></main>;return this.props.children;}
}
export default function App(){
 const[preferences,setPreferences]=useState(loadPreferences),[route,setRoute]=useState(readRoute),[about,setAbout]=useState(false),[undo,setUndo]=useState<string[]|null>(null);
 const language=preferences.language;
 useEffect(()=>{const change=()=>{const next=readRoute();setRoute(next);const lang=next.params.get('lang');if(lang==='en'||lang==='tr')setPreferences(p=>({...p,language:lang}));};change();window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 useEffect(()=>{savePreferences(preferences);document.documentElement.lang=language;document.documentElement.classList.toggle('reduced-motion',preferences.reducedMotion);},[preferences,language]);
 const completed=useMemo(()=>preferences.completed.filter(id=>lessonById.has(id)),[preferences.completed]);
 const onLearn=useCallback((id:string)=>setPreferences(p=>p.completed.includes(id)?p:{...p,completed:[...p.completed,id]}),[]);
 const onVisit=useCallback((id:string)=>setPreferences(p=>p.lastLesson===id?p:{...p,lastLesson:id}),[]);
 let id:string|null=null;if(route.path.startsWith('/lesson/')){try{id=decodeURIComponent(route.path.slice(8));}catch{id='invalid-route';}}
 const lesson=id?lessonById.get(id):undefined;
 useEffect(()=>{document.title=lesson?lesson.title[language]+' — Block Atlas':language==='tr'?'Block Atlas — Sistemleri görerek öğren':'Block Atlas — See how systems work';},[lesson,language]);
 const toggleLanguage=()=>{const lang:Language=language==='en'?'tr':'en';setPreferences(p=>({...p,language:lang}));const next=readRoute();next.params.set('lang',lang);window.history.replaceState(null,'','#'+next.path+'?'+next.params);setRoute(next);};
 return <><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById('main-content')?.focus();document.getElementById('main-content')?.scrollIntoView();}}>{t(language,'skip')}</a><Header language={language} onLanguage={toggleLanguage} onAbout={()=>setAbout(true)} completed={completed.length}/>
 <ErrorBoundary language={language} key={id||'home'}>{lesson?<Lab key={lesson.id} lesson={lesson} language={language} completed={completed.includes(lesson.id)} reducedMotion={preferences.reducedMotion} onLearn={onLearn} onVisit={onVisit}/>:id||!['/','/paths',''].includes(route.path)?<main id="main-content" tabIndex={-1} className="error-page"><BookOpen size={36}/><h1>{t(language,'notFound')}</h1><a className="button dark" href={homeUrl(language)}>{t(language,'back')}<ArrowRight size={16}/></a></main>:<Home language={language} completed={completed} lastLesson={preferences.lastLesson} reducedMotion={preferences.reducedMotion} route={route.path}/>}</ErrorBoundary>
 <Footer language={language} onAbout={()=>setAbout(true)}/>{about&&<Dialog title={t(language,'aboutTitle')} onClose={()=>setAbout(false)}><div className="about-body"><p>{t(language,'aboutText')}</p><p>{t(language,'aboutModels')}</p><div className="preference-row"><div><strong>{t(language,'motion')}</strong><small>{t(language,'motionHint')}</small></div><label className="switch"><input type="checkbox" checked={preferences.reducedMotion} onChange={e=>setPreferences(p=>({...p,reducedMotion:e.target.checked}))} aria-label={t(language,'motion')}/><span className="switch-track"/></label></div><div className="progress-summary"><CheckCircle2 size={23}/><div><strong>{completed.length} / {lessons.length} {t(language,'learned')}</strong><p>{t(language,'progressHint')}</p></div><button className="icon-button" disabled={!completed.length} onClick={()=>{setUndo(completed);setPreferences(p=>({...p,completed:[]}));}} aria-label={t(language,'resetProgress')} title={t(language,'resetProgress')}><RotateCcw size={16}/></button></div>{undo&&<button className="quiet-button undo-button" onClick={()=>{setPreferences(p=>({...p,completed:undo}));setUndo(null);}}><Undo2 size={14}/>{t(language,'undo')}</button>}<a className="button secondary" href="https://github.com/Berkopan/learn-blockchain" target="_blank" rel="noreferrer">{t(language,'viewSource')}<ArrowRight size={15}/></a></div></Dialog>}</>;
}
