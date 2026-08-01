import React from 'react';
import { StoreProvider, useStore } from './contexts/StoreContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppLayout } from './components/Layout/AppLayout';
import { SetupWizard } from './components/features/Setup/SetupWizard';

function AppContent() {
  const { state } = useStore();

  if (!state.aiConfig.isConfigured) {
    return <SetupWizard />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </StoreProvider>
  );
}
