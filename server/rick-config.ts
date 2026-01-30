/**
 * Rick House Configuration
 *
 * Centralizes configuration for the Rick House AI tasting guide feature.
 * Validates environment variables and provides typed access to config values.
 */

export interface RickConfig {
  elevenLabsApiKey: string | undefined;
  elevenLabsVoiceId: string | undefined;
  anthropicApiKey: string | undefined;
  isFullyConfigured: boolean;
  isVoiceEnabled: boolean;
}

/**
 * Get Rick House configuration from environment variables
 */
export function getRickConfig(): RickConfig {
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
  const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  return {
    elevenLabsApiKey,
    elevenLabsVoiceId,
    anthropicApiKey,
    // Voice is enabled if both ElevenLabs key and voice ID are set
    isVoiceEnabled: !!(elevenLabsApiKey && elevenLabsVoiceId),
    // Fully configured if Anthropic (for script generation) is available
    isFullyConfigured: !!anthropicApiKey,
  };
}

/**
 * Validate Rick House configuration on startup
 * Logs warnings for missing optional config, errors for required config
 */
export function validateRickConfig(): void {
  const config = getRickConfig();

  console.log('=== Rick House Configuration ===');

  // Check Anthropic API key (required for script generation)
  if (config.anthropicApiKey) {
    console.log('  ANTHROPIC_API_KEY: configured');
  } else {
    console.log('  ANTHROPIC_API_KEY: not configured (Rick script generation disabled)');
  }

  // Check ElevenLabs API key (optional, for voice)
  if (config.elevenLabsApiKey) {
    console.log('  ELEVENLABS_API_KEY: configured');
  } else {
    console.log('  ELEVENLABS_API_KEY: not configured (voice generation disabled)');
  }

  // Check ElevenLabs Voice ID (required if API key is set)
  if (config.elevenLabsVoiceId) {
    console.log('  ELEVENLABS_VOICE_ID: configured');
  } else if (config.elevenLabsApiKey) {
    console.warn('  ELEVENLABS_VOICE_ID: missing! Voice generation will fail.');
  } else {
    console.log('  ELEVENLABS_VOICE_ID: not configured');
  }

  // Summary
  if (config.isFullyConfigured && config.isVoiceEnabled) {
    console.log('  Status: Rick House fully enabled (script + voice)');
  } else if (config.isFullyConfigured) {
    console.log('  Status: Rick House enabled (text-only mode)');
  } else {
    console.log('  Status: Rick House disabled (missing ANTHROPIC_API_KEY)');
  }

  console.log('================================');
}

/**
 * Check if ElevenLabs is properly configured for voice generation
 */
export function isElevenLabsConfigured(): boolean {
  const config = getRickConfig();
  return config.isVoiceEnabled;
}

/**
 * Get ElevenLabs API key (throws if not configured)
 */
export function getElevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }
  return key;
}

/**
 * Get ElevenLabs Voice ID (throws if not configured)
 */
export function getElevenLabsVoiceId(): string {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!voiceId) {
    throw new Error('ELEVENLABS_VOICE_ID is not configured');
  }
  return voiceId;
}
