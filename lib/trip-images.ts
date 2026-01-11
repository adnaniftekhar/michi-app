/**
 * Trip location images - curated images for cities and countries
 * All images are kid-safe from Unsplash
 */

// Major city images - iconic landmarks/scenery
const CITY_IMAGES: Record<string, string[]> = {
  // USA Cities
  'new york': [
    '1496442226666-8d4d0e62e6e9', // NYC skyline
    '1480714378408-67cf0d13bc1b', // NYC buildings
    '1534430480872-3498386e7856', // Manhattan
    '1518235506717-e1ed3306a89b', // Brooklyn Bridge
    '1499092346589-b9b6be3e94b2', // Times Square area
  ],
  'nyc': ['1496442226666-8d4d0e62e6e9', '1480714378408-67cf0d13bc1b', '1534430480872-3498386e7856'],
  'manhattan': ['1496442226666-8d4d0e62e6e9', '1534430480872-3498386e7856'],
  'brooklyn': ['1518235506717-e1ed3306a89b', '1480714378408-67cf0d13bc1b'],
  'los angeles': [
    '1534190760961-74e8c1c5c3da', // LA skyline
    '1515896769750-31548aa180ed', // Hollywood
    '1506146332389-18140dc7b2fb', // Beach
  ],
  'la': ['1534190760961-74e8c1c5c3da', '1515896769750-31548aa180ed'],
  'san francisco': [
    '1501594907352-04cda38ebc29', // Golden Gate
    '1521464302861-ce943915d1c3', // SF hills
    '1506146332389-18140dc7b2fb', // Bay
  ],
  'sf': ['1501594907352-04cda38ebc29', '1521464302861-ce943915d1c3'],
  'chicago': [
    '1477959858617-67f85cf4f1df', // Chicago skyline
    '1494522855154-9297ac14b55f', // Downtown
  ],
  'miami': [
    '1506966953602-c20cc11f75e3', // Miami beach
    '1514214246283-d427a95c5d2f', // South Beach
  ],
  'seattle': [
    '1502175353174-a7a70e73b4c3', // Space Needle
    '1507608443039-bfde4fbcd142', // Seattle skyline
  ],
  'boston': [
    '1501979376754-1d90542e0fe5', // Boston skyline
    '1572120360610-d971b9d7767c', // Historic Boston
  ],
  'washington': [
    '1501466044931-62695aada8e9', // Capitol
    '1558328347-3e1c0620c7b2', // DC monuments
  ],
  'dc': ['1501466044931-62695aada8e9', '1558328347-3e1c0620c7b2'],

  // European Cities
  'paris': [
    '1502602898657-3e91760cbb34', // Eiffel Tower
    '1499856871958-5b9627545d1a', // Paris streets
    '1478391679764-b2d8b3cd1e94', // Seine
    '1509439581779-6298f75bf6e5', // Notre Dame area
  ],
  'london': [
    '1513635269975-59663e0ac1ad', // Big Ben
    '1520986606214-8b456906c813', // Tower Bridge
    '1505761671935-60b3a7427bad', // London skyline
  ],
  'rome': [
    '1552832230-c0197dd311b5', // Colosseum
    '1515542622106-78bda8ba0e5b', // Roman ruins
    '1529260830199-42c24126f198', // Rome streets
  ],
  'barcelona': [
    '1539037116277-4db20889f2d4', // Sagrada Familia
    '1558618666-fcd25c85cd64', // Barcelona beach
  ],
  'amsterdam': [
    '1512470876399-e391ea77bc0a', // Canals
    '1558618047-3c8c76ca7d13', // Dutch houses
  ],
  'berlin': [
    '1560969184-10fe8719e047', // Brandenburg Gate
    '1528728329032-2972f65dfb3f', // Berlin Wall art
  ],
  'munich': [
    '1577462281852-5c8e36482e7b', // Munich architecture
    '1567359781514-3b964e2b04d6', // Bavarian
  ],
  'vienna': [
    '1516550893923-42d28e5677af', // Vienna palace
    '1519677100203-a0e668c92439', // Austrian architecture
  ],
  'prague': [
    '1519677100203-a0e668c92439', // Prague castle
    '1541849546-216549ae216d', // Old town
  ],
  'venice': [
    '1514890547357-a9ee288728e0', // Venice canals
    '1523906834658-6e24ef2386f9', // Gondolas
  ],
  'florence': [
    '1534445867742-43195f401b6c', // Duomo
    '1515859005217-8a1f08870f59', // Tuscany
  ],

  // Asian Cities
  'tokyo': [
    '1540959733332-eab4deabeeaf', // Tokyo skyline
    '1536098561742-ca998e48cbcc', // Shibuya
    '1503899036084-c55cdd92da26', // Tokyo tower
  ],
  'kyoto': [
    '1493976040374-85c8e12f0c0e', // Temples
    '1528360983277-13d401cdc186', // Bamboo forest
  ],
  'seoul': [
    '1534274867514-d5b47ef89ed7', // Seoul skyline
    '1548115184-bc6544d06a58', // Palaces
  ],
  'singapore': [
    '1525625293386-3f8f99389edd', // Marina Bay
    '1508964942454-1a56651d54ac', // Gardens by Bay
  ],
  'hong kong': [
    '1536599018102-9f803c014336', // Victoria Peak
    '1517144447511-aae2b5b34c65', // HK skyline
  ],
  'bangkok': [
    '1508009603885-50cf7c579365', // Temples
    '1552465011-b4e21bf6e79a', // Thai architecture
  ],
  'dubai': [
    '1512453979834-a2d3c8e1a5b4', // Burj Khalifa
    '1518684079-3c830dcef090', // Dubai skyline
  ],

  // Australia/Oceania
  'sydney': [
    '1506973035872-a4ec16b8e8d9', // Opera House
    '1524293581917-878a6d017c71', // Harbour Bridge
  ],
  'melbourne': [
    '1514395462725-fb4566210144', // Melbourne lanes
    '1545044846-351ba5a7e9a7', // City skyline
  ],

  // South America
  'rio': [
    '1483729558449-99ef09a8c325', // Christ Redeemer
    '1544989164-a68d9b32a8f5', // Copacabana
  ],
  'rio de janeiro': ['1483729558449-99ef09a8c325', '1544989164-a68d9b32a8f5'],
  'buenos aires': [
    '1588438456182-1f5a85e47f07', // BA architecture
    '1518098268026-4e89f1a2cd8e', // Colorful houses
  ],

  // Other
  'toronto': [
    '1517090504951-93a0f2311ff9', // CN Tower
    '1517935706615-2717063c2225', // Toronto skyline
  ],
  'vancouver': [
    '1559511260-66a654ae982a', // Mountains and city
    '1506146332389-18140dc7b2fb', // Coast
  ],
  'mexico city': [
    '1518659526054-190d898ade3f', // Zocalo
    '1585464231568-a1c2c8a8a42d', // Mexican architecture
  ],
  'cairo': [
    '1539650116574-8efeb43e2750', // Pyramids
    '1553913861-c372ad39a293', // Egyptian
  ],
  'cape town': [
    '1580060839134-75a5edca2e99', // Table Mountain
    '1516026672322-bc52d61a55d5', // Cape coast
  ],
  'marrakech': [
    '1489749798305-4fea3ae63d43', // Moroccan architecture
    '1534154391089-9404c4a6feb5', // Souks
  ],
}

