import type { Chapter, LayerId } from './types';
export type EditorialLayer = Exclude<LayerId,'book'>;
export type LayerAvailability = {status:'ready'} | {status:'pending'} | {status:'not-planned';reason:string};
export function layerAvailability(layer:EditorialLayer, chapter?:Chapter, omissionReason?:string):LayerAvailability {
  if (omissionReason) return {status:'not-planned',reason:omissionReason};
  if (chapter && !chapter.wip && chapter.sections.some(section=>Boolean(section[layer]))) return {status:'ready'};
  return {status:'pending'};
}
export function layerStatusLabel(layer:EditorialLayer, availability:LayerAvailability):string {
  const title=layer==='razbor'?'Разбор':'Атлас';
  return availability.status==='ready' ? `${title} готов` : availability.status==='not-planned' ? `${title} не предусмотрен` : `${title} ещё не подготовлен`;
}
export function validateLayerOmissions(parts:{entries:{id:string;chapterId?:string}[]}[], chapters:Chapter[], omissions:Record<string,Partial<Record<EditorialLayer,string>>>):string[] {
  const errors:string[]=[];
  for(const [id,layers] of Object.entries(omissions)) {
    const entry=parts.flatMap(part=>part.entries).find(entry=>entry.id===id);
    if(!entry){errors.push(`${id}: неизвестная запись в решениях о слоях`);continue;}
    const chapter=chapters.find(chapter=>chapter.id===entry.chapterId);
    for(const [layer,reason] of Object.entries(layers)) {
      if(layer!=='razbor' && layer!=='atlas'){errors.push(`${id}: неизвестный слой ${layer}`);continue;}
      if(!reason?.trim()) errors.push(`${id}/${layer}: отсутствует причина исключения слоя`);
      if(layerAvailability(layer,chapter).status==='ready') errors.push(`${id}/${layer}: готовый слой отмечен как не предусмотренный`);
    }
  }
  return errors;
}
