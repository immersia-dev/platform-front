import react from '@vitejs/plugin-react'
import webSpatial from '@webspatial/vite-plugin'
import { defineConfig, type Plugin } from 'vite'

// WebSpatial (Apple Vision Pro): `npm run dev:avp` / `npm run build:avp` set XR_ENV=avp. Elements with the
// `__enableXr__` class become floating panels there; in any other browser it is a plain, unused class and the
// app is regular React (the plugin picks the matching JSX runtime and keeps the normal base path).
const spatial = process.env.XR_ENV === 'avp'

function spatialHtml(): Plugin {
  return {
    name: 'immersia-spatial-html',
    transformIndexHtml: (html) => (spatial ? html.replace('<html', '<html class="is-spatial"') : html),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    webSpatial(),
    react({ jsxImportSource: spatial ? '@webspatial/react-sdk/default' : '@webspatial/react-sdk/web' }),
    spatialHtml(),
  ],
})
