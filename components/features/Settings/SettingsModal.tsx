import React from 'react';
import { Modal } from '../../ui/Modal';
import { useStore } from '../../../contexts/StoreContext';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/Switch';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useStore();
  const { aiConfig } = state;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuration">
      <div className="space-y-8">
        
        <div className="space-y-4">
            <h3 className="text-xs font-mono text-secondary uppercase tracking-widest">System Persona</h3>
            <div>
                <textarea 
                    className="w-full h-32 bg-surface/30 border border-border p-4 text-xs text-primary outline-none focus:border-secondary font-mono rounded-sm leading-relaxed"
                    value={aiConfig.systemInstruction}
                    onChange={(e) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { systemInstruction: e.target.value }})}
                    placeholder="Define the assistant's behavior..."
                />
            </div>
        </div>

        <div className="space-y-4">
            <h3 className="text-xs font-mono text-secondary uppercase tracking-widest">Behavior</h3>
            <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm text-primary lowercase">Thinking Mode (CoT)</span>
                <Switch 
                    checked={aiConfig.useThinking} 
                    onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useThinking: v }})} 
                />
            </div>
             <div className="flex items-center justify-between border-b border-border pb-4">
                <span className="text-sm text-primary lowercase">Web Grounding</span>
                <Switch 
                    checked={aiConfig.useGrounding} 
                    onChange={(v) => dispatch({ type: 'UPDATE_AI_CONFIG', payload: { useGrounding: v }})} 
                />
            </div>
        </div>

        <div className="pt-4 flex justify-end">
            <Button onClick={onClose} variant="primary">Save Configuration</Button>
        </div>
      </div>
    </Modal>
  );
};