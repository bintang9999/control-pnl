import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { DockerManager } from './pages/DockerManager';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';
import { TerminalPage } from './pages/TerminalPage';
import { TailscalePage } from './pages/TailscalePage';
import { FileManager } from './pages/FileManager';
import { ServiceManager } from './pages/ServiceManager';
import { BackupPage } from './pages/BackupPage';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { DockerComposePage } from './pages/DockerComposePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { NetworkPage } from './pages/NetworkPage';
import { ClusterPage } from './pages/ClusterPage';
import { ProxyPage } from './pages/ProxyPage';
import { useAuthStore } from './store/auth';
import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';
import { socket } from './lib/socket';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(state => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    const handleSystemAlert = (data: { title: string, message: string, type: 'warning' | 'error' | 'info' }) => {
      if (data.type === 'warning') toast.warning(data.title, { description: data.message });
      else if (data.type === 'error') toast.error(data.title, { description: data.message });
      else toast.info(data.title, { description: data.message });
    };

    socket.on('system_alert', handleSystemAlert);
    return () => {
      socket.off('system_alert', handleSystemAlert);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster theme="dark" position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="docker" element={<DockerManager />} />
          <Route path="terminal" element={<TerminalPage />} />
          <Route path="tailscale" element={<TailscalePage />} />
          <Route path="files" element={<FileManager />} />
          <Route path="services" element={<ServiceManager />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="security" element={<SecurityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="compose" element={<DockerComposePage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="cluster" element={<ClusterPage />} />
          <Route path="proxy" element={<ProxyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
