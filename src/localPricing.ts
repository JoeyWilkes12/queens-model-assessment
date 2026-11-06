import { LOCAL_PRICING_FILE } from './evidenceFiles'
import { useSharedJson } from './sharedJson'

/**
 * The saved public tariffs (local-qwen-pricing.json), with no live API or inference requests. One request serves the
 * local chapter's views and the Caveman studies page; a failure offers a retry that recovers every reader.
 */
export const usePricing = () => useSharedJson(LOCAL_PRICING_FILE)
