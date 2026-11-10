import { simulateBlockchain } from './blockchain';
import { simulateDistributed } from './distributed';
import { simulateAdvanced } from './advanced';
import { defaultsFor, type Lesson, type Params, type SimulationTrace } from '../types';
const defaultsCache=new Map<string,SimulationTrace>();
export function simulate(lesson:Lesson,params:Params=defaultsFor(lesson)):SimulationTrace{
 const result=simulateBlockchain(lesson.id,params)??simulateDistributed(lesson.id,params)??simulateAdvanced(lesson.id,params);
 if(!result||!result.frames.length)throw new Error('No simulation registered for '+lesson.id);
 return result;
}
export function defaultTrace(lesson:Lesson):SimulationTrace{
 if(!defaultsCache.has(lesson.id))defaultsCache.set(lesson.id,simulate(lesson));
 return defaultsCache.get(lesson.id)!;
}
