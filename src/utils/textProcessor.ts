import nlp from 'compromise';
import {
  entityTypes,
  medicalPatterns,
  relationshipPatterns,
  relationshipTypes
} from './medicalEntities';
import { analyzeGraph } from './graphAnalytics';
import { extractWithAI } from '../lib/aiTextProcessor';
import type { Node, Link, GraphData } from '../components/Graph/types';

type Entity = Node;
type Relationship = Link;

function findMedicalEntities(text: string): Entity[] {
  const doc = nlp(text);
  const entities: Entity[] = [];
  const sentences = doc.sentences().out('array') as string[];
  
  Object.entries(medicalPatterns).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = text.toLowerCase().match(new RegExp(`\\b${pattern}\\b`, 'gi')) || [];
      
      matches.forEach((match: string) => {
        const context = sentences.filter((sentence: string) =>
          sentence.toLowerCase().includes(match.toLowerCase())
        );
        
        const group = Object.keys(medicalPatterns).indexOf(category) + 1;
        
        entities.push({
          id: match,
          group,
          type: category,
          context
        });
      });
    });
  });

  return entities.reduce((acc: Entity[], current) => {
    const existing = acc.find(e => e.id.toLowerCase() === current.id.toLowerCase());
    if (!existing) {
      acc.push(current);
    } else if (current.context && current.context.length > (existing.context?.length || 0)) {
      existing.context = current.context;
    }
    return acc;
  }, []);
}

function findRelationships(text: string, entities: Entity[]): Relationship[] {
  const relationships: Relationship[] = [];
  const doc = nlp(text);
  const sentences = doc.sentences().out('array');

  sentences.forEach(sentence => {
    const entitiesInSentence = entities.filter(entity =>
      sentence.toLowerCase().includes(entity.id.toLowerCase())
    );

    for (let i = 0; i < entitiesInSentence.length; i++) {
      for (let j = i + 1; j < entitiesInSentence.length; j++) {
        const source = entitiesInSentence[i];
        const target = entitiesInSentence[j];
        
        let relationshipType = undefined;
        let maxWeight = 1;

        Object.entries(relationshipPatterns).forEach(([type, patterns]) => {
          patterns.forEach(pattern => {
            if (sentence.toLowerCase().includes(pattern.toLowerCase())) {
              relationshipType = type;
              maxWeight = 2;
            }
          });
        });

        relationships.push({
          source: source.id,
          target: target.id,
          value: maxWeight,
          type: relationshipType,
          context: sentence
        });
      }
    }
  });

  return relationships;
}

function connectIsolatedNodes(nodes: Entity[], links: Relationship[]): GraphData {
  // Create an adjacency map to track connected nodes
  const adjacencyMap = new Map<string, Set<string>>();
  nodes.forEach(node => adjacencyMap.set(node.id, new Set()));

  // Build initial connections
  links.forEach(link => {
    const source = typeof link.source === 'string' ? link.source : link.source.id;
    const target = typeof link.target === 'string' ? link.target : link.target.id;
    adjacencyMap.get(source)?.add(target);
    adjacencyMap.get(target)?.add(source);
  });

  // Find connected components using DFS
  const visited = new Set<string>();
  const components: Set<string>[] = [];

  function dfs(nodeId: string, component: Set<string>) {
    visited.add(nodeId);
    component.add(nodeId);
    adjacencyMap.get(nodeId)?.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        dfs(neighbor, component);
      }
    });
  }

  // Identify all connected components
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component = new Set<string>();
      dfs(node.id, component);
      components.push(component);
    }
  });

  // If there's only one component, no need for additional connections
  if (components.length <= 1) {
    return { nodes, links };
  }

  // Sort components by size (largest first)
  components.sort((a, b) => b.size - a.size);
  const mainComponent = components[0];
  const newLinks: Relationship[] = [...links];

  // Connect smaller components to the main component
  for (let i = 1; i < components.length; i++) {
    const component = components[i];
    const isolatedNodeId = Array.from(component)[0];
    const isolatedNode = nodes.find(n => n.id === isolatedNodeId)!;

    // Find the most suitable node in the main component to connect to
    let bestMatch: { nodeId: string; similarity: number } = { nodeId: '', similarity: -1 };

    mainComponent.forEach(mainNodeId => {
      const mainNode = nodes.find(n => n.id === mainNodeId)!;
      const similarity = calculateNodeSimilarity(isolatedNode, mainNode);
      if (similarity > bestMatch.similarity) {
        bestMatch = { nodeId: mainNodeId, similarity: similarity };
      }
    });

    // Create a new relationship
    newLinks.push({
      source: isolatedNodeId,
      target: bestMatch.nodeId,
      value: 1,
      type: 'inferred_relation',
      context: 'Inferred relationship based on domain similarity'
    });
  }

  return { nodes, links: newLinks };
}

function calculateNodeSimilarity(node1: Entity, node2: Entity): number {
  let similarity = 0;

  // Same group/category bonus
  if (node1.group === node2.group) {
    similarity += 0.5;
  }

  // Context overlap bonus
  if (node1.context && node2.context) {
    const context1 = node1.context.join(' ').toLowerCase();
    const context2 = node2.context.join(' ').toLowerCase();
    
    // Check for shared terms
    const words1 = new Set(context1.split(/\W+/));
    const words2 = new Set(context2.split(/\W+/));
    const sharedWords = new Set([...words1].filter(x => words2.has(x)));
    
    similarity += sharedWords.size / Math.max(words1.size, words2.size);
  }

  // Type similarity bonus
  if (node1.type === node2.type) {
    similarity += 0.3;
  }

  return similarity;
}

export async function processText(text: string): Promise<GraphData> {
  try {
    const aiResult = await extractWithAI(text);
    if (aiResult) {
      const connectedGraph = connectIsolatedNodes(aiResult.nodes, aiResult.links);
      return analyzeGraph(connectedGraph);
    }
  } catch (error) {
    console.warn('AI extraction failed, using local processing:', error);
  }

  const entities = findMedicalEntities(text);
  const relationships = findRelationships(text, entities);
  const connectedGraph = connectIsolatedNodes(entities, relationships);
  return analyzeGraph(connectedGraph);
}