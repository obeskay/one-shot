import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../contexts/StoreContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/Switch';
import { PROVIDERS, getProviderById, getModelsByProvider } from '../../../constants';
import { ProviderType } from '../../../types';
import { Bridge } from '../../../services/bridge';
import { Check, Eye, EyeOff, Key, Terminal } from 'lucide-react';

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

  const provider = getProviderById(localProvider);
  const models = getModelsByProvider(localProvider);

  const handleProviderChange = (newProvider: ProviderType) => {
    setLocalProvider(newProvider);
    const newModels = getModelsByProvider(newProvider);
    if (newModels.length > 0) {
      setLocalModel(newModels[0].id);
    }
    setLocalApiKey('');
  };

  const handleSave = async () => {
    try {
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
        <div className="flex gap-1 p-1 bg-surface rounded-base">
          <button
            onClick={() => setActiveTab('provider')}
            className={`flex-1 px-4 py-2 text-micro font-medium uppercase tracking-widest rounded-base transition-all duration-normal ${
              activeTab === 'provider'
                ? 'bg-ink text-ink-inverted'
                : 'text-ink-subtle hover:text-ink'
            }`}
          >
            proveedor ia
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex-1 px-4 py-2 text-micro font-medium uppercase tracking-widest rounded-base transition-all duration-normal ${
              activeTab === 'behavior'
                ? 'bg-ink text-ink-inverted'
                : 'text-ink-subtle hover:text-ink'
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
              <label className="text-micro text-ink-subtle uppercase tracking-widest font-mono">
                proveedor
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleProviderChange(p.id)}
                    className={`p-3 border rounded-base text-left transition-all duration-normal ${
                      localProvider === p.id
                        ? 'border-ink bg-surface'
                        : 'border-stroke hover:border-stroke-emphasis'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-ink truncate">{p.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {p.requiresApiKey ? (
                            <Key size={8} className="text-status-warning" />
                          ) : (
                            <Terminal size={8} className="text-status-ready" />
                          )}
                          <span className="text-[9px] text-ink-subtle">
                            {p.models.length} modelos
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            {provider?.requiresApiKey && (
              <div className="space-y-2">
                <label className="text-micro text-ink-subtle uppercase tracking-widest font-mono">
                  api key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder={`${provider.name} API Key...`}
                    className="w-full bg-surface border border-stroke rounded-base px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-ink-subtle/50 focus:outline-none focus:border-ink transition-colors duration-normal font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink transition-colors duration-normal"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-micro text-ink-subtle uppercase tracking-widest font-mono">
                modelo
              </label>
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="w-full bg-surface border border-stroke rounded-base px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition-colors duration-normal"
              >
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Tab: Behavior */}
        {activeTab === 'behavior' && (
          <div className="space-y-6 animate-reveal">
            {/* System Instruction */}
            <div className="space-y-2">
              <label className="text-micro text-ink-subtle uppercase tracking-widest font-mono">
                instrucciones del sistema
              </label>
              <textarea
                className="w-full h-32 bg-surface border border-stroke p-3 text-sm text-ink outline-none focus:border-ink transition-colors duration-normal font-mono rounded-base leading-relaxed resize-none custom-scrollbar"
                value={aiConfig.systemInstruction}
                onChange={(e) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { systemInstruction: e.target.value }})}
                placeholder="define el comportamiento del asistente..."
              />
            </div>

            {/* Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-stroke-subtle">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-ink font-medium lowercase">modo pensamiento (cot)</span>
                  <span className="text-xs text-ink-subtle">
                    cadena de razonamiento extendido
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
                    búsqueda en tiempo real
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
          <Button onClick={onClose} variant="ghost" size="md">
            cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
            icon={saved ? <Check size={14} /> : undefined}
            disabled={saved}
          >
            {saved ? 'guardado' : 'guardar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
