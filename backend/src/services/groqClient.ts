import Groq from 'groq-sdk';
import { env } from '../config/env';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const GROQ_MODEL = 'llama-3.3-70b-versatile';

export interface GroqResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export async function callGroq(
  systemPrompt: string,
  userPrompt: string
): Promise<GroqResponse> {
  const startTime = Date.now();

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const choice = completion.choices[0];

  return {
    content: choice.message.content ?? '',
    promptTokens: completion.usage?.prompt_tokens ?? 0,
    completionTokens: completion.usage?.completion_tokens ?? 0,
    durationMs: Date.now() - startTime,
  };
}
