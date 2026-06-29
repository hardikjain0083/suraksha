import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Shield, Search, Database, Loader2 } from 'lucide-react';
import { LoginPage } from './pages/auth/LoginPage';
import { RegistrationPage } from './pages/auth/RegistrationPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { DepartmentDashboard } from './pages/dept/DepartmentDashboard';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { JudgeGuidePage } from './pages/admin/JudgeGuidePage';
import { AppLayout } from './components/layout/AppLayout';
import { AdminRoute, EmployeeRoute } from './components/auth/RouteGuards';

function Home() {
  const [accessState, setAccessState] = useState<'idle' | 'verifying' | 'granted'>('idle');
  const [statusText, setStatusText] = useState('Verifying credentials');
  const navigate = useNavigate();

  const handleAccess = (e: React.MouseEvent) => {
    e.preventDefault();
    if (accessState !== 'idle') return;
    
    setAccessState('verifying');
    setStatusText('Verifying credentials');
    
    // Simulate validation/verification process
    setTimeout(() => setStatusText('Checking compliance access'), 800);
    setTimeout(() => setStatusText('Secure channel established'), 1600);
    
    // Transition to success state
    setTimeout(() => {
      setAccessState('granted');
      setStatusText('Access Granted');
      // Final navigation delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 700);
    }, 2400);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050B14] flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden p-4 md:py-7 font-sans">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes scan {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Security Overlay */}
      {accessState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050B14]/85 backdrop-blur-md transition-opacity duration-300">
          <div className="flex flex-col items-center">
            {/* Scanner */}
            <div className={`relative flex items-center justify-center w-32 h-32 mb-6 transition-colors duration-500 ${accessState === 'granted' ? 'text-green-400' : 'text-cyan-400'}`}>
              {/* Outer rotating ring */}
              <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${accessState === 'granted' ? 'border-green-500/50' : 'border-cyan-500/50'}`} style={{ animationDuration: '3s' }} />
              {/* Inner rotating ring */}
              <div className={`absolute inset-2 rounded-full border border-b-transparent animate-spin ${accessState === 'granted' ? 'border-green-400/40' : 'border-cyan-400/40'}`} style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              
              {/* Inner pulsing ring */}
              <div className={`absolute inset-4 rounded-full bg-current opacity-10 animate-ping`} />
              
              {/* Center Icon */}
              {accessState === 'granted' ? (
                <svg className="w-12 h-12 animate-[scaleIn_0.4s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="relative overflow-hidden w-10 h-10 flex items-center justify-center">
                  <Shield className="w-10 h-10" />
                  {/* Scanning line */}
                  <div className="absolute inset-x-0 h-[2px] bg-white shadow-[0_0_8px_#fff] animate-[scan_1.5s_ease-in-out_infinite]" />
                </div>
              )}

              {/* Success Glow */}
              {accessState === 'granted' && (
                <div className="absolute inset-0 rounded-full shadow-[0_0_40px_rgba(74,222,128,0.4)] animate-pulse" />
              )}
            </div>

            {/* Status Text */}
            <h3 className={`text-xl md:text-2xl font-bold tracking-wider mb-2 transition-colors duration-300 ${accessState === 'granted' ? 'text-green-400' : 'text-cyan-300'}`}>
              {statusText}
            </h3>
            {accessState === 'granted' && (
              <p className="text-sm md:text-base text-green-200/70 font-semibold tracking-widest uppercase animate-pulse">
                Opening Command Center...
              </p>
            )}
          </div>
        </div>
      )}

      {/* CSS Background Grid & Glow */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/15 via-[#050B14]/0 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center max-w-[1050px] w-full pt-4 pb-2">
        
        {/* Brand Area */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold tracking-wider">
              <span className="text-white">Su</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Raksha</span>
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-800/40 backdrop-blur-sm shadow-inner shadow-cyan-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-100">Zero-Trust Security Active</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center w-full max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-500/80 uppercase mb-3">Offline Security Operations</p>
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">SuRaksha</span>
            <br className="hidden md:block" />
            <span className="text-white ml-2 md:ml-0">Banking Compliance</span>
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto font-medium leading-relaxed mt-2.5">
            Offline Compliance & Gap Verification Command Center
          </p>
        </div>

        {/* CTA Button */}
        <div className="mt-6 mb-10">
          <button 
            onClick={handleAccess}
            disabled={accessState !== 'idle'}
            className={`group relative flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-400/20 transition-all duration-300 overflow-hidden ${
              accessState !== 'idle' 
                ? 'scale-95 w-72 md:w-80 opacity-90 cursor-wait shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                : 'hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 active:scale-95 w-64 md:w-72'
            }`}
          >
            {/* Moving Light Shine Effect */}
            {accessState === 'verifying' && (
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            )}

            {accessState !== 'idle' ? (
              <>
                <div className="relative">
                  <Shield className="w-4 h-4 text-cyan-200" />
                  <div className="absolute inset-0 border-2 border-t-transparent border-cyan-100 rounded-full animate-spin" />
                </div>
                <span className="tracking-wide text-sm whitespace-nowrap">Verifying Secure Access...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span className="tracking-wide whitespace-nowrap text-sm">Access Command Center</span>
              </>
            )}
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-[1050px]">
          <div className="flex flex-col items-center justify-center text-center p-6 min-h-[160px] rounded-2xl bg-[#0B1F3A]/40 border border-cyan-500/10 backdrop-blur-sm hover:bg-[#0B1F3A]/60 hover:border-cyan-400/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(6,182,212,0.08)] group">
            <div className="p-2.5 rounded-xl bg-blue-500/10 mb-3.5 group-hover:bg-blue-500/20 transition-colors">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">Secure Verification</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">Protected offline compliance validation.</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-6 min-h-[160px] rounded-2xl bg-[#0B1F3A]/40 border border-cyan-500/10 backdrop-blur-sm hover:bg-[#0B1F3A]/60 hover:border-cyan-400/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(6,182,212,0.08)] group">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 mb-3.5 group-hover:bg-cyan-500/20 transition-colors">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">Gap Detection</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">Identify compliance gaps with confidence.</p>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-6 min-h-[160px] rounded-2xl bg-[#0B1F3A]/40 border border-cyan-500/10 backdrop-blur-sm hover:bg-[#0B1F3A]/60 hover:border-cyan-400/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(6,182,212,0.08)] group">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 mb-3.5 group-hover:bg-indigo-500/20 transition-colors">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-white font-bold text-base mb-1.5">Zero-Trust Ready</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed">Built for controlled banking environments.</p>
          </div>
        </div>

        {/* Bottom Trust Line */}
        <div className="flex items-center justify-center gap-2.5 text-[10px] font-bold text-slate-500/60 uppercase tracking-[0.15em] mt-7">
          <span>Secure</span>
          <span className="w-1 h-1 rounded-full bg-slate-600/50"></span>
          <span>Offline Ready</span>
          <span className="w-1 h-1 rounded-full bg-slate-600/50"></span>
          <span>Built for Banking Compliance</span>
        </div>

      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegistrationPage />} />
          <Route path="/judge-guide" element={<JudgeGuidePage />} />

          {/* Employee Dashboard */}
          <Route path="/employee/dashboard" element={
            <EmployeeRoute><EmployeeDashboard /></EmployeeRoute>
          } />

          {/* Department Head Dashboard */}
          <Route path="/dept" element={
            <EmployeeRoute><DepartmentDashboard /></EmployeeRoute>
          } />
          
          <Route path="/dept/dashboard" element={
            <EmployeeRoute><DepartmentDashboard /></EmployeeRoute>
          } />

          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute><UserManagement /></AdminRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
