import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { circularsApi } from '../../lib/api';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertTriangle, XCircle, BrainCircuit } from 'lucide-react';
import { ClauseViewer } from '../../components/watcher/ClauseViewer';
import { ObligationHighlighter } from '../../components/watcher/ObligationHighlighter';

function parseCircularIdFromPath(pathname: string): string {
  const prefix = '/admin/circulars/';
  if (!pathname.startsWith(prefix)) return '';
  const rest = pathname.slice(prefix.length);
  if (!rest || rest === 'upload') return '';
  return decodeURIComponent(rest);
}

export const CircularDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const circularId = useMemo(
    () => parseCircularIdFromPath(location.pathname),
    [location.pathname]
  );
  const [circular, setCircular] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCircular = async () => {
    setLoading(true);
    try {
      const res = await circularsApi.get(circularId);
      setCircular(res.data);
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setCircular(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!circularId) {
      navigate('/admin/circulars', { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCircular();
  }, [circularId]);

  const handleDownload = () => {
    window.open(circularsApi.downloadUrl(circularId), '_blank');
  };

  if (!circularId) return null;
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  if (!circular) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Circular not found: {circularId}</p>
        <button
          type="button"
          onClick={() => navigate('/admin/circulars')}
          className="text-canara-primary underline"
        >
          Back to board
        </button>
      </div>
    );
  }

  const dateStr = new Date(circular.date_issued).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getStatusBadge = (status: string) => {
    if (status === 'fully_parsed')
      return (
        <span className="flex items-center gap-1 bg-canara-success/10 text-canara-success px-3 py-1 rounded-full text-xs font-bold border border-canara-success/20">
          <CheckCircle className="w-4 h-4" /> Fully Parsed
        </span>
      );
    if (status === 'partially_parsed')
      return (
        <span className="flex items-center gap-1 bg-[#FF6B35]/10 text-[#FF6B35] px-3 py-1 rounded-full text-xs font-bold border border-[#FF6B35]/20">
          <AlertTriangle className="w-4 h-4" /> Partially Parsed
        </span>
      );
    return (
      <span className="flex items-center gap-1 bg-canara-danger/10 text-canara-danger px-3 py-1 rounded-full text-xs font-bold border border-canara-danger/20">
        <XCircle className="w-4 h-4" /> Failed
      </span>
    );
  };

  const rawText = circular.clauses?.map((c: any) => c.text).join('\n\n') ?? '';

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/admin/circulars')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-canara-primary mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Board
          </button>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                  {circular.issuer}
                </span>
                <span className="text-slate-500 font-mono text-sm">{circular.circular_id}</span>
                {getStatusBadge(circular.ingestion_status)}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{circular.title}</h1>
              <p className="text-slate-500 text-sm">Issued on {dateStr}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" /> Download Original
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> Re-parse
              </button>
            </div>
          </div>
        </div>

        <div className="bg-canara-primary/5 border border-canara-primary/20 rounded-xl p-5 mb-8 flex gap-4">
          <BrainCircuit className="w-8 h-8 text-canara-primary shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">AI Ingestion Summary</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The Watcher module extracted {circular.clauses_extracted} clauses from this{' '}
              {circular.pages_processed}-page document in {circular.processing_time_ms}ms using{' '}
              {circular.parser_version}. All clauses have been embedded and are ready for policy gap
              detection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[800px]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Raw Document Text</h3>
              <p className="text-xs text-slate-500">Syntax highlighting active</p>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-800 leading-relaxed whitespace-pre-wrap">
              {rawText ? <ObligationHighlighter text={rawText} /> : 'No raw text available.'}
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-white">
              <h3 className="font-semibold text-slate-800 flex items-center justify-between">
                Extracted Obligations
                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs font-bold">
                  {circular.clauses?.length ?? 0} items
                </span>
              </h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {circular.clauses?.map((clause: any, idx: number) => (
                <ClauseViewer key={idx} clause={clause} />
              ))}
              {(!circular.clauses || circular.clauses.length === 0) && (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                  No clauses parsed.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
