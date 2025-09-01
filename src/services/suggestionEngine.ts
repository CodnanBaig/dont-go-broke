import { 
  Suggestion, 
  SuggestionInput, 
  SuggestionType, 
  SuggestionAction,
  FinancialContext,
  NotificationPriority,
  ExpenseCategory,
  SpendingAnalytics
} from '@/types';

export class SuggestionEngine {
  private static instance: SuggestionEngine;
  
  public static getInstance(): SuggestionEngine {
    if (!SuggestionEngine.instance) {
      SuggestionEngine.instance = new SuggestionEngine();
    }
    return SuggestionEngine.instance;
  }
  
  // Main suggestion generation method
  generateSuggestions(context: FinancialContext, analytics?: SpendingAnalytics): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    
    // Emergency suggestions (highest priority)
    suggestions.push(...this.generateEmergencySuggestions(context));
    
    // Budget and spending suggestions
    suggestions.push(...this.generateBudgetSuggestions(context));
    
    // Investment and savings suggestions
    suggestions.push(...this.generateInvestmentSuggestions(context));
    
    // Category optimization suggestions
    if (analytics) {
      suggestions.push(...this.generateCategoryOptimizationSuggestions(context, analytics));
    }
    
    // Recurring bill suggestions
    suggestions.push(...this.generateRecurringBillSuggestions(context));
    
