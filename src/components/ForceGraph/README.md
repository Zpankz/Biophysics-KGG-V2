# UnifiedForceGraph Component

Unified React component for 2D, 3D, AR, and VR force-directed graph visualization.

## Quick Start

```tsx
import { UnifiedForceGraph } from './components/ForceGraph';

function MyApp() {
  const [mode, setMode] = useState('2d');

  return (
    <UnifiedForceGraph
      data={{
        nodes: [
          { id: 'A', group: 1, type: 'protein' },
          { id: 'B', group: 1, type: 'gene' },
          { id: 'C', group: 2, type: 'pathway' },
        ],
        links: [
          { source: 'A', target: 'B', value: 1, type: 'activates' },
          { source: 'B', target: 'C', value: 2, type: 'regulates' },
        ],
      }}
      mode={mode}
      onNodeClick={(node) => console.log(node)}
    />
  );
}
```

## Features

### All Modes (2D/3D/AR/VR)
- Directional arrows on links
- Curved links for parallel edges
- Self-links (loops)
- Text labels on links
- Auto-colored nodes by group
- Multi-node selection (Ctrl+Click)
- Highlight on hover
- Click to focus with camera animation
- Pathway mode (3-hop neighbor highlighting)

### 2D-Specific
- High-performance canvas rendering
- Custom node shapes via `nodeCanvasObject`
- Scales to 10,000+ nodes smoothly

### 3D-Specific
- Custom Three.js geometries per node type
- 3D text sprites (SpriteText)
- Orbit/trackball/fly camera controls
- Collision detection
- Immersive exploration

### AR-Specific
- Hiro marker tracking
- Mobile-optimized
- Real-world scale configuration

### VR-Specific
- WebXR support
- VR controller interactions
- Immersive graph exploration

## API

### Props

See `types.ts` for full TypeScript definitions.

**Core Props**:
- `data: GraphData` - Graph data with nodes and links
- `mode: VisualizationMode` - '2d' | '3d' | 'ar' | 'vr'
- `layoutAlgorithm?: LayoutAlgorithm` - 'force' | 'dagre' | 'tree' | 'auto'

**Feature Toggles**:
- `enablePathwayMode?: boolean` - Multi-hop highlighting
- `enableMultiSelection?: boolean` - Ctrl+Click selection
- `enableNodeDrag?: boolean` - Drag to move nodes
- `enableZoom?: boolean` - Zoom controls
- `enablePan?: boolean` - Pan controls

**Event Handlers**:
- `onNodeClick?: (node, event) => void`
- `onNodeHover?: (node | null) => void`
- `onLinkClick?: (link, event) => void`
- `onNodeDragEnd?: (node) => void`

### Ref Methods

```tsx
const graphRef = useRef<GraphRef>(null);

<UnifiedForceGraph ref={graphRef} ... />

// Methods:
graphRef.current.centerAt(x, y, 1000);
graphRef.current.zoom(2, 1000);
graphRef.current.zoomToFit(400, 20);
graphRef.current.cameraPosition({x, y, z}, node, 1000);
```

## Custom Hooks

### `useNeighborMap(data)`
Pre-calculates neighbor relationships for O(1) lookup.

```tsx
import { useNeighborMap } from './hooks';

const neighborMap = useNeighborMap(graphData);
const neighbors = neighborMap.get(nodeId);  // Set<string>
```

### `useMultiSelection()`
Manages multi-node selection state.

```tsx
import { useMultiSelection } from './hooks';

const {
  selectedNodes,
  hoveredNode,
  handleNodeSelect,
  clearSelection,
} = useMultiSelection();
```

### `useGraphHighlight(data, neighborMap, pathwayMode)`
Manages highlight state for hover interactions.

```tsx
import { useGraphHighlight } from './hooks';

const { highlightState, handlers } = useGraphHighlight(
  graphData,
  neighborMap,
  pathwayMode
);
```

## Utilities

### Link Curvature

```tsx
import { enrichLinksWithCurvature } from './utils';

const curvedLinks = enrichLinksWithCurvature(links, nodes);
// Automatically calculates curvature for parallel links and self-links
```

### Layout Algorithms

```tsx
import {
  applyDagreLayout,
  applyTreeLayout,
  applyCircularLayout,
  applyAutoLayout
} from './utils';

const hierarchicalData = applyDagreLayout(graphData, {
  rankdir: 'TB',
  nodesep: 50,
  ranksep: 100,
});
```

### 3D Node Geometries

```tsx
import { createNode3DObject } from './utils';

// In ForceGraph3D:
nodeThreeObject={(node) =>
  createNode3DObject(node, isSelected, isHighlighted, true)
}
```

## Performance Tips

1. **Use memoization**: All hooks memoize expensive calculations
2. **Pre-compute layouts**: Use Dagre for hierarchical graphs (set `cooldownTicks={0}`)
3. **Lazy load 3D**: Only load 3D libraries when user switches to 3D mode
4. **Limit pathway depth**: Default is 3 hops, reduce for large graphs
5. **Use WebGL for large graphs**: Switch to 3D mode for 1000+ nodes

## Examples

See `/Users/mikhail/projects/apps/bpkggv3/force-graph/example/` for 33 production-ready examples.

## License

MIT (inherited from parent project)
