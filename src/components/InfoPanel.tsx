// ... (previous imports remain the same)

interface InfoPanelProps {
  node: Node;
  context: string[];
  originalText: string;
  topRelationships: {
    directRelationships: Array<{
      node: Node;
      relationship: {
        type?: string;
        weight: number;
      };
    }>;
    indirectRelationships?: Array<{
      path: {
        nodes: Node[];
        links: any[];
        score: number;
      };
      explanation: string;
    }>;
  };
  compareNode: Node | null;
  onClose: () => void;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  node,
  context,
  topRelationships,
  compareNode,
  onClose
}) => {
  // ... (previous state declarations remain the same)

  return (
    <div className="w-1/3 bg-white rounded-lg shadow-lg p-6 h-[600px] overflow-y-auto">
      {/* ... (previous header section remains the same) */}

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Key Relationships
        </h3>
        <div className="space-y-2">
          {topRelationships.directRelationships.map((rel, index) => (
            <div key={index} className="text-sm bg-gray-50 p-2 rounded">
              <div className="flex items-center justify-between">
                <span className="font-medium">{rel.node.id}</span>
                <span className="text-xs text-gray-400">
                  Strength: {(rel.relationship.weight * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-gray-500 text-sm mt-1">
                {rel.relationship.type || 'relates to'}
              </div>
            </div>
          ))}
        </div>

        {compareNode && topRelationships.indirectRelationships && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-600 mb-2">
              Connection to {compareNode.id}
            </h4>
            <div className="space-y-2">
              {topRelationships.indirectRelationships.map((path, index) => (
                <div key={index} className="text-sm bg-blue-50 p-3 rounded">
                  <p>{path.explanation}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Path strength: {(path.path.score * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ... (rest of the component remains the same) */}
    </div>
  );
};