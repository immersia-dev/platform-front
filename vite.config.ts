import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webSpatial from '@webspatial/vite-plugin'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig({
  plugins: [
    webSpatial(),
    react({ jsxImportSource: '@webspatial/react-sdk' }),
    createHtmlPlugin({
      inject: {
        data: {
          XR_ENV: process.env.XR_ENV,
        },
      },
    }),
  ],
})
