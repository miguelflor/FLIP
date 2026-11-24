import { afterEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { locale, t, translateError, useLanguage } from './i18n';
import LoginForm from '../components/LoginForm.vue';

const setSystemLanguage = (lang: string) =>
  Object.defineProperty(navigator, 'language', { value: lang, configurable: true });

describe('i18n', () => {
  afterEach(() => {
    useLanguage().setLanguage('system');
    setSystemLanguage('pt-PT');
  });

  it('fills in placeholders', () => {
    useLanguage().setLanguage('en');
    expect(t('files.someFailed', { failed: 2, total: 5 })).toBe("2 of 5 files couldn't be downloaded");
  });

  it('translates backend error codes, with their value, and passes other errors through', () => {
    useLanguage().setLanguage('pt');
    expect(translateError('clip_http_error|503')).toBe('O CLIP respondeu com um erro (503)');
    expect(translateError('no_files|Redes | Lab')).toBe('Redes | Lab não tem ficheiros');
    useLanguage().setLanguage('en');
    expect(translateError('session_expired')).toBe('Session expired, please sign in again');
    expect(translateError(new Error('disk full'))).toBe('Error: disk full');
  });

  it('follows the system language by default: Portuguese for any Portuguese, else English', async () => {
    const onSystem = (lang: string) => {
      setSystemLanguage(lang);
      useLanguage().setLanguage('pt');
      useLanguage().setLanguage('system');
      return locale.value;
    };
    expect(onSystem('pt-BR')).toBe('pt-PT');
    expect(onSystem('de-DE')).toBe('en');
    await nextTick();
    expect(document.documentElement.lang).toBe('en');
  });

  it('switches what is on screen at once', async () => {
    useLanguage().setLanguage('pt');
    const wrapper = mount(LoginForm);
    expect(wrapper.text()).toContain('Palavra-passe');

    useLanguage().setLanguage('en');
    await nextTick();
    expect(wrapper.text()).toContain('Password');
    expect(wrapper.text()).toContain('Remember me on this computer');
  });
});
