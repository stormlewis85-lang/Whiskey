/**
 * Image-based Whiskey Identification Service
 * Uses Claude Vision API to identify whiskey from bottle label photos
 */

import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    let apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    apiKey = apiKey.trim();
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface ImageIdentifyResult {
  success: boolean;
  whiskey?: {
    identified: boolean;
    confidence: 'high' | 'medium' | 'low';
    name: string;
    distillery: string | null;
    type: string | null;
    proof: number | null;
    age: string | null;
    mashBill: string | null;
    description: string | null;
    tastingNotes: string[];
  };
  message: string;
}

interface ClaudeVisionResponse {
  identified: boolean;
  confidence: 'high' | 'medium' | 'low';
  name: string;
  distillery: string | null;
  type: string | null;
  proof: number | null;
  age: string | null;
  mashbill: string | null;
  description: string | null;
  tastingNotes: string[];
}

/**
 * Identify whiskey from an image using Claude Vision
 * @param imageBase64 - Base64 encoded image data (without data URL prefix)
 * @param mediaType - Image MIME type (e.g., 'image/jpeg', 'image/png')
 */
export async function identifyWhiskeyFromImage(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
): Promise<ImageIdentifyResult> {
  console.log('=== IMAGE IDENTIFICATION REQUEST ===');
  console.log('Media type:', mediaType);
  console.log('Image size:', Math.round(imageBase64.length / 1024), 'KB (base64)');

  try {
    const prompt = `You are a whiskey expert. Analyze this image of a whiskey bottle label and identify the whiskey.

Look for:
- Brand name and product name on the label
- Distillery information
- Age statement (if any)
- Proof/ABV (if visible)
- Type of whiskey (Bourbon, Rye, Scotch, Irish, Japanese, etc.)
- Any special designations (Single Barrel, Small Batch, Cask Strength, etc.)

Return ONLY valid JSON with no additional text:
{
  "identified": true or false,
  "confidence": "high", "medium", or "low",
  "name": "full product name as shown on label",
  "distillery": "distillery or producer name",
  "type": "Bourbon/Rye/Scotch/Irish/Japanese/Tennessee Whiskey/Canadian/Other",
  "proof": number or null (if visible on label),
  "age": "age statement string or null",
  "mashbill": "High Rye/Wheated/Traditional/etc or null",
  "description": "brief description of this whiskey",
  "tastingNotes": ["note1", "note2", "note3"]
}

If you cannot identify the whiskey or the image doesn't show a whiskey bottle, return:
{
  "identified": false,
  "confidence": "low",
  "name": "Unknown",
  "distillery": null,
  "type": null,
  "proof": null,
  "age": null,
  "mashbill": null,
  "description": "Could not identify whiskey from image",
  "tastingNotes": []
}`;

    console.log('Calling Claude Vision API...');

    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log('Claude Vision response received');

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response');
      return {
        success: false,
        message: 'Failed to get response from AI',
      };
    }

    // Parse JSON response
    let jsonText = textContent.text.trim();
    console.log('Raw Claude response:', jsonText.substring(0, 300));

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result: ClaudeVisionResponse = JSON.parse(jsonText);
    console.log('Parsed result:', JSON.stringify(result, null, 2));

    return {
      success: true,
      whiskey: {
        identified: result.identified,
        confidence: result.confidence || 'medium',
        name: result.name,
        distillery: result.distillery,
        type: result.type,
        proof: result.proof,
        age: result.age,
        mashBill: result.mashbill,
        description: result.description,
        tastingNotes: result.tastingNotes || [],
      },
      message: result.identified
        ? `Identified: ${result.name} (${result.confidence} confidence)`
        : 'Could not identify whiskey from image',
    };

  } catch (error) {
    console.error('Image identification error:', error);
    return {
      success: false,
      message: `Failed to identify whiskey: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
