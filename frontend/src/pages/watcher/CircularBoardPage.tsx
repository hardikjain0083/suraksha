import { useEffect, useState } from 'react';
import { CircularKanban } from '../../components/watcher/CircularKanban';
import { Search, Filter, Plus, PieChart, Clock, FileText } from 'lucide-react';
import { apiClient } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

export const CircularBoardPage = () => {
  const navigate = useNavigate();
  const [circulars, setCirculars] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, fully_parsed: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCirculars = async () => {
    try {
      const res = await apiClient.get('/api/circulars');
      setCirculars(res.data.circulars);
      setStats(res.data.stats);
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCirculars();
  }, []);

  const filteredCirculars = circulars.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.circular_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ingestion Status Board</h1>
            <p className="text-slate-600">Track and manage the parsing pipeline for all regulatory circulars.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/circulars/upload')}
            className="px-4 py-2 bg-canara-primary text-white rounded-lg hover:bg-canara-primary/90 transition-colors font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" /> Upload Circular
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-canara-primary/10 rounded-lg text-canara-primary"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Circulars</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-canara-success/10 rounded-lg text-canara-success"><PieChart className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Parse Success Rate</p>
              <p className="text-2xl font-bold text-slate-900">
                {stats.total > 0 ? Math.round((stats.fully_parsed / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#FF6B35]/10 rounded-lg text-[#FF6B35]"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg Processing Time</p>
              <p className="text-2xl font-bold text-slate-900">1.2s</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search circulars by ID or title..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-canara-primary/50"
            />
          </div>
          <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 flex items-center gap-2 hover:bg-slate-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CircularKanban title="Fully Parsed" status="fully_parsed" circulars={filteredCirculars} colorHint="bg-canara-success" />
          <CircularKanban title="Partially Parsed" status="partially_parsed" circulars={filteredCirculars} colorHint="bg-[#FF6B35]" />
          <CircularKanban title="Failed" status="failed" circulars={filteredCirculars} colorHint="bg-canara-danger" />
          <CircularKanban title="Pending Review" status="pending" circulars={filteredCirculars} colorHint="bg-canara-primary" />
        </div>

      </div>
    </div>
  );
};
