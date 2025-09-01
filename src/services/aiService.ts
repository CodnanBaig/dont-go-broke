import { 
  Suggestion, 
  SuggestionInput, 
  FinancialContext, 
  SpendingAnalytics,
  ExpenseCategory
} from '@/types';

// AI service interface for future implementation
export interface AIService {
  generateSuggestions(context: FinancialContext, analytics?: SpendingAnalytics): Promise<SuggestionInput[]>;
  analyzeSpendingPatterns(expenses: any[]): Promise<any>;
  generatePersonalizedInsights(context: FinancialContext): Promise<string[]>;
  predictFutureSpending(context: FinancialContext): Promise<any>;
}

// Mock AI service implementation
export class MockAIService implements AIService {
  async generateSuggestions(context: FinancialContext, analytics?: SpendingAnalytics): Promise<SuggestionInput[]> {
    // This is a mock implementation that would be replaced with actual AI logic
    const suggestions: SuggestionInput[] = [];
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate AI-powered suggestions based on context
    if (context.daysLeft < 10) {
      suggestions.push({
        type: 'fuel_warning',
        title: '🤖 AI-Powered Fuel Warning',
        description: 'AI analysis shows your spending pattern will exhaust funds soon. Consider these adjustments.',
        action: 'reduce_spending',
        priority: 'high',
        impact: {
          confidenceScore: 0.85
        },
        actionData: {
          aiRecommendations: [
            'Reduce discretionary spending by 25%',
            'Postpone non-essential purchases',
            'Look for cheaper alternatives'
          ]
        }
      });
    }
    
    if (analytics && analytics.categoryBreakdown.length > 0) {
      const highestCategory = analytics.categoryBreakdown[0];
      if (highestCategory.percentage > 30) {
        suggestions.push({
          type: 'category_optimization',
          title: '🤖 AI Category Optimization',
          description: `AI detected ${highestCategory.category} is your highest spending category. Here's how to optimize it.`,
          action: 'review_expenses',
          priority: 'normal',
          category: highestCategory.category,
          impact: {
            confidenceScore: 0.75
          },
          actionData: {
            aiTips: this.generateCategoryTips(highestCategory.category)
          }
        });
      }
    }
    
    // Add general AI insights
    suggestions.push({
      type: 'investment',
      title: '🤖 AI Investment Insight',
      description: 'Based on your financial patterns, AI suggests considering long-term investments.',
      action: 'invest',
      priority: 'normal',
      impact: {
        confidenceScore: 0.7
      },
      actionData: {
        aiInsight: 'Your consistent saving pattern indicates readiness for investment'
      }
    });
    
    return suggestions;
  }
  
  async analyzeSpendingPatterns(expenses: any[]): Promise<any> {
    // Mock implementation for spending pattern analysis
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      patterns: ['weekend_spending', 'evening_purchases'],
      anomalies: [],
      trends: {
        increasing: ['Food', 'Entertainment'],
        decreasing: ['Transport']
      }
    };
  }
  
  async generatePersonalizedInsights(context: FinancialContext): Promise<string[]> {
    // Mock implementation for personalized insights
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const insights: string[] = [];
    
    if (context.daysLeft > 30) {
      insights.push("You're doing great! Your spending habits are sustainable.");
    } else if (context.daysLeft < 10) {
      insights.push("Consider reviewing your expenses to extend your runway.");
    }
    
    if (context.avgDailySpend > context.salary / 30) {
      insights.push("Your daily spending is above average. Look for cost-cutting opportunities.");
    }
    
    return insights;
  }
  
  async predictFutureSpending(context: FinancialContext): Promise<any> {
    // Mock implementation for future spending prediction
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const daysPrediction = Math.max(7, Math.floor(context.daysLeft * 0.8));
    const predictedBalance = Math.max(0, context.balance - (context.avgDailySpend * 7));
    
    return {
      daysPrediction,
      predictedBalance,
      confidence: 0.75,
      recommendations: [
        'Maintain current spending pattern',
        'Look for additional income sources',
        'Build emergency fund'
      ]
    };
  }
  
  private generateCategoryTips(category: string): string[] {
    const tipMap: Record<string, string[]> = {
      'Food': [
        'AI suggests meal planning to reduce food costs by 15%',
        'Consider bulk buying for non-perishable items',
        'Use cashback apps for grocery shopping'
      ],
      'Transport': [
        'AI recommends public transport for 60% of trips',
        'Carpooling could save 30% on transport costs',
        'Maintain vehicle to avoid unexpected repair costs'
      ],
      'Entertainment': [
        'AI suggests limiting entertainment spending to 5% of income',
        'Explore free local events and activities',
        'Share streaming subscriptions with family'
      ],
      'Shopping': [
        'AI recommends creating a 24-hour waiting period for purchases',
        'Compare prices across platforms before buying',
        'Look for seasonal sales and discounts'
      ]
    };
    
    return tipMap[category] || [
      'AI recommends tracking all expenses in this category',
      'Set monthly limits for this spending category',
      'Review subscriptions and cancel unused services'
    ];
  }
}

// OpenAI service implementation (placeholder for future integration)
export class OpenAIService implements AIService {
  private apiKey: string;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  async generateSuggestions(context: FinancialContext, analytics?: SpendingAnalytics): Promise<SuggestionInput[]> {
    // This would be implemented when OpenAI integration is added
    console.log('OpenAI service called with context:', context);
    
    // Fallback to mock service if not implemented
    const mockService = new MockAIService();
    return mockService.generateSuggestions(context, analytics);
  }
  
  async analyzeSpendingPatterns(expenses: any[]): Promise<any> {
    // This would be implemented when OpenAI integration is added
    console.log('OpenAI spending pattern analysis called');
    
    // Fallback to mock service if not implemented
    const mockService = new MockAIService();
    return mockService.analyzeSpendingPatterns(expenses);
  }
  
  async generatePersonalizedInsights(context: FinancialContext): Promise<string[]> {
    // This would be implemented when OpenAI integration is added
    console.log('OpenAI personalized insights called');
    
    // Fallback to mock service if not implemented
    const mockService = new MockAIService();
    return mockService.generatePersonalizedInsights(context);
  }
  
  async predictFutureSpending(context: FinancialContext): Promise<any> {
    // This would be implemented when OpenAI integration is added
    console.log('OpenAI future spending prediction called');
    
    // Fallback to mock service if not implemented
    const mockService = new MockAIService();
    return mockService.predictFutureSpending(context);
  }
}

// Factory function to create AI service
export function createAIService(type: 'mock' | 'openai' = 'mock', apiKey?: string): AIService {
  switch (type) {
    case 'openai':
      if (!apiKey) {
        throw new Error('API key required for OpenAI service');
      }
      return new OpenAIService(apiKey);
    case 'mock':
    default:
      return new MockAIService();
  }
}

// Default export
export default createAIService('mock');