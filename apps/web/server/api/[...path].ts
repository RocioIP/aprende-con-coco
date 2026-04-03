import { defineEventHandler, getRequestURL, proxyRequest } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const path = event.context.params?.path ?? ''
  const query = getRequestURL(event).search || ''
  const target = `${config.apiProxyTarget}/${path}${query}`

  return proxyRequest(event, target)
})
