
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import WorkplaceProvider from "@/context/WorkplaceContext";
import CurrencyProvider from "@/context/CurrencyContext";
import { AccountProvider } from "@/context/AccountContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import AccountsPage from "./pages/AccountsPage";
import JournalsPage from "./pages/JournalsPage";
import WorkplaceSettingsPage from "./pages/WorkplaceSettingsPage";
import WorkplaceRedirect from "./components/workplace/WorkplaceRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WorkplaceProvider>
          <CurrencyProvider>
            <AccountProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Workplace redirect for auth users */}
                  <Route path="/select-workplace" element={<WorkplaceRedirect />} />
                  
                  {/* Workplace-prefixed routes */}
                  <Route path="/workplaces/:workplaceId" element={<AppLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="accounts" element={<AccountsPage />} />
                    <Route path="journals" element={<JournalsPage />} />
                    <Route path="settings" element={<WorkplaceSettingsPage />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AccountProvider>
          </CurrencyProvider>
        </WorkplaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
