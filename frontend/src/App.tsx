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
    <div className="min-h-screen w-full bg-obsidian-900 flex flex-col items-center justify-center text-foreground p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-green tracking-tight animate-neon-pulse">
          SuRaksha MAPS v4.0
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          AI-Powered Compliance Intelligence Platform
        </p>
        <div className="pt-6 flex justify-center">
          <Link to="/auth/login" className="px-8 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-obsidian-900 font-bold rounded-lg hover:shadow-glow-cyan-intense shadow-glow-cyan hover:scale-105 transition-all active:scale-95">
            Access Command Center
          </Link>
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
    </BrowserRouter>
  );
}

export default App;
