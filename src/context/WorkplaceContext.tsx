
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { WorkplaceState, Workplace } from '../lib/types';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import { useToast } from "@/hooks/use-toast";

// Define action types
type WorkplaceAction =
  | { type: 'FETCH_WORKPLACES_REQUEST' }
  | { type: 'FETCH_WORKPLACES_SUCCESS'; payload: Workplace[] }
  | { type: 'FETCH_WORKPLACES_FAILURE'; payload: string }
  | { type: 'SELECT_WORKPLACE'; payload: Workplace }
  | { type: 'CLEAR_WORKPLACES' };

// Initial workplace state
const initialState: WorkplaceState = {
  workplaces: [],
  selectedWorkplace: null,
  isLoading: false,
  error: null,
};

// Create context
const WorkplaceContext = createContext<{
  state: WorkplaceState;
  selectWorkplace: (workplace: Workplace) => void;
  fetchWorkplaces: () => Promise<void>;
}>({
  state: initialState,
  selectWorkplace: () => {},
  fetchWorkplaces: async () => {},
});

// Workplace reducer
const workplaceReducer = (state: WorkplaceState, action: WorkplaceAction): WorkplaceState => {
  switch (action.type) {
    case 'FETCH_WORKPLACES_REQUEST':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_WORKPLACES_SUCCESS':
      return {
        ...state,
        isLoading: false,
        workplaces: action.payload,
        selectedWorkplace: state.selectedWorkplace || 
          (action.payload.length > 0 ? action.payload[0] : null),
        error: null,
      };
    case 'FETCH_WORKPLACES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'SELECT_WORKPLACE':
      return {
        ...state,
        selectedWorkplace: action.payload,
      };
    case 'CLEAR_WORKPLACES':
      return initialState;
    default:
      return state;
  }
};

// Workplace provider component
export const WorkplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workplaceReducer, initialState);
  const { state: authState } = useAuth();
  const { toast } = useToast();

  // Fetch workplaces when authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchWorkplaces();
    } else {
      // Clear workplaces when logged out
      dispatch({ type: 'CLEAR_WORKPLACES' });
    }
  }, [authState.isAuthenticated]);

  // Fetch workplaces function
  const fetchWorkplaces = async () => {
    dispatch({ type: 'FETCH_WORKPLACES_REQUEST' });
    
    const response = await apiService.get<Workplace[]>('/workplaces');
    
    if (response.error) {
      dispatch({ type: 'FETCH_WORKPLACES_FAILURE', payload: response.error });
      toast({
        title: "Error",
        description: "Failed to load workplaces.",
        variant: "destructive"
      });
    } else if (response.data) {
      dispatch({
        type: 'FETCH_WORKPLACES_SUCCESS',
        payload: response.data,
      });
    }
  };

  // Select workplace function
  const selectWorkplace = (workplace: Workplace) => {
    dispatch({ type: 'SELECT_WORKPLACE', payload: workplace });
    toast({
      title: "Workplace Selected",
      description: `Now working in: ${workplace.name}`,
    });
  };

  return (
    <WorkplaceContext.Provider value={{ state, fetchWorkplaces, selectWorkplace }}>
      {children}
    </WorkplaceContext.Provider>
  );
};

// Custom hook to use workplace context
export const useWorkplace = () => useContext(WorkplaceContext);
