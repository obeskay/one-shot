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

// Iconic 8-ray Claude Sparkle/Starburst
export const ClaudeIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.2" 
    strokeLinecap="round"
    className={className}
  >
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
  </svg>
);

// Official Anthropic /\A Corporate Logo
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

// Canonical OpenAI Spiral Logo
export const OpenAIIcon: React.FC<IconProps> = ({ className = "w-4 h-4", size = 16 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9013A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9013 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9014A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.206 5.9897 5.9897 0 0 0 3.9977-2.9013 6.0557 6.0557 0 0 0-.7475-7.0718zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.794.794 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.067l-4.831 2.791A4.5 4.5 0 0 1 3.6 18.304zm-1.543-9.52a4.48 4.48 0 0 1 2.34-1.972l.002.164v5.522a.784.784 0 0 0 .392.68l5.833 3.365-2.02 1.168a.078.078 0 0 1-.075.005L3.693 14.93A4.504 4.504 0 0 1 2.057 8.784zm14.197 3.565-5.834-3.37 2.02-1.164a.078.078 0 0 1 .075-.005l4.836 2.793a4.5 4.5 0 0 1-.692 8.125v-5.698a.79.79 0 0 0-.405-.681zm2.347-4.491-4.779-2.758a.774.774 0 0 0-.78 0L7.301 8.905V6.573a.078.078 0 0 1 .033-.067l4.831-2.79a4.503 4.503 0 0 1 6.685 4.707zm-10.45 2.505 2.51-1.45 2.51 1.45v2.9l-2.51 1.45-2.51-1.45z"/>
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
      return <ClaudeIcon className={className} size={size} />;
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
