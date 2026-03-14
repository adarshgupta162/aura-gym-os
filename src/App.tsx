import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Gyms from "./pages/Gyms";
import Members from "./pages/Members";
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
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/gyms" element={<Gyms />} />
            <Route path="/members" element={<Members />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
