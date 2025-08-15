export function useApi() {
  const { public: { apiBase } } = useRuntimeConfig()
  const headers = { 'Content-Type': 'application/json' }
  return {
    get:  (p: string) => $fetch(`${apiBase}${p}`, { headers }),
    post: (p: string, body?: any) => $fetch(`${apiBase}${p}`, { method: 'POST', body, headers })
  }
}
