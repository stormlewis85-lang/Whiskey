# WhiskeyPedia Review System

## Philosophy

Standard 5-star ratings are too simplistic for whiskey enthusiasts. A whiskey might have an incredible nose but a short finish, or be an amazing value despite being "imperfect." The 6-component weighted system captures this nuance while still outputting familiar formats for sharing.

## The 6 Components

| Component | Weight | Rationale |
|-----------|--------|-----------|
| **Taste** | 3.0x | The primary experience. Most important factor. |
| **Finish** | 2.5x | How long and pleasantly it lingers. Separates good from great. |
| **Mouthfeel** | 2.0x | Texture, body, viscosity. Often overlooked but crucial. |
| **Nose** | 1.5x | Aroma sets expectations. Important but not dominant. |
| **Value** | 1.0x | Price-to-quality ratio. Keeps ratings grounded. |
| **Overall** | 1.0x | Gut feeling. Captures intangibles. |

**Total weight:** 11.0

## Scoring Scale

Each component is scored 1-10:

| Score | Meaning |
|-------|---------|
| 1-2 | Undrinkable / Terrible |
| 3-4 | Below average / Disappointing |
| 5-6 | Average / Acceptable |
| 7-8 | Good / Enjoyable |
| 9 | Excellent / Exceptional |
| 10 | Perfect / Transcendent |

## Calculation Algorithm

### Step 1: Weighted Score (0-10)
```javascript
function calculateWeightedScore(scores) {
  const weights = {
    taste: 3.0,
    finish: 2.5,
    mouthfeel: 2.0,
    nose: 1.5,
    value: 1.0,
    overall: 1.0
  };
  
  const totalWeight = 11.0;
  
  const weightedSum = 
    (scores.taste * weights.taste) +
    (scores.finish * weights.finish) +
    (scores.mouthfeel * weights.mouthfeel) +
    (scores.nose * weights.nose) +
    (scores.value * weights.value) +
    (scores.overall * weights.overall);
  
  return weightedSum / totalWeight;
}
```

### Step 2: Star Rating (1-5, half-star increments)
```javascript
function calculateStarRating(weightedScore) {
  // Map 1-10 to 1-5
  const rawStars = ((weightedScore - 1) / 9) * 4 + 1;
  
  // Round to nearest 0.5
  return Math.round(rawStars * 2) / 2;
}
```

Mapping examples:
| Weighted | Stars |
|----------|-------|
| 1.0 | 1.0 |
| 3.0 | 1.5 |
| 5.0 | 2.5 |
| 5.5 | 3.0 |
| 7.0 | 3.5 |
| 8.0 | 4.0 |
| 9.0 | 4.5 |
| 10.0 | 5.0 |

### Step 3: 100-Point Rating
```javascript
function calculatePointRating(weightedScore) {
  // Map 1-10 to 50-100 (industry standard range)
  // A truly average whiskey (5.5 weighted) = 75 points
  const points = 50 + (weightedScore - 1) * (50 / 9);
  
  return Math.round(points);
}
```

Mapping examples:
| Weighted | Points |
|----------|--------|
| 1.0 | 50 |
| 5.0 | 72 |
| 5.5 | 75 |
| 7.0 | 83 |
| 8.0 | 89 |
| 9.0 | 94 |
| 10.0 | 100 |

## Complete Scoring Function

```typescript
interface ReviewScores {
  taste: number;      // 1-10
  finish: number;     // 1-10
  mouthfeel: number;  // 1-10
  nose: number;       // 1-10
  value: number;      // 1-10
  overall: number;    // 1-10
}

interface CalculatedScores {
  weightedScore: number;  // 1-10, 2 decimal places
  starRating: number;     // 1-5, half-star increments
  pointRating: number;    // 50-100, integer
}

function calculateAllScores(scores: ReviewScores): CalculatedScores {
  const weights = {
    taste: 3.0,
    finish: 2.5,
    mouthfeel: 2.0,
    nose: 1.5,
    value: 1.0,
    overall: 1.0
  };
  
  const totalWeight = 11.0;
  
  // Weighted score
  const weightedSum = 
    (scores.taste * weights.taste) +
    (scores.finish * weights.finish) +
    (scores.mouthfeel * weights.mouthfeel) +
    (scores.nose * weights.nose) +
    (scores.value * weights.value) +
    (scores.overall * weights.overall);
  
  const weightedScore = Math.round((weightedSum / totalWeight) * 100) / 100;
  
  // Star rating (1-5, 0.5 increments)
  const rawStars = ((weightedScore - 1) / 9) * 4 + 1;
  const starRating = Math.round(rawStars * 2) / 2;
  
  // Point rating (50-100)
  const rawPoints = 50 + (weightedScore - 1) * (50 / 9);
  const pointRating = Math.round(rawPoints);
  
  return {
    weightedScore,
    starRating,
    pointRating
  };
}
```

