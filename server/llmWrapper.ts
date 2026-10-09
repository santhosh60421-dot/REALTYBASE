/**
 * Swappable LLM Wrapper for REALTYBASE.
 * All LLM interactions flow strictly through llmCall({ systemPrompt, messages, tools, jsonSchema }).
 * API keys remain exclusively on the server side.
 */

import { GoogleGenAI } from '@google/genai';

export interface LLMMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface LLMCallParams {
  systemPrompt?: string;
  messages: LLMMessage[];
  tools?: any[];
  jsonSchema?: any;
  modelName?: string;
  temperature?: number;
}

export interface LLMCallResult {
  text: string;
  parsedJson?: any;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
    id?: string;
  }>;
  modelUsed: string;
}

// Single instance of GenAI client with required header
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Single swappable LLM entry point with automatic retry and model fallback.
 */
export async function llmCall(params: LLMCallParams): Promise<LLMCallResult> {
  const client = getGenAIClient();
  const primaryModel = params.modelName || 'gemini-3.8-flash';
  const fallbackModels = [primaryModel, 'gemini-3.1-flash-lite'];

  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please check the Secrets panel.');
  }

  // Format contents for Gemini SDK
  const contents = params.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  let lastError: any = null;

  for (const model of fallbackModels) {
    try {
      const config: any = {
        temperature: params.temperature ?? 0.1
      };

      if (params.systemPrompt) {
        config.systemInstruction = params.systemPrompt;
      }

      if (params.jsonSchema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = params.jsonSchema;
      }

      if (params.tools && params.tools.length > 0) {
        config.tools = params.tools;
      }

      const response = await client.models.generateContent({
        model,
        contents,
        config
      });

      const responseText = response.text || '';
      let parsedJson: any = undefined;

      if (params.jsonSchema || config.responseMimeType === 'application/json') {
        try {
          parsedJson = JSON.parse(responseText.trim());
        } catch {
          const cleaned = responseText.replace(/```(?:json)?/g, '').trim();
          try {
            parsedJson = JSON.parse(cleaned);
          } catch (parseErr) {
            console.warn('Failed to parse model JSON output:', parseErr);
          }
        }
      }

      const functionCalls: any[] = [];
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          functionCalls.push({
            name: fc.name,
            args: fc.args,
            id: (fc as any).id
          });
        }
      }

      return {
        text: responseText,
        parsedJson,
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        modelUsed: model
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Attempt with ${model} failed (${err.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error('All model attempts failed');
}
