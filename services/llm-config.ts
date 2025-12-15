
import { AIConfig } from '../types';

export const resolveModelBehavior = (config: AIConfig) => {
    // Force specific constraints based on feature requirements
    
    if (config.useThinking) {
        return {
            model: 'gemini-3-pro-preview',
            thinkingConfig: { thinkingBudget: 32768 },
            maxOutputTokens: undefined, // Must not set maxOutputTokens when thinking
        };
    }

    if (config.useGrounding) {
        return {
            model: 'gemini-2.5-flash',
            tools: [{ googleSearch: {} }]
        };
    }

    // Default fallbacks
    return {
        model: config.model
    };
};
