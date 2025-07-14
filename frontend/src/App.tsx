import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AdminAuthProvider, useAdminAuth } from "./lib/admin-auth";
import { AuthForm } from "./components/AuthForm";
import { AdminAuthForm } from "./components/admin/AdminAuthForm";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AppShell } from "./components/layout/app-shell";
import { Dashboard } from "./pages/Dashboard";
import { LinkDevice } from "./pages/LinkDevice";
import { DeviceDetail } from "./pages/DeviceDetail";
import { Messages } from "./pages/Messages";
import { MessageHistory } from "./pages/MessageHistory";
import { Groups } from "./pages/Groups";
import { Schedule } from "./pages/Schedule";
import { Reports } from "./pages/Reports";
import { Payment } from "./pages/Payment";
import { Settings } from "./pages/Settings";
import IndiaMART from "./pages/IndiaMART";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminClients } from "./pages/admin/AdminClients";
import { AdminPackages } from "./pages/admin/AdminPackages";
import { AdminSettings } from "./pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-whatsapp-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthForm />;
  }
  
  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAdminAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ceo-green"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AdminAuthForm />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="link-device" element={<LinkDevice />} />
                <Route path="link-device/:id" element={<DeviceDetail />} />
                <Route path="messages" element={<Messages />} />
                <Route path="message-history" element={<MessageHistory />} />
                <Route path="groups" element={<Groups />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="reports" element={<Reports />} />
                <Route path="indiamart" element={<IndiaMART />} />
                <Route path="payment" element={<Payment />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminProtectedRoute>
                  <AdminLayout />
                </AdminProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="clients" element={<AdminClients />} />
                <Route path="packages" element={<AdminPackages />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
