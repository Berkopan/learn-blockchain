import { describe, expect, it } from 'vitest';
import { categories, categoryById, lessons, lessonById, paths, searchLessons } from '../src/content/catalog';
import { defaultTrace, simulate } from '../src/simulation';
import { defaultsFor, type Control, type Localized, type Params, type SimulationTrace } from '../src/types';

function translated(value:Localized){expect(value.en.trim().length).toBeGreaterThan(0);expect(value.tr.trim().length).toBeGreaterThan(0);}
function valuesFor(control:Control):Array<string|number|boolean>{
 if(control.kind==='range')return [...new Set([control.min,control.default,control.max])];
 if(control.kind==='toggle')return [false,true];
 if(control.kind==='select')return control.options.map(option=>option.value);
 return ['',control.default,'Öğren 🚀'];
}
function validTrace(trace:SimulationTrace){
 translated(trace.outcome);expect(trace.frames.length).toBeGreaterThanOrEqual(4);
 for(const frame of trace.frames){
  translated(frame.title);translated(frame.description);if(frame.note)translated(frame.note);
  expect(frame.nodes.length).toBeGreaterThan(0);const ids=new Set(frame.nodes.map(node=>node.id));expect(ids.size).toBe(frame.nodes.length);
  for(const node of frame.nodes){
   expect(node.id.length).toBeGreaterThan(0);expect(node.label.length).toBeGreaterThan(0);expect(node.position).toHaveLength(3);
   for(const position of node.position){expect(Number.isFinite(position)).toBe(true);expect(Math.abs(position)).toBeLessThanOrEqual(32);}
   if(node.scale!==undefined){expect(Number.isFinite(node.scale)).toBe(true);expect(node.scale).toBeGreaterThan(0);}
   if(node.value)expect(node.value).not.toMatch(/NaN|Infinity|undefined/);if(node.detail)translated(node.detail);
  }
  for(const link of frame.links){expect(ids.has(link.from),'Missing link origin '+link.from).toBe(true);expect(ids.has(link.to),'Missing link destination '+link.to).toBe(true);}
  for(const id of frame.focus||[])expect(ids.has(id),'Missing focus object '+id).toBe(true);
  for(const metric of frame.metrics||[]){translated(metric.label);expect(String(metric.value)).not.toMatch(/NaN|Infinity|undefined/);if(typeof metric.value==='number')expect(Number.isFinite(metric.value)).toBe(true);}
 }
}
describe('The atlas is connected and searchable',()=>{
 it('has 85 unique lessons, eight categories, and five valid paths',()=>{
  expect(lessons).toHaveLength(85);expect(lessonById.size).toBe(lessons.length);expect(categories).toHaveLength(8);expect(paths).toHaveLength(5);
  for(const lesson of lessons){expect(categoryById.has(lesson.category)).toBe(true);for(const id of lesson.related)expect(lessonById.has(id),'Broken related lesson '+id).toBe(true);}
  for(const path of paths){translated(path.title);translated(path.subtitle);expect(path.lessons).toHaveLength(6);for(const id of path.lessons)expect(lessonById.has(id)).toBe(true);}
 });
 it('searches both languages, category names, and Turkish letters',()=>{
  expect(searchLessons('zaman').length).toBeGreaterThan(0);expect(searchLessons('SHA').map(l=>l.id)).toContain('sha256');
  expect(searchLessons('tutarli').map(l=>l.id)).toContain('consistent-hashing');expect(searchLessons('consensus').length).toBeGreaterThan(5);
  expect(searchLessons('uzlaşma').length).toBeGreaterThan(5);expect(searchLessons('unfindablezzzzconcept')).toEqual([]);expect(searchLessons('  ')).toHaveLength(85);
 });
});
for(const lesson of lessons){
 describe(lesson.id,()=>{
  it('has translated teaching content, valid controls, and primary source links',()=>{
   translated(lesson.title);translated(lesson.hook);translated(lesson.takeaway);translated(lesson.model);translated(lesson.challenge.question);translated(lesson.challenge.explanation);
   expect(lesson.challenge.options.length).toBeGreaterThanOrEqual(2);expect(Number.isInteger(lesson.challenge.correct)).toBe(true);expect(lesson.challenge.correct).toBeGreaterThanOrEqual(0);expect(lesson.challenge.correct).toBeLessThan(lesson.challenge.options.length);lesson.challenge.options.forEach(translated);
   expect(lesson.sources.length).toBeGreaterThan(0);for(const source of lesson.sources){expect(source.title.length).toBeGreaterThan(0);expect(new URL(source.url).protocol).toBe('https:');}
   expect(lesson.controls.length).toBeGreaterThan(0);expect(new Set(lesson.controls.map(control=>control.id)).size).toBe(lesson.controls.length);
   for(const control of lesson.controls){translated(control.label);if(control.description)translated(control.description);
    if(control.kind==='range'){expect(control.default).toBeGreaterThanOrEqual(control.min);expect(control.default).toBeLessThanOrEqual(control.max);expect(control.max).toBeGreaterThan(control.min);expect(control.step||1).toBeGreaterThan(0);}
    if(control.kind==='select'){expect(control.options.map(option=>option.value)).toContain(control.default);control.options.forEach(option=>translated(option.label));}
   }
  });
  it('produces deterministic, renderable traces at every control boundary',()=>{
   const defaults=defaultsFor(lesson),cached=defaultTrace(lesson),snapshot=JSON.stringify(cached);validTrace(cached);
   expect(simulate(lesson,defaults)).toEqual(simulate(lesson,defaults));
   for(const control of lesson.controls){for(const value of valuesFor(control)){const params:Params={...defaults,[control.id]:value};validTrace(simulate(lesson,params));}}
   expect(JSON.stringify(defaultTrace(lesson))).toBe(snapshot);
  },15000);
 });
}
