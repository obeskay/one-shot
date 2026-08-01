import React, { useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProviderType, Model } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ArrowRight, Check, Key, Terminal } from 'lucide-react';
import { Bridge } from '../../../services/bridge';
import { ModelService } from '../../../services/ModelService';
import { BrandIcon } from '../../ui/BrandIcons';

export const SetupWizard: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();

  const [step, setStep] = useState<'provider' | 'config' | 'test'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Dynamic Models State
  const [fetchedModels, setFetchedModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const provider = selectedProvider ? state.providers.find(p => p.id === selectedProvider) : null;

  // Grouped Companies & Providers
  const companyGroups = [
    {
      company: 'Google Ecosystem',
      iconId: 'gemini',
      items: [
        {
          id: 'agy' as ProviderType,
          name: 'Antigravity CLI',
          cmd: 'agy -p',
          description: 'Agente autónomo multimodelo de Google Deepmind',
          iconId: 'agy',
          isCLI: true,
          isDetected: state.detectedCLIs.some(c => c.id === 'agy' && c.isInstalled),
        },
        {
          id: 'gemini' as ProviderType,
          name: 'Google Gemini API',
          cmd: 'Gemini 2.5 Flash / Pro',
          description: 'API oficial de Google Gemini Generative Language',
          iconId: 'gemini',
          isCLI: false,
          isDetected: false,
        }
      ]
    },
    {
      company: 'Anthropic Ecosystem',
      iconId: 'anthropic',
      items: [
        {
          id: 'claude' as ProviderType,
          name: 'Claude Code CLI',
          cmd: 'claude -p',
          description: 'Agente CLI autónomo de Anthropic',
          iconId: 'claude',
          isCLI: true,
          isDetected: state.detectedCLIs.some(c => (c.id === 'claude' || c.id === 'ccai') && c.isInstalled),
        },
        {
          id: 'anthropic' as ProviderType,
          name: 'Anthropic API',
          cmd: 'Claude 3.7 Sonnet',
          description: 'API oficial de Anthropic Claude',
          iconId: 'anthropic',
          isCLI: false,
          isDetected: false,
        }
      ]
    },
    {
      company: 'OpenAI Ecosystem',
      iconId: 'openai',
      items: [
        {
          id: 'codex' as ProviderType,
          name: 'OpenAI Codex CLI',
          cmd: 'codex -p',
          description: 'Agente CLI de ingeniería de código de OpenAI',
          iconId: 'openai',
          isCLI: true,
          isDetected: state.detectedCLIs.some(c => c.id === 'codex' && c.isInstalled),
        },
        {
          id: 'openai' as ProviderType,
          name: 'OpenAI API',
          cmd: 'GPT-4o / o1 / o3-mini',
          description: 'API oficial de OpenAI',
          iconId: 'openai',
          isCLI: false,
          isDetected: false,
        }
      ]
    },
    {
      company: 'Local / Open-Source',
      iconId: 'ollama',
      items: [
        {
          id: 'local' as ProviderType,
          name: 'Ollama Local CLI',
          cmd: 'ollama run',
          description: 'Modelos locales ejecutándose en tu Mac (Llama 3, DeepSeek R1)',
          iconId: 'ollama',
          isCLI: true,
          isDetected: state.detectedCLIs.some(c => c.id === 'ollama' && c.isInstalled),
        }
      ]
    }
  ];

  const handleProviderSelect = (providerId: ProviderType, isCLI = false) => {
    setSelectedProvider(providerId);
    setFetchedModels([]); 
    setFetchError(null);
    
    if (isCLI) {
      // CLI detected -> quick complete
      dispatch({
        type: 'UPDATE_AI_CONFIG',
        payload: {
          provider: providerId,
          model: providerId,
          isConfigured: true,
        }
      });
      addToast('success', `Proveedor ${providerId} seleccionado`);
      return;
    }

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

  const handleComplete = () => {
    if (!selectedProvider) return;

    dispatch({
      type: 'UPDATE_AI_CONFIG',
      payload: {
        provider: selectedProvider,
        model: selectedModel || selectedProvider,
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
    <div className="min-h-screen bg-canvas flex flex-col justify-between pt-12 pb-8 px-6 relative overflow-y-auto font-sans selection:bg-status-ready selection:text-black">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-status-ready/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto relative z-10 my-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-reveal">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-ink mb-2 lowercase">
            one<span className="text-status-ready">shot</span>
          </h1>
          <p className="text-ink-muted text-xs md:text-sm tracking-wide lowercase font-light max-w-md mx-auto">
            configura tu motor de inteligencia agrupado por empresa
          </p>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-center gap-4 mb-10 animate-reveal delay-100">
          {['1. PROVEEDOR', '2. CONFIGURACIÓN', '3. PRUEBA'].map((label, i) => {
            const activeIndex = ['provider', 'config', 'test'].indexOf(step);
            const isCompleted = i < activeIndex;
            const isCurrent = i === activeIndex;

            return (
              <React.Fragment key={label}>
                <div className={`flex items-center gap-2 transition-all duration-300 ${isCurrent ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-all ${
                    isCompleted || isCurrent
                      ? 'bg-status-ready text-canvas border-status-ready font-bold shadow-glow-subtle'
                      : 'bg-transparent text-ink-subtle border-stroke'
                  }`}>
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wider text-ink font-mono uppercase hidden sm:block">
                    {label.split('. ')[1]}
                  </span>
                </div>
                {i < 2 && (
                  <div className={`w-12 h-px transition-all duration-500 ${
                    i < activeIndex ? 'bg-status-ready' : 'bg-stroke'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: PROVEEDOR POR EMPRESA */}
        {step === 'provider' && (
          <div className="space-y-6 animate-reveal delay-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {companyGroups.map((group) => (
                <div 
                  key={group.company}
                  className="p-5 rounded-2xl bg-surface-elevated/40 border border-stroke/70 backdrop-blur-xl flex flex-col justify-between hover:border-stroke-emphasis transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stroke/50">
                    <div className="flex items-center gap-2.5">
                      <BrandIcon id={group.iconId} size={22} className="text-ink" />
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink font-mono">
                        {group.company}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id + item.name}
                        onClick={() => handleProviderSelect(item.id, item.isCLI)}
                        className="group w-full p-3 rounded-xl bg-surface/80 border border-stroke text-left hover:border-status-ready hover:bg-surface transition-all duration-200 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <BrandIcon id={item.iconId} size={20} className="shrink-0 text-status-ready" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-ink group-hover:text-status-ready transition-colors truncate">
                                {item.name}
                              </span>
                              {item.isDetected && (
                                <span className="px-2 py-0.5 rounded-full bg-status-ready/15 text-status-ready border border-status-ready/30 text-[9px] font-mono font-semibold shrink-0">
                                  {item.cmd}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-ink-subtle truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {item.isDetected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-status-ready/20 text-status-ready text-[9px] font-mono uppercase font-bold tracking-wider">
                              <Terminal size={10} />
                              DETECTADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface border border-stroke text-ink-subtle text-[9px] font-mono uppercase tracking-wider group-hover:border-status-ready/40 group-hover:text-ink">
                              <Key size={10} />
                              API KEY
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Skip Option */}
            <div className="text-center pt-4">
              <button
                onClick={handleSkip}
                className="text-xs text-ink-subtle hover:text-status-ready transition-colors font-mono uppercase tracking-widest hover:underline underline-offset-4"
              >
                saltar configuración e ir al explorador
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIGURACIÓN */}
        {step === 'config' && provider && (
          <div className="max-w-xl mx-auto space-y-8 animate-reveal">
            <div className="flex items-center justify-between pb-6 border-b border-stroke">
              <div className="flex items-center gap-3">
                <BrandIcon id={provider.id} size={32} className="text-status-ready" />
                <div>
                  <h3 className="text-base font-semibold text-ink">{provider.name}</h3>
                  <p className="text-xs text-ink-muted">configura tu acceso</p>
                </div>
              </div>
              <button
                onClick={() => setStep('provider')}
                className="text-xs text-ink-subtle hover:text-ink transition-colors font-mono uppercase tracking-widest"
              >
                cambiar
              </button>
            </div>

            <div className="space-y-6">
              {provider.requiresApiKey && (
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-xs text-ink-subtle uppercase tracking-widest font-mono">
                    <span>API Key</span>
                    {apiKey && <span className="text-status-ready flex items-center gap-1"><Check size={10}/> Ingresada</span>}
                  </label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Ingresa tu API Key de ${provider.name}`}
                    className="w-full bg-surface border-stroke text-ink text-sm font-mono focus:border-status-ready"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => setStep('provider')}
                className="flex-1 text-xs uppercase tracking-widest text-ink-subtle hover:text-ink"
              >
                atrás
              </Button>
              <Button
                variant="primary"
                onClick={() => setStep('test')}
                disabled={provider.requiresApiKey && !apiKey}
                className="flex-1 bg-status-ready text-canvas font-semibold text-xs tracking-widest uppercase"
              >
                siguiente
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PRUEBA */}
        {step === 'test' && provider && (
          <div className="max-w-xl mx-auto space-y-8 animate-reveal text-center">
            <div className="flex flex-col items-center gap-3 py-6">
              <BrandIcon id={provider.id} size={48} className="text-status-ready" />
              <h3 className="text-xl font-bold text-ink">{provider.name}</h3>
              <p className="text-xs text-ink-muted max-w-sm">
                Verifica la conexión con el servidor para confirmar credenciales válidas.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setStep('config')}
                className="flex-1 text-xs uppercase tracking-widest text-ink-subtle"
              >
                atrás
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                className="flex-1 bg-status-ready text-canvas font-semibold text-xs tracking-widest uppercase shadow-glow"
              >
                comenzar
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] font-mono text-ink-subtle uppercase tracking-widest z-10 shrink-0">
        One-Shot Engine v0.1.0 • Autonomous Multi-Agent OS
      </footer>
    </div>
  );
};
