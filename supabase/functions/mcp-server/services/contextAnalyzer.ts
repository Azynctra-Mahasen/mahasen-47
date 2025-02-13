
import { IntentType, UrgencyLevel } from '../types/intent.ts';
import { HUMAN_AGENT_KEYWORDS, URGENCY_KEYWORDS, ISSUE_TYPES, INTENT_KEYWORDS, fuzzyMatch } from './keywordMatchers.ts';

export class ContextAnalyzer {
  static calculateContextMatch(message: string, context: string): number {
    if (!context) return 0;
    
    const messageWords = new Set(message.toLowerCase().split(' '));
    const contextWords = new Set(context.toLowerCase().split(' '));
    
    // Calculate word intersection
    const intersection = new Set([...messageWords].filter(word => contextWords.has(word)));
    const intersectionScore = intersection.size / messageWords.size;
    
    // Calculate semantic similarity using word embeddings (simplified version)
    const semanticScore = this.calculateSemanticSimilarity(message, context);
    
    // Weighted combination of both scores
    return (intersectionScore * 0.6) + (semanticScore * 0.4);
  }

  private static calculateSemanticSimilarity(text1: string, text2: string): number {
    // Simplified semantic similarity calculation
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    let commonWords = 0;
    let totalWords = words1.length;

    for (const word of words1) {
      if (words2.includes(word)) {
        commonWords++;
      }
    }

    return commonWords / totalWords;
  }

  static calculateConfidence(
    message: string,
    intent: IntentType,
    contextMatch: number,
    previousMessages: string[] = []
  ): number {
    const lowerMessage = message.toLowerCase();
    let confidence = 0;

    // Calculate keyword match score with fuzzy matching
    const keywordMatchScore = fuzzyMatch(lowerMessage, INTENT_KEYWORDS[intent] || []) / 
      (INTENT_KEYWORDS[intent]?.length || 1);

    // Calculate context relevance
    const contextRelevance = contextMatch * 0.3;

    // Calculate message complexity factor
    const complexityFactor = this.calculateComplexityFactor(message);

    // Consider previous messages
    const historyFactor = this.calculateHistoryFactor(previousMessages, intent);

    // Calculate base confidence
    confidence = (
      (keywordMatchScore * 0.4) +      // Keyword matches
      (contextRelevance * 0.3) +       // Context relevance
      (complexityFactor * 0.15) +      // Message complexity
      (historyFactor * 0.15)          // Conversation history
    );

    // Apply confidence modifiers
    confidence = this.applyConfidenceModifiers(confidence, message, intent);

    // Ensure confidence is between 0 and 1
    return Math.min(Math.max(confidence, 0), 1);
  }

  private static calculateComplexityFactor(message: string): number {
    const words = message.split(' ');
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    
    // Normalize complexity score between 0 and 1
    return Math.min(avgWordLength / 10, 1);
  }

  private static calculateHistoryFactor(previousMessages: string[], intent: IntentType): number {
    if (!previousMessages.length) return 0;

    const relevantMessages = previousMessages.filter(msg => 
      INTENT_KEYWORDS[intent]?.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()))
    );

    return relevantMessages.length / previousMessages.length;
  }

  private static applyConfidenceModifiers(
    baseConfidence: number,
    message: string,
    intent: IntentType
  ): number {
    let confidence = baseConfidence;

    // Boost confidence for explicit requests
    if (intent === 'HUMAN_AGENT_REQUEST' && 
        HUMAN_AGENT_KEYWORDS.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      confidence += 0.3;
    }

    // Reduce confidence for very short messages
    if (message.split(' ').length < 3) {
      confidence *= 0.7;
    }

    // Boost confidence for messages with clear issue types
    const hasIssueType = Object.values(ISSUE_TYPES).some(keywords =>
      keywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (hasIssueType) {
      confidence += 0.1;
    }

    return confidence;
  }

  static requiresEscalation(
    intent: IntentType,
    confidence: number,
    urgencyLevel: UrgencyLevel
  ): { required: boolean; reason: string | null } {
    // Check confidence threshold
    if (confidence < 0.7) {
      return {
        required: true,
        reason: 'Low confidence in automated response'
      };
    }

    // Check urgency level
    if (urgencyLevel === 'high') {
      return {
        required: true,
        reason: 'High urgency request requires immediate attention'
      };
    }

    // Check intent-specific conditions
    if (intent === 'SUPPORT_REQUEST' && urgencyLevel !== 'low') {
      return {
        required: true,
        reason: 'Complex support request requires human assistance'
      };
    }

    if (intent === 'HUMAN_AGENT_REQUEST') {
      return {
        required: true,
        reason: 'Customer explicitly requested human agent'
      };
    }

    // Default case - no escalation needed
    return {
      required: false,
      reason: null
    };
  }

  static detectUrgencyLevel(message: string): UrgencyLevel {
    const lowerMessage = message.toLowerCase();
    
    // Check for high urgency keywords with fuzzy matching
    const highUrgencyScore = fuzzyMatch(lowerMessage, URGENCY_KEYWORDS.high);
    if (highUrgencyScore > 1) return 'high';
    
    // Check for medium urgency keywords
    const mediumUrgencyScore = fuzzyMatch(lowerMessage, URGENCY_KEYWORDS.medium);
    if (mediumUrgencyScore > 1) return 'medium';
    
    // Default to low urgency
    return 'low';
  }

  static detectIssueType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    let highestScore = 0;
    let detectedType = null;

    for (const [type, keywords] of Object.entries(ISSUE_TYPES)) {
      const score = fuzzyMatch(lowerMessage, keywords);
      if (score > highestScore) {
        highestScore = score;
        detectedType = type;
      }
    }

    return highestScore > 0.5 ? detectedType : null;
  }
}
