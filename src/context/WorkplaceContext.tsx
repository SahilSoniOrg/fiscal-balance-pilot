import React, { useMemo, useCallback } from 'react';
import { WorkplaceState, Workplace, WorkplaceMember, UserWorkplaceRole } from '../lib/types';
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
  members: WorkplaceMember[];
  membersLoading: boolean;
  membersError: string | null;
}

// Define action types
const FETCH_WORKPLACES_REQUEST = 'FETCH_WORKPLACES_REQUEST';
const FETCH_WORKPLACES_SUCCESS = 'FETCH_WORKPLACES_SUCCESS';
const FETCH_WORKPLACES_FAILURE = 'FETCH_WORKPLACES_FAILURE';
const SELECT_WORKPLACE = 'SELECT_WORKPLACE';
const CLEAR_WORKPLACES = 'CLEAR_WORKPLACES';
const FETCH_MEMBERS_REQUEST = 'FETCH_MEMBERS_REQUEST';
const FETCH_MEMBERS_SUCCESS = 'FETCH_MEMBERS_SUCCESS';
const FETCH_MEMBERS_FAILURE = 'FETCH_MEMBERS_FAILURE';
const ADD_MEMBER_SUCCESS = 'ADD_MEMBER_SUCCESS';
const REMOVE_MEMBER_SUCCESS = 'REMOVE_MEMBER_SUCCESS';
const UPDATE_MEMBER_ROLE_SUCCESS = 'UPDATE_MEMBER_ROLE_SUCCESS';
const ACTIVATE_WORKPLACE_SUCCESS = 'ACTIVATE_WORKPLACE_SUCCESS';
const DEACTIVATE_WORKPLACE_SUCCESS = 'DEACTIVATE_WORKPLACE_SUCCESS';

// Define action interfaces
type WorkplaceAction = 
  | { type: typeof FETCH_WORKPLACES_REQUEST }
  | { type: typeof FETCH_WORKPLACES_SUCCESS; payload: Workplace[] }
  | { type: typeof FETCH_WORKPLACES_FAILURE; payload: string }
  | { type: typeof SELECT_WORKPLACE; payload: Workplace }
  | { type: typeof CLEAR_WORKPLACES }
  | { type: typeof FETCH_MEMBERS_REQUEST }
  | { type: typeof FETCH_MEMBERS_SUCCESS; payload: WorkplaceMember[] }
  | { type: typeof FETCH_MEMBERS_FAILURE; payload: string }
  | { type: typeof ADD_MEMBER_SUCCESS; payload: WorkplaceMember }
  | { type: typeof REMOVE_MEMBER_SUCCESS; payload: string }
  | { type: typeof UPDATE_MEMBER_ROLE_SUCCESS; payload: { userId: string, role: string } }
  | { type: typeof ACTIVATE_WORKPLACE_SUCCESS; payload: string }
  | { type: typeof DEACTIVATE_WORKPLACE_SUCCESS; payload: string };

// Action creators
const actions = {
  request: (): WorkplaceAction => ({ type: FETCH_WORKPLACES_REQUEST }),
  success: (workplaces: Workplace[]): WorkplaceAction => ({ type: FETCH_WORKPLACES_SUCCESS, payload: workplaces }),
  failure: (error: string): WorkplaceAction => ({ type: FETCH_WORKPLACES_FAILURE, payload: error }),
  select: (workplace: Workplace): WorkplaceAction => ({ type: SELECT_WORKPLACE, payload: workplace }),
  clear: (): WorkplaceAction => ({ type: CLEAR_WORKPLACES }),
  membersRequest: (): WorkplaceAction => ({ type: FETCH_MEMBERS_REQUEST }),
  membersSuccess: (members: WorkplaceMember[]): WorkplaceAction => ({ type: FETCH_MEMBERS_SUCCESS, payload: members }),
  membersFailure: (error: string): WorkplaceAction => ({ type: FETCH_MEMBERS_FAILURE, payload: error }),
  addMemberSuccess: (member: WorkplaceMember): WorkplaceAction => ({ type: ADD_MEMBER_SUCCESS, payload: member }),
  removeMemberSuccess: (userId: string): WorkplaceAction => ({ type: REMOVE_MEMBER_SUCCESS, payload: userId }),
  updateMemberRoleSuccess: (userId: string, role: string): WorkplaceAction => ({ 
    type: UPDATE_MEMBER_ROLE_SUCCESS, 
    payload: { userId, role } 
  }),
  activateWorkplaceSuccess: (workplaceId: string): WorkplaceAction => ({ type: ACTIVATE_WORKPLACE_SUCCESS, payload: workplaceId }),
  deactivateWorkplaceSuccess: (workplaceId: string): WorkplaceAction => ({ type: DEACTIVATE_WORKPLACE_SUCCESS, payload: workplaceId }),
};

