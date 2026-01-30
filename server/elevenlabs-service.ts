/**
 * ElevenLabs Text-to-Speech Service for Rick House
 * Converts Rick's tasting scripts to audio using ElevenLabs API
 */

import { getRickConfig } from './rick-config';
import { writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

// Audio storage directory
const AUDIO_DIR = join(process.cwd(), 'uploads', 'audio');

// In-memory cache of hash -> URL mappings
const audioCache = new Map<string, string>();

export interface TextToSpeechInput {
  text: string;
  voiceId?: string; // Optional override, defaults to config
}

export interface TextToSpeechResult {
  audioBase64: string;
  contentType: string;
  durationEstimate?: number;
}

export interface AudioGenerationResult {
  audioUrl: string | null;
  durationEstimate: number;
  cached: boolean;
  textOnly: boolean;
  error?: string;
}

export interface ElevenLabsStatus {
  configured: boolean;
  available: boolean;
  error?: string;
}

/**
 * Check if ElevenLabs is properly configured
 */
export function checkElevenLabsConfig(): ElevenLabsStatus {
  const config = getRickConfig();

  if (!config.elevenLabsApiKey) {
    return {
      configured: false,
      available: false,
      error: 'ElevenLabs API key not configured'
    };
  }

  if (!config.elevenLabsVoiceId) {
    return {
      configured: false,
      available: false,
      error: 'ElevenLabs voice ID not configured'
    };
  }

  return {
    configured: true,
    available: true
  };
}

/**
 * Generate speech audio from text using ElevenLabs API
 */
export async function generateSpeech(input: TextToSpeechInput): Promise<TextToSpeechResult> {
  const config = getRickConfig();

  if (!config.elevenLabsApiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = input.voiceId || config.elevenLabsVoiceId;
  if (!voiceId) {
    throw new Error('ElevenLabs voice ID not configured');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': config.elevenLabsApiKey,
    },
    body: JSON.stringify({
      text: input.text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('ElevenLabs API error:', response.status, errorText);
    throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
  }

  // Get the audio as ArrayBuffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Convert to base64
  const audioBase64 = buffer.toString('base64');

  // Estimate duration (rough estimate: ~150 words per minute, ~5 chars per word)
  const wordCount = input.text.split(/\s+/).length;
  const durationEstimate = Math.ceil((wordCount / 150) * 60); // seconds

  return {
    audioBase64,
    contentType: 'audio/mpeg',
    durationEstimate,
  };
}

/**
 * Generate speech for a full Rick script (all sections combined)
 */
export async function generateScriptAudio(script: {
  visual: string;
  nose: string;
  palate: string;
  finish: string;
  ricksTake: string;
  quip?: string;
}): Promise<TextToSpeechResult> {
  // Combine all script sections with natural pauses
  const fullText = [
    script.visual,
    script.nose,
    script.palate,
    script.finish,
    script.ricksTake,
    script.quip || '',
  ]
    .filter(s => s.trim())
    .join('\n\n');

  return generateSpeech({ text: fullText });
}

/**
 * Generate speech for a single phase of the tasting
 */
export async function generatePhaseAudio(
  phase: 'visual' | 'nose' | 'palate' | 'finish' | 'ricksTake',
  text: string
): Promise<TextToSpeechResult> {
  return generateSpeech({ text });
}

/**
 * Safely generate script audio with text-only fallback
 */
export async function generateScriptAudioSafe(script: {
  visual: string;
  nose: string;
  palate: string;
  finish: string;
  ricksTake: string;
  quip?: string;
}): Promise<{ result: TextToSpeechResult | null; textOnly: boolean; error?: string }> {
  // Check config first
  const configStatus = checkElevenLabsConfig();
  if (!configStatus.configured) {
    return {
      result: null,
      textOnly: true,
      error: configStatus.error
    };
  }

  try {
    const result = await generateScriptAudio(script);
    return {
      result,
      textOnly: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Script audio generation failed:', errorMessage);
    return {
      result: null,
      textOnly: true,
      error: `Audio generation failed: ${errorMessage}`
    };
  }
}

/**
 * Safely generate phase audio with text-only fallback
 */
export async function generatePhaseAudioSafe(
  phase: 'visual' | 'nose' | 'palate' | 'finish' | 'ricksTake',
  text: string
): Promise<{ result: TextToSpeechResult | null; textOnly: boolean; error?: string }> {
  // Check config first
  const configStatus = checkElevenLabsConfig();
  if (!configStatus.configured) {
    return {
      result: null,
      textOnly: true,
      error: configStatus.error
    };
  }

  try {
    const result = await generatePhaseAudio(phase, text);
    return {
      result,
      textOnly: false
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Phase ${phase} audio generation failed:`, errorMessage);
    return {
      result: null,
      textOnly: true,
      error: `Audio generation failed: ${errorMessage}`
    };
  }
}

/**
 * Ensure audio directory exists
 */
function ensureAudioDir(): void {
  if (!existsSync(AUDIO_DIR)) {
    mkdirSync(AUDIO_DIR, { recursive: true });
  }
}

/**
 * Generate a hash for audio caching
 */
export function generateAudioHash(text: string): string {
  return createHash('md5').update(text).digest('hex').substring(0, 12);
}

/**
 * Save audio to file and return URL
 */
export async function saveAudioFile(
  audioBase64: string,
  sessionId: number,
  phase?: string
): Promise<string> {
  ensureAudioDir();

  const timestamp = Date.now();
  const phaseSuffix = phase ? `-${phase}` : '';
  const filename = `rick-${sessionId}${phaseSuffix}-${timestamp}.mp3`;
  const filepath = join(AUDIO_DIR, filename);

  // Decode base64 and save
  const buffer = Buffer.from(audioBase64, 'base64');
  writeFileSync(filepath, buffer);

  // Return URL path (will be served by express static)
  return `/uploads/audio/${filename}`;
}

/**
 * Check if cached audio exists for a given hash
 */
export function getCachedAudio(hash: string): string | null {
  // Check in-memory cache first
  if (audioCache.has(hash)) {
    const url = audioCache.get(hash)!;
    // Verify file still exists
    const filename = url.split('/').pop();
    if (filename && existsSync(join(AUDIO_DIR, filename))) {
      return url;
    }
    // File doesn't exist, remove from cache
    audioCache.delete(hash);
  }

  // Check filesystem for existing cached file
  ensureAudioDir();
  const files = readdirSync(AUDIO_DIR);
  const cachedFile = files.find(f => f.includes(`-${hash}-`) || f.includes(`-${hash}.`));

  if (cachedFile) {
    const url = `/uploads/audio/${cachedFile}`;
    audioCache.set(hash, url);
    return url;
  }

  return null;
}

/**
 * Generate and save audio with caching support
 * Returns text-only result if audio generation fails
 */
export async function generateAndSaveAudio(
  text: string,
  sessionId: number,
  phase?: string
): Promise<AudioGenerationResult> {
  // Calculate duration estimate from text (used regardless of audio success)
  const wordCount = text.split(/\s+/).length;
  const durationEstimate = Math.ceil((wordCount / 150) * 60);

  // Check if ElevenLabs is configured
  const configStatus = checkElevenLabsConfig();
  if (!configStatus.configured) {
    console.log('ElevenLabs not configured, returning text-only mode');
    return {
      audioUrl: null,
      durationEstimate,
      cached: false,
      textOnly: true,
      error: configStatus.error
    };
  }

  // Generate hash for caching
  const hash = generateAudioHash(text);

  // Check cache first
  const cachedUrl = getCachedAudio(hash);
  if (cachedUrl) {
    console.log(`Using cached audio for hash ${hash}`);
    return {
      audioUrl: cachedUrl,
      durationEstimate,
      cached: true,
      textOnly: false
    };
  }

  // Generate new audio with error handling
  try {
    console.log(`Generating new audio for hash ${hash}`);
    const result = await generateSpeech({ text });

    // Save with hash in filename for future caching
    ensureAudioDir();
    const timestamp = Date.now();
    const phaseSuffix = phase ? `-${phase}` : '';
    const filename = `rick-${sessionId}${phaseSuffix}-${hash}-${timestamp}.mp3`;
    const filepath = join(AUDIO_DIR, filename);

    const buffer = Buffer.from(result.audioBase64, 'base64');
    writeFileSync(filepath, buffer);

    const audioUrl = `/uploads/audio/${filename}`;

    // Update cache
    audioCache.set(hash, audioUrl);

    return {
      audioUrl,
      durationEstimate: result.durationEstimate || durationEstimate,
      cached: false,
      textOnly: false
    };
  } catch (error) {
    // Log the error but don't fail - return text-only mode
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('ElevenLabs audio generation failed, falling back to text-only:', errorMessage);

    return {
      audioUrl: null,
      durationEstimate,
      cached: false,
      textOnly: true,
      error: `Audio generation failed: ${errorMessage}`
    };
  }
}

/**
 * Generate and save audio - throws on error (use when audio is required)
 */
export async function generateAndSaveAudioRequired(
  text: string,
  sessionId: number,
  phase?: string
): Promise<{ audioUrl: string; durationEstimate: number; cached: boolean }> {
  const result = await generateAndSaveAudio(text, sessionId, phase);

  if (result.textOnly || !result.audioUrl) {
    throw new Error(result.error || 'Audio generation failed');
  }

  return {
    audioUrl: result.audioUrl,
    durationEstimate: result.durationEstimate,
    cached: result.cached
  };
}
