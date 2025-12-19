import { createProvider } from './providers/factory';
import { getActiveConfiguration } from './configManager';
import { logUsage, calculateCost } from './usageLogger';

interface Entity {
  id: string;
  group: number;
  type?: string;
  context?: string[];
}

interface Relationship {
  source: string;
  target: string;
  value: number;
  type?: string;
  context?: string;
}

interface GraphData {
  nodes: Entity[];
  links: Relationship[];
}

const EXTRACTION_PROMPT = `You are a knowledge graph extraction expert. Analyze the following text and extract entities and relationships.

Extract:
1. Key entities (people, organizations, concepts, technologies, diseases, treatments, etc.)
2. Relationships between entities
3. Contextual information for each entity

Return a JSON object with this exact structure:
{
  "entities": [
    {
      "name": "entity name",
      "type": "entity type (person, organization, concept, disease, treatment, technology, etc.)",
      "context": ["relevant sentence 1", "relevant sentence 2"]
    }
  ],
  "relationships": [
    {
      "source": "entity name 1",
      "target": "entity name 2",
      "type": "relationship type (causes, treats, related_to, part_of, etc.)",
      "context": "sentence describing the relationship"
    }
  ]
}

TEXT:
{{TEXT}}

Respond with ONLY the JSON object, no other text.`;

export async function extractWithAI(text: string): Promise<GraphData | null> {
  try {
    const configResult = await getActiveConfiguration();
    if (!configResult.data) {
      console.warn('No active configuration found, falling back to local processing');
      return null;
    }

    const config = configResult.data;
    const extractionConfig = config.extraction_config as any;

    const startTime = Date.now();
    const provider = await createProvider(
      extractionConfig.provider,
      extractionConfig.model
    );

    const prompt = EXTRACTION_PROMPT.replace('{{TEXT}}', text);
    const response = await provider.completion({
      prompt,
      systemPrompt: 'You are a knowledge graph extraction expert. Always respond with valid JSON only.',
      temperature: extractionConfig.params?.temperature || 0.1,
      maxTokens: extractionConfig.params?.max_tokens || 4000,
    });

    const latency = Date.now() - startTime;

    const cost = calculateCost(
      extractionConfig.provider,
      extractionConfig.model,
      response.usage.inputTokens,
      response.usage.outputTokens
    );

    await logUsage({
      provider_name: extractionConfig.provider,
      model_name: extractionConfig.model,
      task_type: 'extraction',
      input_tokens: response.usage.inputTokens,
      output_tokens: response.usage.outputTokens,
      latency_ms: latency,
      cost_usd: cost,
      success: true,
    });

    const result = parseExtractionResult(response.text);
    if (!result) {
      console.warn('Failed to parse AI extraction result, falling back to local processing');
      return null;
    }

    return result;
  } catch (error) {
    console.error('AI extraction failed:', error);
    return null;
  }
}

function parseExtractionResult(text: string): GraphData | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.entities || !Array.isArray(parsed.entities)) {
      return null;
    }

    const entityTypes: Record<string, number> = {
      person: 1,
      organization: 2,
      concept: 3,
      disease: 4,
      treatment: 5,
      technology: 6,
      chemical: 7,
      gene: 8,
      protein: 9,
      other: 10,
    };

    const nodes: Entity[] = parsed.entities.map((entity: any) => {
      const type = entity.type?.toLowerCase() || 'other';
      const group = entityTypes[type] || entityTypes.other;

      return {
        id: entity.name,
        group,
        type,
        context: entity.context || [],
      };
    });

    const links: Relationship[] = (parsed.relationships || []).map((rel: any) => {
      const relationshipWeights: Record<string, number> = {
        causes: 3,
        treats: 3,
        inhibits: 3,
        activates: 3,
        part_of: 2,
        related_to: 1,
      };

      const type = rel.type?.toLowerCase() || 'related_to';
      const value = relationshipWeights[type] || 1;

      return {
        source: rel.source,
        target: rel.target,
        value,
        type,
        context: rel.context || '',
      };
    });

    return { nodes, links };
  } catch (error) {
    console.error('Failed to parse extraction result:', error);
    return null;
  }
}
