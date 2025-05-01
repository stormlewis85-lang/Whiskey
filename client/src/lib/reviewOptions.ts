// All available options for review form selections

// Visual
export const COLOR_OPTIONS = [
  { value: 'pale-straw', label: 'Pale Straw', hex: '#F8F4E3' },
  { value: 'straw', label: 'Straw', hex: '#E8DFB5' },
  { value: 'pale-gold', label: 'Pale Gold', hex: '#E6C17D' },
  { value: 'yellow-gold', label: 'Yellow Gold', hex: '#FFD700' },
  { value: 'gold', label: 'Gold', hex: '#D4AF37' },
  { value: 'deep-gold', label: 'Deep Gold', hex: '#996515' },
  { value: 'amber', label: 'Amber', hex: '#FFBF00' },
  { value: 'deep-amber', label: 'Deep Amber', hex: '#D2691E' },
  { value: 'bronze', label: 'Bronze', hex: '#CD7F32' },
  { value: 'copper', label: 'Copper', hex: '#B87333' },
  { value: 'russet', label: 'Russet', hex: '#80461B' },
  { value: 'mahogany', label: 'Mahogany', hex: '#C04000' },
  { value: 'auburn', label: 'Auburn', hex: '#A52A2A' },
  { value: 'tawny', label: 'Tawny', hex: '#CD5700' },
  { value: 'chestnut', label: 'Chestnut', hex: '#954535' },
  { value: 'brown', label: 'Brown', hex: '#964B00' },
  { value: 'dark-brown', label: 'Dark Brown', hex: '#654321' },
  { value: 'ruby', label: 'Ruby', hex: '#9B111E' },
  { value: 'garnet', label: 'Garnet', hex: '#733635' },
  { value: 'dark-mahogany', label: 'Dark Mahogany', hex: '#4E2728' }
];

export const VISCOSITY_OPTIONS = [
  { value: 'no-legs', label: 'No Legs' },
  { value: 'light-legs', label: 'Light Legs' },
  { value: 'medium-legs', label: 'Medium Legs' },
  { value: 'heavy-legs', label: 'Heavy Legs' }
];

export const CLARITY_OPTIONS = [
  { value: 'crystal-clear', label: 'Crystal Clear' },
  { value: 'clear', label: 'Clear' },
  { value: 'hazy', label: 'Hazy' },
  { value: 'cloudy', label: 'Cloudy' }
];

// Aroma and Flavor Options categorized
export const AROMA_FLAVOR_OPTIONS = {
  sweet: [
    { value: 'vanilla', label: 'Vanilla' },
    { value: 'caramel', label: 'Caramel' },
    { value: 'butterscotch', label: 'Butterscotch' },
    { value: 'honey', label: 'Honey' },
    { value: 'maple', label: 'Maple' },
    { value: 'brown-sugar', label: 'Brown Sugar' },
    { value: 'toffee', label: 'Toffee' },
    { value: 'molasses', label: 'Molasses' },
    { value: 'chocolate', label: 'Chocolate' }
  ],
  spice: [
    { value: 'cinnamon', label: 'Cinnamon' },
    { value: 'clove', label: 'Clove' },
    { value: 'nutmeg', label: 'Nutmeg' },
    { value: 'allspice', label: 'Allspice' },
    { value: 'pepper', label: 'Pepper' },
    { value: 'ginger', label: 'Ginger' },
    { value: 'anise', label: 'Anise' },
    { value: 'licorice', label: 'Licorice' },
    { value: 'cardamom', label: 'Cardamom' }
  ],
  fruit: [
    { value: 'apple', label: 'Apple' },
    { value: 'pear', label: 'Pear' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'orange', label: 'Orange' },
    { value: 'lemon', label: 'Lemon' },
    { value: 'apricot', label: 'Apricot' },
    { value: 'peach', label: 'Peach' },
    { value: 'raisin', label: 'Raisin' },
    { value: 'plum', label: 'Plum' },
    { value: 'fig', label: 'Fig' }
  ],
  wood: [
    { value: 'oak', label: 'Oak' },
    { value: 'cedar', label: 'Cedar' },
    { value: 'tobacco', label: 'Tobacco' },
    { value: 'leather', label: 'Leather' },
    { value: 'toasted-wood', label: 'Toasted Wood' },
    { value: 'char', label: 'Char' },
    { value: 'smoke', label: 'Smoke' },
    { value: 'sandalwood', label: 'Sandalwood' },
    { value: 'sawdust', label: 'Sawdust' }
  ],
  grain: [
    { value: 'corn', label: 'Corn' },
    { value: 'rye', label: 'Rye' },
    { value: 'wheat', label: 'Wheat' },
    { value: 'barley', label: 'Barley' },
    { value: 'malt', label: 'Malt' },
    { value: 'cereal', label: 'Cereal' },
    { value: 'bread', label: 'Bread' },
    { value: 'toast', label: 'Toast' },
    { value: 'popcorn', label: 'Popcorn' }
  ]
};

// Mouthfeel options
export const ALCOHOL_FEEL_OPTIONS = [
  { value: 'smooth', label: 'Smooth' },
  { value: 'mild-heat', label: 'Mild Heat' },
  { value: 'warming', label: 'Warming' },
  { value: 'hot', label: 'Hot' },
  { value: 'burning', label: 'Burning' }
];

export const MOUTHFEEL_VISCOSITY_OPTIONS = [
  { value: 'thin', label: 'Thin' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'full', label: 'Full' },
  { value: 'thick', label: 'Thick/Chewy' }
];

export const PLEASANTNESS_OPTIONS = [
  { value: 'unpleasant', label: 'Unpleasant' },
  { value: 'acceptable', label: 'Acceptable' },
  { value: 'pleasant', label: 'Pleasant' },
  { value: 'very-pleasant', label: 'Very Pleasant' }
];

// Finish options
export const FINISH_LENGTH_OPTIONS = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
  { value: 'very-long', label: 'Very Long' }
];

// Value options
export const AVAILABILITY_OPTIONS = [
  { value: 'everywhere', label: 'Everywhere' },
  { value: 'some-places', label: 'Some Places' },
  { value: 'rare', label: 'Rare' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'unicorn', label: 'Unicorn' }
];

export const BUY_AGAIN_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'if-price-right', label: 'If Price is Right' },
  { value: 'must-have', label: 'Must Have' },
  { value: 'splurge-worthy', label: 'Splurge Worthy' }
];

export const OCCASION_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'mixer', label: 'Mixer' },
  { value: 'daily-pour', label: 'Daily Pour' },
  { value: 'showing-off', label: 'Showing Off' },
  { value: 'special-occasion', label: 'Special Occasion' }
];

// Numerical score options (1-5)
export const SCORE_OPTIONS = [
  { value: 1, label: '1 - Poor' },
  { value: 2, label: '2 - Below Average' },
  { value: 3, label: '3 - Average' },
  { value: 4, label: '4 - Good' },
  { value: 5, label: '5 - Excellent' }
];