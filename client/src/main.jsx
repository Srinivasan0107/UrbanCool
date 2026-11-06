import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext.jsx';
import App from './App.jsx';
import { setupBrowserGuards } from './utils/browserGuards.js';
import './index.css';

// Guard against benign browser/extension media interruptions & duplicate GSI initializations
setupBrowserGuards();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

