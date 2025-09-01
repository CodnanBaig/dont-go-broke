import { ExpenseCategory } from './enums';

// Core user and application types
export interface UserProfile {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Salary and income related types
export interface SalaryData {
  amount: number;
  frequency: 'monthly' | 'weekly' | 'biweekly';
  lastUpdated: Date;
  nextSalaryDate: Date;
  recurringBillsDeducted: number;
}

// Expense tracking types
export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  source: 'manual' | 'sms' | 'recurring';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating expenses
export interface ExpenseInput {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date?: Date;
  source?: 'manual' | 'sms' | 'recurring';
  tags?: string[];
}

// Recurring bills and subscriptions
export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  nextDueDate: Date;
  category: ExpenseCategory;
  autoDeduct: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating recurring bills
export interface RecurringBillInput {
  name: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'yearly';
  nextDueDate: Date;
  category: ExpenseCategory;
  autoDeduct?: boolean;
}

// Analytics and insights
export interface SpendingAnalytics {
  averageDailySpend: number;
  categoryBreakdown: CategorySpending[];
  monthlyTrend: MonthlySpending[];
  projectedBurnRate: number;
  savingsStreak: number;
  budgetAdherence: number;
  topCategories: string[];
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
  year: number;
}

// Financial calculations and context
export interface FinancialContext {
  balance: number;
  daysLeft: number;
  salary: number;
  avgDailySpend: number;
  topCategories: string[];
  totalExpenses: number;
  recurringBillsAmount: number;
}

// SMS and transaction parsing
export interface ParsedExpense {
  amount: number;
  description: string;
  category: ExpenseCategory;
  source: 'sms';
  confidence: number;
  rawMessage: string;
}