import 'dotenv/config';
import { db } from './db';
import { distilleries } from '@shared/schema';

const distilleryData = [
  // Kentucky Bourbon (18)
  {
    name: "Buffalo Trace Distillery",
    location: "Frankfort, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1775,
    parentCompany: "Sazerac",
    website: "https://www.buffalotracedistillery.com",
    description: "One of the oldest continuously operating distilleries in America, producing legendary brands like Buffalo Trace, Eagle Rare, and Pappy Van Winkle."
  },
  {
    name: "Wild Turkey Distillery",
    location: "Lawrenceburg, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1869,
    parentCompany: "Campari Group",
    website: "https://www.wildturkeybourbon.com",
    description: "Known for bold, high-proof bourbons crafted by legendary master distiller Jimmy Russell."
  },
  {
    name: "Woodford Reserve Distillery",
    location: "Versailles, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1812,
    parentCompany: "Brown-Forman",
    website: "https://www.woodfordreserve.com",
    description: "Historic distillery producing premium small-batch bourbon with a focus on craft and tradition."
  },
  {
    name: "Maker's Mark Distillery",
    location: "Loretto, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1953,
    parentCompany: "Beam Suntory",
    website: "https://www.makersmark.com",
    description: "Famous for its hand-dipped red wax seal and wheated bourbon recipe."
  },
  {
    name: "Heaven Hill Distillery",
    location: "Bardstown, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1935,
    parentCompany: "Heaven Hill Brands",
    website: "https://www.heavenhill.com",
    description: "Family-owned distillery producing Evan Williams, Elijah Craig, and Henry McKenna."
  },
  {
    name: "Jim Beam Distillery",
    location: "Clermont, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1795,
    parentCompany: "Beam Suntory",
    website: "https://www.jimbeam.com",
    description: "World's best-selling bourbon brand, with over 200 years of family tradition."
  },
  {
    name: "Four Roses Distillery",
    location: "Lawrenceburg, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1888,
    parentCompany: "Kirin",
    website: "https://www.fourrosesbourbon.com",
    description: "Known for using 10 distinct bourbon recipes, creating unique blends and single barrels."
  },
  {
    name: "Barton 1792 Distillery",
    location: "Bardstown, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1879,
    parentCompany: "Sazerac",
    website: "https://www.1792bourbon.com",
    description: "Historic distillery producing 1792 bourbon and Very Old Barton."
  },
  {
    name: "Castle & Key Distillery",
    location: "Frankfort, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2018,
    parentCompany: null,
    website: "https://www.castleandkey.com",
    description: "Restored historic distillery on the site of the former Old Taylor Distillery."
  },
  {
    name: "Bardstown Bourbon Company",
    location: "Bardstown, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2016,
    parentCompany: null,
    website: "https://www.bardstownbourbon.com",
    description: "Modern craft distillery focused on collaborative series and innovative blending."
  },
  {
    name: "Rabbit Hole Distillery",
    location: "Louisville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2012,
    parentCompany: "Pernod Ricard",
    website: "https://www.rabbitholedistillery.com",
    description: "Urban distillery known for unique grain bills and innovative expressions."
  },
  {
    name: "Old Forester Distillery",
    location: "Louisville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1870,
    parentCompany: "Brown-Forman",
    website: "https://www.oldforester.com",
    description: "America's first bottled bourbon, continuously produced through Prohibition."
  },
  {
    name: "Michter's Distillery",
    location: "Louisville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 1753,
    parentCompany: null,
    website: "https://www.michters.com",
    description: "Historic brand revived with a focus on small batch quality over quantity."
  },
  {
    name: "Angel's Envy Distillery",
    location: "Louisville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2010,
    parentCompany: "Bacardi",
    website: "https://www.angelsenvy.com",
    description: "Known for port wine barrel-finished bourbon, founded by Lincoln Henderson."
  },
  {
    name: "Lux Row Distillers",
    location: "Bardstown, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2018,
    parentCompany: "Luxco",
    website: "https://www.luxrowdistillers.com",
    description: "Produces Ezra Brooks, Rebel, and Blood Oath bourbons."
  },
  {
    name: "Wilderness Trail Distillery",
    location: "Danville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2012,
    parentCompany: null,
    website: "https://www.wildernesstraildistillery.com",
    description: "Craft distillery known for sweet mash process and scientific approach."
  },
  {
    name: "New Riff Distillery",
    location: "Newport, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2014,
    parentCompany: null,
    website: "https://www.newriffdistilling.com",
    description: "Craft distillery committed to bottled-in-bond, no chill filtration production."
  },
  {
    name: "Peerless Distilling Co.",
    location: "Louisville, Kentucky",
    country: "USA",
    region: "Kentucky",
    type: "Bourbon",
    yearFounded: 2015,
    parentCompany: null,
    website: "https://www.kentuckypeerless.com",
    description: "Revived pre-Prohibition distillery producing small batch bourbon and rye."
  },

  // Indiana (2)
  {
    name: "MGP Ingredients",
    location: "Lawrenceburg, Indiana",
    country: "USA",
    region: "Indiana",
    type: "Bourbon",
    yearFounded: 1847,
    parentCompany: "MGP Ingredients Inc.",
    website: "https://www.mgpingredients.com",
    description: "Major contract distillery supplying many bourbon brands, known for high-rye recipes."
  },
  {
    name: "Ross & Squibb Distillery",
    location: "Lawrenceburg, Indiana",
    country: "USA",
    region: "Indiana",
    type: "Bourbon",
    yearFounded: 2020,
    parentCompany: "Penelope Bourbon",
    website: "https://www.penelopebourbon.com",
    description: "State-of-the-art distillery dedicated to Penelope Bourbon production."
  },

  // Tennessee (4)
  {
    name: "Jack Daniel Distillery",
    location: "Lynchburg, Tennessee",
    country: "USA",
    region: "Tennessee",
    type: "Tennessee Whiskey",
    yearFounded: 1866,
    parentCompany: "Brown-Forman",
    website: "https://www.jackdaniels.com",
    description: "World's best-selling American whiskey, known for Lincoln County Process charcoal mellowing."
  },
  {
    name: "George Dickel Distillery",
    location: "Tullahoma, Tennessee",
    country: "USA",
    region: "Tennessee",
    type: "Tennessee Whiskey",
    yearFounded: 1870,
    parentCompany: "Diageo",
    website: "https://www.georgedickel.com",
    description: "Classic Tennessee whisky using chill charcoal mellowing process."
  },
  {
    name: "Uncle Nearest Distillery",
    location: "Shelbyville, Tennessee",
    country: "USA",
    region: "Tennessee",
    type: "Tennessee Whiskey",
    yearFounded: 2017,
    parentCompany: "Uncle Nearest Inc.",
    website: "https://www.unclenearest.com",
    description: "Honors Nathan 'Nearest' Green, the first known African American master distiller."
  },
  {
    name: "Nelson's Green Brier Distillery",
    location: "Nashville, Tennessee",
    country: "USA",
    region: "Tennessee",
    type: "Tennessee Whiskey",
    yearFounded: 2014,
    parentCompany: null,
    website: "https://www.greenbrierdistillery.com",
    description: "Revived pre-Prohibition brand producing Belle Meade Bourbon."
  },

  // Texas (4)
  {
    name: "Balcones Distilling",
    location: "Waco, Texas",
    country: "USA",
    region: "Texas",
    type: "Bourbon",
    yearFounded: 2008,
    parentCompany: null,
    website: "https://www.balconesdistilling.com",
    description: "Award-winning craft distillery using Texas blue corn and innovative techniques."
  },
  {
    name: "Garrison Brothers Distillery",
    location: "Hye, Texas",
    country: "USA",
    region: "Texas",
    type: "Bourbon",
    yearFounded: 2006,
    parentCompany: null,
    website: "https://www.garrisonbros.com",
    description: "First legal whiskey distillery in Texas, producing bourbon from grain to glass."
  },
  {
    name: "Still Austin Whiskey Co.",
    location: "Austin, Texas",
    country: "USA",
    region: "Texas",
    type: "Bourbon",
    yearFounded: 2017,
    parentCompany: null,
    website: "https://www.stillaustin.com",
    description: "Urban distillery using Texas-grown grains and slow-water reduction."
  },
  {
    name: "Ironroot Republic Distillery",
    location: "Denison, Texas",
    country: "USA",
    region: "Texas",
    type: "Bourbon",
    yearFounded: 2014,
    parentCompany: null,
    website: "https://www.ironrootrepublic.com",
    description: "Innovative distillery using purple corn and heirloom grains."
  },

  // Other US (6)
  {
    name: "Westland Distillery",
    location: "Seattle, Washington",
    country: "USA",
    region: "Washington",
    type: "Single Malt",
    yearFounded: 2010,
    parentCompany: "Rémy Cointreau",
    website: "https://www.westlanddistillery.com",
    description: "American single malt producer using Pacific Northwest barley and peat."
  },
  {
    name: "Stranahan's Distillery",
    location: "Denver, Colorado",
    country: "USA",
    region: "Colorado",
    type: "Single Malt",
    yearFounded: 2004,
    parentCompany: "Proximo Spirits",
    website: "https://www.stranahans.com",
    description: "Pioneer of American single malt whiskey, using Rocky Mountain water."
  },
  {
    name: "High West Distillery",
    location: "Park City, Utah",
    country: "USA",
    region: "Utah",
    type: "Bourbon",
    yearFounded: 2007,
    parentCompany: "Constellation Brands",
    website: "https://www.highwest.com",
    description: "Known for innovative blends and unique finishes, Utah's first distillery since 1870."
  },
  {
    name: "Westward Whiskey",
    location: "Portland, Oregon",
    country: "USA",
    region: "Oregon",
    type: "Single Malt",
    yearFounded: 2004,
    parentCompany: "Diageo",
    website: "https://www.westwardwhiskey.com",
    description: "American single malt using Pacific Northwest pale malt and ale yeast."
  },
  {
    name: "FEW Spirits",
    location: "Evanston, Illinois",
    country: "USA",
    region: "Illinois",
    type: "Bourbon",
    yearFounded: 2011,
    parentCompany: "Samson & Surrey",
    website: "https://www.fewspirits.com",
    description: "Craft distillery in former Prohibition territory, producing small batch whiskeys."
  },
  {
    name: "Koval Distillery",
    location: "Chicago, Illinois",
    country: "USA",
    region: "Illinois",
    type: "Bourbon",
    yearFounded: 2008,
    parentCompany: null,
    website: "https://www.koval-distillery.com",
    description: "Organic grain-to-bottle distillery known for unique millet and oat whiskeys."
  },

  // Scotland - Speyside (6)
  {
    name: "The Macallan Distillery",
    location: "Craigellachie, Speyside",
    country: "Scotland",
    region: "Speyside",
    type: "Scotch",
    yearFounded: 1824,
    parentCompany: "Edrington Group",
    website: "https://www.themacallan.com",
    description: "Iconic Speyside distillery known for sherry cask maturation and luxury expressions."
  },
  {
    name: "Glenfiddich Distillery",
    location: "Dufftown, Speyside",
    country: "Scotland",
    region: "Speyside",
    type: "Scotch",
    yearFounded: 1887,
    parentCompany: "William Grant & Sons",
    website: "https://www.glenfiddich.com",
    description: "World's best-selling single malt Scotch, family-owned for five generations."
  },
  {
    name: "The Glenlivet Distillery",
    location: "Ballindalloch, Speyside",
    country: "Scotland",
    region: "Speyside",
    type: "Scotch",
    yearFounded: 1824,
    parentCompany: "Pernod Ricard",
    website: "https://www.theglenlivet.com",
    description: "The original licensed distillery in the Glenlivet region, setting the standard for Speyside."
  },
  {
    name: "The Balvenie Distillery",
    location: "Dufftown, Speyside",
    country: "Scotland",
    region: "Speyside",
    type: "Scotch",
    yearFounded: 1892,
    parentCompany: "William Grant & Sons",
    website: "https://www.thebalvenie.com",
    description: "Traditional distillery maintaining floor maltings and in-house cooperage."
  },
  {
    name: "Glenmorangie Distillery",
    location: "Tain, Highlands",
    country: "Scotland",
    region: "Highlands",
    type: "Scotch",
    yearFounded: 1843,
    parentCompany: "LVMH",
    website: "https://www.glenmorangie.com",
    description: "Known for Scotland's tallest stills and innovative cask finishes."
  },
  {
    name: "The Dalmore Distillery",
    location: "Alness, Highlands",
    country: "Scotland",
    region: "Highlands",
    type: "Scotch",
    yearFounded: 1839,
    parentCompany: "Whyte & Mackay",
    website: "https://www.thedalmore.com",
    description: "Highland distillery known for sherry cask maturation and the iconic stag emblem."
  },

  // Scotland - Islay (3)
  {
    name: "Lagavulin Distillery",
    location: "Port Ellen, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1816,
    parentCompany: "Diageo",
    website: "https://www.malts.com/en-gb/distilleries/lagavulin",
    description: "Legendary Islay distillery producing rich, smoky single malts."
  },
  {
    name: "Laphroaig Distillery",
    location: "Port Ellen, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1815,
    parentCompany: "Beam Suntory",
    website: "https://www.laphroaig.com",
    description: "Famous for intensely peated, medicinal character with loyal 'Friends of Laphroaig.'"
  },
  {
    name: "Ardbeg Distillery",
    location: "Port Ellen, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1815,
    parentCompany: "LVMH",
    website: "https://www.ardbeg.com",
    description: "Islay distillery known for complex, heavily peated single malts."
  },

  // Scotland - Other regions (3)
  {
    name: "Talisker Distillery",
    location: "Carbost, Isle of Skye",
    country: "Scotland",
    region: "Isle of Skye",
    type: "Scotch",
    yearFounded: 1830,
    parentCompany: "Diageo",
    website: "https://www.malts.com/en-gb/distilleries/talisker",
    description: "Only distillery on Isle of Skye, known for maritime, peppery character."
  },
  {
    name: "Highland Park Distillery",
    location: "Kirkwall, Orkney",
    country: "Scotland",
    region: "Orkney",
    type: "Scotch",
    yearFounded: 1798,
    parentCompany: "Edrington Group",
    website: "https://www.highlandparkwhisky.com",
    description: "Northernmost Scottish distillery, hand-turning own floor maltings."
  },
  {
    name: "Oban Distillery",
    location: "Oban, Highlands",
    country: "Scotland",
    region: "Highlands",
    type: "Scotch",
    yearFounded: 1794,
    parentCompany: "Diageo",
    website: "https://www.malts.com/en-gb/distilleries/oban",
    description: "Small coastal distillery bridging Highland and Island styles."
  },

  // Ireland (4)
  {
    name: "Midleton Distillery",
    location: "Midleton, County Cork",
    country: "Ireland",
    region: "Cork",
    type: "Irish",
    yearFounded: 1825,
    parentCompany: "Pernod Ricard",
    website: "https://www.midletonveryrate.com",
    description: "Home of Jameson, Redbreast, Powers, and Midleton Very Rare."
  },
  {
    name: "Old Bushmills Distillery",
    location: "Bushmills, County Antrim",
    country: "Ireland",
    region: "Northern Ireland",
    type: "Irish",
    yearFounded: 1608,
    parentCompany: "Proximo Spirits",
    website: "https://www.bushmills.com",
    description: "World's oldest licensed whiskey distillery, producing triple-distilled Irish whiskey."
  },
  {
    name: "Teeling Whiskey Distillery",
    location: "Dublin",
    country: "Ireland",
    region: "Dublin",
    type: "Irish",
    yearFounded: 2015,
    parentCompany: "Teeling Whiskey Company",
    website: "https://www.teelingwhiskey.com",
    description: "First new distillery in Dublin in over 125 years, known for innovative finishes."
  },
  {
    name: "Dingle Distillery",
    location: "Dingle, County Kerry",
    country: "Ireland",
    region: "Kerry",
    type: "Irish",
    yearFounded: 2012,
    parentCompany: null,
    website: "https://www.dingledistillery.ie",
    description: "Small batch craft distillery on Ireland's Wild Atlantic Way."
  },

  // Japan (5)
  {
    name: "Yamazaki Distillery",
    location: "Shimamoto, Osaka",
    country: "Japan",
    region: "Osaka",
    type: "Japanese",
    yearFounded: 1923,
    parentCompany: "Suntory",
    website: "https://www.suntory.com/factory/yamazaki",
    description: "Japan's first whisky distillery, founded by Shinjiro Torii."
  },
  {
    name: "Hakushu Distillery",
    location: "Hokuto, Yamanashi",
    country: "Japan",
    region: "Yamanashi",
    type: "Japanese",
    yearFounded: 1973,
    parentCompany: "Suntory",
    website: "https://www.suntory.com/factory/hakushu",
    description: "Forest distillery at 700m elevation, known for fresh, herbal character."
  },
  {
    name: "Yoichi Distillery",
    location: "Yoichi, Hokkaido",
    country: "Japan",
    region: "Hokkaido",
    type: "Japanese",
    yearFounded: 1934,
    parentCompany: "Nikka",
    website: "https://www.nikka.com/eng/distilleries/yoichi",
    description: "Founded by Masataka Taketsuru, using direct coal-fired pot stills."
  },
  {
    name: "Miyagikyo Distillery",
    location: "Sendai, Miyagi",
    country: "Japan",
    region: "Miyagi",
    type: "Japanese",
    yearFounded: 1969,
    parentCompany: "Nikka",
    website: "https://www.nikka.com/eng/distilleries/miyagikyo",
    description: "Nikka's second distillery, producing elegant, fruity single malts."
  },
  {
    name: "Chichibu Distillery",
    location: "Chichibu, Saitama",
    country: "Japan",
    region: "Saitama",
    type: "Japanese",
    yearFounded: 2008,
    parentCompany: "Venture Whisky",
    website: "https://www.facebook.com/ChichibuDistillery",
    description: "Small craft distillery founded by Ichiro Akuto, highly sought after."
  },

  // India (2)
  {
    name: "Amrut Distilleries",
    location: "Bangalore, Karnataka",
    country: "India",
    region: "Karnataka",
    type: "Single Malt",
    yearFounded: 1948,
    parentCompany: "N.R. Jagdale Group",
    website: "https://www.amrutdistilleries.com",
    description: "Pioneer of Indian single malt whisky, tropical maturation creates rapid aging."
  },
  {
    name: "Paul John Distillery",
    location: "Goa",
    country: "India",
    region: "Goa",
    type: "Single Malt",
    yearFounded: 1996,
    parentCompany: "John Distilleries",
    website: "https://www.pauljohnwhisky.com",
    description: "Award-winning Indian single malt using six-row barley and tropical climate."
  },

  // Canada (3)
  {
    name: "Crown Royal Distillery",
    location: "Gimli, Manitoba",
    country: "Canada",
    region: "Manitoba",
    type: "Canadian",
    yearFounded: 1939,
    parentCompany: "Diageo",
    website: "https://www.crownroyal.com",
    description: "Canada's best-selling whisky, created for the 1939 royal visit."
  },
  {
    name: "Hiram Walker Distillery",
    location: "Windsor, Ontario",
    country: "Canada",
    region: "Ontario",
    type: "Canadian",
    yearFounded: 1858,
    parentCompany: "Beam Suntory",
    website: "https://www.canadianclubwhisky.com",
    description: "Historic distillery producing Canadian Club and other premium Canadian whiskies."
  },
  {
    name: "Corby Spirit and Wine",
    location: "Windsor, Ontario",
    country: "Canada",
    region: "Ontario",
    type: "Canadian",
    yearFounded: 1859,
    parentCompany: "Pernod Ricard",
    website: "https://www.pernod-ricard.com",
    description: "Produces Lot 40 and other premium Canadian rye whiskies."
  },

  // Additional notable distilleries (8 more to reach ~75)
  {
    name: "Bruichladdich Distillery",
    location: "Bruichladdich, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1881,
    parentCompany: "Rémy Cointreau",
    website: "https://www.bruichladdich.com",
    description: "Innovative Islay distillery producing unpeated, peated (Port Charlotte), and super-heavily peated (Octomore) whisky."
  },
  {
    name: "Bowmore Distillery",
    location: "Bowmore, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1779,
    parentCompany: "Beam Suntory",
    website: "https://www.bowmore.com",
    description: "Oldest Islay distillery, maintaining floor maltings and moderate peat levels."
  },
  {
    name: "Springbank Distillery",
    location: "Campbeltown",
    country: "Scotland",
    region: "Campbeltown",
    type: "Scotch",
    yearFounded: 1828,
    parentCompany: "J & A Mitchell & Co",
    website: "https://www.springbank.scot",
    description: "Family-owned distillery performing 100% of production on-site, including malting."
  },
  {
    name: "Caol Ila Distillery",
    location: "Port Askaig, Islay",
    country: "Scotland",
    region: "Islay",
    type: "Scotch",
    yearFounded: 1846,
    parentCompany: "Diageo",
    website: "https://www.malts.com/en-gb/distilleries/caol-ila",
    description: "Largest distillery on Islay, known for lighter, more elegant peated style."
  },
  {
    name: "Redbreast (Midleton)",
    location: "Midleton, County Cork",
    country: "Ireland",
    region: "Cork",
    type: "Irish",
    yearFounded: 1903,
    parentCompany: "Pernod Ricard",
    website: "https://www.redbreastwhiskey.com",
    description: "Premium single pot still Irish whiskey brand produced at Midleton."
  },
  {
    name: "Tullamore D.E.W. Distillery",
    location: "Tullamore, County Offaly",
    country: "Ireland",
    region: "Offaly",
    type: "Irish",
    yearFounded: 2014,
    parentCompany: "William Grant & Sons",
    website: "https://www.tullamoredew.com",
    description: "New state-of-the-art distillery for the historic Tullamore D.E.W. brand."
  },
  {
    name: "Starward Distillery",
    location: "Melbourne, Victoria",
    country: "Australia",
    region: "Victoria",
    type: "Single Malt",
    yearFounded: 2007,
    parentCompany: null,
    website: "https://www.starward.com.au",
    description: "Australian whisky matured in red wine barrels from local wineries."
  },
  {
    name: "Kavalan Distillery",
    location: "Yilan County",
    country: "Taiwan",
    region: "Yilan",
    type: "Single Malt",
    yearFounded: 2005,
    parentCompany: "King Car Group",
    website: "https://www.kavalanwhisky.com",
    description: "Award-winning Taiwanese distillery with rapid tropical maturation."
  }
];

async function seedDistilleries() {
  console.log('Seeding distilleries...');

  // Check if distilleries already exist
  const existing = await db.select().from(distilleries);
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} distilleries. Skipping seed.`);
    process.exit(0);
  }

  let count = 0;
  for (const data of distilleryData) {
    await db.insert(distilleries).values(data);
    count++;
    if (count % 10 === 0) {
      console.log(`  Inserted ${count} distilleries...`);
    }
  }

  console.log(`\nSeeded ${count} distilleries successfully!`);
  process.exit(0);
}

seedDistilleries().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
