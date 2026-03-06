/**
 * @fileoverview Application entry point and React root initialization
 */

import { createRoot } from 'react-dom/client'

import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'

registerSW({
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      setInterval(
        () => {
          registration.update()
        },
        60 * 60 * 1000,
      )
    }
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}
createRoot(rootElement).render(<App />)
