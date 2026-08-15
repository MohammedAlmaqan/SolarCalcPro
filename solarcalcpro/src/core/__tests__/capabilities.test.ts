import {
  FEATURE_REGISTRY,
  FEATURE_TIERS,
  FREE_PROJECT_LIMIT,
  generateLicenseKey,
  hasFeature,
  isValidLicenseKey,
  MASTER_LICENSE_KEY,
  projectLimit,
  isTier,
} from '../capabilities';

describe('capabilities — tier gating', () => {
  it('declares every feature exactly once in the registry', () => {
    const keys = FEATURE_REGISTRY.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(Object.keys(FEATURE_TIERS)).toHaveLength(keys.length);
  });

  it('keeps free-tier features available on the free tier', () => {
    const freeFeatures = FEATURE_REGISTRY.filter((f) => f.tier === 'free');
    expect(freeFeatures.length).toBeGreaterThan(0);
    for (const f of freeFeatures) expect(hasFeature('free', f.key)).toBe(true);
  });

  it('gates pro features behind the pro tier', () => {
    const proFeatures = FEATURE_REGISTRY.filter((f) => f.tier === 'pro');
    expect(proFeatures.length).toBeGreaterThan(0);
    for (const f of proFeatures) {
      expect(hasFeature('free', f.key)).toBe(false);
      expect(hasFeature('pro', f.key)).toBe(true);
    }
  });

  it('applies the free project cap and lifts it for Pro', () => {
    expect(projectLimit('free')).toBe(FREE_PROJECT_LIMIT);
    expect(FREE_PROJECT_LIMIT).toBe(3);
    expect(projectLimit('pro')).toBe(Infinity);
  });

  it('validates tier strings', () => {
    expect(isTier('free')).toBe(true);
    expect(isTier('pro')).toBe(true);
    expect(isTier('trial')).toBe(false);
    expect(isTier(null)).toBe(false);
  });
});

describe('capabilities — offline license keys', () => {
  it('accepts the master key', () => {
    expect(isValidLicenseKey(MASTER_LICENSE_KEY)).toBe(true);
  });

  it('accepts generated keys', () => {
    for (let i = 0; i < 50; i += 1) {
      const key = generateLicenseKey();
      expect(key).toMatch(/^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/);
      expect(isValidLicenseKey(key)).toBe(true);
    }
  });

  it('is case-insensitive and ignores separators/whitespace', () => {
    expect(isValidLicenseKey(MASTER_LICENSE_KEY.toLowerCase())).toBe(true);
    expect(isValidLicenseKey(MASTER_LICENSE_KEY.replace(/-/g, ' '))).toBe(true);
    expect(isValidLicenseKey(`  ${MASTER_LICENSE_KEY}  `)).toBe(true);
  });

  it('rejects tampered keys', () => {
    // Flip one checksum character.
    const tampered =
      MASTER_LICENSE_KEY.slice(0, MASTER_LICENSE_KEY.length - 1) +
      (MASTER_LICENSE_KEY.endsWith('C') ? 'D' : 'C');
    expect(isValidLicenseKey(tampered)).toBe(false);
    // Flip a payload character.
    const payloadTampered = `8${MASTER_LICENSE_KEY.slice(1)}`;
    expect(isValidLicenseKey(payloadTampered)).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidLicenseKey('')).toBe(false);
    expect(isValidLicenseKey('XXXX-XXXX-XXXX-XXXX')).toBe(false);
    expect(isValidLicenseKey('1234')).toBe(false);
    expect(isValidLicenseKey('ZZZZ-ZZZZ-ZZZZ-ZZZZ')).toBe(false);
  });
});
