import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Gyms from "./pages/Gyms";
import Members from "./pages/Members";
import Trainers from "./pages/Trainers";
import Attendance from "./pages/Attendance";
import Equipment from "./pages/Equipment";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import Plans from "./pages/Plans";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gyms" element={<ProtectedRoute allowedRoles={["super_admin"]}><Gyms /></ProtectedRoute>} />
              <Route path="/members" element={<Members />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
