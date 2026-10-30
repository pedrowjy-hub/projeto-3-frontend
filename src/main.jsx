import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router";
import './index.css';
import App from './App.jsx';
import AparenciaProvider from './components/AparenciaProvider';
import { initializeAppearance } from './services/aparencia';
import './aparencia.css';

initializeAppearance();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AparenciaProvider><App /></AparenciaProvider>
    </BrowserRouter>
  </StrictMode>,
)
