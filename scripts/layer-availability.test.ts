import {test} from 'node:test';
import assert from 'node:assert/strict';
import {layerAvailability,validateLayerOmissions} from '../src/lib/layer-availability';
import type {Chapter} from '../src/lib/types';
const chapter:Chapter={id:'c',num:'1',title:'t',subtitle:'',sections:[{id:'s',num:'1',title:'s',razbor:{paragraphs:['text']}}]};
test('availability is independent for each layer and omissions are explicit',()=>{
  assert.equal(layerAvailability('razbor',chapter).status,'ready');
  assert.equal(layerAvailability('atlas',chapter).status,'pending');
  assert.deepEqual(layerAvailability('atlas',undefined,'Reason'),{status:'not-planned',reason:'Reason'});
  assert.equal(layerAvailability('razbor',{...chapter,wip:true}).status,'pending');
  assert.equal(layerAvailability('atlas').status,'pending');
});
test('omissions cannot contradict prepared content or reference an unknown entry',()=>{
  const parts=[{entries:[{id:'e',chapterId:'c'}]}];
  assert.deepEqual(validateLayerOmissions(parts,[chapter],{e:{atlas:'Reason'}}),[]);
  assert.ok(validateLayerOmissions(parts,[chapter],{e:{razbor:'Reason'}}).some(message=>message.includes('готовый слой')));
  assert.ok(validateLayerOmissions(parts,[chapter],{missing:{atlas:'Reason'}}).some(message=>message.includes('неизвестная запись')));
  assert.ok(validateLayerOmissions(parts,[chapter],{e:{atlas:'  '}}).some(message=>message.includes('отсутствует причина')));
});
