import pluginVue from 'eslint-plugin-vue'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import globals from 'globals'

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'],
  },

  // Style guide tiers A + B + C. See https://vuejs.org/style-guide/
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    name: 'app/language-options',
    languageOptions: {
      globals: globals.browser,
    },
  },
)
