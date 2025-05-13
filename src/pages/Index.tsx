import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { token, isLoading } = useAuth();

  const handleGoogleLogin = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.runtimeEnv.VITE_GOOGLE_CLIENT_ID;
    // Construct the redirectUri dynamically using the current window origin
    const redirectUri = `${window.location.origin}/auth/google/callback`;

    if (!googleClientId) {
      console.error("Google Client ID is not configured.");
      // Optionally, show a toast to the user
      return;
    }

    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('oauth_state', state);

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(googleClientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` + // Optional: for refresh token from backend if backend supports it
      `prompt=consent`; // Optional: forces consent screen, good for testing

    window.location.href = oauthUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-finance-blue" />
      </div>
    );
  }
  
  if (token) {
    return <Navigate to="/select-workplace" replace={true} />;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-finance-blue">Fiscal Balance</h1>
          <p className="mt-2 text-sm text-gray-600">
            Personal finance management based on double-entry bookkeeping
          </p>
        </div>
        <LoginForm />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-50 px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <div>
          <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Sign in with Google
          </Button>
        </div>

        <div className="text-sm text-center text-gray-600 mt-4 p-4 bg-gray-100 rounded-lg">
          <p className="font-medium mb-1">Demo credentials:</p>
          <p>Email: demo@example.com</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
