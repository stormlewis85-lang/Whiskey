/**
 * UPC Whiskey Lookup Service
 *
 * 1. Check local DB for matching UPC
 * 2. Try Open Food Facts API for product name
 * 3. Use Claude for whiskey enrichment
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export interface WhiskeyLookupResult {
  found: boolean;
  source: 'local' | 'enriched' | 'not_found';
  upc: string;
  whiskey?: {
    identified: boolean;
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

interface OpenFoodFactsResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    categories_tags?: string[];
  };
}

interface ClaudeWhiskeyResponse {
  identified: boolean;
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
 * Fetch product info from Open Food Facts API
 */
async function fetchFromOpenFoodFacts(upc: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${upc}.json`,
      {
        headers: {
          'User-Agent': 'WhiskeyPedia/1.0 (whiskey collection app)'
        }
      }
    );

    if (!response.ok) {
      console.log(`Open Food Facts returned ${response.status} for UPC ${upc}`);
      return null;
    }

    const data: OpenFoodFactsResponse = await response.json();

    if (data.status === 1 && data.product?.product_name) {
      // Combine brand and product name if available
      const brand = data.product.brands || '';
      const name = data.product.product_name;

      if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
        return `${brand} ${name}`;
      }
      return name;
    }

    return null;
  } catch (error) {
    console.error('Open Food Facts API error:', error);
    return null;
  }
}

/**
 * Use Claude to enrich whiskey information
 */
async function enrichWithClaude(productInfo: string, upc: string): Promise<ClaudeWhiskeyResponse | null> {
  try {
    const prompt = `You are a whiskey database expert. Given this product info, return ONLY valid JSON (no markdown, no explanation, no code blocks):

Product: ${productInfo}
UPC: ${upc}

Return this exact JSON structure:
{
  "identified": true or false,
  "name": "full product name",
  "distillery": "distillery name or null",
  "type": "Bourbon/Rye/Scotch/Irish/Japanese/Canadian/Tennessee Whiskey/Other or null",
  "proof": number or null,
  "age": "age statement like '12 years' or null",
  "mashbill": "High Rye/High Corn/Wheated/etc or null",
  "description": "brief 1-2 sentence description or null",
  "tastingNotes": ["note1", "note2", "note3"] or []
}

If you cannot identify this as a whiskey product or don't have enough information, set "identified": false and provide your best guess for the name field only, leaving other fields as null or empty.

Important: Return ONLY the JSON object, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response');
      return null;
    }

    // Parse JSON response - handle potential markdown code blocks
    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result: ClaudeWhiskeyResponse = JSON.parse(jsonText);
    return result;

  } catch (error) {
    console.error('Claude enrichment error:', error);
    return null;
  }
}

/**
 * Main lookup function - orchestrates the lookup process
 */
export async function lookupWhiskeyByUPC(upc: string): Promise<WhiskeyLookupResult> {
  console.log(`Looking up UPC: ${upc}`);

  // Step 1: Try Open Food Facts for product name
  console.log('Checking Open Food Facts...');
  const productName = await fetchFromOpenFoodFacts(upc);

  const productInfo = productName || `Unknown product with UPC: ${upc}`;
  console.log(`Product info: ${productInfo}`);

  // Step 2: Enrich with Claude
  console.log('Enriching with Claude...');
  const enrichedData = await enrichWithClaude(productInfo, upc);

  if (!enrichedData) {
    return {
      found: false,
      source: 'not_found',
      upc,
      message: 'Could not identify this product. You can add it manually.'
    };
  }

  if (!enrichedData.identified) {
    return {
      found: false,
      source: 'not_found',
      upc,
      whiskey: {
        identified: false,
        name: enrichedData.name || productInfo,
        distillery: null,
        type: null,
        proof: null,
        age: null,
        mashBill: null,
        description: null,
        tastingNotes: []
      },
      message: 'Could not confirm this is a whiskey product. You can add it manually with the suggested name.'
    };
  }

  return {
    found: true,
    source: 'enriched',
    upc,
    whiskey: {
      identified: true,
      name: enrichedData.name,
      distillery: enrichedData.distillery,
      type: enrichedData.type,
      proof: enrichedData.proof,
      age: enrichedData.age,
      mashBill: enrichedData.mashbill,
      description: enrichedData.description,
      tastingNotes: enrichedData.tastingNotes || []
    },
    message: 'Whiskey identified successfully'
  };
}
