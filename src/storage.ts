import type { Language } from './types';
const KEY='block-atlas-v1';
export interface Preferences {language:Language;completed:string[];lastLesson:string|null;reducedMotion:boolean}
export function loadPreferences():Preferences{
 const defaults:Preferences={language:navigator.language.toLowerCase().startsWith('tr')?'tr':'en',completed:[],lastLesson:null,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches};
 try{const value=JSON.parse(localStorage.getItem(KEY)||'null');if(!value||typeof value!=='object')return defaults;
 return {language:value.language==='tr'?'tr':value.language==='en'?'en':defaults.language,completed:Array.isArray(value.completed)?value.completed.filter((v:unknown)=>typeof v==='string'):[],lastLesson:typeof value.lastLesson==='string'?value.lastLesson:null,reducedMotion:typeof value.reducedMotion==='boolean'?value.reducedMotion:defaults.reducedMotion};
 }catch{return defaults;}
}
export function savePreferences(value:Preferences){try{localStorage.setItem(KEY,JSON.stringify(value));}catch{/* Lessons stay usable with storage disabled. */}}
