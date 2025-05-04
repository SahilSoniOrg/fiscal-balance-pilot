import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';

/**
 * Generic types for the context state and actions
 */
export interface BaseState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: number;
}

export interface Action<T extends string = string, P = any> {
  type: T;
  payload?: P;
}

/**
 * Configuration object for creating a context provider
 */
export interface ContextProviderConfig<
  State extends BaseState,
  Actions extends Action,
  ContextValue extends { state: State }
> {
  // The name of the context for debugging purposes
  name: string;
  
  // Initial state for the reducer
  initialState: State;
  
  // Reducer function that handles state updates
  reducer: (state: State, action: Actions) => State;
  
  // Function to get additional context value beyond the state
  getContextValue: (state: State, dispatch: React.Dispatch<Actions>) => Omit<ContextValue, 'state'>;
  
  // Optional dependencies for the context - can be a function returning dependency values
  dependencies?: () => any;
  
  // Optional fetch function to be called when the provider mounts or dependencies change
  fetchOnMount?: (dispatch: React.Dispatch<Actions>, dependencies?: any) => Promise<void>;
  
  // Optional cache configuration
  cache?: {
    enabled: boolean;
    key: string;
    expiryMs?: number; // Default to 5 minutes
  };
}

// Helper function to check if two objects are shallowly equal
const shallowEqual = (objA: any, objB: any): boolean => {
  if (objA === objB) {
    return true;
  }

  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  // Test for A's keys different from B.
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      objA[key] !== objB[key]
    ) {
      return false;
    }
  }

  return true;
};

/**
 * Creates a standardized context provider with caching and state management
 */
export function createContextProvider<
  State extends BaseState,
  Actions extends Action,
  ContextValue extends { state: State }
>(config: ContextProviderConfig<State, Actions, ContextValue>) {
  const {
    name,
    initialState,
    reducer,
    getContextValue,
    dependencies,
    fetchOnMount,
    cache = { enabled: false, key: '', expiryMs: 5 * 60 * 1000 } // 5 minutes default cache expiry
  } = config;

  // Create the context
  const Context = createContext<ContextValue | undefined>(undefined);
  Context.displayName = name;

  // Create the provider component
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Try to load initial state from cache if enabled
    const cachedInitialState = React.useMemo(() => {
      if (!cache.enabled) return initialState;
      
      try {
        const cachedData = localStorage.getItem(`context_${cache.key}`);
        if (!cachedData) return initialState;
        
        const parsed = JSON.parse(cachedData);
        
        // Check if the cache is expired
        if (parsed.lastUpdated && cache.expiryMs) {
          const now = Date.now();
          if (now - parsed.lastUpdated > cache.expiryMs) {
            localStorage.removeItem(`context_${cache.key}`);
            return initialState;
          }
        }
        
        return { ...initialState, ...parsed };
      } catch (error) {
        console.error(`Error loading cached state for ${name}:`, error);
        return initialState;
      }
    }, []);

    // Create a wrapped reducer that handles caching
    const cachedReducer = React.useCallback(
      (state: State, action: Actions): State => {
        const newState = reducer(state, action);
        
        // Add lastUpdated timestamp to the state
        const stateWithTimestamp = {
          ...newState,
          lastUpdated: Date.now()
        };
        
        // Update cache if enabled
        if (cache.enabled) {
          try {
            localStorage.setItem(`context_${cache.key}`, JSON.stringify(stateWithTimestamp));
          } catch (error) {
            console.error(`Error caching state for ${name}:`, error);
          }
        }
        
        return stateWithTimestamp;
      },
      [reducer, cache.enabled, cache.key]
    );

    // Initialize state with reducer
    const [state, dispatch] = useReducer(cachedReducer, cachedInitialState);

    // Keep track of previous dependencies for comparison
    const depsRef = useRef<any>(null);
    
    // Get dependencies if function is provided
    const deps = dependencies ? dependencies() : null;
    
    // Store fetch in progress flag
    const isFetchingRef = useRef(false);

    // Fetch data when dependencies change
    useEffect(() => {
      // Skip if no fetch function is provided
      if (!fetchOnMount) return;
      
      // Skip if no dependencies are provided
      if (!deps) return;
      
      // Skip if the dependencies haven't changed
      if (depsRef.current && shallowEqual(depsRef.current, deps)) return;
      
      // Debug dependency changes
      if (depsRef.current) {
        console.log(`${name} dependencies changed:`, {
          previous: depsRef.current,
          current: deps,
          changed: !shallowEqual(depsRef.current, deps)
        });
      }
      
      // Store the new dependencies
      depsRef.current = deps;
      
      // Prevent multiple fetches in progress
      if (isFetchingRef.current) {
        console.log(`${name}: Fetch already in progress, skipping`);
        return;
      }
      
      // Define the fetch function
      const fetchData = async () => {
        try {
          isFetchingRef.current = true;
          console.log(`${name}: Starting data fetch...`);
          await fetchOnMount(dispatch, deps);
          console.log(`${name}: Data fetch completed successfully`);
        } catch (error) {
          console.error(`Error in fetchOnMount for ${name}:`, error);
        } finally {
          // Clear fetching flag
          isFetchingRef.current = false;
        }
      };
      
      // Call the fetch function
      fetchData();
    }, [deps, fetchOnMount, name]);

    // Get the context value
    const contextValue = {
      state,
      ...getContextValue(state, dispatch)
    } as ContextValue;

    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
  };

  // Create custom hook to use the context
  const useContextHook = (): ContextValue => {
    const context = useContext(Context);
    if (context === undefined) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  };

  return {
    Provider,
    useContext: useContextHook
  };
}

/**
 * Helper function to create standard actions
 */
export const createActions = <T extends string>(resourceName: string) => ({
  request: `FETCH_${resourceName.toUpperCase()}_REQUEST` as T,
  success: `FETCH_${resourceName.toUpperCase()}_SUCCESS` as T,
  failure: `FETCH_${resourceName.toUpperCase()}_FAILURE` as T,
  clear: `CLEAR_${resourceName.toUpperCase()}` as T,
}); 