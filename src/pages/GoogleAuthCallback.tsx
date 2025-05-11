import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import apiService from '../services/apiService'; 

interface BackendTokenPayload {
  token: string;
}

interface BackendApiResponse {
  data: BackendTokenPayload;
}

const GoogleAuthCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth(); 
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get('code');
      const state = queryParams.get('state');
      const storedState = localStorage.getItem('oauth_state');
      localStorage.removeItem('oauth_state'); 

      if (!code) {
        setError('Authorization code not found.');
        toast({
          title: 'Login Failed',
          description: 'Authorization code not found in Google response.',
          variant: 'destructive',
        });
        navigate('/', { replace: true });
        return;
      }

      if (!state || state !== storedState) {
        setError('Invalid state parameter. Potential CSRF attack.');
        toast({
          title: 'Login Failed',
          description: 'Invalid state. Please try logging in again.',
          variant: 'destructive',
        });
        navigate('/', { replace: true });
        return;
      }

      try {
        const response = await apiService.post<BackendApiResponse>('/auth/google/exchange-code', { code });

        if (response.data && response.data.data && response.data.data.token) {
          loginWithToken(response.data.data.token);
          toast({
            title: 'Login Successful',
            description: 'Welcome back!',
          });
          navigate('/select-workplace', { replace: true });
        } else {
          throw new Error(response.error || 'Failed to exchange code for token, or token not found at expected path in response.');
        }
      } catch (err: any) {
        console.error('Error exchanging code:', err);
        setError(err.message || 'An error occurred during Google authentication with backend.');
        toast({
          title: 'Login Failed',
          description: err.message || 'Could not complete Google sign-in. Please try again.',
          variant: 'destructive',
        });
        navigate('/', { replace: true });
      }
    };

    processAuth();
  }, [location, navigate, loginWithToken, toast]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-finance-blue" />
      <p className="ml-2 mt-2">Processing Google authentication...</p>
      {error && <p className="mt-4 text-red-500">Error: {error}</p>}
    </div>
  );
};

export default GoogleAuthCallback;
