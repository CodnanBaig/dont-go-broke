// Export all core types
export * from './core';

// Export all enums and constants
export * from './enums';

// Export suggestion and achievement types
export * from './suggestions';

// Import types for component props
import { ExpenseInput, Expense, SpendingAnalytics, ParsedExpense, ExpenseCategory } from './core';
import { Suggestion } from './suggestions';

// Component prop types
export interface BalanceCardProps {
  currentBalance: number;
  salaryAmount: number;
  totalSpent: number;
  onRecharge: () => void;
}

export interface FuelGaugeProps {
  percentage: number;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export interface DaysLeftCounterProps {
  daysRemaining: number;
  trend: 'up' | 'down' | 'stable';
  animated?: boolean;
}

export interface ExpenseFormProps {
  onSubmit: (expense: ExpenseInput) => void;
  categories: ExpenseCategory[];
  suggestedAmount?: number;
  initialData?: Partial<ExpenseInput>;
}

export interface ExpenseListProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  groupByDate?: boolean;
  showCategories?: boolean;
}

export interface SmartSuggestionsProps {
  availableBalance: number;
  spendingPattern: SpendingAnalytics;
  onActionTaken: (suggestion: Suggestion) => void;
  maxSuggestions?: number;
}

export interface SMSParserProps {
  onExpenseDetected: (expense: ParsedExpense) => void;
  enableAutoAdd: boolean;
}

// Screen navigation types
export interface RootStackParamList {
  Dashboard: undefined;
  Expenses: undefined;
  Salary: undefined;
  Settings: undefined;
  Onboarding: undefined;
  ExpenseDetail: { expenseId: string };
  AddExpense: { category?: ExpenseCategory };
  EditExpense: { expenseId: string };
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

// Theme and styling types
export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}