import React, { useState } from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { ProviderType } from '../../../types';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { ArrowRight, Check, Key, Terminal } from 'lucide-react';
import { BrandIcon } from '../../ui/BrandIcons';

export const SetupWizard: React.FC = () => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();

  const [step, setStep] = useState<'provider' | 'config' | 'test'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel] = useState('');

  const provider = selectedProvider ? state.providers.find(p => p.id === selectedProvider) : null;

  // Simplified flat provider cards
  const providerCards = [
    {
      id: 'agy' as ProviderType,
      name: 'Google Antigravity',
      subtitle: 'Agente CLI Multimodelo',
      cmd: 'agy -p',
      iconId: 'agy',
      brandColor: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-emerald-500/10 text-emerald-400',
      isCLI: true,
      isDetected: state.detectedCLIs.some(c => c.id === 'agy' && c.isInstalled),
    },
    {
      id: 'claude' as ProviderType,
      name: 'Anthropic Claude Code',
      subtitle: 'Agente CLI Autónomo',
      cmd: 'claude -p',
      iconId: 'claude',
      brandColor: 'border-amber-500/40 hover:border-amber-400 hover:shadow-amber-500/10 text-amber-400',
      isCLI: true,
      isDetected: state.detectedCLIs.some(c => (c.id === 'claude' || c.id === 'ccai') && c.isInstalled),
    },
    {
      id: 'codex' as ProviderType,
      name: 'OpenAI Codex',
      subtitle: 'Agente CLI Código',
      cmd: 'codex -p',
      iconId: 'openai',
      brandColor: 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-cyan-500/10 text-cyan-400',
      isCLI: true,
      isDetected: state.detectedCLIs.some(c => c.id === 'codex' && c.isInstalled),
    },
    {
      id: 'gemini' as ProviderType,
      name: 'Google Gemini API',
      subtitle: 'Gemini 2.5 Flash / Pro',
      cmd: 'API Key',
      iconId: 'gemini',
      brandColor: 'border-blue-500/40 hover:border-blue-400 hover:shadow-blue-500/10 text-blue-400',
      isCLI: false,
      isDetected: false,
    },
    {
      id: 'anthropic' as ProviderType,
      name: 'Anthropic API',
      subtitle: 'Claude 3.7 Sonnet API',
      cmd: 'API Key',
      iconId: 'anthropic',
      brandColor: 'border-orange-500/40 hover:border-orange-400 hover:shadow-orange-500/10 text-orange-400',
      isCLI: false,
      isDetected: false,
    },
    {
      id: 'openai' as ProviderType,
      name: 'OpenAI API',
      subtitle: 'GPT-4o / o1 / o3-mini',
      cmd: 'API Key',
      iconId: 'openai',
      brandColor: 'border-teal-500/40 hover:border-teal-400 hover:shadow-teal-500/10 text-teal-400',
      isCLI: false,
      isDetected: false,
    },
  ];

  const handleSelectCard = (card: typeof providerCards[0]) => {
    setSelectedProvider(card.id);
    
    if (card.isCLI || card.isDetected) {
      dispatch({
        type: 'UPDATE_AI_CONFIG',
        payload: {
          provider: card.id,
          model: card.id,
          isConfigured: true,
        }
      });
      addToast('success', `${card.name} configurado`);
      return;
    }
    
    setStep('config');
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
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[350px] bg-gradient-to-b from-status-ready/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto relative z-10 my-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-reveal">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-ink mb-2 lowercase">
            one<span className="text-status-ready">shot</span>
          </h1>
          <p className="text-ink-muted text-xs md:text-sm tracking-wide lowercase font-light">
            selecciona tu motor o agente preferido
          </p>
        </div>

        {/* Stepper Header */}
        <div className="flex items-center justify-center gap-4 mb-8 animate-reveal delay-100">
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

        {/* STEP 1: CLEAN FLAT CARDS */}
        {step === 'provider' && (
          <div className="space-y-6 animate-reveal delay-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {providerCards.map((card) => (
                <button
                  key={card.id + card.name}
                  onClick={() => handleSelectCard(card)}
                  className={`group relative p-4 rounded-2xl bg-surface-elevated/40 border ${card.brandColor} backdrop-blur-xl text-left transition-all duration-300 flex flex-col justify-between h-36 hover:scale-[1.02] shadow-sm hover:shadow-md`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-surface/90 border border-stroke/60 flex items-center justify-center shadow-inner">
                      <BrandIcon id={card.iconId} size={22} className={card.brandColor.split(' ').pop()} />
                    </div>

                    {card.isDetected ? (
                      <span className="px-2 py-0.5 rounded-full bg-status-ready/15 text-status-ready border border-status-ready/30 text-[10px] font-mono font-bold tracking-wide flex items-center gap-1">
                        <Terminal size={10} />
                        {card.cmd}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-stroke text-ink-subtle text-[10px] font-mono tracking-wide flex items-center gap-1">
                        <Key size={10} />
                        KEY
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-ink group-hover:text-status-ready transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-[11px] text-ink-subtle font-mono mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Direct Action CTA */}
            <div className="text-center pt-4">
              <button
                onClick={handleSkip}
                className="px-6 py-2.5 rounded-full bg-surface border border-stroke hover:border-status-ready text-ink text-xs font-mono uppercase tracking-widest transition-all duration-200 shadow-sm hover:shadow-glow"
              >
                saltar e ir al explorador ↗
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CONFIGURACIÓN */}
        {step === 'config' && provider && (
          <div className="max-w-md mx-auto space-y-6 animate-reveal bg-surface-elevated/40 p-6 rounded-2xl border border-stroke">
            <div className="flex items-center justify-between pb-4 border-b border-stroke">
              <div className="flex items-center gap-3">
                <BrandIcon id={provider.id} size={28} className="text-status-ready" />
                <div>
                  <h3 className="text-base font-semibold text-ink">{provider.name}</h3>
                  <p className="text-xs text-ink-muted">ingresa tu acceso</p>
                </div>
              </div>
              <button
                onClick={() => setStep('provider')}
                className="text-xs text-ink-subtle hover:text-ink font-mono uppercase"
              >
                cambiar
              </button>
            </div>

            <div className="space-y-4">
              {provider.requiresApiKey && (
                <div className="space-y-2">
                  <label className="text-xs text-ink-subtle font-mono uppercase tracking-wider">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`sk-...`}
                    className="w-full bg-surface border-stroke text-ink text-sm font-mono focus:border-status-ready"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setStep('provider')}
                className="flex-1 text-xs uppercase tracking-widest text-ink-subtle"
              >
                atrás
              </Button>
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={provider.requiresApiKey && !apiKey}
                className="flex-1 bg-status-ready text-canvas font-semibold text-xs tracking-widest uppercase shadow-glow"
              >
                comenzar
                <ArrowRight size={14} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] font-mono text-ink-subtle uppercase tracking-widest shrink-0 z-10">
        One-Shot Engine v0.1.0 • Autonomous Multi-Agent OS
      </footer>
    </div>
  );
};
