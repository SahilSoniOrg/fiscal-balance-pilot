import React, { useMemo } from 'react';
import { WorkplaceState, Workplace } from '../lib/types';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import { useToast } from "@/hooks/use-toast";
import { 
  createContextProvider, 
  BaseState
} from '@/lib/createContextProvider';

// Define the state interface
interface WorkplaceContextState extends BaseState {
  workplaces: Workplace[];
  selectedWorkplace: Workplace | null;
}

// Define action types
const FETCH_WORKPLACES_REQUEST = 'FETCH_WORKPLACES_REQUEST';
const FETCH_WORKPLACES_SUCCESS = 'FETCH_WORKPLACES_SUCCESS';
const FETCH_WORKPLACES_FAILURE = 'FETCH_WORKPLACES_FAILURE';
const SELECT_WORKPLACE = 'SELECT_WORKPLACE';
const CLEAR_WORKPLACES = 'CLEAR_WORKPLACES';

// Define action interfaces
type WorkplaceAction = 
  | { type: typeof FETCH_WORKPLACES_REQUEST }
  | { type: typeof FETCH_WORKPLACES_SUCCESS; payload: Workplace[] }
  | { type: typeof FETCH_WORKPLACES_FAILURE; payload: string }
  | { type: typeof SELECT_WORKPLACE; payload: Workplace }
  | { type: typeof CLEAR_WORKPLACES };

// Action creators
const actions = {
  request: (): WorkplaceAction => ({ type: FETCH_WORKPLACES_REQUEST }),
  success: (workplaces: Workplace[]): WorkplaceAction => ({ type: FETCH_WORKPLACES_SUCCESS, payload: workplaces }),
  failure: (error: string): WorkplaceAction => ({ type: FETCH_WORKPLACES_FAILURE, payload: error }),
  select: (workplace: Workplace): WorkplaceAction => ({ type: SELECT_WORKPLACE, payload: workplace }),
  clear: (): WorkplaceAction => ({ type: CLEAR_WORKPLACES })
};

// Define the context value interface
interface WorkplaceContextValue {
  state: WorkplaceContextState;
  selectWorkplace: (workplace: Workplace) => void;
  fetchWorkplaces: () => Promise<void>;
  createWorkplace: (data: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
}

// Initial state
const initialState: WorkplaceContextState = {
  workplaces: [],
  selectedWorkplace: null,
  isLoading: false,
  error: null
};

// Workplace reducer
const workplaceReducer = (state: WorkplaceContextState, action: WorkplaceAction): WorkplaceContextState => {
  switch (action.type) {
    case FETCH_WORKPLACES_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case FETCH_WORKPLACES_SUCCESS:
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
    case FETCH_WORKPLACES_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case SELECT_WORKPLACE:
      // Store the selected workplace ID in local storage
      localStorage.setItem('selectedWorkplaceId', action.payload.workplaceID);
      return {
        ...state,
        selectedWorkplace: action.payload,
      };
    case CLEAR_WORKPLACES:
      localStorage.removeItem('selectedWorkplaceId'); // Clear stored preference on logout
      return initialState;
    default:
      return state;
  }
};

// Create the workplace context provider
const { Provider, useContext } = createContextProvider<WorkplaceContextState, WorkplaceAction, WorkplaceContextValue>({
  name: 'Workplace',
  initialState,
  reducer: workplaceReducer,
  
  // Define functions that will be exposed through the context
  getContextValue: (state, dispatch) => {
    const { toast } = useToast();
    
    // Function to fetch workplaces
    const fetchWorkplaces = async () => {
      dispatch(actions.request());
      
      try {
        const response = await apiService.get<{ workplaces: Workplace[] }>('/workplaces');
        
        if (response.error) {
          dispatch(actions.failure(response.error));
          toast({
            title: "Error Loading Workplaces",
            description: response.error,
            variant: "destructive"
          });
        } else if (response.data && response.data.workplaces) {
          dispatch(actions.success(response.data.workplaces));
        } else {
          dispatch(actions.failure('Received invalid data format for workplaces.'));
          toast({
            title: "Error",
            description: "Received invalid data format for workplaces.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch workplaces:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading workplaces.'));
      }
    };
    
    // Function to create a new workplace
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
        }
        
        toast({
          title: "Success",
          description: "Workplace created successfully",
        });
        
        // Refresh the workplaces list
        await fetchWorkplaces();
        return { success: true };
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
    
    // Function to select a workplace
    const selectWorkplace = (workplace: Workplace) => {
      dispatch(actions.select(workplace));
      toast({
        title: "Workplace Selected",
        description: `Now working in: ${workplace.name}`,
      });
    };
    
    return {
      selectWorkplace,
      fetchWorkplaces,
      createWorkplace
    };
  },
  
  // Get auth data directly in the component, then pass to fetchOnMount
  dependencies: () => {
    const { token, isLoading: isAuthLoading } = useAuth();
    
    // Add more debugging to help understand dependency changes
    const deps = useMemo(() => ({ 
      token, 
      isAuthLoading 
    }), [token, isAuthLoading]);
    
    console.log("WorkplaceContext deps created:", { token: !!token, isAuthLoading });
    return deps;
  },
  
  // Fetch function to be called on mount and when dependencies change
  fetchOnMount: async (dispatch, dependencies) => {
    const { token, isAuthLoading } = dependencies;
    
    // Better check for loading state without localStorage
    console.log("WorkplaceContext fetchOnMount called with:", { token: !!token, isAuthLoading });
    
    if (!isAuthLoading && token) {
      dispatch(actions.request());
      
      try {
        const response = await apiService.get<{ workplaces: Workplace[] }>('/workplaces');
        
        if (response.error) {
          dispatch(actions.failure(response.error));
        } else if (response.data && response.data.workplaces) {
          dispatch(actions.success(response.data.workplaces));
        } else {
          dispatch(actions.failure('Received invalid data format for workplaces.'));
        }
      } catch (error: any) {
        console.error('Failed to fetch workplaces:', error);
        dispatch(actions.failure(error.message || 'An unexpected error occurred while loading workplaces.'));
      }
    } else if (!isAuthLoading && !token) {
      // If auth is done loading and there's no token, clear workplaces
      dispatch(actions.clear());
    }
  },
  
  // Enable caching
  cache: {
    enabled: true,
    key: 'workplaces',
    expiryMs: 15 * 60 * 1000 // 15 minutes
  }
});

// Export the custom hook
export const useWorkplace = useContext;

// Export the provider component
export default Provider;
