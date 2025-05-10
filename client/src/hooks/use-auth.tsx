import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { 
  User, 
  InsertUser, 
  LoginUser 
} from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Interface for storing auth token
interface AuthToken {
  token: string;
  userId: number;
}

// Local storage helpers
const TOKEN_STORAGE_KEY = "whiskeypedia_auth_token";

function saveAuthToken(token: string, userId: number) {
  const authToken: AuthToken = { token, userId };
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authToken));
}

function getAuthToken(): AuthToken | null {
  const tokenData = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!tokenData) return null;
  
  try {
    return JSON.parse(tokenData) as AuthToken;
  } catch (e) {
    console.error("Error parsing auth token:", e);
    return null;
  }
}

function clearAuthToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginUser>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, InsertUser>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Refresh every minute when the window is visible
    refetchInterval: 60000, 
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 3,
    staleTime: 30000,
  });

  const loginMutation = useMutation<User, Error, LoginUser>({
    mutationFn: async (credentials: LoginUser) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (response: User & { token?: string }) => {
      // Save token to local storage if provided
      if (response.token) {
        console.log("Saving auth token to local storage");
        saveAuthToken(response.token, response.id);
      }
      
      // Remove token from user object before caching
      const { token, ...user } = response;
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<User, Error, InsertUser>({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (response: User & { token?: string }) => {
      // Save token to local storage if provided
      if (response.token) {
        console.log("Saving auth token to local storage");
        saveAuthToken(response.token, response.id);
      }
      
      // Remove token from user object before caching
      const { token, ...user } = response;
      
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to WhiskeyPedia, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      // Clear the auth token from local storage
      clearAuthToken();
      
      queryClient.setQueryData(["/api/user"], null);
      // Also invalidate whiskeys to refresh the collection
      queryClient.invalidateQueries({ queryKey: ["/api/whiskeys"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}