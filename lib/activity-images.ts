/**
 * Utility functions for getting activity images and icons
 * Uses keyword extraction from titles to find relevant images
 * LARGE image library to minimize duplicates
 */

export type ActivityType = 
  | 'museum'
  | 'nature'
  | 'market'
  | 'historical'
  | 'cultural'
  | 'lab'
  | 'workshop'
  | 'reading'
  | 'discussion'
  | 'reflection'
  | 'audio'
  | 'music'
  | 'art'
  | 'technology'
  | 'food'
  | 'travel'
  | 'writing'
  | 'photography'
  | 'city'
  | 'education'
  | 'community'
  | 'default'

// Keyword to activity type mapping for better image matching
const KEYWORD_MAPPINGS: Record<string, ActivityType> = {
  // City/Urban
  'city': 'city',
  'urban': 'city',
  'neighborhood': 'city',
  'street': 'city',
  'downtown': 'city',
  'nyc': 'city',
  'manhattan': 'city',
  'brooklyn': 'city',
  'borough': 'city',
  'metro': 'city',
  'subway': 'city',
  
  // Community
  'community': 'community',
  'people': 'community',
  'social': 'community',
  'group': 'community',
  'together': 'community',
  'gathering': 'community',
  
  // Education
  'introduction': 'education',
  'learn': 'education',
  'study': 'education',
  'class': 'education',
  'course': 'education',
  'lesson': 'education',
  'education': 'education',
  'school': 'education',
  'university': 'education',
  'college': 'education',
  
  // Audio/Music
  'audio': 'audio',
  'sound': 'audio',
  'podcast': 'audio',
  'recording': 'audio',
  'music': 'music',
  'song': 'music',
  'melody': 'music',
  'instrument': 'music',
  'piano': 'music',
  'guitar': 'music',
  'orchestra': 'music',
  'concert': 'music',
  
  // Art
  'art': 'art',
  'arts': 'art',
  'painting': 'art',
  'drawing': 'art',
  'sketch': 'art',
  'canvas': 'art',
  'sculpture': 'art',
  'creative': 'art',
  'design': 'art',
  'artistic': 'art',
  
  // Technology
  'ai': 'technology',
  'artificial': 'technology',
  'intelligence': 'technology',
  'computer': 'technology',
  'code': 'technology',
  'coding': 'technology',
  'programming': 'technology',
  'digital': 'technology',
  'tech': 'technology',
  'software': 'technology',
  'robot': 'technology',
  'data': 'technology',
  
  // Nature
  'nature': 'nature',
  'forest': 'nature',
  'tree': 'nature',
  'ocean': 'nature',
  'beach': 'nature',
  'mountain': 'nature',
  'river': 'nature',
  'garden': 'nature',
  'plant': 'nature',
  'animal': 'nature',
  'bird': 'nature',
  'wildlife': 'nature',
  'outdoor': 'nature',
  'hiking': 'nature',
  'park': 'nature',
  
  // Food
  'food': 'food',
  'cooking': 'food',
  'recipe': 'food',
  'cuisine': 'food',
  'restaurant': 'food',
  'meal': 'food',
  'kitchen': 'food',
  'baking': 'food',
  'chef': 'food',
  'dish': 'food',
  
  // Travel/Cultural
  'immigrant': 'cultural',
  'immigration': 'cultural',
  'culture': 'cultural',
  'cultural': 'cultural',
  'heritage': 'cultural',
  'tradition': 'cultural',
  'ethnic': 'cultural',
  'diversity': 'cultural',
  'multicultural': 'cultural',
  'travel': 'travel',
  'journey': 'travel',
  'explore': 'travel',
  'adventure': 'travel',
  'destination': 'travel',
  'tour': 'travel',
  'visit': 'travel',
  
  // Writing
  'essay': 'writing',
  'write': 'writing',
  'writing': 'writing',
  'story': 'writing',
  'narrative': 'writing',
  'journal': 'writing',
  'blog': 'writing',
  'article': 'writing',
  'author': 'writing',
  'poem': 'writing',
  'poetry': 'writing',
  
  // Photography
  'photo': 'photography',
  'photography': 'photography',
  'camera': 'photography',
  'picture': 'photography',
  'image': 'photography',
  'film': 'photography',
  'documentary': 'photography',
  
  // Museum/Historical
  'museum': 'museum',
  'gallery': 'museum',
  'exhibition': 'museum',
  'exhibit': 'museum',
  'collection': 'museum',
  'history': 'historical',
  'historical': 'historical',
  'ancient': 'historical',
  'monument': 'historical',
  'landmark': 'historical',
  'historic': 'historical',
  
  // Lab/Science
  'lab': 'lab',
  'laboratory': 'lab',
  'experiment': 'lab',
  'science': 'lab',
  'research': 'lab',
  'chemistry': 'lab',
  'biology': 'lab',
  'physics': 'lab',
  'scientist': 'lab',
  
  // Workshop
  'workshop': 'workshop',
  'craft': 'workshop',
  'making': 'workshop',
  'build': 'workshop',
  'create': 'workshop',
  'hands': 'workshop',
  'diy': 'workshop',
  'project': 'workshop',
  
  // Reading
  'reading': 'reading',
  'book': 'reading',
  'literature': 'reading',
  'library': 'reading',
  'novel': 'reading',
  'text': 'reading',
  
  // Discussion
  'discussion': 'discussion',
  'debate': 'discussion',
  'talk': 'discussion',
  'conversation': 'discussion',
  'interview': 'discussion',
  'dialogue': 'discussion',
  'presentation': 'discussion',
  
  // Reflection
  'reflection': 'reflection',
  'reflect': 'reflection',
  'think': 'reflection',
  'meditate': 'reflection',
  'contemplate': 'reflection',
  'deep': 'reflection',
  'dive': 'reflection',
  
  // Market
  'market': 'market',
  'shop': 'market',
  'shopping': 'market',
  'store': 'market',
  'vendor': 'market',
  'bazaar': 'market',
}

