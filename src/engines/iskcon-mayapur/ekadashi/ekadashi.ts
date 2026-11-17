import type { EkadashiObservance, MayapurLocation } from "../types.js";
import { DEFAULT_LOCATION, OFFICIAL_MAYAPUR_CALENDAR_URL } from "../constants.js";
import { getMayapurPanchang, getArunodayaTithi } from "../astronomy/panchang.js";
import { addDays } from "../services/date-time.js";
import { decideEkadashiObservance } from "../observances/vaishnava-rules.js";
import { VERIFIED_EKADASHI } from "../festivals/reference-data.js";
export function getPublishedEkadashis(from:string,to:string):EkadashiObservance[] { return VERIFIED_EKADASHI.filter(x=>x.fastDate>=from&&x.fastDate<=to).map(x=>({...x,notes:[...x.notes]})); }
/** Provisional sunrise scan. Published Mayapur rows always supersede these estimates. */
export function calculateEkadashiCandidates(from:string,to:string,location:MayapurLocation=DEFAULT_LOCATION):EkadashiObservance[] {
 const results:EkadashiObservance[]=[];
 for(let date=from;date<=to;date=addDays(date,1)){
  const day=getMayapurPanchang(date,location), previousDate=addDays(date,-1), nextDate=addDays(date,1);
  const previous=getMayapurPanchang(previousDate,location), next=getMayapurPanchang(nextDate,location);
  const arunodaya=getArunodayaTithi(date,location), previousArunodaya=getArunodayaTithi(previousDate,location);
  const skipped=day.tithi.number===12&&((day.tithi.index-previous.tithi.index+30)%30===2);
  const isCandidate=day.tithi.number===11||skipped;
  if(!isCandidate)continue;
  const decision=decideEkadashiObservance({
   dashamiAtArunodaya:day.tithi.number===12?previousArunodaya.number===10:arunodaya.number===10,
   ekadashiAtSunrise:day.tithi.number===11,
   ekadashiAtPreviousSunrise:previous.tithi.number===11,
   ekadashiAtNextSunrise:next.tithi.number===11,
   dvadashiAtSunrise:day.tithi.number===12,
   ekadashiSkippedAtSunrise:skipped
  });
  if(!decision.observe)continue;
  const fastDate=date;
  results.push({name:"Ekadashi (calculated candidate)",fastDate,paranaDate:addDays(fastDate,1),paranaStart:null,paranaEnd:null,kind:decision.kind!,source:"Calculated from analytical tithi and local arunodaya model",verification:"calculated-unverified",notes:[...decision.notes,"No Parana window is inferred. Confirm this candidate against the official Mayapur/GCAL calendar."]});
 }
 return results;
}
export function getEkadashis(from:string,to:string,location:MayapurLocation=DEFAULT_LOCATION):EkadashiObservance[] { const published=getPublishedEkadashis(from,to); const covered=new Set(published.map(x=>x.fastDate)); return [...published,...calculateEkadashiCandidates(from,to,location).filter(x=>!covered.has(x.fastDate))].sort((a,b)=>a.fastDate.localeCompare(b.fastDate)); }