// Country fallback images
const COUNTRY_IMAGES: Record<string, string[]> = {
  'usa': ['1485738422979-f5c462d49f74', '1501594907352-04cda38ebc29', '1480714378408-67cf0d13bc1b'],
  'united states': ['1485738422979-f5c462d49f74', '1501594907352-04cda38ebc29'],
  'uk': ['1513635269975-59663e0ac1ad', '1520986606214-8b456906c813'],
  'united kingdom': ['1513635269975-59663e0ac1ad', '1520986606214-8b456906c813'],
  'england': ['1513635269975-59663e0ac1ad', '1520986606214-8b456906c813'],
  'france': ['1502602898657-3e91760cbb34', '1499856871958-5b9627545d1a'],
  'italy': ['1552832230-c0197dd311b5', '1514890547357-a9ee288728e0'],
  'spain': ['1539037116277-4db20889f2d4', '1558618666-fcd25c85cd64'],
  'germany': ['1560969184-10fe8719e047', '1528728329032-2972f65dfb3f'],
  'japan': ['1540959733332-eab4deabeeaf', '1493976040374-85c8e12f0c0e'],
  'china': ['1508804185872-d7badad00f7d', '1547981609-4b6bfe67ca0b'],
  'australia': ['1506973035872-a4ec16b8e8d9', '1524293581917-878a6d017c71'],
  'brazil': ['1483729558449-99ef09a8c325', '1544989164-a68d9b32a8f5'],
  'mexico': ['1518659526054-190d898ade3f', '1585464231568-a1c2c8a8a42d'],
  'canada': ['1517090504951-93a0f2311ff9', '1559511260-66a654ae982a'],
  'india': ['1524492412937-b28074a5d7da', '1564507592333-df0c3f51c18b'],
  'egypt': ['1539650116574-8efeb43e2750', '1553913861-c372ad39a293'],
  'morocco': ['1489749798305-4fea3ae63d43', '1534154391089-9404c4a6feb5'],
  'south africa': ['1580060839134-75a5edca2e99', '1516026672322-bc52d61a55d5'],
  'thailand': ['1508009603885-50cf7c579365', '1552465011-b4e21bf6e79a'],
  'vietnam': ['1528127269322-539c59a5d6d7', '1555921015-5532091f6cbe'],
  'greece': ['1533105079780-92b9be482077', '1530841377377-3ff06c0ca713'],
  'netherlands': ['1512470876399-e391ea77bc0a', '1558618047-3c8c76ca7d13'],
  'portugal': ['1555881400-74d7acaacd8b', '1558618047-3c8c76ca7d13'],
  'switzerland': ['1530122037265-a5f1f91d3b99', '1506905925346-21bda4d32df4'],
  'austria': ['1516550893923-42d28e5677af', '1519677100203-a0e668c92439'],
  'czech republic': ['1519677100203-a0e668c92439', '1541849546-216549ae216d'],
  'ireland': ['1533174072545-7a4b6ad7a6c3', '1518855706573-84de4022b69b'],
  'scotland': ['1506377247377-2a5b3b417ebb', '1551522435-a2cab2b9f2a5'],
  'singapore': ['1525625293386-3f8f99389edd', '1508964942454-1a56651d54ac'],
  'uae': ['1512453979834-a2d3c8e1a5b4', '1518684079-3c830dcef090'],
  'south korea': ['1534274867514-d5b47ef89ed7', '1548115184-bc6544d06a58'],
}

