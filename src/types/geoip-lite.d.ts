declare module 'geoip-lite' {
  export function lookup(ip: string): { country: string } | null
}
