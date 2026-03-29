import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveChild } from '@/composables/useActiveChild'
import { useAuthSession } from '@/composables/useAuthSession'
import type {
  ActivityEventPayload,
  ActivityResponsePayload,
  ActivitySessionFinishPayload,
  ActivitySessionRecord,
  ActivitySessionStartPayload,
} from '@/types/analytics'
import { useApi } from '@/utils/api'

interface SessionResponsesRequest {
  responses: ActivityResponsePayload[]
}

interface SessionEventsRequest {
  events: ActivityEventPayload[]
}

export function useActivitySessionTracker() {
  const api = useApi()
  const { locale } = useI18n()
  const { activeChildId } = useActiveChild()
  const { isAuthenticated } = useAuthSession()

  const sessionId = ref<number | null>(null)
  const isActive = ref(false)
  const isFinalized = ref(false)

  let trackingEnabled = true
  let sessionToken = 0
  let pendingResponses: ActivityResponsePayload[] = []
  let pendingEvents: ActivityEventPayload[] = []
  let startTask: Promise<void> | null = null
  let responseFlushTask: Promise<void> | null = null
  let eventFlushTask: Promise<void> | null = null

  function resolveDeviceType(deviceType?: string) {
    if (deviceType) return deviceType
    if (!import.meta.client) return 'desktop'
    if (window.innerWidth < 768) return 'mobile'
    if (window.innerWidth < 1024) return 'tablet'
    return 'desktop'
  }

  function resetLocalState() {
    sessionId.value = null
    isActive.value = false
    isFinalized.value = false
    trackingEnabled = true
    pendingResponses = []
    pendingEvents = []
    startTask = null
    responseFlushTask = null
    eventFlushTask = null
  }

  function normalizeEvent(event: ActivityEventPayload): ActivityEventPayload {
    return {
      ...event,
      occurredAt: event.occurredAt ?? new Date().toISOString(),
    }
  }

  async function flushResponses() {
    if (!trackingEnabled || !sessionId.value || pendingResponses.length === 0) return
    if (responseFlushTask) return responseFlushTask

    const queuedResponses = [...pendingResponses]
    pendingResponses = []

    responseFlushTask = api
      .post<unknown, SessionResponsesRequest>(`/sessions/${sessionId.value}/responses`, {
        responses: queuedResponses,
      })
      .catch((error) => {
        pendingResponses = [...queuedResponses, ...pendingResponses]
        console.warn('[analytics] Failed to send responses', error)
      })
      .finally(() => {
        responseFlushTask = null
      })

    return responseFlushTask
  }

  async function flushEvents() {
    if (!trackingEnabled || !sessionId.value || pendingEvents.length === 0) return
    if (eventFlushTask) return eventFlushTask

    const queuedEvents = [...pendingEvents]
    pendingEvents = []

    eventFlushTask = api
      .post<unknown, SessionEventsRequest>(`/sessions/${sessionId.value}/events/batch`, {
        events: queuedEvents,
      })
      .catch((error) => {
        pendingEvents = [...queuedEvents, ...pendingEvents]
        console.warn('[analytics] Failed to send events', error)
      })
      .finally(() => {
        eventFlushTask = null
      })

    return eventFlushTask
  }

  async function flushPending() {
    await Promise.all([flushResponses(), flushEvents()])
  }

  function trackResponse(response: ActivityResponsePayload) {
    if (!trackingEnabled || isFinalized.value) return

    pendingResponses.push(response)

    if (sessionId.value) {
      void flushResponses()
    }
  }

  function trackEvent(event: ActivityEventPayload) {
    if (!trackingEnabled || isFinalized.value) return

    pendingEvents.push(normalizeEvent(event))

    if (sessionId.value) {
      void flushEvents()
    }
  }

  async function waitForSessionStart() {
    if (startTask) {
      await startTask
    }

    return sessionId.value
  }

  async function startSession(payload: ActivitySessionStartPayload) {
    const currentToken = ++sessionToken

    sessionId.value = null
    isActive.value = true
    isFinalized.value = false
    trackingEnabled = true
    pendingResponses = []
    pendingEvents = []

    if (!isAuthenticated.value || !activeChildId.value) {
      trackingEnabled = false
      return
    }

    startTask = api
      .post<ActivitySessionRecord, Omit<ActivitySessionStartPayload, 'childId' | 'locale'> & {
        childId: number
        deviceType: string
        locale: string
      }>('/sessions/start', {
        ...payload,
        childId: payload.childId ?? activeChildId.value,
        deviceType: resolveDeviceType(payload.deviceType),
        locale: payload.locale ?? locale.value,
      })
      .then(async (session) => {
        if (currentToken !== sessionToken) return

        sessionId.value = session.id
        await flushPending()
      })
      .catch((error) => {
        if (currentToken !== sessionToken) return

        trackingEnabled = false
        pendingResponses = []
        pendingEvents = []
        console.warn('[analytics] Failed to start session', error)
      })
      .finally(() => {
        if (currentToken === sessionToken) {
          startTask = null
        }
      })

    return startTask
  }

  async function finishSession(payload: ActivitySessionFinishPayload) {
    if (!isActive.value || isFinalized.value) return

    const currentToken = sessionToken
    isFinalized.value = true

    const currentSessionId = await waitForSessionStart()

    if (!trackingEnabled || !currentSessionId) {
      if (currentToken === sessionToken) {
        isActive.value = false
      }
      return
    }

    await flushPending()

    try {
      await api.post<unknown, ActivitySessionFinishPayload>(
        `/sessions/${currentSessionId}/finish`,
        payload
      )
    } catch (error) {
      console.warn('[analytics] Failed to finish session', error)
    } finally {
      if (currentToken === sessionToken) {
        isActive.value = false
      }
    }
  }

  async function abandonSession(metadata?: Record<string, unknown>) {
    if (!isActive.value || isFinalized.value) return

    trackEvent({
      type: 'session_abandoned',
      payload: metadata,
    })

    await finishSession({
      status: 'abandoned',
      metadata,
    })
  }

  function resetTracker() {
    resetLocalState()
  }

  onBeforeUnmount(() => {
    if (!isActive.value || isFinalized.value) return

    void abandonSession({ reason: 'screen_unmounted' })
  })

  return {
    abandonSession,
    finishSession,
    isActive,
    resetTracker,
    sessionId,
    startSession,
    trackEvent,
    trackResponse,
  }
}
