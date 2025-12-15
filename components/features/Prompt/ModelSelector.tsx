import React from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { getProviderById, getModelsByProvider } from '../../../constants';
import { Select } from '../../ui/Select';
import { Switch } from '../../ui/Switch';
import { Sparkles, BrainCircuit, Globe } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export const ModelSelector: React.FC = () => {
  const { state, dispatch } = useStore();
  const { aiConfig } = state;

  const provider = getProviderById(aiConfig.provider);
  const models = getModelsByProvider(aiConfig.provider);
  const currentModel = models.find(m => m.id === aiConfig.model);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-surface/40 border-b border-border backdrop-blur-sm">

      {/* Provider & Model Info */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <div className="bg-primary/10 p-1.5 rounded-md text-primary">
          <span className="text-sm">{provider?.icon || '🤖'}</span>
        </div>
        <Select
          value={aiConfig.model}
          onChange={(e) => {
            const newModel = e.target.value;
            const modelDef = models.find(m => m.id === newModel);
            dispatch({
              type: 'UPDATE_AI_CONFIG',
              payload: {
                model: newModel,
                useThinking: aiConfig.useThinking && modelDef?.canThink ? true : false,
                useGrounding: aiConfig.useGrounding && modelDef?.canSearch ? true : false
              }
            });
          }}
          className="font-medium"
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </Select>
      </div>

      <div className="h-6 w-px bg-border hidden sm:block" />

      {/* Feature Toggles */}
      <div className="flex items-center gap-4 flex-1">

        {/* Thinking Toggle */}
        <div className={currentModel?.canThink ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
          <Tooltip text="Modo Pensamiento: razonamiento profundo">
            <div className="flex items-center gap-2">
              <BrainCircuit size={16} className={aiConfig.useThinking ? "text-purple-400" : "text-secondary"} />
              <Switch
                checked={aiConfig.useThinking}
                onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useThinking: v } })}
                label="COT"
              />
            </div>
          </Tooltip>
        </div>

        {/* Grounding Toggle */}
        <div className={currentModel?.canSearch ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
          <Tooltip text="Web Grounding: búsqueda en tiempo real">
            <div className="flex items-center gap-2">
              <Globe size={16} className={aiConfig.useGrounding ? "text-green-400" : "text-secondary"} />
              <Switch
                checked={aiConfig.useGrounding}
                onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useGrounding: v } })}
                label="Web"
              />
            </div>
          </Tooltip>
        </div>

      </div>
    </div>
  );
};
