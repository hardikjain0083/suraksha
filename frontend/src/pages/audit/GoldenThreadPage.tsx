import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Activity, CheckCircle, Database, Network, Clock, FileText, ArrowRight, Check } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';

const nodes = [
  { id: 'c1', type: 'CIRCULAR', label: 'RBI/2026-ABC', badge: 'INGESTED', color: 'border-cyber-blue text-cyber-blue bg-cyber-blue/10 shadow-glow-blue/20' },
  { id: 'cl1', type: 'CLAUSE', label: 'CLAUSE 1.1', badge: 'EXTRACTED', color: 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 shadow-glow-cyan/20' },
  { id: 'g1', type: 'GAP', label: 'AES-256 GAP', badge: 'SUSPECTED', color: 'border-cyber-magenta text-cyber-magenta bg-cyber-magenta/10 shadow-glow-magenta/20' },
  { id: 'm1', type: 'MAP', label: 'MAP-2026-013', badge: 'ACTIVE', color: 'border-cyber-blue text-cyber-blue bg-cyber-blue/10 shadow-glow-blue/20' },
  { id: 'd1', type: 'ROUTING', label: 'IT DEPT (EMP01)', badge: 'ALLOCATED', color: 'border-slate-500 text-slate-400 bg-slate-800/20' },
  { id: 'e1', type: 'EVIDENCE', label: 'FW-CONFIG.JSON', badge: 'INGESTED', color: 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 shadow-glow-cyan/20' },
  { id: 'v1', type: 'VALIDATION', label: 'CHECKSUM RUN', badge: 'PASSED', color: 'border-cyber-green text-cyber-green bg-cyber-green/10 shadow-glow-green/20' },
];

export function GoldenThreadPage() {
  const { map_id } = useParams();
  const [visibleNodes, setVisibleNodes] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isVerifyingBlock, setIsVerifyingBlock] = useState(false);
  const [verifyBlockResult, setVerifyBlockResult] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleNodes(v => (v < nodes.length ? v + 1 : v));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const handleVerifyBlock = () => {
    setIsVerifyingBlock(true);
    setVerifyBlockResult(null);
    setTimeout(() => {
      setIsVerifyingBlock(false);
      setVerifyBlockResult(true);
    }, 1200);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-obsidian-950/20 font-mono text-slate-300 relative overflow-hidden -m-6">
      {/* Laser network web lines overlay background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,136,255,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,54,0)_50%,rgba(0,217,255,0.01)_50%)] bg-[size:4px_4px] pointer-events-none" />

      {/* Main Flow Canvas */}
      <div className="flex-1 p-6 flex flex-col justify-between relative overflow-hidden">
        {/* Title bar */}
        <div className="flex justify-between items-center z-10">
          <div>
            <h1 className="text-lg font-bold text-cyber-cyan flex items-center gap-2">
              <Network className="w-5 h-5 text-cyber-cyan animate-pulse-glow" />
              GOLDEN THREAD TRACER: {map_id || 'MAP-2026-013'}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">End-to-end cryptographic lineage tracing from circular ingestion to validation compliance checksum.</p>
          </div>
          <button className="px-3 py-1.5 border border-cyber-cyan/30 hover:border-cyber-cyan/60 text-cyber-cyan bg-cyber-cyan/5 hover:bg-cyber-cyan/10 rounded text-xs font-bold transition-all shadow-glow-cyan/10">
            EXPORT LEDGER GRAPH
          </button>
        </div>

        {/* Nodes Timeline Canvas */}
        <div className="relative flex items-center justify-between px-10 py-20 w-full overflow-x-auto">
          {nodes.map((node, i) => (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div 
                className={`transform transition-all duration-700 flex flex-col items-center gap-3 cursor-pointer shrink-0
                  ${i < visibleNodes ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-90'}
                `}
                onClick={() => {
                  setSelectedNode(node);
                  setVerifyBlockResult(null);
                }}
                style={{ zIndex: 10 }}
              >
                <span className="text-[9px] font-bold text-slate-500 tracking-widest">{node.type}</span>
                
                <div 
                  className={`p-3 rounded-lg border w-32 text-center transition-all duration-300 relative ${node.color} ${
                    selectedNode?.id === node.id 
                      ? 'ring-2 ring-cyber-cyan scale-105 border-cyber-cyan shadow-glow-cyan' 
                      : 'hover:scale-102 hover:border-slate-400'
                  }`}
                >
                  {/* Digital glowing grid dot */}
                  <span className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-cyber-cyan opacity-40" />
                  
                  <div className="font-bold text-[10px] truncate">{node.label}</div>
                </div>

                <span className={`text-[8px] font-bold px-2 py-0.5 rounded border ${node.color}`}>
                  {node.badge}
                </span>
              </div>
              
              {/* Laser connecting beam */}
              {i < nodes.length - 1 && (
                <div className="relative flex-1 min-w-[32px] h-0.5 mx-2 bg-obsidian-900 border-t border-slate-800 shrink-0">
                  <div 
                    className={`absolute inset-0 bg-gradient-to-r from-cyber-cyan to-cyber-blue shadow-glow-cyan transition-all duration-1000 origin-left
                       ${i < visibleNodes - 1 ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Lower guidelines label */}
        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>SELECT THREAD NODE TO QUERY METADATA OVERLAYS AND MERKLE HASH VERIFICATIONS</span>
        </div>
      </div>

      {/* Slide-out Node Detail Console */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="w-[380px] bg-obsidian-950 border-l border-cyber-cyan/15 p-5 shadow-2xl flex flex-col justify-between z-20"
          >
            <div className="space-y-6">
              {/* Panel Header */}
              <div className="flex justify-between items-center border-b border-cyber-cyan/10 pb-3">
                <h2 className="text-sm font-bold text-cyber-cyan flex items-center gap-1.5 uppercase">
                  <Cpu className="w-4 h-4 text-cyber-cyan" />
                  NODE METADATA
                </h2>
                <button 
                  onClick={() => setSelectedNode(null)} 
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  ✖
                </button>
              </div>
              
              {/* Node Details Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">NODE TYPE IDENTIFIER</h3>
                  <div className="p-2.5 bg-obsidian-900 border border-cyber-cyan/10 rounded font-bold text-cyber-blue">
                    {selectedNode.type}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">LOGGED VALUE</h3>
                  <div className="p-2.5 bg-obsidian-900 border border-cyber-cyan/10 rounded font-bold text-slate-200">
                    {selectedNode.label}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">COMPLIANCE STATE</h3>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${selectedNode.color}`}>
                    {selectedNode.badge}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">LINKED CRYPTO BLOCK</h3>
                  <div className="space-y-2">
                    <div className="p-3 border border-cyber-cyan/5 rounded bg-obsidian-900/60 font-mono text-[10px] relative">
                      <div className="text-slate-500 text-[8px] flex justify-between mb-1">
                        <span>TIMESTAMP: 2026-05-17 10:00:00 UTC</span>
                        <span className="text-cyber-green">SIGNED</span>
                      </div>
                      <div className="font-bold text-cyber-cyan">sys_ledger_agent</div>
                      <div className="mt-1 text-slate-400">Created validation thread block for element ID: {selectedNode.id}</div>
                      <div className="mt-2 pt-1.5 border-t border-white/5 text-[9px] text-slate-500 truncate">
                        Block Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Block hash validation action */}
            <div className="border-t border-cyber-cyan/10 pt-4 mt-4 space-y-3">
              {verifyBlockResult && (
                <div className="bg-cyber-green/10 border border-cyber-green/30 text-cyber-green p-2 rounded text-[10px] flex items-center gap-1.5 animate-pulse-glow">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>BLOCK VERIFIED: MERKLE TREE HASH MATCH</span>
                </div>
              )}
              <button 
                onClick={handleVerifyBlock}
                disabled={isVerifyingBlock}
                className="w-full py-2 bg-obsidian-900 hover:bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-[11px] font-bold rounded flex items-center justify-center gap-2 transition-all"
              >
                {isVerifyingBlock ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    COMPUTING HASHES...
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    VERIFY BLOCK INTEGRITY
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { Loader2 } from 'lucide-react';