// Define the context value interface
interface WorkplaceContextValue {
  state: WorkplaceContextState;
  selectWorkplace: (workplace: Workplace) => void;
  fetchWorkplaces: () => Promise<void>;
  createWorkplace: (data: { name: string; description?: string }) => Promise<{ success: boolean; error?: string }>;
  fetchMembers: () => Promise<void>;
  addMember: (userId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  removeMember: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateMemberRole: (userId: string, role: string) => Promise<{ success: boolean; error?: string }>;
  activateWorkplace: (workplaceId: string) => Promise<{ success: boolean; error?: string }>;
  deactivateWorkplace: (workplaceId: string) => Promise<{ success: boolean; error?: string }>;
}

// Initial state
const initialState: WorkplaceContextState = {
  workplaces: [],
  selectedWorkplace: null,
  isLoading: false,
  error: null,
  members: [],
  membersLoading: false,
  membersError: null
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
    case FETCH_MEMBERS_REQUEST:
      return {
        ...state,
        membersLoading: true,
        membersError: null,
      };
    case FETCH_MEMBERS_SUCCESS:
      return {
        ...state,
        membersLoading: false,
        members: action.payload,
        membersError: null,
      };
    case FETCH_MEMBERS_FAILURE:
      return {
        ...state,
        membersLoading: false,
        membersError: action.payload,
      };
    case ADD_MEMBER_SUCCESS:
      return {
        ...state,
        members: [...state.members, action.payload],
      };
    case REMOVE_MEMBER_SUCCESS:
      return {
        ...state,
        members: state.members.filter(member => member.userID !== action.payload),
      };
    case UPDATE_MEMBER_ROLE_SUCCESS:
      return {
        ...state,
        members: state.members.map(member => 
          member.userID === action.payload.userId
            ? { ...member, role: action.payload.role as UserWorkplaceRole }
            : member
        ),
      };
    case ACTIVATE_WORKPLACE_SUCCESS:
      return {
        ...state,
        workplaces: state.workplaces.map(workplace => 
          workplace.workplaceID === action.payload 
            ? { ...workplace, isActive: true } 
            : workplace
        ),
        selectedWorkplace: state.selectedWorkplace?.workplaceID === action.payload
          ? { ...state.selectedWorkplace, isActive: true }
          : state.selectedWorkplace
      };
    case DEACTIVATE_WORKPLACE_SUCCESS:
      return {
        ...state,
        workplaces: state.workplaces.map(workplace => 
          workplace.workplaceID === action.payload 
            ? { ...workplace, isActive: false } 
            : workplace
        ),
        selectedWorkplace: state.selectedWorkplace?.workplaceID === action.payload
          ? { ...state.selectedWorkplace, isActive: false }
          : state.selectedWorkplace
      };
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

    // Function to fetch workplace members - memoized to prevent infinite loops
    const fetchMembers = useCallback(async () => {
      if (!state.selectedWorkplace) {
        return;
      }
      
      dispatch(actions.membersRequest());
      
      try {
        const response = await apiService.getWorkplaceMembers(state.selectedWorkplace.workplaceID);
        
        if (response.error) {
          dispatch(actions.membersFailure(response.error));
          toast({
            title: "Error Loading Members",
            description: response.error,
            variant: "destructive"
          });
        } else if (response.data) {
          // Handle different possible response formats
          let members: WorkplaceMember[] = [];
          
          if (Array.isArray(response.data)) {
            members = response.data;
          } else {
            const data = response.data as any; // Use any for type checking
            if (data.users && Array.isArray(data.users)) {
              members = data.users;
            } else if (data.members && Array.isArray(data.members)) {
              members = data.members;
            }
          }
          
          dispatch(actions.membersSuccess(members));
        } else {
          dispatch(actions.membersFailure('Received invalid data format for members.'));
          toast({
            title: "Error",
            description: "Received invalid data format for members.",
            variant: "destructive"
          });
        }
      } catch (error: any) {
        console.error('Failed to fetch members:', error);
        dispatch(actions.membersFailure(error.message || 'An unexpected error occurred while loading members.'));
      }
    }, [state.selectedWorkplace, toast]);
    
    // Function to add a new member
    const addMember = async (userId: string, role: string) => {
      if (!state.selectedWorkplace) {
        toast({
          title: "Error",
          description: "No workplace selected",
          variant: "destructive"
        });
        return { success: false, error: "No workplace selected" };
      }
      
      try {
        const response = await apiService.addWorkplaceMember(state.selectedWorkplace.workplaceID, userId, role);
        
        if (response.error) {
          toast({
            title: "Error adding member",
            description: response.error,
            variant: "destructive"
          });
          return { success: false, error: response.error };
        }
        
        // For 204 No Content response, just consider it successful
        // and refresh the members list
        toast({
          title: "Success",
          description: "Member added successfully"
        });
        
        // Refresh the members list to get the updated data
        fetchMembers();
        
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    };
    
    // Function to update a member's role
    const updateMemberRole = async (userId: string, role: string) => {
      if (!state.selectedWorkplace) {
        toast({
          title: "Error",
          description: "No workplace selected",
          variant: "destructive"
        });
        return { success: false, error: "No workplace selected" };
      }
      
      try {
        const response = await apiService.updateWorkplaceMemberRole(state.selectedWorkplace.workplaceID, userId, role);
        
        if (response.error) {
          // Special handling for "Cannot demote the last admin" error (422)
          if (response.error.includes("last admin") || response.error.includes("Cannot demote")) {
            toast({
              title: "Cannot Update Role",
              description: "Cannot demote the last admin of the workspace. Promote another user to admin first.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error updating role",
              description: response.error,
              variant: "destructive"
            });
          }
          return { success: false, error: response.error };
        }
        
        dispatch(actions.updateMemberRoleSuccess(userId, role));
        toast({
          title: "Success",
          description: "Member role updated successfully"
        });
        
        // If role is REMOVED, refresh the members list to remove the user
        if (role === UserWorkplaceRole.REMOVED) {
          dispatch(actions.removeMemberSuccess(userId));
        }
        
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    };
    
    // Function to remove a member
    const removeMember = async (userId: string) => {
      if (!state.selectedWorkplace) {
        toast({
          title: "Error",
          description: "No workplace selected",
          variant: "destructive"
        });
        return { success: false, error: "No workplace selected" };
      }
      
      try {
        const response = await apiService.removeWorkplaceMember(state.selectedWorkplace.workplaceID, userId);
        
        if (response.error) {
          // Special handling for "Cannot remove the last admin" error (422)
          if (response.error.includes("last admin") || response.error.includes("Cannot remove")) {
            toast({
              title: "Cannot Remove User",
              description: "Cannot remove the last admin of the workspace. Promote another user to admin first.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Error removing member",
              description: response.error,
              variant: "destructive"
            });
          }
          return { success: false, error: response.error };
        }
        
        dispatch(actions.removeMemberSuccess(userId));
        toast({
          title: "Success",
          description: "Member removed successfully"
        });
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    };
    
    // Function to activate a workplace
    const activateWorkplace = async (workplaceId: string) => {
      try {
        const response = await apiService.activateWorkplace(workplaceId);
        
        if (response.error) {
          toast({
            title: "Error activating workplace",
            description: response.error,
            variant: "destructive"
          });
          return { success: false, error: response.error };
        }
        
        dispatch(actions.activateWorkplaceSuccess(workplaceId));
        toast({
          title: "Success",
          description: "Workplace activated successfully"
        });
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    };
    
    // Function to deactivate a workplace
    const deactivateWorkplace = async (workplaceId: string) => {
      try {
        const response = await apiService.deactivateWorkplace(workplaceId);
        
        if (response.error) {
          toast({
            title: "Error deactivating workplace",
            description: response.error,
            variant: "destructive"
          });
          return { success: false, error: response.error };
        }
        
        dispatch(actions.deactivateWorkplaceSuccess(workplaceId));
        toast({
          title: "Success",
          description: "Workplace deactivated successfully"
        });
        return { success: true };
      } catch (error: any) {
        const errorMessage = error.message || "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return { success: false, error: errorMessage };
      }
    };
    
    return {
      selectWorkplace,
      fetchWorkplaces,
      createWorkplace,
      fetchMembers,
      addMember,
      removeMember,
      updateMemberRole,
      activateWorkplace,
      deactivateWorkplace
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
