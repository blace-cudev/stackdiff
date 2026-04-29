import { getPreset, listPresets, resolvePreset, BUILT_IN_PRESETS } from '../filterPresets';

describe('getPreset', () => {
  it('returns preset by name', () => {
    const preset = getPreset('breaking');
    expect(preset).toBeDefined();
    expect(preset?.options.breaking).toBe(true);
  });

  it('returns undefined for unknown preset', () => {
    expect(getPreset('nonexistent')).toBeUndefined();
  });

  it('returns prod-breaking preset with correct scope', () => {
    const preset = getPreset('prod-breaking');
    expect(preset?.options.scope).toBe('dependencies');
    expect(preset?.options.breaking).toBe(true);
  });
});

describe('listPresets', () => {
  it('returns a string for each preset', () => {
    const lines = listPresets();
    expect(lines).toHaveLength(BUILT_IN_PRESETS.length);
  });

  it('includes preset names in output', () => {
    const lines = listPresets();
    expect(lines.some((l) => l.includes('breaking'))).toBe(true);
    expect(lines.some((l) => l.includes('dev-changes'))).toBe(true);
  });
});

describe('resolvePreset', () => {
  it('returns overrides when no preset name given', () => {
    const result = resolvePreset(undefined, { breaking: true });
    expect(result).toEqual({ breaking: true });
  });

  it('merges preset with overrides', () => {
    const result = resolvePreset('breaking', { scope: 'dependencies' });
    expect(result.breaking).toBe(true);
    expect(result.scope).toBe('dependencies');
  });

  it('overrides take precedence over preset', () => {
    const result = resolvePreset('prod-breaking', { scope: 'devDependencies' });
    expect(result.scope).toBe('devDependencies');
  });

  it('throws for unknown preset name', () => {
    expect(() => resolvePreset('unknown-preset', {})).toThrow(/Unknown filter preset/);
  });
});
