import OpenAI from 'openai';
import { getApiKey } from './apiKeyStorage';

export async function generateSummary(
  nodes: string[],
  relationships: any[]
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return 'API key not set';
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });

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

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a biophysics expert. Provide concise, numbered insights focusing on mechanisms and physical properties."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const summary = response.choices[0]?.message?.content || 'Unable to generate summary';
    
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