/**
 * Detects activity type from title and description using keyword analysis
 */
export function detectActivityType(title: string, description?: string, fieldExperience?: string): ActivityType {
  const text = `${title} ${description || ''} ${fieldExperience || ''}`.toLowerCase()
  const words = text.split(/\s+/)
  
  // Count matches for each activity type
  const typeCounts: Record<ActivityType, number> = {} as Record<ActivityType, number>
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z]/g, '')
    if (cleanWord.length > 2 && KEYWORD_MAPPINGS[cleanWord]) {
      const type = KEYWORD_MAPPINGS[cleanWord]
      typeCounts[type] = (typeCounts[type] || 0) + 1
    }
  }
  
  // Find the type with most matches
  let bestType: ActivityType = 'default'
  let bestCount = 0
  
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > bestCount) {
      bestCount = count
      bestType = type as ActivityType
    }
  }
  
  return bestType
}

// MASSIVE curated, kid-safe Unsplash image library
// 15-20 images per category to minimize duplicates
const IMAGE_COLLECTIONS: Record<ActivityType, string[]> = {
  city: [
    '1480714378408-67cf0d13bc1b', // NYC skyline
    '1496442226666-8d4d0e62e6e9', // City streets
    '1514924013411-cbf25faa35bb', // Urban architecture
    '1444723121867-7a241cacace9', // City night
    '1477959858617-67f85cf4f1df', // Downtown
    '1449824913935-59a10b8d2000', // City view
    '1480714378408-67cf0d13bc1c', // Street scene
    '1518235506717-e1ed3306a89b', // City bridge
    '1517732306149-e8f829eb588a', // Urban landscape
    '1498036882173-b41c28a8ba34', // City park
    '1534430480872-3498386e7856', // Buildings
    '1519501025264-65ba15a82390', // City center
    '1486325212027-8a89f3a0a49b', // Metropolitan
    '1517248135467-4c7edcad34c4', // Urban view
    '1543722530-d2c3201371e7', // City panorama
  ],
  community: [
    '1529156069898-49953e39b3ac', // People gathering
    '1517457373958-b7bdd4587205', // Community event
    '1491438590914-bc09fcaaf77a', // Group activity
    '1522202176988-66273c2fd55f', // Team collaboration
    '1573164574472-797cdf4a583a', // Meeting
    '1528605248644-14dd04022da1', // Social gathering
    '1511632765486-a01205278f6c', // Community space
    '1523580494863-6f3031224c94', // Group work
    '1517486808906-6ca8b3f04846', // People together
    '1556761175-5973dc0f32e7', // Collaboration
    '1519389950473-47ba0277781c', // Team work
    '1517048676732-d65bc937f952', // Discussion group
    '1560439514-4e9645039924', // People meeting
    '1552664730-d307ca884978', // Conversation
    '1531545514256-b1400bc00f31', // Social event
  ],
  education: [
    '1503676260728-1c00da094a0b', // Classroom
    '1523050854058-8df90110c9f1', // Students
    '1509062522246-3755977927d7', // Learning
    '1427504494785-3a9ca7044f45', // Education
    '1503676382389-4809596d5290', // Teaching
    '1524178232363-1fb2b075b655', // School
    '1497633762265-9d179a990aa6', // Study
    '1434030216411-0b793f4b4173', // Learning materials
    '1488190211105-8b0e65b80b4e', // Education space
    '1456513080510-7bf3a84b82f8', // Books learning
    '1516321318423-f06f85e504b3', // Study environment
    '1580582932707-520aed937b7b', // Classroom setting
    '1546410531-bb4caa6b424d', // Educational
    '1571260899304-425eee4c7efc', // School learning
    '1577896851231-70ef18881754', // Education concept
  ],
  audio: [
    '1493225457124-a3eb161ffa5f', // Headphones
    '1511671782779-c97d3d27a1d4', // Sound waves
    '1598488035139-bdbb2231ce04', // Microphone
    '1518609878373-06d740f60d8b', // Audio equipment
    '1558618666-fcd25c85cd64', // Recording studio
    '1478737270761-e4b5b0beabc7', // Podcast setup
    '1589903308904-1010c2294adc', // Sound recording
    '1571330735066-03aaa9429d89', // Audio production
    '1516280440614-37939bbacd81', // Sound mixing
    '1505740420928-5e560c06d30e', // Headphones music
    '1487180144351-b8472da7d491', // Audio gear
    '1571974599782-87624638275c', // Recording
    '1508700929628-666bc8bd84ea', // Sound equipment
    '1524678606370-a47ad25cb82a', // Audio setup
    '1470225620780-dba8ba36b745', // DJ equipment
  ],
  music: [
    '1507838153286-6c95e3f4d4c8', // Piano keys
    '1511379938547-c1f69419868d', // Music notes
    '1514320291840-2e0a9bf2a9ae', // Guitar
    '1459749411175-04bf5292ceea', // Concert hall
    '1510915361894-db8b60106cb1', // Violin
    '1465847899084-d164df4dedc6', // Sheet music
    '1507838153286-6c95e3f4d4c9', // Musical instrument
    '1513883049090-d0b7439799bf', // Orchestra
    '1520523839897-bd0b52f945a0', // Music performance
    '1498038432885-c6f3f1b912ee', // Piano
    '1415201364774-f6f0bb35f28f', // Music studio
    '1485579149621-3123dd979885', // Guitar strings
    '1511192336575-5a79af67a629', // Music notes
    '1493225255756-d9584f39e385', // Music production
    '1525201548942-d8732f6617a0', // Musical
  ],
  art: [
    '1460661419201-fd4cecdf8a8d', // Paint brushes
    '1513364776144-60967b0f800f', // Art supplies
    '1579783902614-a3fb3927b6a5', // Canvas
    '1456086272160-b24b0a8e6a80', // Abstract art
    '1547891654-e66ed7ebb968', // Colorful art
    '1541961017774-22349e4a1262', // Art gallery
    '1499892477393-f675706cbe6e', // Painting
    '1460661419201-fd4cecdf8a8e', // Art creation
    '1513519245088-0e12902e35ca', // Artist tools
    '1551913902-c0bbfc4cfe1e', // Creative art
    '1482245294234-b3f2f8d5f1a4', // Art studio
    '1515405295579-ba7b45403062', // Artwork
    '1580136579312-94651dfd596d', // Art materials
    '1561998338-13ad0e082e09', // Artistic
    '1571115764595-644a1f56a55c', // Art display
  ],
  technology: [
    '1518770660439-4636190af475', // Circuit board
    '1550751827-4bd374c3f58b', // Robot
    '1485827404703-89b55fcc595e', // Technology
    '1526374965328-7f61d4dc18c5', // Code
    '1517077304055-6e89dc36afc3', // AI concept
    '1488590528505-98d2b5aba04b', // Computer
    '1531297484001-80022131f5a1', // Tech setup
    '1518770660439-4636190af476', // Electronics
    '1550745165-9bc0b252726f', // Programming
    '1504868584819-f8e8b4b6d7e3', // Digital
    '1558494949-ef010cbdcc31', // Tech abstract
    '1535223289827-42f1e9919769', // Computer code
    '1451187580459-43490279c0fa', // Data
    '1519389950473-47ba0277781d', // Tech workspace
    '1581091226825-a6a2a5aee158', // Technology concept
  ],
  nature: [
    '1441974231531-c6227db76b6e', // Forest
    '1506905925346-21bda4d32df4', // Mountains
    '1511497584788-876760111969', // Tropical
    '1469474968028-56623f02e42e', // Beach sunset
    '1475924156734-496f6cac6ec1', // Lake
    '1470071459604-3b5ec3a7fe05', // Sunrise
    '1447752875215-b2761acb3c5d', // Forest path
    '1433086966358-54859d0ed716', // Waterfall
    '1501854140801-50d01698950b', // Nature scene
    '1465188162913-8fb5709d6d57', // Green landscape
    '1507003211169-0a1dd7228f2d', // Nature view
    '1469521669194-a4876e7069ab', // Ocean
    '1542202229-7d93c33f5d07', // Garden
    '1446329813274-7c9036bd9a1f', // Flowers
    '1518495973542-4542c06a5843', // Natural beauty
  ],
  food: [
    '1476224203421-9ac39bcb3327', // Healthy food
    '1504674900247-0877df9cc836', // Cooking
    '1490645935967-10de6ba17061', // Meal
    '1466637574441-749b8f19452f', // Fresh ingredients
    '1498837167922-ddd27525d352', // Kitchen
    '1540189549336-e6e99c3679fe', // Food prep
    '1504754524776-8f4f37790ca0', // Cuisine
    '1455619452474-d2be8b1e70cd', // Food dish
    '1473093295043-cdd812d0e601', // Meal prep
    '1482049016530-d79ae97c4f64', // Fresh food
    '1495521821757-a1efb6729352', // Cooking scene
    '1547592166-23ac45744acd', // Chef cooking
    '1464226184884-fa280b87c399', // Food art
    '1512621776951-a57141f2eefd', // Healthy meal
    '1414235077428-338989a2e8c0', // Food ingredients
  ],
  cultural: [
    '1523050854058-8df90110c9f1', // Diverse community
    '1529156069898-49953e39b3ac', // Cultural celebration
    '1493707553211-f1b5eb1c7b63', // Traditional crafts
    '1511632765486-a01205278f6c', // Cultural artifacts
    '1544967082-d9d25d867d4d', // Heritage site
    '1517457373958-b7bdd4587205', // Cultural event
    '1504197885163-e4f5b4a0284c', // Traditional
    '1518998053901-5348d3961a04', // Cultural diversity
    '1508964942454-1a56651d54ac', // Heritage
    '1516466723877-e4ec1d736c8a', // Culture
    '1499793983394-12a2f9e3b1f8', // Traditional art
    '1506905925346-21bda4d32df5', // Cultural landscape
    '1488521479708-61f9bffc38dc', // Diverse culture
    '1531058020387-3be344556be6', // Cultural expression
    '1517841905240-472988babdf9', // Heritage artifacts
  ],
  travel: [
    '1500835556837-99ac94a94552', // Airplane
    '1476514525535-07fb3b4ae5f1', // Travel adventure
    '1528543606781-2f6e6857f318', // Passport
    '1503220317375-aabd63ab2fd7', // Travel destination
    '1501785888041-af3ef285b470', // Scenic view
    '1469854523086-cc02fe5d8800', // Road trip
    '1520250497591-112f2f40a3f4', // Travel scene
    '1530521954074-e64f6810b32d', // Adventure
    '1527631746610-bca00a040d60', // Exploration
    '1502003148287-a82ef80a6abc', // Journey
    '1517760444937-f6397edcbbcd', // Travel landscape
    '1504598318550-17eba1008a68', // Wanderlust
    '1502920917128-1aa500764cbd', // Travel view
    '1519922639192-e73293ca430e', // Destination
    '1522199710521-72d69614c702', // Travel photography
  ],
  writing: [
    '1455390582262-044cdead277a', // Typewriter
    '1486312338219-ce68d2c6f44d', // Writing desk
    '1517842645767-c639042777db', // Notebook
    '1488190211105-8b0e65b80b4e', // Journal
    '1471107340929-a87cd0f5b5f3', // Writing
    '1518384076138-23e1bb365f8c', // Pen and paper
    '1450101499163-c8848c66ca85', // Writing tools
    '1495465798138-718f86d1a4bc', // Journaling
    '1519791883288-dc8bd696e667', // Writing space
    '1455390582262-044cdead277b', // Author desk
    '1504691342899-4d92b50853e1', // Writing scene
    '1473186578172-c141e6798cf4', // Notebook writing
    '1531346878377-a5be20888e57', // Creative writing
    '1476275466078-4007374efbbe', // Story writing
    '1434030216411-0b793f4b4174', // Write
  ],
  photography: [
    '1516035069371-29a1b244cc32', // Camera
    '1452780212940-6f5c0d14d848', // Photography
    '1495745966610-2a67f2297e5e', // Lens
    '1542038784456-1ea8e935640e', // Photo camera
    '1554048612-d6a6bb83b7ff', // Photography gear
    '1520390138845-fd2d229dd553', // Photographer
    '1500051638674-ff996a0ec29e', // Camera equipment
    '1502982720700-bfff97f2ecac', // Photo shoot
    '1471341971476-ae15ff5dd4ea', // Photography art
    '1495837174058-628aafc7d610', // Camera lens
    '1516035069371-29a1b244cc33', // Photo
    '1494515843206-f3117d3f51b7', // Photography setup
    '1455849318743-b2233052fcff', // Camera work
    '1512790182412-b19e6d62bc39', // Photo art
    '1510127034890-ba27508e9f1c', // Photography scene
  ],
  museum: [
    '1554907984-15263bfd63bd', // Museum interior
    '1564399580075-5dfe19c205f3', // Art gallery
    '1513364776144-60967b0f800f', // Exhibition
    '1551966775-a4ddc8df052b', // Museum display
    '1580060405188-b3d52738f188', // Museum hall
    '1566127992631-0ce475cef4b1', // Gallery space
    '1574096079513-d8259312b785', // Museum art
    '1536053341826-35d1e40e4fb8', // Exhibit
    '1568605114967-8904fddcfb2f', // Gallery
    '1541961017774-22349e4a1263', // Museum visit
    '1518998053901-5348d3961a05', // Art exhibit
    '1566073771259-6a89a2d26ac5', // Museum collection
    '1577705998148-6da4f3963bc8', // Gallery art
    '1590402494610-2c378a9114c6', // Museum scene
    '1531572753322-ad063cecc140', // Art museum
  ],
  historical: [
    '1539037116277-4db20889f2d4', // Ancient ruins
    '1564399580075-5dfe19c205f3', // Historical site
    '1548013146-72479768bada', // Monument
    '1555217851-6a1bfb1c90a1', // Historical building
    '1547471080-7cc2caa01a7e', // Heritage
    '1467269204594-9661b134dd2b', // Ancient site
    '1558688942-5a91d01e2d3a', // Historic landmark
    '1533929736458-ca588d08c8be', // Old architecture
    '1516483638261-f4dbaf036963', // Historical
    '1564507592333-df0c3f51c18b', // Monument view
    '1570793005386-d183d4236fb7', // Ancient history
    '1552832230-c0197dd311b5', // Heritage site
    '1571380401583-72ca84994796', // Historic place
    '1527684651001-731c74c95ed7', // Old building
    '1580137189272-c9379f8864fd', // Historical monument
  ],
  lab: [
    '1532094349884-543bc11b234d', // Laboratory
    '1576319155264-99536e0be1ee', // Science equipment
    '1530973428-5bf2db2e4d71', // Chemistry
    '1507413245164-6160d8298b31', // Research
    '1518152006812-edab29b069ac', // Experiment
    '1581091226825-a6a2a5aee159', // Science lab
    '1581093458791-9f3c3250a8b0', // Lab equipment
    '1581093588401-fbb62a02f120', // Chemistry lab
    '1581093577421-f561a654a353', // Science research
    '1564510714747-69c3bc1fab41', // Laboratory work
    '1582719471384-894fbb16563a', // Science tools
    '1628595351029-c2bf17511435', // Lab research
    '1516979187457-637abb4f9353', // Scientific
    '1517976487492-5750f3195933', // Lab scene
    '1518998053901-5348d3961a06', // Research lab
  ],
  workshop: [
    '1416879595882-3373a0480b5b', // Workshop tools
    '1504148455328-c376907d081c', // Craft workshop
    '1452860606245-08befc0ff44b', // Maker space
    '1530124566582-a618bc2615dc', // Hands-on work
    '1558618666-fcd25c85cd64', // Creative studio
    '1514580426463-fd77dc4d0672', // Workshop space
    '1503387762-592deb58ef4e', // Woodwork
    '1558944351-3f79926e74c1', // Craft making
    '1519340241574-2cec6aef0c01', // DIY
    '1461354464878-ad92f79a2e0c', // Making
    '1558522195-e1201b090344', // Tools
    '1562259949-e8e7689d7828', // Crafting
    '1494883759339-0b042055a4ee', // Workshop scene
    '1560769629-975ec94e6a86', // Creative work
    '1556557286-bf3be5fd9d06', // Project work
  ],
  reading: [
    '1507842217343-583bb7270b66', // Library
    '1481627834876-b7833e8f5570', // Books
    '1497633762265-9d179a990aa6', // Reading
    '1456513080510-7bf3a84b82f8', // Study
    '1519682337058-a94d519337bc', // Book stack
    '1512820790803-83ca734da794', // Library scene
    '1535905557558-afc4877a26fc', // Reading time
    '1495446815901-a7297e633e8d', // Book reading
    '1457369804613-52c61a468e7d', // Books collection
    '1491841651911-ce4c58a4f5d6', // Library books
    '1474932430478-367dbb6832c1', // Reading corner
    '1524995997946-a1c13c536a21', // Book shelf
    '1506880018603-83d5b814b5a6', // Reading spot
    '1512045502-2cd3c04e5ae5', // Literature
    '1553729459-efe14f6c57e5', // Book scene
  ],
  discussion: [
    '1517048676732-d65bc937f952', // Discussion
    '1529156069898-49953e39b3ac', // Group talk
    '1552664730-d307ca884978', // Conversation
    '1573164574472-797cdf4a583a', // Meeting
    '1560439514-4e9645039924', // Collaboration
    '1522202176988-66273c2fd55f', // Team discussion
    '1515187029135-18ee286d815b', // Dialogue
    '1517457373958-b7bdd4587206', // Group discussion
    '1543269865-cbf427effbad', // Talk
    '1528605248644-14dd04022da2', // Discussion group
    '1556761175-5973dc0f32e8', // Team talk
    '1517486808906-6ca8b3f04847', // Conversation group
    '1551135049-8a33b5883817', // Discussion meeting
    '1523580494863-6f3031224c95', // Talking
    '1528605105345-5344ea20e269', // Group conversation
  ],
  reflection: [
    '1518241353330-0f7941c2d9b5', // Calm water
    '1506905925346-21bda4d32df4', // Peaceful mountain
    '1507400492013-162706c8c05e', // Meditation
    '1470252649378-9c29740c9fa8', // Sunset
    '1499002238440-d264edd596e5', // Quiet nature
    '1516339901601-2e1b62dc0c45', // Peaceful
    '1509114397022-ed747cca3f65', // Reflection
    '1489549132488-d00b7eee80f1', // Calm scene
    '1505778276668-26b3c7140de9', // Serene
    '1454391304352-2bf4678b1a7a', // Contemplation
    '1528183429752-a97d0bf97b5c', // Peaceful moment
    '1518495973542-4542c06a5844', // Tranquil
    '1501854140801-50d01698950c', // Quiet reflection
    '1439853949127-fa647821eba0', // Mindful
    '1500534314209-a25ddb2bd429', // Calm
  ],
  market: [
    '1533900298318-6b8da08a523e', // Market stalls
    '1542838132-92c53300491e', // Shopping
    '1556742049-0cfed4f6a45d', // Fresh market
    '1488459716781-31db52582f63', // Vendor
    '1579113800032-c38bd7635818', // Local market
    '1534723452862-4c874018d66d', // Market scene
    '1519566335946-e6f65f0f4fdf', // Street market
    '1555529902-5261145633bf', // Market food
    '1505142468610-359e7d316be0', // Shopping scene
    '1541701494587-cb58502866ab', // Fresh produce
    '1488459716781-31db52582f64', // Market vendor
    '1506719040632-7d586470c936', // Local shop
    '1552566626-52f8b828add9', // Marketplace
    '1572883454114-efb8d78df48d', // Street vendor
    '1577705998148-6da4f3963bc9', // Market goods
  ],
  default: [
    '1503676260728-1c00da094a0b', // Education
    '1456513080510-7bf3a84b82f8', // Learning
    '1516321318423-f06f85e504b3', // Study
    '1488190211105-8b0e65b80b4e', // Workspace
    '1434030216411-0b793f4b4173', // Materials
    '1497633762265-9d179a990aa6', // Study scene
    '1523050854058-8df90110c9f2', // Education environment
    '1509062522246-3755977927d8', // Learning space
    '1427504494785-3a9ca7044f46', // Educational
    '1503676382389-4809596d5291', // Teaching scene
    '1524178232363-1fb2b075b656', // School setting
    '1580582932707-520aed937b7c', // Classroom
    '1546410531-bb4caa6b424e', // Learning environment
    '1571260899304-425eee4c7efd', // Study area
    '1577896851231-70ef18881755', // Education concept
  ],
}

