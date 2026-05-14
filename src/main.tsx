import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "Uncaught TypeError: Cannot set property fetch of #<Window> which has only a getter"
// This can happen when libraries try to polyfill fetch in environments where it's already defined as a read-only getter.
if (typeof window !== 'undefined') {
  try {
    const originalFetch = window.fetch;
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && descriptor.configurable) {
      Object.defineProperty(window, 'fetch', {
        get: () => originalFetch,
        set: () => { /* Ignore assignment to prevent crash */ },
        configurable: true,
        enumerable: true
      });
    }
  } catch (e) {
    // Silently ignore if we can't patch it
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
