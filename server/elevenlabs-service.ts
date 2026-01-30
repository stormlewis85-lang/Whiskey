/**
 * ElevenLabs Text-to-Speech Service for Rick House
 * Converts Rick's tasting scripts to audio using ElevenLabs API
 */

import { getRickConfig } from './rick-config';

export interface TextToSpeechInput {
  text: string;
  voiceId?: string; // Optional override, defaults to config
}

export interface TextToSpeechResult {
  audioBase64: string;
  contentType: string;
  durationEstimate?: number;
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