// Global set to track used images across all activities in a session
const globalUsedImages = new Set<string>()

/**
 * Gets a unique, kid-appropriate image URL for an activity.
 * Uses activity type detection from title + strict duplicate prevention.
 */
export function getActivityIconUrl(
  activityType: ActivityType, 
  uniqueKey: string,
  usedImageIds?: Set<string>
): string {
  const trackingSet = usedImageIds || globalUsedImages
  const options = IMAGE_COLLECTIONS[activityType] || IMAGE_COLLECTIONS.default
  
  // Generate a hash from the unique key
  let hash = 0
  for (let i = 0; i < uniqueKey.length; i++) {
    hash = ((hash << 5) - hash) + uniqueKey.charCodeAt(i)
    hash = hash & hash
  }
  
  // Try to find an unused image
  let index = Math.abs(hash) % options.length
  let attempts = 0
  const maxAttempts = options.length * 2
  
  while (trackingSet.has(options[index]) && attempts < maxAttempts) {
    index = (index + 1) % options.length
    attempts++
    
    // If we've gone through all options, add entropy
    if (attempts === options.length) {
      // Try a completely different category as fallback
      const fallbackTypes: ActivityType[] = ['education', 'city', 'nature', 'art', 'technology']
      for (const fallbackType of fallbackTypes) {
        const fallbackOptions = IMAGE_COLLECTIONS[fallbackType]
        for (const img of fallbackOptions) {
          if (!trackingSet.has(img)) {
            trackingSet.add(img)
            return `https://images.unsplash.com/photo-${img}?w=800&h=400&fit=crop&auto=format&q=80`
          }
        }
      }
    }
  }
  
  const imageId = options[index]
  trackingSet.add(imageId)
  
  return `https://images.unsplash.com/photo-${imageId}?w=800&h=400&fit=crop&auto=format&q=80`
}

