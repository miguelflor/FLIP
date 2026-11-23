import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import tauriConf from '../../src-tauri/tauri.conf.json';

describe('the app loads nothing from the internet', () => {
  it('has no external URLs in its page', () => {
    expect(indexHtml).not.toMatch(/https?:\/\//);
  });

  it('allows no external hosts in its Content Security Policy', () => {
    const sources = Object.values(tauriConf.app.security.csp).join(' ');
    expect(sources).not.toMatch(/https:/);
    expect(sources).not.toMatch(/googleapis|gstatic/);
  });
});
