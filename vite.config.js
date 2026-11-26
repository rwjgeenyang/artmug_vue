import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    vue(),
    ...(command === 'serve' && !isPreview
      ? [vueDevTools({ launchEditor: 'code' })]
      : []),
  ],
}))
