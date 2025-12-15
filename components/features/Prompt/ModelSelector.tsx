
import React from 'react';
import { useStore } from '../../../contexts/StoreContext';
import { MODELS } from '../../../constants';
import { Select } from '../../ui/Select';
import { Switch } from '../../ui/Switch';
import { Sparkles, BrainCircuit, Zap, Globe } from 'lucide-react';
import { Tooltip } from '../../ui/Tooltip';

export const ModelSelector: React.FC = () => {
  const { state, dispatch } = useStore();
  const { aiConfig } = state;

  const currentModelDef = MODELS.find(m => m.id === aiConfig.model);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-gray-800/40 border-b border-gray-800 backdrop-blur-sm">
      
      {/* Model Dropdown */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <div className="bg-blue-600/20 p-1.5 rounded-md text-blue-400">
            {currentModelDef?.speed === 'lightning' ? <Zap size={16} /> : <Sparkles size={16} />}
        </div>
        <Select 
            value={aiConfig.model}
            onChange={(e) => {
                const newModel = e.target.value as any;
                // Reset incompatible flags when switching
                const canThink = MODELS.find(m => m.id === newModel)?.canThink;
                const canSearch = MODELS.find(m => m.id === newModel)?.canSearch;
                dispatch({ 
                    type: 'UPDATE_AI_CONFIG', 
                    payload: { 
                        model: newModel,
                        useThinking: aiConfig.useThinking && canThink ? true : false,
                        useGrounding: aiConfig.useGrounding && canSearch ? true : false
                    } 
                });
            }}
            className="font-medium"
        >
            {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </Select>
      </div>

      <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

      {/* Feature Toggles */}
      <div className="flex items-center gap-4 flex-1">
        
        {/* Thinking Toggle */}
        <div className={currentModelDef?.canThink ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
            <Tooltip text="Thinking Mode: 32k token budget for deep reasoning (Gemini 3 Pro only)">
                <div className="flex items-center gap-2">
                    <BrainCircuit size={16} className={aiConfig.useThinking ? "text-purple-400" : "text-gray-500"} />
                    <Switch 
                        checked={aiConfig.useThinking} 
                        onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useThinking: v } })}
                        label="Reasoning"
                    />
                </div>
            </Tooltip>
        </div>

        {/* Grounding Toggle */}
        <div className={currentModelDef?.canSearch ? 'opacity-100' : 'opacity-40 pointer-events-none'}>
            <Tooltip text="Search Grounding: Use Google Search for real-time info">
                <div className="flex items-center gap-2">
                    <Globe size={16} className={aiConfig.useGrounding ? "text-green-400" : "text-gray-500"} />
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
