import React from 'react';
import { StoreProvider } from './contexts/StoreContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/Layout/AppLayout';

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppLayout />
      </ToastProvider>
    </StoreProvider>
  );
}