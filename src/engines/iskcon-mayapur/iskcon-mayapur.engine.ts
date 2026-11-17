import type { MayapurLocation } from "./types.js";
import { DEFAULT_LOCATION } from "./constants.js";
import { getMayapurPanchang } from "./astronomy/panchang.js";
import { getEkadashis } from "./ekadashi/ekadashi.js";
import { getPublishedFestivals } from "./festivals/festivals.js";
import { validateLocation, assertDate } from "./services/date-time.js";
export class IskconMayapurCalendarEngine {
 readonly location: MayapurLocation;
 constructor(location:MayapurLocation=DEFAULT_LOCATION){validateLocation(location);this.location={...location};}
 getDay(date:string){assertDate(date);return getMayapurPanchang(date,this.location);}
 getEkadashis(from:string,to:string){assertDate(from);assertDate(to);if(from>to)throw new RangeError("from must not be after to");return getEkadashis(from,to,this.location);}
 getFestivals(from:string,to:string){assertDate(from);assertDate(to);if(from>to)throw new RangeError("from must not be after to");return getPublishedFestivals(from,to);}
 getEvents(from:string,to:string){return [...this.getEkadashis(from,to),...this.getFestivals(from,to)].sort((a,b)=>(("fastDate" in a?a.fastDate:a.date).localeCompare("fastDate" in b?b.fastDate:b.date)));}
}
