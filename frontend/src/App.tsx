import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { RegistrationPage } from './pages/auth/RegistrationPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DepartmentDashboard } from './pages/dept/DepartmentDashboard';
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { AppLayout } from './components/layout/AppLayout';
import { AdminRoute, EmployeeRoute } from './components/auth/RouteGuards';

function Home() {
  return (
    <div className="min-h-screen w-full bg-obsidian-900 flex flex-col items-center justify-center text-foreground p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-green tracking-tight animate-neon-pulse">
          SuRaksha Banking Compliance
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
          Offline Compliance & Gap Verification Command Center
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
          <Route path="/auth/register" element={<RegistrationPage />} />

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

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
