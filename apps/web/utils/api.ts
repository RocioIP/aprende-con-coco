export function useApi() {
  const {
    public: { apiBase },
  } = useRuntimeConfig()
  const baseOptions = {
    credentials: 'include' as const,
    headers: { 'Content-Type': 'application/json' },
  }

  return {
    apiBase,
    get: <TResponse>(path: string) => $fetch<TResponse>(`${apiBase}${path}`, baseOptions),
    post: <TResponse, TBody = unknown>(path: string, body?: TBody) =>
      $fetch<TResponse>(`${apiBase}${path}`, { ...baseOptions, method: 'POST', body }),
    patch: <TResponse, TBody = unknown>(path: string, body?: TBody) =>
      $fetch<TResponse>(`${apiBase}${path}`, { ...baseOptions, method: 'PATCH', body }),
  }
}
