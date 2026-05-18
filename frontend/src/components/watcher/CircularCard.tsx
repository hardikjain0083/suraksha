import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CircularData {
  circular_id: string;
  title: string;
  issuer: string;
  date_issued: string;
  ingestion_status: string;
  clauses_extracted: number;
}

interface Props {
  circular: CircularData;
}

export const CircularCard: React.FC<Props> = ({ circular }) => {
  const navigate = useNavigate();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'fully_parsed':
        return { icon: CheckCircle, color: 'text-canara-success', bg: 'bg-canara-success/10', border: 'border-canara-success/20' };
      case 'partially_parsed':
        return { icon: AlertTriangle, color: 'text-[#FF6B35]', bg: 'bg-[#FF6B35]/10', border: 'border-[#FF6B35]/20' };
      case 'failed':
        return { icon: XCircle, color: 'text-canara-danger', bg: 'bg-canara-danger/10', border: 'border-canara-danger/20' };
      default:
        return { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200' };
    }
  };

  const config = getStatusConfig(circular.ingestion_status);
  const Icon = config.icon;

  const dateStr = new Date(circular.date_issued).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-xl border ${config.border} p-4 shadow-sm cursor-pointer transition-all`}
      onClick={() => navigate(`/admin/circulars/${circular.circular_id}`)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded">
            {circular.issuer}
          </span>
          <span className={`px-2 py-0.5 ${config.bg} ${config.color} text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1`}>
            <Icon className="w-3 h-3" />
            {circular.ingestion_status.replace('_', ' ')}
          </span>
        </div>
      </div>
      
      <h3 className="font-semibold text-slate-900 mb-1 text-sm line-clamp-2" title={circular.title}>
        {circular.title}
      </h3>
      <p className="text-xs text-slate-500 font-mono mb-4">{circular.circular_id}</p>
      
      <div className="flex justify-between items-end">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Clauses</span>
            <span className="text-sm font-semibold flex items-center gap-1 text-slate-700">
              <FileText className="w-3 h-3 text-slate-400" /> {circular.clauses_extracted}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Date</span>
            <span className="text-sm font-semibold text-slate-700">{dateStr}</span>
          </div>
        </div>
        
        <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-canara-primary hover:bg-canara-primary/5 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};
