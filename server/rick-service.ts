/**
 * Rick House - AI Tasting Guide Script Generation Service
 * Uses Claude API with Rick's character prompt to generate tasting scripts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { storage } from './storage';
import { getRickConfig } from './rick-config';

// TypeScript interface for Rick's tasting script
export interface RickScript {
  visual: string;
  nose: string;
  palate: string;
  finish: string;
  ricksTake: string;
  quip: string;
  metadata?: RickScriptMetadata;
}

export interface RickScriptMetadata {
  whiskeyId: number;
  whiskeyName: string;
  mode: 'guided' | 'notes';
  generatedAt: string;
  personalized: boolean;
  communityReviewCount: number;
}

export interface GenerateScriptInput {
  whiskeyId: number;
  userId: number;
  mode: 'guided' | 'notes';
}

export interface GenerateScriptResult {
  script: RickScript;
  cached: boolean;
  whiskeyName: string;
  mode: 'guided' | 'notes';
}

// Load the Rick character prompt
function loadRickPrompt(): string {
  try {
    const promptPath = join(__dirname, 'prompts', 'rick-house.md');
    return readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load Rick prompt:', error);
    throw new Error('Rick House configuration error: prompt file not found');
  }
}

// Build the full prompt for Claude
function buildPrompt(
  rickCharacter: string,
  whiskey: { name: string; distillery?: string | null; type?: string | null; age?: number | null; abv?: number | null; price?: number | null },
  communityNotes: Awaited<ReturnType<typeof storage.getCommunityNotes>>,
  palateProfile: Awaited<ReturnType<typeof storage.getPalateProfile>> | null,
  mode: 'guided' | 'notes'
): string {
  const modeInstructions = mode === 'guided'
    ? 'Use "Guide Me" mode: Full walkthrough with educational content. Tell them what to do, what to look for. Be warm and instructive.'
    : 'Use "Just Notes" mode: Brief and direct. Respect that they know what they\'re doing.';

  let whiskeyDetails = `
## Whiskey Details
- Name: ${whiskey.name}
- Distillery: ${whiskey.distillery || 'Unknown'}
- Type: ${whiskey.type || 'Whiskey'}
- Age: ${whiskey.age ? `${whiskey.age} years` : 'No Age Statement'}
- ABV: ${whiskey.abv ? `${whiskey.abv}%` : 'Unknown'}
- Price: ${whiskey.price ? `$${whiskey.price}` : 'Unknown'}
`;

  let communitySection = '';
  if (communityNotes && communityNotes.totalReviews > 0) {
    communitySection = `
## Community Tasting Notes (${communityNotes.totalReviews} reviews)
- Average Overall Score: ${communityNotes.averageScores.overall || 'N/A'}
- Top Nose Notes: ${communityNotes.topFlavors.nose.map(f => f.flavor).join(', ') || 'None recorded'}
- Top Taste Notes: ${communityNotes.topFlavors.taste.map(f => f.flavor).join(', ') || 'None recorded'}
- Top Finish Notes: ${communityNotes.topFlavors.finish.map(f => f.flavor).join(', ') || 'None recorded'}
`;
  } else {
    communitySection = `
## Community Notes
No community reviews available for this whiskey yet. Use the distillery profile and whiskey characteristics to set expectations.
`;
  }

  let personalizationSection = '';
  if (palateProfile && palateProfile.reviewCount >= 5) {
    const topFlavors = palateProfile.topFlavors.all.slice(0, 5).map(f => f.flavor).join(', ');
    const topTypes = palateProfile.preferredTypes.slice(0, 3).map(t => t.type).join(', ');
    personalizationSection = `
## Taster's Palate Profile (${palateProfile.reviewCount} reviews)
- Scoring tendency: ${palateProfile.scoringTendencies.tendency}
- Commonly detected flavors: ${topFlavors || 'Not enough data'}
- Preferred whiskey types: ${topTypes || 'Varied'}
- Consider referencing their preferences naturally in your script.
`;
  }

  return `${rickCharacter}

---

# Current Task

${modeInstructions}

${whiskeyDetails}
${communitySection}
${personalizationSection}

Generate a tasting script for this whiskey in Rick House's voice. Return ONLY valid JSON matching this structure:

{
  "visual": "string - What to observe when looking at the pour",
  "nose": "string - How to approach the aroma and what to expect",
  "palate": "string - The tasting experience and flavors",
  "finish": "string - How it ends and what lingers",
  "ricksTake": "string - Rick's honest assessment",
  "quip": "string - One of Rick's wisdom lines from the list"
}

Remember: No markdown, no code blocks, just the raw JSON object.`;
}

// Parse Claude's response to extract the JSON script
function parseScriptResponse(responseText: string): RickScript {
  // Try to extract JSON from the response
  let jsonStr = responseText.trim();

  // Remove markdown code blocks if present
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate required fields
    const requiredFields: (keyof RickScript)[] = ['visual', 'nose', 'palate', 'finish', 'ricksTake', 'quip'];
    for (const field of requiredFields) {
      if (typeof parsed[field] !== 'string') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    return parsed as RickScript;
  } catch (error) {
    console.error('Failed to parse Rick script:', error);
    console.error('Raw response:', responseText);
    throw new Error('Failed to parse AI response as valid script');
  }
}

/**
 * Generate a tasting script using Claude API with Rick's persona
 * Implements caching: returns cached script if valid (<7 days old AND review count unchanged)
 */
