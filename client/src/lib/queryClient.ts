import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const isFormData = data instanceof FormData;
  
  // Get auth token if available
  const authToken = localStorage.getItem("whiskeypedia_auth_token");
  let token = null;
  
  if (authToken) {
    try {
      const authData = JSON.parse(authToken);
      token = authData.token;
    } catch (e) {
      console.error("Error parsing auth token:", e);
    }
  }
  
  // Build headers with auth token if available
  const headers: Record<string, string> = {
    ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  
  // Add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Enhanced request options with credentials always included
  const requestOptions = {
    method,
    headers,
    body: data && !isFormData ? JSON.stringify(data) : data,
    credentials: 'include' as RequestCredentials,
    ...options,
  };
  
  const res = await fetch(url, requestOptions);

  if (res.status === 401) {
    // Handle unauthorized errors (session expired)
    // Try to refresh the user session by invalidating the cache
    queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    
    // Still throw the error for proper handling
    const errorText = await res.text();
    throw new Error(`401: ${errorText || 'Unauthorized - Please log in again'}`);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token if available
    const authToken = localStorage.getItem("whiskeypedia_auth_token");
    let token = null;
    
    if (authToken) {
      try {
        const authData = JSON.parse(authToken);
        token = authData.token;
      } catch (e) {
        console.error("Error parsing auth token:", e);
      }
    }
    
    // Build headers with auth token if available
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    // Add Authorization header if we have a token
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    if (res.status === 401) {
      const errorText = await res.text();
      throw new Error(`401: ${errorText || 'Unauthorized - Please log in again'}`);
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
