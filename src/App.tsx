import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Billing from "./pages/Billing";
import Customers from "./pages/Customers";
import LowStock from "./pages/LowStock";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import ContactPage from "./pages/ContactPage";
import Attendance from "./pages/Attendance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!user) {
    return <Routes>
      <Route path="*" element={<LoginPage />} />
    </Routes>;
  }

  return (
    <AppLayout>
      <Routes>
        {isAdmin ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/attendance" replace />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/products" element={<Products />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/contact" element={<ContactPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to={isAdmin ? "/" : "/attendance"} replace />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <StoreProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
