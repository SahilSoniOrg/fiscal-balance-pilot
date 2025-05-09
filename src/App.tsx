import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from 'react';
import { AuthProvider } from "./context/AuthContext";
import WorkplaceProvider from "@/context/WorkplaceContext";
// import { AccountProvider } from "@/context/AccountContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const AccountsPage = React.lazy(() => import('./pages/AccountsPage'));
const JournalsPage = React.lazy(() => import('./pages/JournalsPage'));
const WorkplaceSettingsPage = React.lazy(() => import('./pages/WorkplaceSettingsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
import WorkplaceRedirect from "./components/workplace/WorkplaceRedirect";
import CreateWorkplacePage from "./pages/CreateWorkplacePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WorkplaceProvider>
          {/* <AccountProvider> */}
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/register" element={<Register />} />
                
                {/* Workplace redirect for auth users */}
                <Route path="/select-workplace" element={<WorkplaceRedirect />} />
                <Route path="/create-workplace" element={<CreateWorkplacePage />} />
                
                {/* Workplace-prefixed routes */}
                <Route path="/workplaces/:workplaceId" element={<AppLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Suspense fallback={<div>Loading...</div>}><DashboardPage /></Suspense>} />
                  <Route path="accounts" element={<Suspense fallback={<div>Loading...</div>}><AccountsPage /></Suspense>} />
                  <Route path="journals" element={<Suspense fallback={<div>Loading...</div>}><JournalsPage /></Suspense>} />
                  <Route path="reports" element={<Suspense fallback={<div>Loading...</div>}><ReportsPage /></Suspense>} />
                  <Route path="settings" element={<Suspense fallback={<div>Loading...</div>}><WorkplaceSettingsPage /></Suspense>} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          {/* </AccountProvider> */}
        </WorkplaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