// Generic travel images as final fallback
const GENERIC_TRAVEL_IMAGES = [
  '1500835556837-99ac94a94552', // Airplane
  '1476514525535-07fb3b4ae5f1', // Travel adventure
  '1503220317375-aabd63ab2fd7', // Travel destination
  '1501785888041-af3ef285b470', // Scenic view
  '1469854523086-cc02fe5d8800', // Road trip
  '1520250497591-112f2f40a3f4', // Travel scene
  '1530521954074-e64f6810b32d', // Adventure
  '1527631746610-bca00a040d60', // Exploration
  '1502003148287-a82ef80a6abc', // Journey
  '1517760444937-f6397edcbbcd', // Travel landscape
]

/**
 * Get an image URL for a trip based on its location
 */
export function getTripImageUrl(location: string, index: number = 0): string {
  const locationLower = location.toLowerCase().trim()
  
  // Try to find city-specific images first
  for (const [city, images] of Object.entries(CITY_IMAGES)) {
    if (locationLower.includes(city) || city.includes(locationLower.split(',')[0].trim())) {
      const imageId = images[index % images.length]
      return `https://images.unsplash.com/photo-${imageId}?w=600&h=400&fit=crop&auto=format&q=80`
    }
  }
  
  // Try country-specific images
  for (const [country, images] of Object.entries(COUNTRY_IMAGES)) {
    if (locationLower.includes(country)) {
      const imageId = images[index % images.length]
      return `https://images.unsplash.com/photo-${imageId}?w=600&h=400&fit=crop&auto=format&q=80`
    }
  }
  
  // Use generic travel images as fallback
  const imageId = GENERIC_TRAVEL_IMAGES[index % GENERIC_TRAVEL_IMAGES.length]
  return `https://images.unsplash.com/photo-${imageId}?w=600&h=400&fit=crop&auto=format&q=80`
}

/**
 * Get alt text for a trip image
 */
export function getTripImageAlt(location: string): string {
  return `Trip to ${location}`
}
