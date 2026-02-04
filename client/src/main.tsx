/**
 * @fileoverview Application entry point and React root initialization
 *
 * Bootstraps the React application by mounting the root App component
 * to the DOM and importing global styles.
 */

import { createRoot } from 'react-dom/client'

import App from './App'
import './index.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}
createRoot(rootElement).render(<App />)
