import { ProviderType, Model } from '../types';

interface ModelServiceResponse {
    models: Model[];
    error?: string;
}

export class ModelService {

    static async fetchModels(
        provider: ProviderType,
        apiKey: string,
        baseUrl?: string
    ): Promise<ModelServiceResponse> {
        try {
            switch (provider) {
                case 'openai':
                case 'deepseek': // DeepSeek is OpenAI compatible
                    return await this.fetchOpenAICompatiblemodels(apiKey, baseUrl || 'https://api.openai.com/v1');
                case 'gemini':
                    return await this.fetchGeminiModels(apiKey);
                case 'local':
                    return await this.fetchOllamaModels(baseUrl || 'http://localhost:11434/v1');
                case 'anthropic':
                    // Anthropic doesn't support client-side model listing easily due to CORS/Auth scope often
                    // We return empty to trigger manual entry or use fallback
                    return { models: [] };
                default:
                    return { models: [] };
            }
        } catch (error) {
            console.error(`Error fetching models for ${provider}:`, error);
            return { models: [], error: (error as Error).message };
        }
    }

    private static async fetchOpenAICompatiblemodels(apiKey: string, baseUrl: string): Promise<ModelServiceResponse> {
        // Handle trailing slash
        const url = `${baseUrl.replace(/\/$/, '')}/models`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();

        // Normalize OpenAI/DeepSeek response
        // typically: { data: [ { id: "gpt-4", ... }, ... ] }
        const models: Model[] = (data.data || []).map((m: any) => ({
            id: m.id,
            name: m.id, // OpenAI doesn't give pretty names in API
            maxTokens: 128000, // Default assumption, hard to know from API
            canThink: m.id.includes('o1') || m.id.includes('reasoner') || m.id.includes('thinking'),
            canSearch: false
        })).sort((a: Model, b: Model) => b.id.localeCompare(a.id)); // Newer usually top

        return { models };
    }

    private static async fetchGeminiModels(apiKey: string): Promise<ModelServiceResponse> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch Gemini models: ${response.statusText}`);
        }

        const data = await response.json();
        // Response: { models: [ { name: "models/gemini-1.5-flash", displayName: "Gemini 1.5 Flash", inputTokenLimit: 123 } ] }

        const models: Model[] = (data.models || [])
            .filter((m: any) => m.name.includes('gemini')) // Filter pertinent ones
            .map((m: any) => {
                const id = m.name.replace('models/', '');
                return {
                    id: id,
                    name: m.displayName || id,
                    maxTokens: m.inputTokenLimit || 1000000,
                    canThink: id.includes('thinking'),
                    canSearch: true
                };
            })
            .sort((a: Model, b: Model) => b.id.localeCompare(a.id));

        return { models };
    }

    private static async fetchOllamaModels(baseUrl: string): Promise<ModelServiceResponse> {
        // Ollama API: GET /api/tags
        // Note: The OpenAI compatible endpoint for Ollama (/v1/models) also works and might be easier since it returns OpenAI format.
        // Let's try the native tags endpoint first as it's cleaner for Ollama specifically, 
        // OR just reuse fetchOpenAICompatiblemodels if the user points to v1.

        // If baseUrl ends in /v1, treat as OpenAI compatible
        if (baseUrl.endsWith('/v1')) {
            return this.fetchOpenAICompatiblemodels('ollama', baseUrl);
        }

        // Native Ollama API
        const url = `${baseUrl.replace(/\/$/, '')}/api/tags`;
        const response = await fetch(url);

        if (!response.ok) {
            // Fallback to /v1/models if /api/tags fails, maybe they mapped it differently
            return this.fetchOpenAICompatiblemodels('ollama', `${baseUrl}/v1`);
        }

        const data = await response.json();
        // { models: [ { name: "llama3:latest", ... } ] }

        const models: Model[] = (data.models || []).map((m: any) => ({
            id: m.name,
            name: m.name,
            maxTokens: 32000, // Ollama default guess
            canThink: m.name.includes('deepseek-r1'),
        }));

        return { models };
    }
}
