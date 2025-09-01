import { NotificationPriority } from './enums';

// Smart suggestion system types
export enum SuggestionType {
  EMERGENCY = 'emergency',
  INVESTMENT = 'investment', 
  SAVINGS = 'savings',
  BUDGET_ADJUSTMENT = 'budget_adjustment',
  CATEGORY_OPTIMIZATION = 'category_optimization',
  RECURRING_BILL = 'recurring_bill',
  FUEL_WARNING = 'fuel_warning'
}

export enum SuggestionAction {
  SAVE = 'save',
  INVEST = 'invest',
  REDUCE_SPENDING = 'reduce_spending',
  REVIEW_EXPENSES = 'review_expenses',
  ADD_INCOME = 'add_income',
  TRANSFER_MONEY = 'transfer_money',
  SET_REMINDER = 'set_reminder',
  ADJUST_BUDGET = 'adjust_budget'
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action: SuggestionAction;
  priority: NotificationPriority;
  actionAmount?: number;
  category?: string;
  impact: {
    daysGained?: number;
    moneySaved?: number;
    confidenceScore: number;
  };
  isApplied: boolean;
  isDismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionData?: Record<string, any>;
}

export interface SuggestionInput {
  type: SuggestionType;
  title: string;
  description: string;
  action: SuggestionAction;
  priority?: NotificationPriority;
  actionAmount?: number;
  category?: string;
  impact: {
    daysGained?: number;
    moneySaved?: number;
    confidenceScore: number;
  };
  expiresAt?: Date;
  actionData?: Record<string, any>;
}

// Achievement and gamification system
export enum AchievementType {
  SAVINGS_STREAK = 'savings_streak',
  BUDGET_MASTER = 'budget_master',
  CATEGORY_SAVER = 'category_saver',
  FUEL_EFFICIENT = 'fuel_efficient',
  EMERGENCY_FUND = 'emergency_fund',
  INVESTMENT_STARTER = 'investment_starter',
  BILL_TRACKER = 'bill_tracker',
  EXPENSE_LOGGER = 'expense_logger'
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  unlockedAt?: Date;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  rewards?: {
    title: string;
    description: string;
    type: 'badge' | 'feature' | 'insight';
  }[];
}

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// Gamification scoring system
export interface GameScore {
  totalPoints: number;
  level: number;
  levelProgress: number;
  nextLevelPoints: number;
  streak: {
    current: number;
    best: number;
    type: 'savings' | 'logging' | 'budget';
  };
  badges: string[];
  rank: string;
}

// AI and rule-based suggestion context
export interface SuggestionContext {
  financialHealth: {
    score: number; // 0-100
    factors: string[];
  };
  spendingPatterns: {
    topCategories: Array<{
      category: string;
      amount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    monthlyAverage: number;
    volatility: number;
  };
  goals: {
    savingsTarget?: number;
    budgetLimit?: number;
    emergencyFundTarget?: number;
  };
  riskFactors: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

// Template system for suggestions
export interface SuggestionTemplate {
  id: string;
  type: SuggestionType;
  titleTemplate: string;
  descriptionTemplate: string;
  conditions: {
    minBalance?: number;
    maxBalance?: number;
    minDaysLeft?: number;
    maxDaysLeft?: number;
    categories?: string[];
    spendingThreshold?: number;
  };
  variables: string[];
}