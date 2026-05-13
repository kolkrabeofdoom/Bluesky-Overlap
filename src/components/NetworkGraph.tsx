import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export type NetworkNode = {
  id: string;
  label: string;
  radius: number;
  image?: string;
};

export type NetworkLink = {
  source: string;
  target: string;
};

export default function NetworkGraph({ nodes, links }: { nodes: NetworkNode[]; links: NetworkLink[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    
    const width = containerRef.current.clientWidth;
    const height = 400;

    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Define arrowhead marker
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 30) // Adjust this based on node radius to push arrow outside
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#94a3b8')
      .style('stroke', 'none');

    // Make a copy of nodes and links as D3 mutates them
    const simNodes = nodes.map(d => ({ ...d }));
    const simLinks = links.map(d => ({ ...d }));

    const simulation = d3.forceSimulation(simNodes as any)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 20));

    // Draw links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .enter().append('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Node circles (background/border)
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', '#f1f5f9')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 3);

    // Node Images
    node.append('clipPath')
      .attr('id', (d, i) => `clip-${i}`)
      .append('circle')
      .attr('r', d => d.radius);

    node.append('image')
      .attr('xlink:href', d => d.image || '')
      .attr('x', d => -d.radius)
      .attr('y', d => -d.radius)
      .attr('width', d => d.radius * 2)
      .attr('height', d => d.radius * 2)
      .attr('clip-path', (d, i) => `url(#clip-${i})`);
      
    // Default text if no image
    node.filter(d => !d.image)
      .append('text')
      .text(d => d.label.charAt(0).toUpperCase())
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#94a3b8')
      .attr('font-size', '20px')
      .attr('font-weight', 'bold');

    // Node Labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.radius + 20)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0f172a')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      // Keep nodes constrained to viewport
      simNodes.forEach((d: any) => {
        d.x = Math.max(d.radius + 20, Math.min(width - d.radius - 20, d.x));
        d.y = Math.max(d.radius + 20, Math.min(height - d.radius - 20, d.y));
      });

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => {
            // Adjust end point to be outside target node
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return d.target.x;
            const r = d.target.radius + 5; // offset
            return d.target.x - dx / len * r;
        })
        .attr('y2', (d: any) => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return d.target.y;
            const r = d.target.radius + 5;
            return d.target.y - dy / len * r;
        });

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]"></div>;
}
