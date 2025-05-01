
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { WorkplaceState, Workplace } from '../lib/types';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import { useToast } from "@/hooks/use-toast";

// Define the structure of the API response for fetching workplaces
interface FetchWorkplacesResponse {
  workplaces: Workplace[];
}

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

// Create context with fetchWorkplaces function included in the type
const WorkplaceContext = createContext<{
  state: WorkplaceState;
  selectWorkplace: (workplace: Workplace) => void;
  fetchWorkplaces: () => Promise<void>;
  createWorkplace: (data: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
}>({
  state: initialState,
  selectWorkplace: () => {},
  fetchWorkplaces: async () => {},
  createWorkplace: async () => ({ success: false }),
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
       // When fetching is successful, also try to retrieve and set the last selected workplace from local storage
       const lastSelectedId = localStorage.getItem('selectedWorkplaceId');
       const selected = action.payload.find(wp => wp.workplaceID === lastSelectedId) || 
                        (action.payload.length > 0 ? action.payload[0] : null);
      return {
        ...state,
        isLoading: false,
        workplaces: action.payload,
        // Use the found selected workplace or the first one as fallback
        selectedWorkplace: selected,
        error: null,
      };
    case 'FETCH_WORKPLACES_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case 'SELECT_WORKPLACE':
       // Store the selected workplace ID in local storage
       localStorage.setItem('selectedWorkplaceId', action.payload.workplaceID);
      return {
        ...state,
        selectedWorkplace: action.payload,
      };
    case 'CLEAR_WORKPLACES':
       localStorage.removeItem('selectedWorkplaceId'); // Clear stored preference on logout
      return initialState;
    default:
      return state;
  }
};

// --- Custom hook MUST be defined before the provider that uses the context ---
// Keep useWorkplace as a named export
export const useWorkplace = () => useContext(WorkplaceContext);

// --- Provider Component ---
// Change WorkplaceProvider to be a regular const, not exported here
const WorkplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workplaceReducer, initialState);
  // Use the hook defined above
  const { token, isLoading: isAuthLoading } = useAuth(); 
  const { toast } = useToast();

  // Fetch workplaces based on token presence and auth loading state
  useEffect(() => {
    // Only fetch if auth is done loading AND a token exists
    if (!isAuthLoading && token) { 
      fetchWorkplaces();
    } else if (!isAuthLoading && !token) { 
      // If auth is done loading and there's no token, clear workplaces
      dispatch({ type: 'CLEAR_WORKPLACES' });
    }
    // Dependency includes token and auth loading state
  }, [token, isAuthLoading]);

  // Fetch workplaces function
  const fetchWorkplaces = async () => {
    dispatch({ type: 'FETCH_WORKPLACES_REQUEST' });
    
    // Expect the API response structure { workplaces: Workplace[] }
    const response = await apiService.get<FetchWorkplacesResponse>('/workplaces');
    
    if (response.error) {
      dispatch({ type: 'FETCH_WORKPLACES_FAILURE', payload: response.error });
      toast({
        title: "Error Loading Workplaces",
        description: response.error,
        variant: "destructive"
      });
    } else if (response.data && response.data.workplaces) {
      // Pass the nested array to the success action
      dispatch({
        type: 'FETCH_WORKPLACES_SUCCESS',
        payload: response.data.workplaces, 
      });
    } else {
       // Handle case where data exists but workplaces array might be missing
        dispatch({ type: 'FETCH_WORKPLACES_FAILURE', payload: 'Received invalid data format for workplaces.' });
         toast({
            title: "Error",
            description: "Received invalid data format for workplaces.",
            variant: "destructive"
        });
    }
  };

  // Add createWorkplace function to context
  const createWorkplace = async (workplaceData: { name: string; description?: string }) => {
    try {
      const response = await apiService.post<Workplace>('/workplaces', workplaceData);
      
      if (response.error) {
        toast({
          title: "Error creating workplace",
          description: response.error,
          variant: "destructive",
        });
        return { success: false, error: response.error };
      } else {
        toast({
          title: "Success",
          description: "Workplace created successfully",
        });
        // Refresh the workplaces list
        await fetchWorkplaces();
        return { success: true };
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  };

  // Select workplace function
  const selectWorkplace = (workplace: Workplace) => {
    // Ensure we use the correct ID field for selection and storage
    dispatch({ type: 'SELECT_WORKPLACE', payload: workplace });
    toast({
      title: "Workplace Selected",
      description: `Now working in: ${workplace.name}`,
    });
  };

  return (
    <WorkplaceContext.Provider value={{ state, fetchWorkplaces, selectWorkplace, createWorkplace }}>
      {children}
    </WorkplaceContext.Provider>
  );
};

// Add default export for the component
export default WorkplaceProvider;
