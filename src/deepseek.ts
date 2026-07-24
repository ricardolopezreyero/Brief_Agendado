// RLR
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

export async function llamarDeepSeek(apiKey: string, params: {
  system: string;
  user: string;
  jsonMode?: boolean;
  temperature?: number;
  model?: string;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: params.model ?? 'deepseek-v4-flash',
    messages: [
      { role: 'system', content: params.system },
      { role: 'user', content: params.user },
    ],
    temperature: params.temperature ?? 0.3,
  };
  if (params.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const r = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`DeepSeek ${r.status}: ${errText}`);
  }

  const data = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek no devolvió contenido');
  return content;
}
