import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions<T> = { immediate: true }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !!options.immediate,
    error: null,
  });

  const optionsRef = useRef(options);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFunction();
      setState({ data, loading: false, error: null });
      optionsRef.current.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setState({ data: null, loading: false, error: errorMessage });
      optionsRef.current.onError?.(err);
      throw err;
    }
  }, [apiFunction]);

  useEffect(() => {
    if (optionsRef.current.immediate) {
      execute();
    }
  }, [execute]);

  return { ...state, refetch: execute };
}

export function useMutation<T, A extends any[]>(
  apiFunction: (...args: A) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const optionsRef = useRef(options);
  
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const mutate = useCallback(async (...args: A) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await apiFunction(...args);
      setState({ data, loading: false, error: null });
      optionsRef.current.onSuccess?.(data);
      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || "Mutation failed";
      setState({ data: null, loading: false, error: errorMessage });
      optionsRef.current.onError?.(err);
      return { success: false, error: errorMessage };
    }
  }, [apiFunction]);

  return { ...state, mutate, reset: () => setState({ data: null, loading: false, error: null }) };
}
