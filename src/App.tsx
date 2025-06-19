import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./styles/sidebar.css";
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
const GoogleAuthCallback = React.lazy(() => import('./pages/GoogleAuthCallback'));
const UserSettingsPage = React.lazy(() => import('./pages/UserSettingsPage'));

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
                <Route path="/auth/google/callback" element={<Suspense fallback={<div>Loading...</div>}><GoogleAuthCallback /></Suspense>} />
                
                {/* Workplace redirect for auth users */}
                <Route path="/select-workplace" element={<WorkplaceRedirect />} />
                
                {/* User settings */}
                <Route path="/settings" element={
                  <Suspense fallback={<div>Loading...</div>}>
                    <UserSettingsPage />
                  </Suspense>
                } />
                
                {/* Workplace-prefixed routes */}
                <Route path="/workplaces/:workplaceId" element={<AppLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<Suspense fallback={<div>Loading...</div>}><DashboardPage /></Suspense>} />
                  <Route path="accounts" element={<Suspense fallback={<div>Loading...</div>}><AccountsPage /></Suspense>} />
                  <Route path="journals" element={<Suspense fallback={<div>Loading...</div>}><JournalsPage /></Suspense>}>
                    <Route path=":journalId" element={<Suspense fallback={<div>Loading...</div>}><JournalsPage /></Suspense>} />
                  </Route>
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
