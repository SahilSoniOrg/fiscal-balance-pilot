
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const Index: React.FC = () => {
  const { state } = useAuth();
  
  // If already authenticated, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" />;
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
        <div className="text-sm text-center text-gray-600">
          <p>Demo credentials:</p>
          <p>Email: demo@example.com</p>
          <p>Password: password</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
