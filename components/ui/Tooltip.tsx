import React, { useState } from 'react';

export const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-surface border border-border text-primary text-[10px] tracking-wide shadow-xl whitespace-nowrap z-50 animate-reveal">
          {text}
        </div>
      )}
    </div>
  );
};