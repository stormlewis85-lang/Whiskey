/**
 * UPC Whiskey Lookup Service
 *
 * 1. Check local DB for matching UPC
 * 2. Try Open Food Facts API for product name
 * 3. Use Claude for whiskey enrichment
 */

import Anthropic from '@anthropic-ai/sdk';

// Create client lazily to ensure env vars are loaded
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    let apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('UPC Service - API Key check:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})` : 'NOT SET');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    // Trim any whitespace
    apiKey = apiKey.trim();
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

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
 * Fetch product info from UPCitemdb.com API
 */
async function fetchFromUPCitemdb(upc: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhiskeyPedia/1.0'
        }
      }
    );

    if (!response.ok) {
      console.log(`UPCitemdb returned ${response.status} for UPC ${upc}`);
      return null;
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      const title = item.title || item.brand || null;
      if (title) {
        console.log(`UPCitemdb found: ${title}`);
        return title;
      }
    }

    return null;
  } catch (error) {
    console.error('UPCitemdb API error:', error);
    return null;
  }
}

/**
 * Fetch product info from Go-UPC API
 */
async function fetchFromGoUPC(upc: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://go-upc.com/api/v1/code/${upc}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhiskeyPedia/1.0'
        }
      }
    );

    if (!response.ok) {
      console.log(`Go-UPC returned ${response.status} for UPC ${upc}`);
      return null;
    }

    const data = await response.json();

    if (data.product && data.product.name) {
      console.log(`Go-UPC found: ${data.product.name}`);
      return data.product.name;
    }

    return null;
  } catch (error) {
    console.error('Go-UPC API error:', error);
    return null;
  }
}

/**
 * Fetch product info from UPC Database (upcdatabase.org)
 */
async function fetchFromUPCDatabase(upc: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.upcdatabase.org/product/${upc}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhiskeyPedia/1.0'
        }
      }
    );

    if (!response.ok) {
      console.log(`UPC Database returned ${response.status} for UPC ${upc}`);
      return null;
    }

    const data = await response.json();

    if (data.title) {
      console.log(`UPC Database found: ${data.title}`);
      return data.title;
    }

    return null;
  } catch (error) {
    console.error('UPC Database API error:', error);
    return null;
  }
}

/**
 * Fetch from Barcode Spider (free, no key needed)
 */
async function fetchFromBarcodeSpider(upc: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.barcodespider.com/api/free/${upc}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhiskeyPedia/1.0'
        }
      }
    );

    if (!response.ok) {
      console.log(`Barcode Spider returned ${response.status} for UPC ${upc}`);
      return null;
    }

    const data = await response.json();

    if (data.item_attributes && data.item_attributes.title) {
      console.log(`Barcode Spider found: ${data.item_attributes.title}`);
      return data.item_attributes.title;
    }

    return null;
  } catch (error) {
    console.error('Barcode Spider API error:', error);
    return null;
  }
}

/**
 * Use Claude to enrich whiskey information
 */
async function enrichWithClaude(productInfo: string, upc: string, hasRealProductName: boolean): Promise<ClaudeWhiskeyResponse | null> {
  try {
    const prompt = hasRealProductName
      ? `You are a whiskey database expert. A UPC database found this product:

Product Name: ${productInfo}
UPC: ${upc}

Enrich this whiskey with accurate details. Return ONLY valid JSON:
{
  "identified": true,
  "name": "${productInfo}",
  "distillery": "distillery name",
  "type": "Bourbon/Rye/Scotch/Irish/Japanese/Canadian/Tennessee Whiskey",
  "proof": number or null,
  "age": "age statement or null",
  "mashbill": "High Rye/Wheated/Traditional/etc or null",
  "description": "brief accurate description",
  "tastingNotes": ["note1", "note2", "note3"]
}

Use real, accurate information for this specific product. Return ONLY JSON.`

      : `You are a whiskey and spirits database expert. We have a UPC barcode that was not found in any product database.

UPC/Barcode: ${upc}

Use your knowledge to identify this specific product. Many whiskeys, beers, and spirits have well-known UPCs. For example:
- 614036107093 = Dragon's Milk Origin Bonded by New Holland Brewing
- Search your knowledge for this exact UPC code

If you can identify the SPECIFIC product from this UPC, return:
{
  "identified": true,
  "name": "exact product name",
  "distillery": "manufacturer/distillery name",
  "type": "Bourbon/Whiskey/Beer/Spirit type",
  "proof": number or null,
  "age": "age statement or null",
  "mashbill": "mashbill info or null",
  "description": "accurate product description",
  "tastingNotes": ["note1", "note2", "note3"]
}

If you cannot identify this specific UPC, return:
{
  "identified": false,
  "name": "Unknown Product",
  "distillery": null,
  "type": null,
  "proof": null,
  "age": null,
  "mashbill": null,
  "description": "UPC not recognized. Please enter product details manually.",
  "tastingNotes": []
}

Return ONLY valid JSON.`;

    console.log('Calling Claude API...');
    console.log('UPC BEING SENT:', upc);
    console.log('HAS REAL PRODUCT NAME:', hasRealProductName);
    console.log('PRODUCT INFO:', productInfo);
    const message = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    console.log('Claude response received:', JSON.stringify(message.content).substring(0, 500));

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error('No text content in Claude response');
      return null;
    }

    // Parse JSON response - handle potential markdown code blocks
    let jsonText = textContent.text.trim();
    console.log('Raw Claude text:', jsonText.substring(0, 300));

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result: ClaudeWhiskeyResponse = JSON.parse(jsonText);
    console.log('Parsed result:', JSON.stringify(result));
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

  // Try multiple UPC databases to find product name
  let productName: string | null = null;

  // 1. Open Food Facts
  console.log('Checking Open Food Facts...');
  productName = await fetchFromOpenFoodFacts(upc);

  // 2. UPCitemdb
  if (!productName) {
    console.log('Checking UPCitemdb...');
    productName = await fetchFromUPCitemdb(upc);
  }

  // 3. Go-UPC
  if (!productName) {
    console.log('Checking Go-UPC...');
    productName = await fetchFromGoUPC(upc);
  }

  // 4. UPC Database
  if (!productName) {
    console.log('Checking UPC Database...');
    productName = await fetchFromUPCDatabase(upc);
  }

  // 5. Barcode Spider
  if (!productName) {
    console.log('Checking Barcode Spider...');
    productName = await fetchFromBarcodeSpider(upc);
  }

  const hasRealProductName = productName !== null;
  const productInfo = productName || `UPC: ${upc}`;
  console.log(`Final product info: ${productInfo} (from database: ${hasRealProductName})`);
  console.log(`Product info: ${productInfo}`);

  // Step 2: Enrich with Claude
  console.log('Enriching with Claude...');
  const enrichedData = await enrichWithClaude(productInfo, upc, hasRealProductName);

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
