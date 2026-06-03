import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
import { apiClient } from '../../lib/api';
import {
  DashboardLayout,
  DashboardHeader,
  MetricGrid,
  StatCard,
  Panel,
  Alert,
} from '../../components/ui/cards';

const t = (s: string) => s;

export function GraphHealthMonitor() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/admin/graph-health')
      .then(res => {
        setHealth(res.data);
        setLoading(false);
      })
      .catch(err => {
        if (import.meta.env.DEV) console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePrune = async () => {
    try {
      const res = await apiClient.post('/api/admin/graph-health/prune');
      alert(res.data.message);
      // Refresh data
      const updated = await apiClient.get('/api/admin/graph-health');
      setHealth(updated.data);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-2 border-cyber-cyan border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">{t('Loading graph health data...')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!health) {
    return (
      <DashboardLayout>
        <Alert
          type="error"
          title="Failed to Load"
          message="Unable to fetch graph health metrics. Please refresh or contact support."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Graph Health Monitor"
        subtitle="Real-time monitoring and optimization of policy mapping architecture"
        action={
          <button
            onClick={handlePrune}
            className="btn-cyber-primary flex items-center gap-2 px-6 py-3"
          >
            <Zap size={18} />
            1-Click Prune Stale Edges
          </button>
        }
      />

      {/* Key Metrics */}
      <MetricGrid cols={4}>
        <StatCard
          label="Connectivity Score"
          value={`${health.connectivity_score}/100`}
          accentColor="blue"
          trend={{
            value: 12,
            isPositive: health.connectivity_score > 80,
          }}
        />
        <StatCard
          label="Stale Edges"
          value={health.stale_edges}
          accentColor="red"
          trend={{
            value: 5,
            isPositive: health.stale_edges < 10,
          }}
        />
        <StatCard
          label="Orphan Clauses"
          value={health.orphan_clauses}
          accentColor="cyan"
          trend={{
            value: 3,
            isPositive: health.orphan_clauses < 5,
          }}
        />
        <StatCard
          label="Policy Coverage"
          value={`${health.policy_coverage_rate}%`}
          accentColor="green"
          trend={{
            value: 8,
            isPositive: true,
          }}
        />
      </MetricGrid>

      {/* Detected Issues & Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Detected Issues" subtitle={`${health.issues.length} issue(s) found`}>
          {health.issues.length > 0 ? (
            <ul className="space-y-3">
              {health.issues.map((issue: any, idx: number) => (
                <div
                  key={idx}
                  className="glass-dark rounded-lg p-4 border border-red-500/30 bg-red-500/10"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wide">
                        {issue.type}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-8">
              <CheckCircle2 size={32} className="text-green-400 opacity-70" />
              <p className="text-muted-foreground ml-3">{t('All systems operational')}</p>
            </div>
          )}
        </Panel>

        <Panel title="AI Suggestions" subtitle="Optimization recommendations">
          {health.suggestions.length > 0 ? (
            <ul className="space-y-3">
              {health.suggestions.map((suggestion: string, idx: number) => (
                <div
                  key={idx}
                  className="glass-dark rounded-lg p-4 border border-cyber-blue/30 bg-cyber-blue/10"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp size={18} className="text-cyber-blue shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{suggestion}</p>
                  </div>
                </div>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <p>{t('No suggestions at this time')}</p>
            </div>
          )}
        </Panel>
      </div>

      {/* Graph Visualization */}
      <Panel title="Interactive Compliance Path & Graph Network">
        <GraphNetworkVisualizer graph={health.graph} />
      </Panel>
    </DashboardLayout>
  );
}

function GraphNetworkVisualizer({ graph }: { graph: any }) {
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{t('No graph mapping network data currently generated. Please upload a circular or parse guidelines first.')}</div>;
  }

  // Layered Layout Configuration
  const width = 1000;
  const height = 500;
  
  // X columns mapping
  const groupColumns = new Map<string, number>([
    ['circular', 80],
    ['clause', 280],
    ['map', 500],
    ['policy', 720],
    ['department', 920],
  ]);

  // Group colors mapping
  const groupColors = new Map<string, { stroke: string; label: string }>([
    ['circular', { stroke: '#3b82f6', label: 'Circular' }],
    ['clause', { stroke: '#06b6d4', label: 'Clause' }],
    ['map', { stroke: '#f59e0b', label: 'MAP' }],
    ['policy', { stroke: '#a855f7', label: 'Policy' }],
    ['department', { stroke: '#22c55e', label: 'Dept' }],
  ]);

  // Count items per group to distribute them vertically
  const nodesByGroup = new Map<string, any[]>();
  graph.nodes.forEach((node: any) => {
    const grp = node.group || 'unknown';
    if (!nodesByGroup.has(grp)) nodesByGroup.set(grp, []);
    nodesByGroup.get(grp)!.push(node);
  });

  // Calculate coordinates for each node
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  groupColumns.forEach((x, group) => {
    const groupNodes = nodesByGroup.get(group) || [];
    groupNodes.forEach((node, idx) => {
      const y = (idx + 1) * (height / (groupNodes.length + 1));
      nodePositions.set(node.id, { x, y });
    });
  });

  // Filter links where both source and target have coordinates
  const validLinks = (graph.links || []).filter(
    (link: any) => nodePositions.has(link.source) && nodePositions.has(link.target)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
      <div className="lg:col-span-3 glass-dark rounded-xl p-4 border border-obsidian-800 relative overflow-hidden bg-obsidian-950/20">
        {/* Legend */}
        <div className="absolute top-4 left-4 flex gap-4 text-[10px] font-semibold bg-obsidian-950/80 px-3 py-2 rounded-lg border border-obsidian-800/60 z-10">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Circular</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />Clause</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />MAP</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" />Policy</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Dept</span>
        </div>

        {/* SVG Graph Canvas */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none mt-6">
          {/* Draw Link Lines */}
          {validLinks.map((link: any, idx: number) => {
            const p1 = nodePositions.get(link.source);
            const p2 = nodePositions.get(link.target);
            if (!p1 || !p2) return null;
            const isHighlighted = hoveredNode === link.source || hoveredNode === link.target;
            
            // Draw smooth bezier curves between columns
            return (
              <path
                key={idx}
                d={`M ${p1.x} ${p1.y} C ${(p1.x + p2.x) / 2} ${p1.y}, ${(p1.x + p2.x) / 2} ${p2.y}, ${p2.x} ${p2.y}`}
                fill="none"
                stroke={isHighlighted ? '#22d3ee' : '#1e293b'}
                strokeWidth={isHighlighted ? 3 : 1.2}
                strokeOpacity={isHighlighted ? 1.0 : 0.4}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Draw Node Circles */}
          {graph.nodes.map((node: any) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;

            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode?.id === node.id;
            const colors = groupColors.get(node.group) || { stroke: '#94a3b8', label: 'Other' };
            const strokeColor = isHovered ? '#22d3ee' : isSelected ? '#ffffff' : colors.stroke;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(node)}
              >
                {/* Node Outer Glow Circle */}
                <circle
                  r={isHovered ? 15 : 9}
                  fill="#0b0f19"
                  stroke={strokeColor}
                  strokeWidth={isHovered || isSelected ? 3 : 1.5}
                  className="transition-all duration-300"
                />
                {/* Node Center Dot */}
                <circle
                  r={3}
                  fill={colors.stroke}
                />
                
                {/* Node Label Text */}
                <text
                  y={22}
                  textAnchor="middle"
                  fill={isHovered ? '#22d3ee' : '#94a3b8'}
                  className="text-[9px] font-semibold transition-all duration-200 fill-slate-400"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side Panel for details */}
      <div className="glass-dark rounded-xl p-5 border border-obsidian-800 flex flex-col justify-between bg-obsidian-950/40">
        {selectedNode ? (
          <div>
            <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
              selectedNode.group === 'circular' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              selectedNode.group === 'clause' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
              selectedNode.group === 'map' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              selectedNode.group === 'policy' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
              'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {selectedNode.group} Node
            </span>
            <h4 className="text-sm font-bold text-foreground mt-4 leading-snug">{selectedNode.label}</h4>
            <div className="mt-4 space-y-2 border-t border-obsidian-800/80 pt-3 text-[11px] text-slate-400 leading-relaxed">
              <div>
                <span className="font-bold text-slate-500 block">{t('Identifier:')}</span>
                <span className="font-mono text-[10px] break-all">{selectedNode.id}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-8">
            <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-xs">{t('Select any network node to inspect its compliance links.')}</p>
          </div>
        )}
        <div className="border-t border-obsidian-800/80 pt-4 mt-4">
          <p className="text-[10px] text-slate-500 leading-normal">
            This graph highlights the regulatory "Golden Thread" linking circulars to policy requirements, confirmation gaps, and active MAPs.
          </p>
        </div>
      </div>
    </div>
  );
}