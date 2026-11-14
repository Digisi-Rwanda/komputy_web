/** First value of a search param (Next gives string | string[] | undefined). */
export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
