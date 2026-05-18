import { motion } from 'framer-motion';
import { FileText, GitBranch, AlertCircle, Shield, Building2, User } from 'lucide-react';
import type { ProvenanceNode } from '../../types/map';

const NODE_ICONS: Record<string, React.ElementType> = {
  circular: FileText,
  clause: GitBranch,
  gap: AlertCircle,
  policy: Shield,
  department: Building2,
  employee: User,
};

const NODE_COLORS: Record<string, string> = {
  circular: 'bg-canara-primary text-white',
  clause: 'bg-blue-500 text-white',
  gap: 'bg-amber-500 text-white',
  policy: 'bg-purple-500 text-white',
  department: 'bg-canara-success text-white',
  employee: 'bg-slate-600 text-white',
};

interface Props {
  nodes: ProvenanceNode[];
  animated?: boolean;
  highlightIndex?: number | null;
  onNodeClick?: (node: ProvenanceNode, index: number) => void;
}

export const ProvenanceTimeline: React.FC<Props> = ({
  nodes,
  animated = true,
  highlightIndex = null,
  onNodeClick,
}) => {
  return (
    <motion.div
      className="flex items-center gap-0 overflow-x-auto py-4 px-2"
      initial={animated ? { opacity: 0 } : false}
      animate={animated ? { opacity: 1 } : false}
    >
      {nodes.map((node, i) => {
        const Icon = NODE_ICONS[node.type] || FileText;
        const color = NODE_COLORS[node.type] || 'bg-slate-400 text-white';
        const label = node.title || node.name || node.text?.slice(0, 24) || node.id;
        const isHighlight = highlightIndex === i;

        return (
          <motion.div key={`${node.type}-${i}`} className="flex items-center shrink-0">
            <motion.button
              type="button"
              onClick={() => onNodeClick?.(node, i)}
              className={`flex flex-col items-center gap-1.5 min-w-[72px] max-w-[100px] ${onNodeClick ? 'cursor-pointer' : ''}`}
              whileHover={onNodeClick ? { scale: 1.05 } : undefined}
              animate={
                isHighlight
                  ? { scale: [1, 1.08, 1], boxShadow: '0 0 0 3px rgba(0,71,171,0.4)' }
                  : {}
              }
              transition={{ repeat: isHighlight ? Infinity : 0, duration: 1.5 }}
            >
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${color} ${isHighlight ? 'ring-2 ring-canara-primary ring-offset-2' : ''}`}
                initial={animated ? { scale: 0 } : false}
                animate={animated ? { scale: 1 } : false}
                transition={{ delay: i * 0.1 }}
              >
                <Icon className="w-4 h-4" />
              </motion.div>
              <span className="text-[10px] font-semibold uppercase text-slate-500">{node.type}</span>
              <span className="text-[10px] text-slate-700 text-center line-clamp-2 leading-tight">{label}</span>
            </motion.button>
            {i < nodes.length - 1 && (
              <motion.div
                className="h-0.5 w-8 sm:w-12 bg-gradient-to-r from-canara-primary/60 to-canara-success/60 mx-1 shrink-0"
                initial={animated ? { scaleX: 0 } : false}
                animate={animated ? { scaleX: 1 } : false}
                transition={{ delay: i * 0.1 + 0.05, duration: 0.4 }}
                style={{ originX: 0 }}
              />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
};
