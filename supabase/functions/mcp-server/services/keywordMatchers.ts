
// Enhanced keyword matchers with synonyms and variations
export const HUMAN_AGENT_KEYWORDS = [
  // Direct requests
  'speak to human', 'real person', 'agent', 'representative', 'supervisor',
  'connect to human', 'talk to human', 'real human', 'human agent',
  // Frustration indicators
  'need help', 'frustrated', 'not helping', 'useless', 'cant understand',
  "don't understand", 'wrong answers', 'incorrect', 'mistake',
  // Variations
  'actual person', 'live agent', 'customer service', 'support person',
  'real support', 'human support', 'speak with someone', 'talk to someone',
  'connect me', 'transfer me', 'escalate', 'manager'
];

export const URGENCY_KEYWORDS = {
  high: [
    // Time-sensitive
    'urgent', 'emergency', 'asap', 'immediately', 'right now', 'critical',
    'urgent matter', 'time sensitive', 'emergency situation', 'crisis',
    // Impact indicators
    'serious issue', 'major problem', 'severe', 'crucial', 'vital',
    'cannot wait', "can't wait", 'need immediate', 'pressing matter'
  ],
  medium: [
    'soon', 'important', 'needed', 'waiting', 'priority',
    'attention required', 'please help', 'need assistance',
    'follow up', 'resolve this', 'look into', 'address this'
  ],
  low: [
    'when possible', 'at your convenience', 'not urgent',
    'just checking', 'wondering if', 'would like to know'
  ]
};

export const ISSUE_TYPES = {
  technical: [
    // Problems
    'error', 'bug', 'not working', 'broken', 'failed', 'issue',
    'crash', 'glitch', 'problem', 'malfunction', 'down',
    // Actions
    'fix', 'repair', 'resolve', 'troubleshoot', 'debug'
  ],
  billing: [
    // Payment related
    'payment', 'charge', 'bill', 'invoice', 'refund', 'subscription',
    'credit card', 'transaction', 'receipt', 'pricing', 'cost',
    'payment failed', 'overcharged', 'billing issue'
  ],
  account: [
    // Access related
    'login', 'password', 'access', 'account', 'profile',
    'sign in', 'cant log in', 'locked out', 'reset password',
    'account settings', 'security', 'verification'
  ],
  product: [
    // Product related
    'product', 'item', 'order', 'delivery', 'shipping',
    'tracking', 'package', 'purchase', 'bought', 'received',
    'quality', 'damaged', 'missing', 'wrong item'
  ],
  service: [
    // Service related
    'service', 'subscription', 'feature', 'functionality',
    'upgrade', 'downgrade', 'cancel', 'change plan'
  ]
};

export const INTENT_KEYWORDS = {
  SUPPORT_REQUEST: [
    'help', 'support', 'issue', 'problem', 'error',
    'trouble', 'difficulty', 'assistance', 'guide',
    'explain', 'clarify', 'understand', 'how to'
  ],
  ORDER_PLACEMENT: [
    'buy', 'purchase', 'order', 'price', 'cost',
    'payment', 'checkout', 'cart', 'billing',
    'want to get', 'interested in', 'available'
  ],
  GENERAL_QUERY: [
    'what', 'how', 'when', 'where', 'can you',
    'could you', 'information', 'details', 'tell me',
    'explain', 'describe', 'learn about'
  ]
};

// Helper function to check for fuzzy matches
export const fuzzyMatch = (text: string, keywords: string[]): number => {
  const words = text.toLowerCase().split(' ');
  let matches = 0;
  let partialMatches = 0;

  for (const keyword of keywords) {
    const keywordParts = keyword.toLowerCase().split(' ');
    
    // Check for exact matches
    if (text.toLowerCase().includes(keyword.toLowerCase())) {
      matches += 2;
      continue;
    }

    // Check for partial matches
    for (const keywordPart of keywordParts) {
      if (words.some(word => {
        const distance = levenshteinDistance(word, keywordPart);
        return distance <= Math.min(2, Math.floor(keywordPart.length / 3));
      })) {
        partialMatches++;
      }
    }
  }

  return matches + (partialMatches * 0.5);
};

// Levenshtein distance calculation for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array(b.length + 1).fill(null).map(() => 
    Array(a.length + 1).fill(null)
  );

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + substitutionCost
      );
    }
  }

  return matrix[b.length][a.length];
};
