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
  
  // Enhanced request options with credentials always included
  const requestOptions = {
    method,
    headers: {
      ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    body: data && !isFormData ? JSON.stringify(data) : data,
    credentials: 'include' as RequestCredentials,
    ...options,
  };
  
  // Console log for debugging
  console.log(`Making ${method} request to ${url}`, { 
    withData: !!data,
    withOptions: !!options
  });
  
  const res = await fetch(url, requestOptions);

  if (res.status === 401) {
    // Handle unauthorized errors (session expired)
    console.warn("Session expired or authentication required");
    
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
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log("Unauthorized request - returning null as requested");
      return null;
    }

    if (res.status === 401) {
      console.warn("Session expired or unauthorized access");
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
