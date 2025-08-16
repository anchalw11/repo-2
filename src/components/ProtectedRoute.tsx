import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser, User } from '../contexts/UserContext';
import { useAdmin } from '../contexts/AdminContext';
import api from '../api';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, setUser } = useUser();
  const { admin } = useAdmin();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/api/auth/profile');
          const profile = response.data;
          
          // Use the plan from the fetched profile as the source of truth
          const plan = profile.plan_type || 'basic';

          setUser(currentUser => ({
            ...currentUser,
            id: profile.id,
            name: profile.username,
            email: profile.email,
            membershipTier: plan,
            isAuthenticated: true,
            setupComplete: true, // Always true if they have a valid token
            token: localStorage.getItem('token') || undefined,
          } as User));
        }
      } catch (error) {
        console.error('Failed to fetch user profile', error);
        // If profile fetch fails, check localStorage for user data
        const storedUser = localStorage.getItem('current_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isAdminRoute) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [isAdminRoute, setUser]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (isAdminRoute) {
    if (!admin || !admin.isAuthenticated) {
      return <Navigate to="/admin" state={{ from: location }} replace />;
    }
  } else {
    if (!user || !user.isAuthenticated) {
      return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // Remove automatic redirect to questionnaire since setup is done during signup
  }

  return children;
};

export default ProtectedRoute;
