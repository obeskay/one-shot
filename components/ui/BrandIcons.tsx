import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const AntigravityIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    className={className}
  >
    <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" stroke="currentColor" fill="none" />
    <polyline points="12 22 12 12 22 8.5" />
    <polyline points="12 12 2 8.5" />
    <circle cx="12" cy="12" r="3" className="fill-status-ready text-status-ready" />
  </svg>
);

export const AnthropicIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M13.827 3.525h3.633L24 20.475h-3.633l-1.89-4.364H11.08l-1.89 4.364H5.557L13.827 3.525zm3.176 9.615L15.64 9.006l-1.363 4.134h2.726zM0 20.475l5.06-11.64 2.27 5.22L4.09 20.475H0z"/>
  </svg>
);

export const OpenAIIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M22.28 9.77a6 6 0 0 0-.52-5.1 6.05 6.05 0 0 0-6.8-2.73 6.06 6.06 0 0 0-4.66-2.07 6.06 6.06 0 0 0-5.74 4.14 6.06 6.06 0 0 0-4.14 2.87 6.05 6.05 0 0 0 .82 7.33 6.05 6.05 0 0 0 .52 5.1 6.05 6.05 0 0 0 6.8 2.73 6.06 6.06 0 0 0 4.66 2.07 6.06 6.06 0 0 0 5.74-4.14 6.06 6.06 0 0 0 4.14-2.87 6.05 6.05 0 0 0-.82-7.33zM12 2.37a4.26 4.26 0 0 1 3.2 1.44l-1.34 2.33a2.76 2.76 0 0 0-2.86-.33l-2.07-3.6a4.24 4.24 0 0 1 3.07-.16zM4.3 6.47a4.25 4.25 0 0 1 1.76-2.75l2.07 3.6a2.76 2.76 0 0 0 .58 2.81l-3.6 2.07a4.25 4.25 0 0 1-.81-5.73zm1.18 8.65a4.25 4.25 0 0 1-1.44-3.2l3.6-2.07a2.76 2.76 0 0 0 3.44 2.48v4.14a4.26 4.26 0 0 1-5.6-1.35zm9.52 6.51a4.26 4.26 0 0 1-3.2-1.44l1.34-2.33a2.76 2.76 0 0 0 2.86.33l2.07 3.6a4.25 4.25 0 0 1-3.07.16zm5.7-4.1a4.25 4.25 0 0 1-1.76 2.75l-2.07-3.6a2.76 2.76 0 0 0-.58-2.81l3.6-2.07a4.25 4.25 0 0 1 .81 5.73zm-1.18-8.65a4.25 4.25 0 0 1 1.44 3.2l-3.6 2.07a2.76 2.76 0 0 0-3.44-2.48V8.38a4.26 4.26 0 0 1 5.6 1.35z"/>
  </svg>
);

export const GeminiIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z" />
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

export const OllamaIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 14h-7a.5.5 0 0 1-.5-.5V11a3.5 3.5 0 0 1 7 0v4.5a.5.5 0 0 1-.5.5z"/>
  </svg>
);

export const BrandIcon: React.FC<{ id: string; className?: string; size?: number }> = ({ id, className = "w-4 h-4", size = 16 }) => {
  switch (id.toLowerCase()) {
    case 'agy':
    case 'antigravity':
      return <AntigravityIcon className={className} size={size} />;
    case 'claude':
    case 'ccai':
    case 'anthropic':
      return <AnthropicIcon className={className} size={size} />;
    case 'openai':
    case 'codex':
      return <OpenAIIcon className={className} size={size} />;
    case 'gemini':
      return <GeminiIcon className={className} size={size} />;
    case 'gh':
    case 'copilot':
      return <GitHubIcon className={className} size={size} />;
    case 'ollama':
      return <OllamaIcon className={className} size={size} />;
    default:
      return <AntigravityIcon className={className} size={size} />;
  }
};
