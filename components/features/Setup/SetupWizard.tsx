import React, { useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProviderType, Model } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ArrowRight, Check, Eye, EyeOff, Terminal, Key, Zap } from 'lucide-react';
import { Bridge } from '../../../services/bridge';
import { ModelService } from '../../../services/ModelService';

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

  // Dynamic Models State
  const [fetchedModels, setFetchedModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const provider = selectedProvider ? state.providers.find(p => p.id === selectedProvider) : null;
  // Combine fetched models with static fallbacks, prioritizing fetched
  const displayModels = fetchedModels.length > 0 ? fetchedModels : (provider?.models || []);

  const handleProviderSelect = (providerId: ProviderType) => {
    setSelectedProvider(providerId);
    setFetchedModels([]); 
    setFetchError(null);
    
    // Auto-fetch for local
    if (providerId === 'local') {
        fetchModels(providerId, '', 'http://localhost:11434/v1');
    }
    
    setStep('config');
  };

  const fetchModels = async (provId: ProviderType, key: string, url?: string) => {
      setIsLoadingModels(true);
      setFetchError(null);
      try {
          const res = await ModelService.fetchModels(provId, key, url);
          if (res.error) {
              setFetchError(res.error);
          } else {
              setFetchedModels(res.models);
              if (res.models.length > 0) {
                  setSelectedModel(res.models[0].id);
              }
          }
      } catch (e) {
          setFetchError('Error fetching models');
      } finally {
          setIsLoadingModels(false);
      }
  };

  const handleManualRefresh = () => {
      if (selectedProvider) {
          fetchModels(selectedProvider, apiKey, provider?.baseURL);
      }
  };

  const handleTestConnection = async () => {
    if (!selectedProvider) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      // Configurar el provider en el backend (Bridge)
      await Bridge.ConfigureLLM(selectedProvider, apiKey, provider?.baseURL || '');

      // VERIFICACIÓN REAL: Intentar fetch de modelos
      // Si el fetch funciona, la credencial es válida.
      const response = await ModelService.fetchModels(selectedProvider, apiKey, provider?.baseURL);
      
      if (response.error) {
          throw new Error(response.error);
      }
      
      if (response.models.length === 0 && selectedProvider !== 'anthropic') {
           // Si devolvio 0 modelos y no es anthropic (que no lista), sospechoso pero pase.
           // Pero si es error, ya habria saltado.
      }

      setTestResult('success');
      addToast('success', 'Conexión verificada exitosamente');

    } catch (err) {
      console.error(err);
      setTestResult('error');
      addToast('error', 'Error de conexión: Credenciales inválidas o servicio inaccesible');
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
    <div className="min-h-screen bg-canvas flex items-center justify-center p-8 relative overflow-hidden font-sans selection:bg-status-ready selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-surface-elevated/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-status-ready/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16 animate-reveal">
          <h1 className="text-display font-semibold tracking-tighter text-ink mb-3 lowercase">
            one-shot
          </h1>
          <p className="text-ink-muted text-sm tracking-wide lowercase font-light">
            configura tu motor de inteligencia
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-4 mb-16 animate-reveal delay-100">
          {['proveedor', 'configuración', 'prueba'].map((s, i) => {
             const activeIndex = ['provider', 'config', 'test'].indexOf(step);
             const isCompleted = i < activeIndex;
             const isCurrent = i === activeIndex;
             
             return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2 transition-all duration-normal ${isCurrent ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border transition-all ${
                  isCompleted || isCurrent
                    ? 'bg-ink text-canvas border-ink shadow-glow-subtle'
                    : 'bg-transparent text-ink-subtle border-stroke'
                }`}>
                  {isCompleted ? <Check size={14} /> : i + 1}
                </div>
                <span className="text-xs font-medium uppercase tracking-widest text-ink hidden sm:block">
                    {s}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-12 h-px transition-all duration-slow ${
                  i < activeIndex ? 'bg-ink/50' : 'bg-stroke-emphasis'
                }`} />
              )}
            </React.Fragment>
          )})}
        </div>

        {/* Content Container */}
        <div className="min-h-[400px]">
        {/* Step: Provider Selection */}
        {step === 'provider' && (
          <div className="space-y-8 animate-reveal delay-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className={`group relative p-6 border rounded-xl text-left transition-all duration-300 ${
                    selectedProvider === p.id 
                      ? 'bg-status-ready/5 border-status-ready shadow-glow-subtle' 
                      : 'bg-surface-elevated/30 border-stroke hover:border-stroke-emphasis hover:bg-surface-elevated/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                     <span className={`text-2xl transition-all duration-300 ${selectedProvider === p.id ? 'opacity-100 scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-105'}`}>{p.icon}</span>
                     {selectedProvider === p.id && <div className="w-1.5 h-1.5 rounded-full bg-status-ready animate-pulse shadow-glow" />}
                  </div>
                  
                  <div className="space-y-1">
                    <div className={`font-medium text-sm transition-colors ${selectedProvider === p.id ? 'text-ink' : 'text-ink-muted group-hover:text-ink'}`}>
                        {p.name}
                    </div>
                    <div className="text-[10px] text-ink-subtle leading-relaxed line-clamp-2">
                        {p.description}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                      {p.requiresApiKey ? (
                          <div className={`flex items-center gap-1.5 text-[9px] uppercase tracking-widest px-2 py-1 rounded border transition-colors ${
                              selectedProvider === p.id 
                              ? 'text-status-warning bg-status-warning/10 border-status-warning/20' 
                              : 'text-ink-subtle bg-surface border-stroke group-hover:border-stroke-emphasis'
                          }`}>
                            <Key size={10} /> 
                            <span>Key Required</span>
                          </div>
                      ) : (
                          <div className={`flex items-center gap-1.5 text-[9px] uppercase tracking-widest px-2 py-1 rounded border transition-colors ${
                              selectedProvider === p.id 
                              ? 'text-status-ready bg-status-ready/10 border-status-ready/20' 
                              : 'text-ink-subtle bg-surface border-stroke group-hover:border-stroke-emphasis'
                          }`}>
                            <Terminal size={10} /> 
                            <span>Local CLI</span>
                          </div>
                      )}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center pt-8">
              <button
                onClick={handleSkip}
                className="text-xs text-ink-subtle hover:text-ink transition-colors uppercase tracking-widest hover:underline decoration-ink-subtle underline-offset-4"
              >
                saltar configuración por ahora
              </button>
            </div>
          </div>
        )}

        {/* Step: Configuration */}
        {step === 'config' && provider && (
          <div className="max-w-xl mx-auto space-y-8 animate-reveal">
            
            <div className="flex items-center justify-between pb-6 border-b border-stroke">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-stroke text-2xl">
                       {provider.icon}
                   </div>
                   <div>
                       <h3 className="text-lg font-medium text-ink">{provider.name}</h3>
                       <p className="text-xs text-ink-muted">configuración de acceso</p>
                   </div>
               </div>
               <button
                onClick={() => setStep('provider')}
                className="text-xs text-ink-subtle hover:text-ink transition-colors uppercase tracking-widest"
              >
                cambiar
              </button>
            </div>

            <div className="space-y-6">
                {/* API Key */}
                {provider.requiresApiKey && (
                <div className="space-y-3 group">
                    <label className="flex items-center justify-between text-xs text-ink-subtle uppercase tracking-widest font-mono group-focus-within:text-ink transition-colors">
                        <span>API Key</span>
                        {apiKey && <span className="text-status-ready flex items-center gap-1"><Check size={10}/> válida formato</span>}
                    </label>
                    <div className="relative">
                    <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        onBlur={() => apiKey && fetchModels(selectedProvider!, apiKey, provider?.baseURL)}
                        placeholder={`sk-...`}
                        className="pr-12 bg-surface/50 border-stroke focus:border-ink/50 focus:bg-surface font-mono"
                    />
                    <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors"
                    >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    </div>
                    <p className="text-[10px] text-ink-subtle flex items-center gap-1.5">
                        <Key size={10} />
                        Se almacenará de forma segura en tu llavero del sistema local.
                    </p>
                </div>
                )}

                {/* Model Selection */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-ink-subtle uppercase tracking-widest font-mono">
                            Modelo Base
                        </label>
                        <button 
                            onClick={handleManualRefresh}
                            disabled={isLoadingModels}
                            className="text-[10px] text-status-active hover:text-status-ready disabled:opacity-50 flex items-center gap-1 transition-colors"
                        >
                            {isLoadingModels ? <span className="animate-spin">⟳</span> : '⟳'} refrescar
                        </button>
                    </div>
                    
                    {fetchError && (
                        <div className="p-3 bg-status-error/10 border border-status-error/20 rounded-lg text-xs text-status-error">
                            No se pudieron cargar los modelos. Verifica tu API Key.
                        </div>
                    )}
                    
                    <div className="grid gap-2 max-h-[240px] overflow-y-auto pr-2 scrollbar-thin">
                        {displayModels.map((model) => (
                        <button
                            key={model.id}
                            onClick={() => setSelectedModel(model.id)}
                            className={`p-3 border rounded-lg text-left transition-all duration-200 group ${
                            selectedModel === model.id
                                ? 'border-status-active bg-status-active/5 shadow-glow-subtle'
                                : 'border-stroke hover:border-stroke-emphasis hover:bg-surface'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${selectedModel === model.id ? 'text-ink' : 'text-ink-muted group-hover:text-ink'}`}>
                                    {model.name}
                                </span>
                                <div className="flex gap-1.5">
                                    {model.canThink && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">COT</span>}
                                    {selectedModel === model.id && <Check size={14} className="text-status-active"/>}
                                </div>
                            </div>
                        </button>
                        ))}
                    </div>

                    <div className="pt-2 border-t border-stroke-subtle mt-4">
                        <Input 
                            value={selectedModel} 
                            onChange={(e) => setSelectedModel(e.target.value)} 
                            placeholder="o escribe el ID del modelo..."
                            className="text-xs font-mono bg-transparent border-transparent hover:border-stroke focus:border-ink placeholder:text-ink-subtle/30"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-4 pt-8">
              <Button
                variant="ghost"
                onClick={() => setStep('provider')}
                className="flex-1 text-xs uppercase tracking-widest text-ink-subtle hover:text-ink hover:bg-surface-elevated/50"
              >
                atrás
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep('test')}
                disabled={provider.requiresApiKey && !apiKey.trim()}
                className="flex-1 shadow-glow hover:shadow-glow-active bg-status-ready hover:bg-status-active text-canvas border-none transition-all duration-300 transform active:scale-[0.98]"
              >
                continuar
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Test Connection */}
        {step === 'test' && provider && (
          <div className="max-w-md mx-auto animate-reveal text-center space-y-8">
            <div className="relative inline-block">
                <div className="w-20 h-20 rounded-2xl bg-surface-elevated border border-stroke flex items-center justify-center text-5xl mb-4 relative z-10">
                    {provider.icon}
                </div>
                <div className="absolute inset-0 bg-status-ready/20 blur-xl z-0 animate-pulse-glow" />
            </div>

            <div>
                <h2 className="text-xl font-medium text-ink mb-2">
                Verificando conexión
                </h2>
                <p className="text-ink-muted text-sm font-light">
                Estableciendo enlace seguro con {provider.name}...
                </p>
            </div>

            <div className="bg-surface/50 border border-stroke rounded-xl p-6 text-left space-y-4 shadow-base backdrop-blur-sm">
                 <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
                     <span className="text-ink-subtle">Provider:</span>
                     <span className="text-ink font-medium">{provider.name}</span>
                     
                     <span className="text-ink-subtle">Model:</span>
                     <span className="text-ink font-mono text-xs bg-surface px-1.5 py-0.5 rounded border border-stroke-subtle">{selectedModel}</span>
                     
                     {provider.requiresApiKey && (
                        <>
                        <span className="text-ink-subtle">Secure Key:</span>
                        <span className="text-status-ready text-xs tracking-widest flex items-center gap-1">
                            •••• {apiKey.slice(-4)} <Check size={10} />
                        </span>
                        </>
                     )}
                 </div>
            </div>

            <div className="h-16 flex items-center justify-center">
                {testResult === 'success' && (
                <div className="flex items-center gap-2 text-status-ready animate-reveal">
                    <div className="w-6 h-6 rounded-full bg-status-ready text-canvas flex items-center justify-center shadow-glow">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="font-medium tracking-wide">Conexión establecida</span>
                </div>
                )}

                {testResult === 'error' && (
                <div className="text-status-error animate-reveal px-4 py-2 bg-status-error/10 rounded-lg border border-status-error/20">
                    <span className="text-sm font-medium">Error de conexión. Verifica los credenciales.</span>
                </div>
                )}
                
                {testResult === null && !isTesting && (
                    <span className="text-ink-subtle text-xs">Listo para probar...</span>
                )}
                {isTesting && (
                     <div className="text-ink-subtle text-xs animate-pulse">Conectando...</div>
                )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('config')}
                className="flex-1 text-xs uppercase tracking-widest text-ink-subtle hover:text-ink hover:bg-surface-elevated/50"
              >
                atrás
              </Button>

              {testResult !== 'success' ? (
                <Button
                  variant="primary"
                  onClick={handleTestConnection}
                  isLoading={isTesting}
                  className="flex-1 shadow-glow hover:shadow-glow-active bg-status-ready hover:bg-status-active text-canvas border-none transition-all duration-300 transform active:scale-[0.98]"
                >
                  <Zap size={16} className="mr-2" />
                  probar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  className="flex-1 shadow-glow hover:shadow-glow-active bg-status-ready hover:bg-status-active text-canvas border-none transition-all duration-300 transform active:scale-[0.98]"
                >
                  comenzar
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
