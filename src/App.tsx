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
import MemberPortal from "./pages/MemberPortal";
import MemberProfile from "./pages/MemberProfile";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import DietPlans from "./pages/DietPlans";
import Enquiries from "./pages/Enquiries";
import Feedback from "./pages/Feedback";
import AuditLog from "./pages/AuditLog";
import Inventory from "./pages/Inventory";
import Referrals from "./pages/Referrals";
import StaffAttendance from "./pages/StaffAttendance";
import Reports from "./pages/Reports";
import DataExport from "./pages/DataExport";
import GymSubscriptions from "./pages/GymSubscriptions";
import ResetPassword from "./pages/ResetPassword";
import LegalPages from "./pages/LegalPages";
import PublicGymPage from "./pages/PublicGymPage";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/legal" element={<LegalPages />} />
            <Route path="/gym/:code" element={<PublicGymPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/gyms" element={<ProtectedRoute allowedRoles={["super_admin"]}><Gyms /></ProtectedRoute>} />
              <Route path="/gym-subscriptions" element={<ProtectedRoute allowedRoles={["super_admin"]}><GymSubscriptions /></ProtectedRoute>} />
              <Route path="/members" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Members /></ProtectedRoute>} />
              <Route path="/member/:id" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><MemberProfile /></ProtectedRoute>} />
              <Route path="/trainers" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Trainers /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Attendance /></ProtectedRoute>} />
              <Route path="/staff-attendance" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><StaffAttendance /></ProtectedRoute>} />
              <Route path="/equipment" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Equipment /></ProtectedRoute>} />
              <Route path="/finance" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Finance /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Analytics /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Plans /></ProtectedRoute>} />
              <Route path="/diet-plans" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><DietPlans /></ProtectedRoute>} />
              <Route path="/enquiries" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Enquiries /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Feedback /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Inventory /></ProtectedRoute>} />
              <Route path="/referrals" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Referrals /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Reports /></ProtectedRoute>} />
              <Route path="/data-export" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><DataExport /></ProtectedRoute>} />
              <Route path="/audit-log" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><AuditLog /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute allowedRoles={["gym_admin", "super_admin"]}><Notifications /></ProtectedRoute>} />
              <Route path="/my-portal" element={<ProtectedRoute allowedRoles={["member"]}><MemberPortal /></ProtectedRoute>} />
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
