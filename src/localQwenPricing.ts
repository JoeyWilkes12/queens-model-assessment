export type Pricing = { schema_version: number; checked_utc: string; catalog_url: string; catalog_sha256: string; models: { id: string; usd_per_million: { input: number; output: number } }[] }

/** Guard for the saved public tariff evidence (local-qwen-pricing.json); pure, so offline verifiers can import it. */
export function isPricing(value: unknown): value is Pricing {
  const p = value as Pricing
  return !!p && p.schema_version === 1 && p.catalog_url === 'https://openrouter.ai/api/v1/models' && Array.isArray(p.models) && p.models.length > 0 && Number.isFinite(Date.parse(p.checked_utc))
    && p.models.every(m => /^qwen\/[a-zA-Z0-9.-]+$/.test(m.id) && [m.usd_per_million?.input, m.usd_per_million?.output].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0))
}