## Example Calculations

### Example 1: Excellent Bourbon
```
Taste: 9, Finish: 8, Mouthfeel: 8, Nose: 9, Value: 7, Overall: 9

Weighted = (9×3 + 8×2.5 + 8×2 + 9×1.5 + 7×1 + 9×1) / 11
         = (27 + 20 + 16 + 13.5 + 7 + 9) / 11
         = 92.5 / 11
         = 8.41

Stars = ((8.41 - 1) / 9) × 4 + 1 = 4.29 → 4.5 stars
Points = 50 + (8.41 - 1) × (50/9) = 91
```

### Example 2: Good Value Whiskey
```
Taste: 7, Finish: 6, Mouthfeel: 7, Nose: 6, Value: 9, Overall: 7

Weighted = (7×3 + 6×2.5 + 7×2 + 6×1.5 + 9×1 + 7×1) / 11
         = (21 + 15 + 14 + 9 + 9 + 7) / 11
         = 75 / 11
         = 6.82

Stars = ((6.82 - 1) / 9) × 4 + 1 = 3.58 → 3.5 stars
Points = 50 + (6.82 - 1) × (50/9) = 82
```

## Flavor Tags

Flavor tags are curated descriptors grouped by category:

### Categories
```javascript
const flavorCategories = {
  sweet: [
    'vanilla', 'caramel', 'honey', 'brown sugar', 'maple',
    'butterscotch', 'toffee', 'molasses', 'dark chocolate'
  ],
  fruit: [
    'apple', 'pear', 'cherry', 'orange', 'lemon', 'dried fruit',
    'raisin', 'fig', 'apricot', 'banana', 'tropical'
  ],
  spice: [
    'cinnamon', 'nutmeg', 'clove', 'allspice', 'black pepper',
    'white pepper', 'ginger', 'anise', 'mint'
  ],
  oak: [
    'oak', 'char', 'smoke', 'toast', 'wood', 'cedar',
    'sandalwood', 'sawdust'
  ],
  grain: [
    'corn', 'wheat', 'rye', 'barley', 'malt', 'bread',
    'biscuit', 'cereal', 'oatmeal'
  ],
  floral: [
    'rose', 'lavender', 'jasmine', 'honeysuckle', 'violet',
    'orange blossom', 'chamomile'
  ],
  nutty: [
    'almond', 'walnut', 'pecan', 'hazelnut', 'peanut',
    'marzipan', 'coconut'
  ],
  savory: [
    'leather', 'tobacco', 'coffee', 'cocoa', 'earth',
    'mushroom', 'grass', 'hay'
  ]
};
```

### UI Implementation
- Display as collapsible accordions by category
- Chips/tags for selection (multi-select)
- Show top 3-5 tags on whiskey cards
- Allow clicking tag to filter collection

## Testing the Review System

### Unit Tests Required
```javascript
describe('Review Scoring', () => {
  it('calculates weighted score correctly', () => {
    const scores = { taste: 8, finish: 8, mouthfeel: 7, nose: 8, value: 9, overall: 8 };
    const result = calculateAllScores(scores);
    expect(result.weightedScore).toBeCloseTo(8.05, 2);
  });
  
  it('converts to star rating with half-star precision', () => {
    expect(calculateStarRating(8.05)).toBe(4.0);
    expect(calculateStarRating(9.0)).toBe(4.5);
    expect(calculateStarRating(5.5)).toBe(3.0);
  });
  
  it('converts to 100-point scale', () => {
    expect(calculatePointRating(8.05)).toBe(89);
    expect(calculatePointRating(5.5)).toBe(75);
  });
  
  it('handles edge cases', () => {
    const min = { taste: 1, finish: 1, mouthfeel: 1, nose: 1, value: 1, overall: 1 };
    const max = { taste: 10, finish: 10, mouthfeel: 10, nose: 10, value: 10, overall: 10 };
    
    expect(calculateAllScores(min).pointRating).toBe(50);
    expect(calculateAllScores(max).pointRating).toBe(100);
    expect(calculateAllScores(min).starRating).toBe(1.0);
    expect(calculateAllScores(max).starRating).toBe(5.0);
  });
});
```

## Important Notes

1. **Never modify the weights** without explicit instruction—this is core IP
2. **Always recalculate** derived scores when any component changes
3. **Store all scores** in the database (don't rely on client calculation)
4. **Validate inputs** are 1-10 integers before calculation
5. **Round appropriately** at each step to avoid floating point issues
