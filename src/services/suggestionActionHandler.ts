import { Suggestion, SuggestionAction, ExpenseCategory } from '@/types';
import { useAppStore } from '@/stores';
import { useSuggestionsStore } from '@/stores/suggestionsStore';
import NotificationService from '@/services/notificationService';

class SuggestionActionHandler {
  private static instance: SuggestionActionHandler;
  
  public static getInstance(): SuggestionActionHandler {
    if (!SuggestionActionHandler.instance) {
      SuggestionActionHandler.instance = new SuggestionActionHandler();
    }
    return SuggestionActionHandler.instance;
  }
  
  // Handle suggestion action based on type
  async handleAction(suggestion: Suggestion): Promise<boolean> {
    try {
      switch (suggestion.action) {
        case SuggestionAction.SAVE:
          return await this.handleSaveAction(suggestion);
        case SuggestionAction.INVEST:
          return await this.handleInvestAction(suggestion);
        case SuggestionAction.REDUCE_SPENDING:
          return await this.handleReduceSpendingAction(suggestion);
        case SuggestionAction.REVIEW_EXPENSES:
          return await this.handleReviewExpensesAction(suggestion);
        case SuggestionAction.ADD_INCOME:
          return await this.handleAddIncomeAction(suggestion);
        case SuggestionAction.TRANSFER_MONEY:
          return await this.handleTransferMoneyAction(suggestion);
        case SuggestionAction.SET_REMINDER:
          return await this.handleSetReminderAction(suggestion);
        case SuggestionAction.ADJUST_BUDGET:
          return await this.handleAdjustBudgetAction(suggestion);
        default:
          console.warn(`Unknown action type: ${suggestion.action}`);
          return false;
      }
    } catch (error) {
      console.error('Error handling suggestion action:', error);
      return false;
    }
  }
  
