import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Switch } from '../../ui/Switch';
import { ProviderType } from '../../../types';
import { Bridge } from '../../../services/bridge';
import { Check, Eye, EyeOff, Key, Terminal, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const { aiConfig } = state;

  const [localProvider, setLocalProvider] = useState<ProviderType>(aiConfig.provider);
  const [localModel, setLocalModel] = useState(aiConfig.model);
  const [localApiKey, setLocalApiKey] = useState(aiConfig.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'provider' | 'behavior'>('provider');

  const provider = state.providers.find(p => p.id === localProvider);
  const models = provider?.models || [];

  const handleProviderChange = (newProvider: ProviderType) => {
    setLocalProvider(newProvider);
    const newProv = state.providers.find(p => p.id === newProvider);
    const newModels = newProv?.models || [];
    if (newModels.length > 0) {
      setLocalModel(newModels[0].id);
    }
    setLocalApiKey('');
  };

  const handleSave = async () => {
    try {
      if (localProvider !== 'local-cli' && provider?.requiresApiKey && !localApiKey) {
         addToast('error', 'API Key requerida');
         return;
      }
      // Configurar en backend
      await Bridge.ConfigureLLM(localProvider, localApiKey, provider?.baseURL || '');

      dispatch({
        type: 'UPDATE_AI_CONFIG',
        payload: {
          provider: localProvider,
          model: localModel,
          apiKey: localApiKey,
          baseURL: provider?.baseURL,
        }
      });

      setSaved(true);
      addToast('success', 'Configuración guardada');
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 800);
    } catch (err) {
      addToast('error', 'Error al guardar configuración');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="configuración">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface rounded-lg border border-stroke">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 px-4 py-2 text-[10px] font-medium uppercase tracking-widest rounded-md transition-all duration-300 ${
              activeTab === 'provider'
                ? 'bg-ink text-ink-inverted shadow-sm'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-elevated'
            }`}
          >
            proveedor ia
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex-1 px-4 py-2 text-[10px] font-medium uppercase tracking-widest rounded-md transition-all duration-300 ${
              activeTab === 'behavior'
                ? 'bg-ink text-ink-inverted shadow-sm'
                : 'text-ink-subtle hover:text-ink hover:bg-surface-elevated'
            }`}
          >
            comportamiento
          </button>
        </div>

        {/* Tab: Provider */}
        {activeTab === 'provider' && (
          <div className="space-y-6 animate-reveal">
            {/* Provider Selection */}
            <div className="space-y-3">
              <label className="text-[10px] text-ink-subtle uppercase tracking-widest font-mono font-bold">
                proveedor
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {state.providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`p-3 border rounded-lg text-left transition-all duration-200 group relative ${
                      localProvider === p.id
                        ? 'border-status-ready bg-status-ready/5 shadow-glow-subtle'
                        : 'border-stroke hover:border-stroke-emphasis hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${localProvider === p.id ? 'opacity-100' : 'opacity-70'}`}>{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${localProvider === p.id ? 'text-ink' : 'text-ink-muted'}`}>{p.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                           <span className="text-[9px] text-ink-subtle/70 bg-surface px-1.5 py-0.5 rounded border border-stroke-subtle">
                             {p.models.length} modelos
                           </span>
                        </div>
                      </div>
                      {localProvider === p.id && <div className="w-1.5 h-1.5 rounded-full bg-status-ready absolute top-3 right-3 shadow-glow" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            {provider?.requiresApiKey && (
              <div className="space-y-2">
                <label className="text-[10px] text-ink-subtle uppercase tracking-widest font-mono font-bold">
                  api key
                </label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={`${provider.name} API Key...`}
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors duration-200"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-[10px] text-ink-subtle uppercase tracking-widest font-mono font-bold">
                modelo predeterminado
              </label>
              <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">
                      <Cpu size={14} />
                  </div>
                  <select
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    className="w-full bg-surface-elevated/50 border border-stroke rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-status-ready/20 focus:border-status-ready/50 transition-colors duration-200 appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM3MTcxN2EiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJtNiA5IDYgNiA2LTYiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center]"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Behavior */}
        {activeTab === 'behavior' && (
          <div className="space-y-6 animate-reveal">
            {/* System Instruction */}
            <div className="space-y-2">
              <label className="text-[10px] text-ink-subtle uppercase tracking-widest font-mono font-bold">
                instrucciones del sistema (prompt)
              </label>
              <textarea
                className="w-full h-32 bg-surface-elevated/50 border border-stroke p-3 text-xs text-ink outline-none focus:ring-2 focus:ring-status-ready/20 focus:border-status-ready/50 transition-colors duration-200 font-mono rounded-lg leading-relaxed resize-none custom-scrollbar"
                value={aiConfig.systemInstruction}
                onChange={(e) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { systemInstruction: e.target.value }})}
                placeholder="Eres un experto en..."
              />
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-stroke-subtle">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-ink font-medium lowercase">pensamiento (cot)</span>
                  <span className="text-xs text-ink-subtle">
                    Habilitar cadena de razonamiento visible
                  </span>
                </div>
                <Switch
                  checked={aiConfig.useThinking}
                  onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useThinking: v }})}
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-stroke-subtle">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-ink font-medium lowercase">web grounding</span>
                  <span className="text-xs text-ink-subtle">
                    Permitir búsquedas en internet para contexto
                  </span>
                </div>
                <Switch
                  checked={aiConfig.useGrounding}
                  onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useGrounding: v }})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex justify-end gap-3 border-t border-stroke-subtle">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="md"
            className="text-xs text-ink-subtle hover:text-ink hover:bg-surface-elevated"
          >
            cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
            icon={saved ? <Check size={14} /> : undefined}
            disabled={saved}
            className={cn(
                "shadow-glow transition-all duration-300",
                saved ? "bg-status-ready text-canvas" : "bg-status-ready hover:bg-status-active text-canvas hover:shadow-glow-active"
            )}
          >
            {saved ? 'guardado' : 'guardar cambios'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
