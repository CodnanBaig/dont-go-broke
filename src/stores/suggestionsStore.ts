import { create } from 'zustand';
import { persist, suggestionsStorePersistConfig } from './persistence';
import { 
  Suggestion, 
  SuggestionInput, 
  SuggestionType, 
  SuggestionAction,
  SuggestionContext,
  FinancialContext,
  NotificationPriority 
} from '@/types';
import { createAIService } from '@/services/aiService';

interface SuggestionsState {
  suggestions: Suggestion[];
  suggestionsHistory: Suggestion[];
  lastGenerated: Date | null;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
}

interface SuggestionsActions {
  // Suggestion Management
  addSuggestion: (suggestion: SuggestionInput) => void;
  applySuggestion: (id: string) => void;
  dismissSuggestion: (id: string) => void;
  deleteSuggestion: (id: string) => void;
  
  // AI Generation
  generateSuggestions: (context: FinancialContext, analytics?: SpendingAnalytics) => Promise<void>;
  
  // Utility Functions
  getActiveSuggestions: () => Suggestion[];
  getSuggestionsByType: (type: SuggestionType) => Suggestion[];
  getHighPrioritySuggestions: () => Suggestion[];
  
  // System Actions
  setGenerating: (generating: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSuggestions: () => void;
}

type SuggestionsStore = SuggestionsState & SuggestionsActions;

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const initialState: SuggestionsState = {
  suggestions: [],
  suggestionsHistory: [],
  lastGenerated: null,
  isGenerating: false,
  isLoading: false,
  error: null
};

export const useSuggestionsStore = create<SuggestionsStore>()(persist((set, get) => ({
  ...initialState,
  
  // Suggestion Management
  addSuggestion: (suggestionInput: SuggestionInput) => {
    set({ isLoading: true, error: null });
    try {
      const suggestion: Suggestion = {
        id: generateId(),
        type: suggestionInput.type,
        title: suggestionInput.title,
        description: suggestionInput.description,
        action: suggestionInput.action,
        priority: suggestionInput.priority || NotificationPriority.NORMAL,
        actionAmount: suggestionInput.actionAmount,
        category: suggestionInput.category,
        impact: suggestionInput.impact,
        isApplied: false,
        isDismissed: false,
        createdAt: new Date(),
        expiresAt: suggestionInput.expiresAt,
        actionData: suggestionInput.actionData
      };
      
      set(state => ({
        suggestions: [...state.suggestions, suggestion],
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add suggestion';
      set({ error: errorMessage, isLoading: false });
      console.error('Add suggestion error:', error);
    }
  },
  
  applySuggestion: (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => {
        const suggestion = state.suggestions.find(s => s.id === id);
        if (!suggestion) {
          set({ isLoading: false });
          return state;
        }
        
        const updatedSuggestion = { ...suggestion, isApplied: true };
        
        const newState = {
          suggestions: state.suggestions.map(s => 
            s.id === id ? updatedSuggestion : s
          ),
          suggestionsHistory: [...state.suggestionsHistory, updatedSuggestion],
          isLoading: false
        };
        
        return newState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply suggestion';
      set({ error: errorMessage, isLoading: false });
      console.error('Apply suggestion error:', error);
    }
  },
  
  dismissSuggestion: (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => {
        const suggestion = state.suggestions.find(s => s.id === id);
        if (!suggestion) {
          set({ isLoading: false });
          return state;
        }
        
        const updatedSuggestion = { ...suggestion, isDismissed: true };
        
        const newState = {
          suggestions: state.suggestions.map(s => 
            s.id === id ? updatedSuggestion : s
          ),
          suggestionsHistory: [...state.suggestionsHistory, updatedSuggestion],
          isLoading: false
        };
        
        return newState;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to dismiss suggestion';
      set({ error: errorMessage, isLoading: false });
      console.error('Dismiss suggestion error:', error);
    }
  },
  
  deleteSuggestion: (id: string) => {
    set({ isLoading: true, error: null });
    try {
      set(state => ({
        suggestions: state.suggestions.filter(s => s.id !== id),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete suggestion';
      set({ error: errorMessage, isLoading: false });
      console.error('Delete suggestion error:', error);
    }
  },
  
  // AI Generation
  generateSuggestions: async (context: FinancialContext, analytics?: SpendingAnalytics) => {
    set({ isGenerating: true, error: null });
    
    try {
      // Clear existing active suggestions
      set(state => ({
        suggestions: state.suggestions.filter(s => s.isApplied || s.isDismissed)
      }));
      
      // Generate rule-based suggestions
      const ruleBasedSuggestions = generateRuleBasedSuggestions(context);
      
      // Generate AI-powered suggestions
      const aiService = createAIService();
      const aiSuggestions = await aiService.generateSuggestions(context, analytics);
      
      // Combine suggestions (AI suggestions take priority)
      const allSuggestions = [...aiSuggestions, ...ruleBasedSuggestions];
      
      // Add each suggestion
      allSuggestions.forEach(suggestion => {
        get().addSuggestion(suggestion);
      });
      
      set({ 
        lastGenerated: new Date(),
        isGenerating: false 
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions';
      set({ 
        error: errorMessage,
        isGenerating: false 
      });
      console.error('Generate suggestions error:', error);
    }
  },
  
  // Utility Functions
  getActiveSuggestions: () => {
    const now = new Date();
    return get().suggestions.filter(s => 
      !s.isApplied && 
      !s.isDismissed && 
      (!s.expiresAt || s.expiresAt > now)
    );
  },
  
  getSuggestionsByType: (type: SuggestionType) => {
    return get().suggestions.filter(s => s.type === type);
  },
  
  getHighPrioritySuggestions: () => {
    return get().getActiveSuggestions().filter(s => 
      s.priority === NotificationPriority.HIGH || 
      s.priority === NotificationPriority.URGENT
    );
  },
  
  // System Actions
  setGenerating: (generating: boolean) => {
    set({ isGenerating: generating });
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  clearSuggestions: () => {
    set({ suggestions: [] });
  }
}), suggestionsStorePersistConfig));

// Rule-based suggestion generation
function generateRuleBasedSuggestions(context: FinancialContext): SuggestionInput[] {
  const suggestions: SuggestionInput[] = [];
  const { balance, daysLeft, salary, avgDailySpend } = context;
  
  // Emergency fund suggestion
  if (balance < salary * 0.1) {
    suggestions.push({
      type: SuggestionType.EMERGENCY,
      title: '🚨 Emergency Mode',
      description: 'Your fuel is critically low! Consider reducing non-essential expenses immediately.',
      action: SuggestionAction.REDUCE_SPENDING,
      priority: NotificationPriority.URGENT,
      impact: {
        daysGained: 5,
        moneySaved: avgDailySpend * 5,
        confidenceScore: 0.9
      },
      actionData: { recommendedReduction: avgDailySpend * 0.5 }
    });
  }
  
  // Investment suggestion
  if (balance > salary * 0.5 && daysLeft > 20) {
    const investAmount = Math.floor(balance * 0.3);
    suggestions.push({
      type: SuggestionType.INVESTMENT,
      title: '💎 Investment Opportunity',
      description: `You have surplus funds. Consider investing ₹${investAmount} for future growth.`,
      action: SuggestionAction.INVEST,
      priority: NotificationPriority.NORMAL,
      actionAmount: investAmount,
      impact: {
        moneySaved: investAmount * 0.08, // Assuming 8% annual return
        confidenceScore: 0.7
      },
      actionData: { investmentOptions: ['SIP', 'Fixed Deposit', 'Index Funds'] }
    });
  }
  
  // Savings suggestion
  if (daysLeft > 25) {
    const saveAmount = Math.floor(balance * 0.2);
    suggestions.push({
      type: SuggestionType.SAVINGS,
      title: '🏆 Great Job!',
      description: `You're ahead of budget! Consider saving ₹${saveAmount} for emergency fund.`,
      action: SuggestionAction.SAVE,
      priority: NotificationPriority.LOW,
      actionAmount: saveAmount,
      impact: {
        moneySaved: saveAmount,
        confidenceScore: 0.8
      },
      actionData: { savingsGoal: salary }
    });
  }
  
  // Budget adjustment suggestion
  if (daysLeft < 10 && daysLeft > 0) {
    suggestions.push({
      type: SuggestionType.BUDGET_ADJUSTMENT,
      title: '⚠️ Budget Alert',
      description: 'Your current spending rate will exhaust funds soon. Adjust your daily budget.',
      action: SuggestionAction.ADJUST_BUDGET,
      priority: NotificationPriority.HIGH,
      impact: {
        daysGained: 10,
        moneySaved: avgDailySpend * 10,
        confidenceScore: 0.85
      },
      actionData: { 
        recommendedDailyBudget: balance / 20,
        currentDailySpend: avgDailySpend
      }
    });
  }
  
  // Category optimization suggestion
  if (context.topCategories.length > 0) {
    const topCategory = context.topCategories[0];
    suggestions.push({
      type: SuggestionType.CATEGORY_OPTIMIZATION,
      title: '🎯 Category Focus',
      description: `${topCategory} is your top spending category. Look for ways to optimize here.`,
      action: SuggestionAction.REVIEW_EXPENSES,
      priority: NotificationPriority.NORMAL,
      category: topCategory,
      impact: {
        daysGained: 3,
        moneySaved: avgDailySpend * 0.3,
        confidenceScore: 0.6
      },
      actionData: { 
        category: topCategory,
        tips: getCategoryOptimizationTips(topCategory)
      }
    });
  }
  
  // Recurring bill review
  if (context.recurringBillsAmount > salary * 0.4) {
    suggestions.push({
      type: SuggestionType.RECURRING_BILL,
      title: '📋 Bill Review',
      description: 'Your recurring bills are high. Review subscriptions and cancel unused ones.',
      action: SuggestionAction.REVIEW_EXPENSES,
      priority: NotificationPriority.NORMAL,
      impact: {
        moneySaved: context.recurringBillsAmount * 0.2,
        daysGained: 5,
        confidenceScore: 0.75
      },
      actionData: { 
        totalBills: context.recurringBillsAmount,
        recommendation: 'Cancel unused subscriptions'
      }
    });
  }
  
  return suggestions;
}

// Helper function to get optimization tips by category
function getCategoryOptimizationTips(category: string): string[] {
  const tips: Record<string, string[]> = {
    'Food': [
      'Cook at home more often',
      'Plan meals in advance',
      'Buy groceries in bulk',
      'Avoid food delivery apps'
    ],
    'Transport': [
      'Use public transport',
      'Carpool when possible',
      'Walk or bike for short distances',
      'Maintain your vehicle regularly'
    ],
    'Entertainment': [
      'Look for free events',
      'Share subscriptions with family',
      'Choose home entertainment',
      'Use discount apps'
    ],
    'Shopping': [
      'Make a shopping list',
      'Wait 24 hours before big purchases',
      'Compare prices online',
      'Buy only what you need'
    ]
  };
  
  return tips[category] || ['Review your expenses in this category'];
}

// Helper function to create suggestion templates
export const createSuggestionTemplate = (
  type: SuggestionType,
  context: FinancialContext
): SuggestionInput | null => {
  switch (type) {
    case SuggestionType.FUEL_WARNING:
      if (context.daysLeft < 7) {
        return {
          type: SuggestionType.FUEL_WARNING,
          title: '🔥 Fuel Running Low',
          description: `Only ${context.daysLeft} days of fuel left! Time to be more careful with spending.`,
          action: SuggestionAction.REDUCE_SPENDING,
          priority: NotificationPriority.HIGH,
          impact: {
            daysGained: 3,
            confidenceScore: 0.8
          }
        };
      }
      return null;
      
    default:
      return null;
  }
};