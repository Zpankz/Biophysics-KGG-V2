import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getActiveConfiguration } from '../lib/configManager';
import { getApiKey } from '../lib/apiKeyManager';

export async function generateSummary(
  nodes: string[],
  relationships: any[]
): Promise<string> {
  try {
    const { data: config, error: configError } = await getActiveConfiguration();

    if (configError || !config) {
      return 'Configuration error. Please check your settings.';
    }

    const chatConfig = config.chat_config;
    const provider = chatConfig.provider.toLowerCase();
    const model = chatConfig.model;

    const { data: keyData, error: keyError } = await getApiKey(provider);

    if (keyError || !keyData) {
      return `API key not found for ${provider}. Please add your API key in settings.`;
    }

    const prompt = `
Analyze these biomedical concepts and their relationships:

Concepts: ${nodes.join(', ')}
Relationships: ${relationships.map(r =>
  `${r.node.id} (${r.relationship.type || 'relates to'})`
).join(', ')}

Create 3-4 numbered bullet points that:
1. Focus on key molecular/biophysical mechanisms
2. Highlight causal relationships
3. Include quantitative/structural aspects if present

Requirements:
- Each point must be under 20 words
- Focus on specific mechanisms
- Include numerical values if present
- Order by importance`;

    const systemPrompt = "You are a biophysics expert. Provide concise, numbered insights focusing on mechanisms and physical properties.";

    let summary: string;

    if (provider === 'openai') {
      const openai = new OpenAI({
        apiKey: keyData.decrypted_key,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 150
      });

      summary = response.choices[0]?.message?.content || 'Unable to generate summary';
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({
        apiKey: keyData.decrypted_key,
        dangerouslyAllowBrowser: true
      });

      const response = await anthropic.messages.create({
        model,
        max_tokens: 150,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      summary = content.type === 'text' ? content.text : 'Unable to generate summary';
    } else {
      return `Provider ${provider} is not supported for summaries yet.`;
    }

    return summary
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const cleanLine = line.replace(/^\d+\.\s*\d+\.\s*/, '$1. ');
        return cleanLine;
      })
      .join('\n');

  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Error generating summary. Please try again.';
  }
}