    // Fuel warning suggestions
    suggestions.push(...this.generateFuelWarningSuggestions(context));
    
    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => {
        const priorityOrder = {
          [NotificationPriority.URGENT]: 4,
          [NotificationPriority.HIGH]: 3,
          [NotificationPriority.NORMAL]: 2,
          [NotificationPriority.LOW]: 1
        };
        
        const aPriority = priorityOrder[a.priority || NotificationPriority.NORMAL];
        const bPriority = priorityOrder[b.priority || NotificationPriority.NORMAL];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return (b.impact.confidenceScore || 0) - (a.impact.confidenceScore || 0);
      })
      .slice(0, 5); // Return top 5 suggestions
  }
  
  private generateEmergencySuggestions(context: FinancialContext): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    const { balance, salary, daysLeft, avgDailySpend } = context;
    
    // Critical low balance
    if (balance < salary * 0.05 || daysLeft < 3) {
      suggestions.push({
        type: SuggestionType.EMERGENCY,
        title: '🚨 Emergency Mode Activated',
        description: 'Your fuel is critically low! Immediate action required to avoid running out of money.',
        action: SuggestionAction.REDUCE_SPENDING,
        priority: NotificationPriority.URGENT,
        impact: {
          daysGained: Math.floor(avgDailySpend * 0.5 / avgDailySpend),
          moneySaved: avgDailySpend * 0.5 * 7,
          confidenceScore: 0.95
        },
        actionData: {
          emergencyLevel: 'critical',
          recommendations: [
            'Stop all non-essential spending',
            'Cancel subscriptions temporarily',
            'Look for immediate income sources',
            'Contact family/friends for support if needed'
          ],
          targetDailyBudget: Math.max(0, balance / 7)
        }
      });
    }
    
    // Low balance warning
    else if (balance < salary * 0.1 || daysLeft < 7) {
      suggestions.push({
        type: SuggestionType.EMERGENCY,
        title: '⚠️ Low Fuel Warning',
        description: 'You\'re running low on fuel. Time to tighten your spending and look for ways to stretch your money.',
        action: SuggestionAction.REDUCE_SPENDING,
        priority: NotificationPriority.HIGH,
        impact: {
          daysGained: 5,
          moneySaved: avgDailySpend * 0.3 * 7,
          confidenceScore: 0.85
        },
        actionData: {
          emergencyLevel: 'warning',
          recommendations: [
            'Reduce dining out by 50%',
            'Use public transport',
            'Cook meals at home',
            'Avoid impulse purchases'
          ],
          targetDailyBudget: balance / 14
        }
      });
    }
    
    return suggestions;
  }
  
  private generateBudgetSuggestions(context: FinancialContext): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    const { balance, daysLeft, avgDailySpend, salary } = context;
    
    // Overspending pattern detected
    if (avgDailySpend > (salary / 30) && daysLeft < 20) {
      const recommendedDailyBudget = balance / 20;
      const potentialSavings = (avgDailySpend - recommendedDailyBudget) * 20;
      
      suggestions.push({
        type: SuggestionType.BUDGET_ADJUSTMENT,
        title: '📊 Budget Optimization',
        description: `Your current spending pace needs adjustment. Reduce daily expenses from ₹${Math.round(avgDailySpend)} to ₹${Math.round(recommendedDailyBudget)}.`,
        action: SuggestionAction.ADJUST_BUDGET,
        priority: NotificationPriority.HIGH,
        impact: {
          daysGained: 10,
          moneySaved: potentialSavings,
          confidenceScore: 0.8
        },
        actionData: {
          currentDailySpend: avgDailySpend,
          recommendedDailyBudget,
          potentialSavings,
          tips: [
            'Set daily spending limits',
            'Track expenses in real-time',
            'Use cash for discretionary spending',
            'Plan meals in advance'
          ]
        }
      });
    }
    
    return suggestions;
  }
  
  private generateInvestmentSuggestions(context: FinancialContext): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    const { balance, salary, daysLeft } = context;
    
    // Good financial position - suggest investment
    if (balance > salary * 0.5 && daysLeft > 25) {
      const investmentAmount = Math.floor(balance * 0.3);
      
      suggestions.push({
        type: SuggestionType.INVESTMENT,
        title: '💎 Investment Opportunity',
        description: `You have surplus funds! Consider investing ₹${investmentAmount} for long-term growth.`,
        action: SuggestionAction.INVEST,
        priority: NotificationPriority.NORMAL,
        actionAmount: investmentAmount,
        impact: {
          moneySaved: investmentAmount * 0.12, // Assuming 12% annual return
          confidenceScore: 0.7
        },
        actionData: {
          investmentOptions: [
            { type: 'SIP', description: 'Systematic Investment Plan in mutual funds', riskLevel: 'Medium', expectedReturn: '12-15%' },
            { type: 'Fixed Deposit', description: 'Guaranteed returns with bank FDs', riskLevel: 'Low', expectedReturn: '6-8%' },
            { type: 'Index Funds', description: 'Diversified market investment', riskLevel: 'Medium', expectedReturn: '10-12%' },
            { type: 'Gold ETF', description: 'Digital gold investment', riskLevel: 'Low', expectedReturn: '8-10%' }
          ],
          recommendedAmount: investmentAmount,
          timeHorizon: 'Long-term (3+ years)'
        }
      });
    }
    
    // Moderate position - suggest savings
    else if (balance > salary * 0.3 && daysLeft > 20) {
      const savingsAmount = Math.floor(balance * 0.2);
      
      suggestions.push({
        type: SuggestionType.SAVINGS,
        title: '🏦 Smart Savings',
        description: `Build your emergency fund! Save ₹${savingsAmount} for financial security.`,
        action: SuggestionAction.SAVE,
        priority: NotificationPriority.NORMAL,
        actionAmount: savingsAmount,
        impact: {
          moneySaved: savingsAmount,
          confidenceScore: 0.8
        },
        actionData: {
          savingsGoal: salary,
          currentProgress: balance / salary,
          targetAmount: savingsAmount,
          savingsOptions: [
            'High-yield savings account',
            'Fixed deposit',
            'Recurring deposit',
            'Liquid mutual funds'
          ]
        }
      });
    }
    
    return suggestions;
  }
  
  private generateCategoryOptimizationSuggestions(
    context: FinancialContext, 
    analytics: SpendingAnalytics
  ): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    
    // Analyze top spending categories
    const topCategories = analytics.categoryBreakdown.slice(0, 3);
    
    for (const category of topCategories) {
      if (category.percentage > 40) { // Category takes up more than 40% of spending
        const tips = this.getCategoryOptimizationTips(category.category);
        const potentialSavings = category.amount * 0.2; // 20% reduction potential
        
        suggestions.push({
          type: SuggestionType.CATEGORY_OPTIMIZATION,
          title: `🎯 Optimize ${category.category} Spending`,
          description: `${category.category} accounts for ${Math.round(category.percentage)}% of your spending. Here's how to save ₹${Math.round(potentialSavings)}.`,
          action: SuggestionAction.REVIEW_EXPENSES,
          priority: NotificationPriority.NORMAL,
          category: category.category,
          impact: {
            moneySaved: potentialSavings,
            daysGained: Math.floor(potentialSavings / context.avgDailySpend),
            confidenceScore: 0.6
          },
          actionData: {
            category: category.category,
            currentAmount: category.amount,
            percentage: category.percentage,
            tips,
            targetReduction: potentialSavings
          }
        });
        break; // Only suggest one category optimization at a time
      }
    }
    
    return suggestions;
  }
  
  private generateRecurringBillSuggestions(context: FinancialContext): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    
    // High recurring bills
    if (context.recurringBillsAmount > context.salary * 0.4) {
      suggestions.push({
        type: SuggestionType.RECURRING_BILL,
        title: '📋 Review Subscriptions',
        description: `Your recurring bills are high (₹${context.recurringBillsAmount}). Cancel unused subscriptions to free up ₹${Math.floor(context.recurringBillsAmount * 0.2)} monthly.`,
        action: SuggestionAction.REVIEW_EXPENSES,
        priority: NotificationPriority.NORMAL,
        impact: {
          moneySaved: context.recurringBillsAmount * 0.2,
          daysGained: Math.floor((context.recurringBillsAmount * 0.2) / context.avgDailySpend),
          confidenceScore: 0.75
        },
        actionData: {
          totalBills: context.recurringBillsAmount,
          percentageOfSalary: (context.recurringBillsAmount / context.salary) * 100,
          recommendedReduction: context.recurringBillsAmount * 0.2,
          tips: [
            'Review all subscription services',
            'Cancel unused gym memberships',
            'Downgrade streaming services',
            'Negotiate better rates with providers',
            'Share family plans with relatives'
          ]
        }
      });
    }
    
    return suggestions;
  }
  
  private generateFuelWarningSuggestions(context: FinancialContext): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    const { daysLeft, avgDailySpend } = context;
    
    if (daysLeft < 10 && daysLeft > 0) {
      suggestions.push({
        type: SuggestionType.FUEL_WARNING,
        title: '🔥 Fuel Running Low',
        description: `Only ${daysLeft} days of fuel remaining! Reduce daily spending by 30% to extend your runway.`,
        action: SuggestionAction.REDUCE_SPENDING,
        priority: NotificationPriority.HIGH,
        impact: {
          daysGained: Math.floor(daysLeft * 0.4),
          moneySaved: avgDailySpend * 0.3 * daysLeft,
          confidenceScore: 0.85
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
        actionData: {
          currentDailySpend: avgDailySpend,
          targetDailySpend: avgDailySpend * 0.7,
          emergencyActions: [
            'Skip dining out',
            'Use public transport only',
            'Postpone non-essential purchases',
            'Look for quick income opportunities'
          ]
        }
      });
    }
    
    return suggestions;
  }
  
  private getCategoryOptimizationTips(category: string): string[] {
    const tipMap: Record<string, string[]> = {
      [ExpenseCategory.FOOD]: [
        'Cook more meals at home',
        'Plan weekly meal prep',
        'Buy groceries in bulk',
        'Avoid food delivery apps',
        'Use grocery store loyalty programs',
        'Choose seasonal produce'
      ],
      [ExpenseCategory.TRANSPORT]: [
        'Use public transportation',
        'Carpool with colleagues',
        'Walk or bike for short distances',
        'Combine multiple errands in one trip',
        'Use ride-sharing instead of owning a car',
        'Maintain your vehicle regularly'
      ],
      [ExpenseCategory.ENTERTAINMENT]: [
        'Look for free events and activities',
        'Share streaming subscriptions',
        'Choose matinee movie shows',
        'Host game nights at home',
        'Use discount apps and coupons',
        'Explore free outdoor activities'
      ],
      [ExpenseCategory.SHOPPING]: [
        'Make a shopping list and stick to it',
        'Wait 24 hours before big purchases',
        'Compare prices online',
        'Buy during sales and discounts',
        'Consider second-hand options',
        'Use cashback apps'
      ],
      [ExpenseCategory.UTILITIES]: [
        'Reduce electricity usage',
        'Use energy-efficient appliances',
        'Monitor water consumption',
        'Switch to a cheaper internet plan',
        'Use natural light during the day',
        'Unplug devices when not in use'
      ],
      [ExpenseCategory.SUBSCRIPTION]: [
        'Audit all active subscriptions',
        'Cancel unused services',
        'Downgrade premium plans',
        'Share family plans',
        'Look for annual discounts',
        'Use free alternatives'
      ]
    };
    
    return tipMap[category] || [
      'Track expenses in this category',
      'Set a monthly budget limit',
      'Look for alternatives and discounts',
      'Review necessity of purchases'
    ];
  }
  
  // Smart suggestion based on patterns
  generatePatternBasedSuggestions(
    expenseHistory: any[],
    context: FinancialContext
  ): SuggestionInput[] {
    const suggestions: SuggestionInput[] = [];
    
    // TODO: Analyze spending patterns and generate suggestions
    // This could include:
    // - Seasonal spending patterns
    // - Weekend vs weekday spending
    // - Monthly cycles
    // - Unusual spending spikes
    
    return suggestions;
  }
  
  // Validate suggestion relevance
  validateSuggestion(suggestion: SuggestionInput, context: FinancialContext): boolean {
    const { balance, daysLeft, salary } = context;
    
    // Don't suggest investments if in emergency mode
    if (suggestion.type === SuggestionType.INVESTMENT && (balance < salary * 0.2 || daysLeft < 10)) {
      return false;
    }
    
    // Don't suggest savings if balance is too low
    if (suggestion.type === SuggestionType.SAVINGS && balance < salary * 0.15) {
      return false;
    }
    
    // Don't suggest the same action if balance is improving
    if (suggestion.type === SuggestionType.EMERGENCY && daysLeft > 15) {
      return false;
    }
    
    return true;
  }
}

// Export singleton instance
export default SuggestionEngine.getInstance();