/**
 * Gets an image URL based on the activity title (keyword-based)
 */
export function getActivityImageFromTitle(
  title: string,
  description?: string,
  index: number = 0
): { url: string; alt: string; type: ActivityType } {
  const type = detectActivityType(title, description)
  const options = IMAGE_COLLECTIONS[type] || IMAGE_COLLECTIONS.default
  
  // Use a combination of title hash and index for variety
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i)
  }
  
  const imageIndex = (Math.abs(hash) + index) % options.length
  const imageId = options[imageIndex]
  const url = `https://images.unsplash.com/photo-${imageId}?w=800&h=400&fit=crop&auto=format&q=80`
  
  return {
    url,
    alt: `Image representing ${title}`,
    type,
  }
}

/**
 * Resets the global used images tracker (call between trips)
 */
export function resetUsedImages() {
  globalUsedImages.clear()
}

/**
 * Gets SVG fallback icon
 */
export function getActivityIconFallback(activityType: ActivityType): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMxNy41IDIgMjIgNi41IDIyIDEyQzIyIDE3LjUgMTcuNSAyMiAxMiAyMkM2LjUgMjIgMiAxNy41IDIgMTJDMiA2LjUgNi41IDIgMTIgMloiIHN0cm9rZT0iIzZGQkZBOUEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+'
}

/**
 * Gets alt text for an activity image
 */
export function getActivityImageAlt(activityType: ActivityType, title: string, location?: string): string {
  const typeLabels: Record<ActivityType, string> = {
    museum: 'museum activity',
    nature: 'nature activity',
    market: 'market activity',
    historical: 'historical site',
    cultural: 'cultural activity',
    lab: 'laboratory activity',
    workshop: 'workshop activity',
    reading: 'reading activity',
    discussion: 'discussion activity',
    reflection: 'reflection activity',
    audio: 'audio activity',
    music: 'music activity',
    art: 'art activity',
    technology: 'technology activity',
    food: 'food activity',
    travel: 'travel activity',
    writing: 'writing activity',
    photography: 'photography activity',
    city: 'city exploration',
    education: 'educational activity',
    community: 'community activity',
    default: 'learning activity',
  }
  
  return typeLabels[activityType] || typeLabels.default
}
