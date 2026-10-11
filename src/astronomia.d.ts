declare module 'astronomia/julian' {
  export function CalendarGregorianToJD(y: number, m: number, day: number): number;
}
declare module 'astronomia/deltat' {
  export function deltaT(decimalYear: number): number;
}
declare module 'astronomia/sidereal' {
  /** Mean sidereal time at Greenwich, seconds of time in [0, 86400). */
  export function mean(jd: number): number;
}
declare module 'astronomia/nutation' {
  /** [Δψ, Δε] in radians. */
  export function nutation(jde: number): [number, number];
  export function meanObliquity(jde: number): number;
}
declare module 'astronomia/solar' {
  export function aberration(rangeAU: number): number;
}
declare module 'astronomia/planetposition' {
  export interface EclipticCoord {
    lon: number;
    lat: number;
    range: number;
  }
  export class Planet {
    constructor(data: unknown);
    /** Heliocentric ecliptic, equinox of date, radians + AU. */
    position(jde: number): EclipticCoord;
  }
}
declare module 'astronomia/moonposition' {
  /** Geocentric, mean equinox of date, NO nutation. Range in km. */
  export function position(jde: number): { lon: number; lat: number; range: number };
}
declare module 'astronomia/data/vsop87Bearth' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bmercury' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bvenus' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bmars' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bjupiter' {
  const data: unknown;
  export default data;
}
declare module 'astronomia/data/vsop87Bsaturn' {
  const data: unknown;
  export default data;
}
