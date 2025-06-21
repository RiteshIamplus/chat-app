import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App'; // make sure this imports the component using <AuthRoutes />
import './index.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* ✅ This is required */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