  // Handle save action
  private async handleSaveAction(suggestion: Suggestion): Promise<boolean> {
    const { actionAmount } = suggestion;
    
    if (!actionAmount) {
      console.warn('Save action requires actionAmount');
      return false;
    }
    
    // In a real app, this would transfer money to savings
    // For now, we'll just log the action and send a notification
    console.log(`Saving ₹${actionAmount}`);
    
    await NotificationService.sendImmediateNotification(
      '🏦 Savings Action',
      `₹${actionAmount} has been set aside for savings.`,
      { type: 'suggestion_action', action: 'save', amount: actionAmount }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle invest action
  private async handleInvestAction(suggestion: Suggestion): Promise<boolean> {
    const { actionAmount } = suggestion;
    
    if (!actionAmount) {
      console.warn('Invest action requires actionAmount');
      return false;
    }
    
    // In a real app, this would initiate investment process
    // For now, we'll just log the action and send a notification
    console.log(`Investing ₹${actionAmount}`);
    
    await NotificationService.sendImmediateNotification(
      '💎 Investment Action',
      `₹${actionAmount} has been allocated for investment.`,
      { type: 'suggestion_action', action: 'invest', amount: actionAmount }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle reduce spending action
  private async handleReduceSpendingAction(suggestion: Suggestion): Promise<boolean> {
    const { actionData } = suggestion;
    
    // In a real app, this would set spending limits or create reminders
    // For now, we'll just log the action and send a notification
    console.log('Reducing spending', actionData);
    
    let message = 'Spending reduction plan activated.';
    if (actionData?.recommendedReduction) {
      message = `Recommended to reduce daily spending by ₹${actionData.recommendedReduction}.`;
    }
    
    await NotificationService.sendImmediateNotification(
      '💰 Spending Reduction',
      message,
      { type: 'suggestion_action', action: 'reduce_spending', data: actionData }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle review expenses action
  private async handleReviewExpensesAction(suggestion: Suggestion): Promise<boolean> {
    const { category, actionData } = suggestion;
    
    // In a real app, this would navigate to expense review screen
    // For now, we'll just log the action and send a notification
    console.log('Reviewing expenses', { category, actionData });
    
    let message = 'Expense review initiated.';
    if (category) {
      message = `Reviewing expenses in ${category} category.`;
    }
    
    await NotificationService.sendImmediateNotification(
      '📋 Expense Review',
      message,
      { type: 'suggestion_action', action: 'review_expenses', category, data: actionData }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle add income action
  private async handleAddIncomeAction(suggestion: Suggestion): Promise<boolean> {
    const { actionAmount } = suggestion;
    
    if (!actionAmount) {
      console.warn('Add income action requires actionAmount');
      return false;
    }
    
    // In a real app, this would prompt for income entry
    // For now, we'll just log the action and send a notification
    console.log(`Adding income: ₹${actionAmount}`);
    
    await NotificationService.sendImmediateNotification(
      '💼 Income Addition',
      `₹${actionAmount} has been added to your income.`,
      { type: 'suggestion_action', action: 'add_income', amount: actionAmount }
    );
    
    // In a real implementation, we would update the salary
    const { setSalary } = useAppStore.getState();
    // setSalary(currentSalary + actionAmount); // This would need current salary
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle transfer money action
  private async handleTransferMoneyAction(suggestion: Suggestion): Promise<boolean> {
    const { actionAmount, actionData } = suggestion;
    
    if (!actionAmount) {
      console.warn('Transfer money action requires actionAmount');
      return false;
    }
    
    // In a real app, this would initiate money transfer
    // For now, we'll just log the action and send a notification
    console.log(`Transferring ₹${actionAmount}`, actionData);
    
    const fromAccount = actionData?.fromAccount || 'default';
    const toAccount = actionData?.toAccount || 'savings';
    
    await NotificationService.sendImmediateNotification(
      '🔁 Money Transfer',
      `₹${actionAmount} transferred from ${fromAccount} to ${toAccount}.`,
      { 
        type: 'suggestion_action', 
        action: 'transfer_money', 
        amount: actionAmount,
        from: fromAccount,
        to: toAccount
      }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle set reminder action
  private async handleSetReminderAction(suggestion: Suggestion): Promise<boolean> {
    const { actionData } = suggestion;
    
    // In a real app, this would create a calendar reminder
    // For now, we'll just log the action and send a notification
    console.log('Setting reminder', actionData);
    
    const reminderText = actionData?.reminderText || 'Financial task';
    const dueDate = actionData?.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await NotificationService.scheduleNotification(
      '📅 Financial Reminder',
      reminderText,
      { date: dueDate },
      { type: 'suggestion_action', action: 'set_reminder', data: actionData }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Handle adjust budget action
  private async handleAdjustBudgetAction(suggestion: Suggestion): Promise<boolean> {
    const { actionData } = suggestion;
    
    // In a real app, this would adjust budget settings
    // For now, we'll just log the action and send a notification
    console.log('Adjusting budget', actionData);
    
    const dailyBudget = actionData?.recommendedDailyBudget || 0;
    const category = actionData?.category;
    
    let message = 'Budget adjusted successfully.';
    if (dailyBudget > 0) {
      message = `Daily budget set to ₹${dailyBudget}${category ? ` for ${category}` : ''}.`;
    }
    
    await NotificationService.sendImmediateNotification(
      '📊 Budget Adjustment',
      message,
      { 
        type: 'suggestion_action', 
        action: 'adjust_budget', 
        dailyBudget,
        category,
        data: actionData 
      }
    );
    
    // Mark suggestion as applied
    useSuggestionsStore.getState().applySuggestion(suggestion.id);
    
    return true;
  }
  
  // Dismiss a suggestion
  dismissSuggestion(suggestionId: string): void {
    useSuggestionsStore.getState().dismissSuggestion(suggestionId);
  }
  
  // Delete a suggestion
  deleteSuggestion(suggestionId: string): void {
    useSuggestionsStore.getState().deleteSuggestion(suggestionId);
  }
}

export default SuggestionActionHandler.getInstance();