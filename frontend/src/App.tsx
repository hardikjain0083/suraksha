import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { EnrollmentPage } from './pages/auth/EnrollmentPage';
import { RegistrationPage } from './pages/auth/RegistrationPage';
import { CircularUploadPage } from './pages/watcher/CircularUploadPage';
import { CircularBoardPage } from './pages/watcher/CircularBoardPage';
import { CircularDetailPage } from './pages/watcher/CircularDetailPage';
import { GapDashboard } from './pages/gaps/GapDashboard';
import { GapQueue } from './pages/gaps/GapQueue';
import { TriageDashboard } from './pages/admin/TriageDashboard';
import { MapsManagementPage } from './pages/maps/MapsManagementPage';
import { ValidationDashboard } from './pages/validation/ValidationDashboard';
import { AuditPortalPage } from './pages/audit/AuditPortalPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { GoldenThreadPage } from './pages/audit/GoldenThreadPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PolicyLifecycleManager } from './pages/admin/PolicyLifecycleManager';
import { GraphHealthMonitor } from './pages/admin/GraphHealthMonitor';
import { UxFrictionDashboard } from './pages/admin/UxFrictionDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { IngestionStatusBoard } from './pages/admin/IngestionStatusBoard';
import { JudgeGuidePage } from './pages/admin/JudgeGuidePage';
import { VerifyDashboardPage } from './pages/verify/VerifyDashboardPage';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { DepartmentPortalPage } from './pages/dept/DepartmentPortalPage';
import { DepartmentMapsPage } from './pages/dept/DepartmentMapsPage';
import { DepartmentMapDetailPage } from './pages/dept/DepartmentMapDetailPage';
import { TeamBoardPage } from './pages/dept/TeamBoardPage';
import { MyStatsPage } from './pages/dept/MyStatsPage';

import { AppLayout } from './components/layout/AppLayout';
import { AdminRoute, EmployeeRoute } from './components/auth/RouteGuards';

function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-foreground p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-canara-blue tracking-tight">SuRaksha MAPS v4.0</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Deterministic Compliance. Intelligent Augmentation.
        </p>
        <div className="pt-6 flex justify-center">
          <Link to="/auth/login" className="px-8 py-3 bg-canara-blue text-white font-bold rounded-md hover:bg-canara-blue/90 shadow-lg hover:scale-105 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        <header className="bg-canara-primary text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-canara-primary bg-white p-1 rounded shadow" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path></svg>
            <h1 className="text-xl font-bold font-mono tracking-tight">SuRaksha MAPS <span className="text-sm bg-blue-900 border border-blue-500 px-2 py-0.5 rounded ml-1 tracking-normal font-sans">v4.0 | Demo Ready</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/judge-guide" className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 text-xs font-bold rounded shadow hover:scale-105 transition-transform flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              JUDGE GUIDE
            </Link>
            <div className="text-sm opacity-80 border-l border-white/20 pl-4">Demo Active</div>
          </div>
        </header>

        <AppLayout>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/enroll" element={<EnrollmentPage />} />
            <Route path="/auth/register" element={<RegistrationPage />} />
            <Route path="/judge-guide" element={<JudgeGuidePage />} />
            <Route path="/verify" element={<VerifyDashboardPage />} />

            {/* ── Employee Portal ─────────────────────────────── */}
            <Route path="/employee/dashboard" element={
              <EmployeeRoute><EmployeeDashboard /></EmployeeRoute>
            } />

            {/* ── Department Portal ───────────────────────────── */}
            <Route path="/dept" element={<EmployeeRoute><DepartmentPortalPage /></EmployeeRoute>} />
            <Route path="/dept/maps" element={<EmployeeRoute><DepartmentMapsPage /></EmployeeRoute>} />
            <Route path="/dept/maps/:mapId" element={<EmployeeRoute><DepartmentMapDetailPage /></EmployeeRoute>} />
            <Route path="/dept/team" element={<EmployeeRoute><TeamBoardPage /></EmployeeRoute>} />
            <Route path="/dept/stats" element={<EmployeeRoute><MyStatsPage /></EmployeeRoute>} />

            {/* ── Admin Portal (all admin/compliance/auditor roles) ── */}
            <Route path="/admin/circulars/upload" element={<AdminRoute><CircularUploadPage /></AdminRoute>} />
            <Route path="/admin/circulars/*" element={<AdminRoute><CircularDetailPage /></AdminRoute>} />
            <Route path="/admin/circulars" element={<AdminRoute><CircularBoardPage /></AdminRoute>} />
            <Route path="/admin/gaps/queue" element={<AdminRoute><GapQueue /></AdminRoute>} />
            <Route path="/admin/gaps" element={<AdminRoute><GapDashboard /></AdminRoute>} />
            <Route path="/admin/triage" element={<AdminRoute><TriageDashboard /></AdminRoute>} />
            <Route path="/admin/maps" element={<AdminRoute><MapsManagementPage /></AdminRoute>} />
            <Route path="/admin/validation" element={<AdminRoute><ValidationDashboard /></AdminRoute>} />
            <Route path="/admin/policies" element={<AdminRoute><PolicyLifecycleManager /></AdminRoute>} />
            <Route path="/admin/graph-health" element={<AdminRoute><GraphHealthMonitor /></AdminRoute>} />
            <Route path="/admin/ux-friction" element={<AdminRoute><UxFrictionDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/admin/ingestion" element={<AdminRoute><IngestionStatusBoard /></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Audit (auditor + admin) */}
            <Route path="/audit" element={<AdminRoute><AuditPortalPage /></AdminRoute>} />
            <Route path="/audit/logs" element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
            <Route path="/audit/golden-thread/:map_id" element={<AdminRoute><GoldenThreadPage /></AdminRoute>} />
            <Route path="/audit/golden-thread" element={<AdminRoute><GoldenThreadPage /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>

        <footer className="bg-gray-900 text-gray-400 py-6 text-center text-sm font-mono border-t-4 border-[#00A86B] mt-auto">
          <p>Canara Bank SuRaksha Hackathon 2.0 &copy; 2026</p>
          <p className="mt-1 opacity-70 flex justify-center gap-4">
            <span>Demo Version v4.0</span>
            <span>•</span>
            <span>Zero-Trust Architecture</span>
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
