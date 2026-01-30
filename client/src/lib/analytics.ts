/**
 * Simple analytics tracking utility for Rick House
 * These events can be connected to a real analytics system (GA, Mixpanel, etc.) later
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
}

// Set to true to enable console logging of analytics events
const DEBUG_ANALYTICS = import.meta.env.DEV;

/**
 * Track an analytics event
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  const analyticsEvent: AnalyticsEvent = { event, properties };

  if (DEBUG_ANALYTICS) {
    console.log('[Analytics]', event, properties);
  }

  // TODO: Connect to actual analytics service
  // Example: window.gtag('event', event, properties);
  // Example: mixpanel.track(event, properties);
  // Example: posthog.capture(event, properties);
}

// Rick House specific events
export const RickAnalytics = {
  sessionStarted: (whiskeyId: number, whiskeyName: string, mode: 'guided' | 'notes') => {
    trackEvent('rick_session_started', { whiskeyId, whiskeyName, mode });
  },

  sessionCompleted: (whiskeyId: number, whiskeyName: string, mode: 'guided' | 'notes', durationSeconds: number) => {
    trackEvent('rick_session_completed', { whiskeyId, whiskeyName, mode, durationSeconds });
  },

  sessionAbandoned: (whiskeyId: number, whiskeyName: string, mode: 'guided' | 'notes', phase: string) => {
    trackEvent('rick_session_abandoned', { whiskeyId, whiskeyName, mode, lastPhase: phase });
  },

  phaseAdvanced: (whiskeyId: number, phase: string, phaseIndex: number) => {
    trackEvent('rick_phase_advanced', { whiskeyId, phase, phaseIndex });
  },

  audioPlayed: (whiskeyId: number, phase: string) => {
    trackEvent('rick_audio_played', { whiskeyId, phase });
  },

  audioFailed: (whiskeyId: number, error: string) => {
    trackEvent('rick_audio_failed', { whiskeyId, error });
  },

  modeSelected: (mode: 'guided' | 'notes') => {
    trackEvent('rick_mode_selected', { mode });
  },

  reviewStartedFromSession: (whiskeyId: number, sessionId: number) => {
    trackEvent('rick_review_started_from_session', { whiskeyId, sessionId });
  }
};
