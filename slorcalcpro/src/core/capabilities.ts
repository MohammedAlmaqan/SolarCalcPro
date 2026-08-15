/**
 * Feature-flag / Pro-gating module.
 *
 * Every gateable feature is declared once in `FEATURE_REGISTRY` with the tier
 * that unlocks it. Pure functions (`hasFeature`, `projectLimit`) keep the
 * gating rules unit-testable and independent of any UI or persistence layer.
 *
 * The app is fully offline, so Pro is unlocked with an offline license key
 * validated by a deterministic checksum. This is obfuscation, not security:
 * distribution integrity must come from app-signing + a future online
 * licensing server.
 */

export type Tier = 'free' | 'pro';

export type FeatureKey =
  | 'proposalPdf'
  | 'companyBranding'
  | 'scenarioComparison'
  | 'unlimitedProjects'
  | 'fullBackup'
  | 'waterPumping'
  | 'evCharging'
  | 'loadProfileEditor'
  | 'kmlExport'
  | 'excelExport'
  | 'sldPngExport'
  | 'sitePhotos';

export interface FeatureDef {
  key: FeatureKey;
  label: string;
  description: string;
  tier: Tier;
}

export const FEATURE_REGISTRY: FeatureDef[] = [
  {
    key: 'proposalPdf',
    label: 'Proposal PDF',
    description: 'Client-facing proposal with quote, savings and commercial terms.',
    tier: 'pro',
  },
  {
    key: 'companyBranding',
    label: 'Company branding',
    description: 'Upload your logo and show your company details on exported documents.',
    tier: 'pro',
  },
  {
    key: 'scenarioComparison',
    label: 'Scenario comparison',
    description: 'Side-by-side metrics across multiple design scenarios.',
    tier: 'pro',
  },
  {
    key: 'unlimitedProjects',
    label: 'Unlimited projects',
    description: 'Design more than 3 sites. The free tier is capped at 3 projects.',
    tier: 'pro',
  },
  {
    key: 'fullBackup',
    label: 'Full database backup',
    description: 'Whole-database export/restore. Kept free as a data-safety feature.',
    tier: 'free',
  },
  {
    key: 'waterPumping',
    label: 'Water-pumping sizing',
    description: 'Head & flow to pump power sizing for boreholes and tanks.',
    tier: 'pro',
  },
  {
    key: 'evCharging',
    label: 'EV charging presets',
    description: 'Pre-built electric-vehicle charging load profiles.',
    tier: 'pro',
  },
  {
    key: 'loadProfileEditor',
    label: '24h load-profile editor',
    description: 'Per-hour load editing with a daily consumption chart.',
    tier: 'pro',
  },
  {
    key: 'kmlExport',
    label: 'KML roof-layout export',
    description: 'Export array geometry for Google Earth / mapping tools.',
    tier: 'pro',
  },
  {
    key: 'excelExport',
    label: 'Excel export',
    description: 'Native .xlsx BOM and financial exports.',
    tier: 'pro',
  },
  {
    key: 'sldPngExport',
    label: 'SLD image export',
    description: 'Export the single-line diagram as a PNG image.',
    tier: 'pro',
  },
  {
    key: 'sitePhotos',
    label: 'Site photos & signature',
    description: 'Attach site photos and a signature block to proposals.',
    tier: 'pro',
  },
];

export const FEATURE_TIERS: Record<FeatureKey, Tier> = Object.fromEntries(
  FEATURE_REGISTRY.map((f) => [f.key, f.tier]),
) as Record<FeatureKey, Tier>;

export const FEATURE_BY_KEY = Object.fromEntries(
  FEATURE_REGISTRY.map((f) => [f.key, f]),
) as Record<FeatureKey, FeatureDef>;

/** Number of projects the free tier may create. */
export const FREE_PROJECT_LIMIT = 3;

export function hasFeature(tier: Tier, feature: FeatureKey): boolean {
  return tier === 'pro' || FEATURE_TIERS[feature] === 'free';
}

export function isTier(value: string | null): value is Tier {
  return value === 'free' || value === 'pro';
}

export function projectLimit(tier: Tier): number {
  return tier === 'pro' ? Infinity : FREE_PROJECT_LIMIT;
}

export function featureTier(feature: FeatureKey): Tier {
  return FEATURE_TIERS[feature];
}

// ---------------------------------------------------------------------------
// Offline license keys
// Format: XXXX-XXXX-XXXX-XXXX (16 uppercase hex). The last 4 chars are a
// checksum over the first 12, keyed by SALT. Validation is case-insensitive
// and ignores separators.
// ---------------------------------------------------------------------------

const LICENSE_SALT = 'SlorCalcPro::offline-license::v1';
const LICENSE_CHARS = '0123456789ABCDEF';

/** Known-good master key for the owner; generate more via `generateLicenseKey()`. */
export const MASTER_LICENSE_KEY = '7A81-83F0-77E5-11CC';

function fnv1a32(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

function licenseChecksum(payload: string): string {
  const hash = fnv1a32(LICENSE_SALT + payload);
  const checksum = ((hash >>> 16) ^ (hash & 0xffff)) & 0xffff;
  return checksum.toString(16).toUpperCase().padStart(4, '0');
}

export function isValidLicenseKey(key: string): boolean {
  const normalized = key.toUpperCase().replace(/[\s-]/g, '');
  if (!/^[0-9A-F]{16}$/.test(normalized)) return false;
  const payload = normalized.slice(0, 12);
  const checksum = normalized.slice(12);
  return licenseChecksum(payload) === checksum;
}

export function formatLicenseKey(key: string): string {
  const normalized = key.toUpperCase().replace(/[\s-]/g, '');
  return normalized.length === 16 ? normalized.match(/.{4}/g)?.join('-') ?? normalized : normalized;
}

/** Deterministic generator for issuing keys offline (uses Math.random). */
export function generateLicenseKey(): string {
  let payload = '';
  for (let i = 0; i < 12; i += 1) {
    payload += LICENSE_CHARS[Math.floor(Math.random() * 16)];
  }
  return formatLicenseKey(payload + licenseChecksum(payload));
}
