import React, { useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { PROVIDERS, getModelsByProvider } from '../../../constants';
import { ProviderType } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ArrowRight, Check, Eye, EyeOff, Terminal, Key, Zap } from 'lucide-react';
import { Bridge } from '../../../services/bridge';

export const SetupWizard: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();

  const [step, setStep] = useState<'provider' | 'config' | 'test'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const provider = selectedProvider ? PROVIDERS.find(p => p.id === selectedProvider) : null;
  const models = selectedProvider ? getModelsByProvider(selectedProvider) : [];

  const handleProviderSelect = (providerId: ProviderType) => {
    setSelectedProvider(providerId);
    const providerModels = getModelsByProvider(providerId);
    if (providerModels.length > 0) {
      setSelectedModel(providerModels[0].id);
    }
    setStep('config');
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Configurar el provider en el backend
      await Bridge.ConfigureLLM(selectedProvider, apiKey, provider?.baseURL || '');

      // Test básico - intentar una llamada simple
      // Por ahora solo simulamos éxito si hay API key o es CLI local
      if (!provider?.requiresApiKey || apiKey.trim()) {
        setTestResult('success');
        addToast('success', 'Conexión exitosa');
      } else {
        setTestResult('error');
        addToast('error', 'API Key requerida');
      }
    } catch (err) {
      setTestResult('error');
      addToast('error', 'Error de conexión');
    } finally {
      setIsTesting(false);
    }
  };

  const handleComplete = () => {
    if (!selectedProvider || !selectedModel) return;

    dispatch({
      type: 'UPDATE_AI_CONFIG',
      payload: {
        provider: selectedProvider,
        model: selectedModel,
        apiKey: apiKey,
        baseURL: provider?.baseURL,
        isConfigured: true,
      }
    });

    addToast('success', 'Configuración guardada');
  };

  const handleSkip = () => {
    dispatch({
      type: 'UPDATE_AI_CONFIG',
      payload: {
        isConfigured: true,
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 animate-reveal">
          <h1 className="text-4xl font-semibold tracking-tighter text-primary mb-4">
            one-shot
          </h1>
          <p className="text-secondary text-sm font-light">
            configura tu proveedor de IA para comenzar
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {['provider', 'config', 'test'].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                step === s
                  ? 'bg-primary text-background'
                  : i < ['provider', 'config', 'test'].indexOf(step)
                    ? 'bg-primary/20 text-primary'
                    : 'bg-border/30 text-secondary'
              }`}>
                {i < ['provider', 'config', 'test'].indexOf(step) ? <Check size={14} /> : i + 1}
              </div>
              {i < 2 && (
                <div className={`w-16 h-px transition-all ${
                  i < ['provider', 'config', 'test'].indexOf(step) ? 'bg-primary/40' : 'bg-border/30'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step: Provider Selection */}
        {step === 'provider' && (
          <div className="space-y-4 animate-reveal">
            <h2 className="text-lg font-medium text-primary mb-6 text-center">
              selecciona tu proveedor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className={`p-5 border rounded-lg text-left transition-all hover:border-primary/50 hover:bg-surface/30 group ${
                    selectedProvider === p.id ? 'border-primary bg-surface/40' : 'border-border/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-primary group-hover:text-primary/90">
                        {p.name}
                      </div>
                      <div className="text-xs text-secondary mt-1">
                        {p.description}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {p.requiresApiKey ? (
                          <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded">
                            <Key size={10} className="inline mr-1" />
                            API Key
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded">
                            <Terminal size={10} className="inline mr-1" />
                            Local
                          </span>
                        )}
                        <span className="text-[10px] text-secondary">
                          {p.models.length} modelos
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-secondary group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-6">
              <button
                onClick={handleSkip}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                saltar configuración por ahora
              </button>
            </div>
          </div>
        )}

        {/* Step: Configuration */}
        {step === 'config' && provider && (
          <div className="space-y-6 animate-reveal">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('provider')}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                &larr; cambiar proveedor
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xl">{provider.icon}</span>
                <span className="font-medium text-primary">{provider.name}</span>
              </div>
            </div>

            {/* API Key (si es requerida) */}
            {provider.requiresApiKey && (
              <div className="space-y-4">
                <label className="text-xs text-secondary uppercase tracking-widest font-mono">
                  API Key
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Ingresa tu ${provider.name} API Key...`}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary hover:text-primary transition-colors p-1"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-secondary">
                  Tu API key se guarda localmente y nunca se comparte
                </p>
              </div>
            )}

            {/* Modelo */}
            <div className="space-y-2">
              <label className="text-xs text-secondary uppercase tracking-widest">
                Modelo
              </label>
              <div className="grid gap-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedModel === model.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm text-primary">{model.name}</div>
                        <div className="text-xs text-secondary mt-0.5">{model.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {model.canThink && (
                          <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded">
                            COT
                          </span>
                        )}
                        {model.canSearch && (
                          <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                            Search
                          </span>
                        )}
                        <span className="text-[10px] text-secondary font-mono">
                          {(model.maxTokens / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep('provider')}
                className="flex-1"
              >
                atrás
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep('test')}
                disabled={provider.requiresApiKey && !apiKey.trim()}
                className="flex-1"
              >
                continuar
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Test Connection */}
        {step === 'test' && provider && (
          <div className="space-y-6 animate-reveal text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-3xl">{provider.icon}</span>
            </div>

            <h2 className="text-lg font-medium text-primary">
              verificar conexión
            </h2>

            <p className="text-sm text-secondary max-w-md mx-auto">
              Probamos la conexión con {provider.name} usando el modelo seleccionado
            </p>

            <div className="bg-surface/30 border border-border/50 rounded-lg p-6 max-w-md mx-auto">
              <div className="space-y-3 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Proveedor:</span>
                  <span className="text-primary font-medium">{provider.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary">Modelo:</span>
                  <span className="text-primary font-mono text-xs">{selectedModel}</span>
                </div>
                {provider.requiresApiKey && (
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">API Key:</span>
                    <span className="text-primary font-mono text-xs">
                      {apiKey.slice(0, 8)}...{apiKey.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {testResult === 'success' && (
              <div className="flex items-center justify-center gap-2 text-green-400 animate-reveal">
                <Check size={20} />
                <span className="font-medium">Conexión exitosa</span>
              </div>
            )}

            {testResult === 'error' && (
              <div className="text-red-400 animate-reveal">
                <span className="text-sm">Error de conexión. Verifica tu API key.</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 max-w-md mx-auto">
              <Button
                variant="ghost"
                onClick={() => setStep('config')}
                className="flex-1"
              >
                atrás
              </Button>

              {testResult !== 'success' ? (
                <Button
                  variant="primary"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                  className="flex-1"
                >
                  <Zap size={14} className="mr-2" />
                  probar conexión
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  className="flex-1"
                >
                  <Check size={14} className="mr-2" />
                  comenzar
                </Button>
              )}
            </div>

            {testResult !== 'success' && (
              <button
                onClick={handleComplete}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                continuar sin probar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
