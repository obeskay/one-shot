import React from 'react';
// Poppins: la tipografia de obeskay.com, empaquetada para funcionar offline.
// Se importa desde JS y no con @import en index.css: ahi Tailwind la inlinea
// sin reescribir sus url(./files/...) y el build no copia las fuentes.
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);