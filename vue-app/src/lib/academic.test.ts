import { describe, expect, it } from 'vitest';
import { extractYearForRequest } from './academic';

describe('extractYearForRequest', () => {
  it('turns a displayed year into the end year CLIP expects', () => {
    expect(extractYearForRequest('2025/26')).toBe('2026');
  });

  it('passes anything else through', () => {
    expect(extractYearForRequest('2026')).toBe('2026');
  });
});