export async function generateRickScript(input: GenerateScriptInput): Promise<GenerateScriptResult> {
  const config = getRickConfig();

  if (!config.anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Get whiskey details
  const whiskey = await storage.getWhiskey(input.whiskeyId, input.userId);
  if (!whiskey) {
    throw new Error('Whiskey not found or not accessible');
  }

  // Check for cached script first
  const cachedScript = await storage.getCachedScript(input.whiskeyId, input.mode);
  if (cachedScript) {
    console.log(`Using cached script for whiskey ${input.whiskeyId}`);
    const scriptJson = cachedScript.scriptJson as RickScript;
    return {
      script: scriptJson,
      cached: true,
      whiskeyName: whiskey.name,
      mode: input.mode
    };
  }

  // No valid cache - generate new script
  console.log(`Generating new script for whiskey ${input.whiskeyId}`);

  // Get community notes for this whiskey
  const communityNotes = await storage.getCommunityNotes(input.whiskeyId);

  // Get user's palate profile for personalization
  let palateProfile = null;
  try {
    palateProfile = await storage.getPalateProfile(input.userId);
  } catch (error) {
    // Palate profile is optional, continue without it
    console.log('Could not fetch palate profile:', error);
  }

  // Load Rick's character prompt
  const rickCharacter = loadRickPrompt();

  // Build the full prompt
  const prompt = buildPrompt(rickCharacter, whiskey, communityNotes, palateProfile, input.mode);

  // Call Claude API
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }]
  });

  // Extract text from response
  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse the script
  const script = parseScriptResponse(responseText);

  // Add metadata to the script
  const isPersonalized = palateProfile !== null && palateProfile.reviewCount >= 5;
  script.metadata = {
    whiskeyId: input.whiskeyId,
    whiskeyName: whiskey.name,
    mode: input.mode,
    generatedAt: new Date().toISOString(),
    personalized: isPersonalized,
    communityReviewCount: communityNotes?.totalReviews || 0,
  };

  // Save to cache for future requests
  try {
    await storage.saveScriptCache(input.whiskeyId, script as unknown as Record<string, unknown>, input.mode);
    console.log(`Cached script for whiskey ${input.whiskeyId}`);
  } catch (cacheError) {
    // Don't fail the request if caching fails
    console.error('Failed to cache script:', cacheError);
  }

  return {
    script,
    cached: false,
    whiskeyName: whiskey.name,
    mode: input.mode
  };
}
