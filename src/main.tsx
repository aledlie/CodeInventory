import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

/**
 * Main Entry Point
 *
 * Renders the React application into the DOM.
 * Uses React 18's createRoot API for concurrent features.
 *
 * The root element is expected to exist in public/index.html:
 * ```html
 * <div id="root"></div>
 * ```
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in your HTML.'
  );
}

/**
 * Create React root and render the app
 *
 * React.StrictMode:
 * - Highlights potential problems in development
 * - Activates additional checks and warnings
 * - Does not impact production build
 */
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
