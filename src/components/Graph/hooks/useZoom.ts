import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface UseZoomProps {
  svgRef: React.RefObject<SVGSVGElement>;
  gRef: React.RefObject<SVGGElement>;
}

export function useZoom({ svgRef, gRef }: UseZoomProps) {
  const zoomRef = useRef<d3.ZoomBehavior<any, any> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        d3.select(gRef.current).attr('transform', event.transform);
      });

    d3.select(svgRef.current).call(zoom as any);
    zoomRef.current = zoom;

    return () => {
      d3.select(svgRef.current).on('.zoom', null);
    };
  }, []);

  return zoomRef;
}