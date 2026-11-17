import type { MayapurFestival } from "../types.js";
import { VERIFIED_FESTIVALS } from "./reference-data.js";
export function getPublishedFestivals(from:string,to:string):MayapurFestival[]{return VERIFIED_FESTIVALS.filter(x=>x.date>=from&&x.date<=to);}
