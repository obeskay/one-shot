import React from 'react';
import { cn } from '../../utils/cn';

interface TabsProps {
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string; icon?: React.ReactNode }[];
}

export const Tabs: React.FC<TabsProps> = ({ value, onChange, options }) => {
    return (
        <div className="flex p-1 bg-gray-900 rounded-lg border border-gray-800">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex items-center justify-center flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                        value === opt.value 
                            ? "bg-gray-800 text-white shadow-sm" 
                            : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    {opt.icon && <span className="mr-2">{opt.icon}</span>}
                    {opt.label}
                </button>
            ))}
        </div>
    );
};