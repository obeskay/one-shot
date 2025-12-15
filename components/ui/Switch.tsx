import React from 'react';
import { cn } from '../../utils/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label }) => {
  return (
    <label className="flex items-center cursor-pointer group gap-3">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={cn(
          "w-8 h-4 rounded-full transition-colors duration-300 ease-expo border",
          checked ? "bg-primary border-primary" : "bg-transparent border-border group-hover:border-secondary"
        )}></div>
        <div className={cn(
          "absolute left-0.5 top-0.5 bg-black w-3 h-3 rounded-full transition-transform duration-300 ease-expo",
          checked ? "transform translate-x-4 bg-black" : "bg-secondary"
        )}></div>
      </div>
      {label && <span className="text-xs text-secondary font-medium group-hover:text-primary transition-colors lowercase">{label}</span>}
    </label>
  );
};