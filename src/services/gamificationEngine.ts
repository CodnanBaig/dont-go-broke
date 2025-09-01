import { 
  FuelLevel, 
  FuelStatus, 
  AppNotification, 
  NotificationInput,
  NotificationType,
  NotificationPriority,
  Expense,
  Achievement,
  AchievementType,
  AchievementTier,
  GameScore,
  SpendingAnalytics,
  UserProfile
} from '@/types';
import { useNotificationStore } from '@/stores/notificationStore';

export class GamificationEngine {
  private static instance: GamificationEngine;
  
  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }
  
  // Fuel level calculations
  calculateFuelLevel(balance: number, salary: number): number {
    if (salary === 0) return 0;
    return Math.min(100, Math.max(0, (balance / salary) * 100));
  }
  
  calculateDaysRemaining(balance: number, avgDailySpend: number): number {
    if (avgDailySpend === 0) return balance > 0 ? 999 : 0;
    return Math.floor(balance / avgDailySpend);
  }
  
  calculateFuelStatus(balance: number, salary: number, avgDailySpend: number): FuelStatus {
    const percentage = this.calculateFuelLevel(balance, salary);
    const level = this.getFuelLevelFromPercentage(percentage);
    const daysRemaining = this.calculateDaysRemaining(balance, avgDailySpend);
    
    return {
      level,
      percentage: Math.round(percentage),
      daysRemaining,
      color: this.getFuelColor(level),
      warningMessage: this.getFuelWarningMessage(level, daysRemaining)
    };
  }
  
  private getFuelLevelFromPercentage(percentage: number): FuelLevel {
    if (percentage > 75) return FuelLevel.FULL;
    if (percentage > 50) return FuelLevel.HIGH;
    if (percentage > 25) return FuelLevel.MEDIUM;
    if (percentage > 10) return FuelLevel.LOW;
    if (percentage > 5) return FuelLevel.CRITICAL;
    return FuelLevel.EMPTY;
  }
  
  private getFuelColor(level: FuelLevel): string {
    const colorMap = {
      [FuelLevel.FULL]: '#22c55e',
      [FuelLevel.HIGH]: '#22c55e', 
      [FuelLevel.MEDIUM]: '#f59e0b',
      [FuelLevel.LOW]: '#ef4444',
      [FuelLevel.CRITICAL]: '#991b1b',
      [FuelLevel.EMPTY]: '#991b1b'
    };
    
    return colorMap[level] || '#6b7280';
  }
  
  private getFuelWarningMessage(level: FuelLevel, daysRemaining: number): string | undefined {
    switch (level) {
      case FuelLevel.EMPTY:
        return '🚨 Fuel tank is empty! Time to refuel or reduce spending immediately.';
      case FuelLevel.CRITICAL:
        return `⚠️ Critical fuel level! Only ${daysRemaining} days left.`;
      case FuelLevel.LOW:
        return `🔥 Low fuel warning! ${daysRemaining} days remaining.`;
      case FuelLevel.MEDIUM:
        if (daysRemaining < 10) {
          return `⚡ Moderate fuel, but only ${daysRemaining} days left. Plan carefully.`;
        }
        return undefined;
      default:
        return undefined;
    }
  }
  
  // Notification generation based on fuel changes
  generateFuelChangeNotifications(
    previousFuelStatus: FuelStatus | null,
    currentFuelStatus: FuelStatus,
    recentExpense?: Expense
  ): NotificationInput[] {
    const notifications: NotificationInput[] = [];
    
    // Check for fuel level changes
    if (previousFuelStatus && previousFuelStatus.level !== currentFuelStatus.level) {
      const notification = this.createFuelLevelChangeNotification(
        previousFuelStatus.level,
        currentFuelStatus.level,
        currentFuelStatus
      );
      if (notification) {
        notifications.push(notification);
      }
    }
    
    // Check for big spend alerts
    if (recentExpense && previousFuelStatus) {
      const daysDifference = previousFuelStatus.daysRemaining - currentFuelStatus.daysRemaining;
      if (daysDifference >= 3) {
        notifications.push(this.createBigSpendNotification(
          recentExpense,
          previousFuelStatus.daysRemaining,
          currentFuelStatus.daysRemaining
        ));
      }
    }
    
    // Check for critical warnings
    if (currentFuelStatus.level === FuelLevel.CRITICAL || currentFuelStatus.level === FuelLevel.EMPTY) {
      notifications.push(this.createCriticalFuelNotification(currentFuelStatus));
    }
    
    return notifications;
  }
  
  private createFuelLevelChangeNotification(
    previousLevel: FuelLevel,
    currentLevel: FuelLevel,
    currentStatus: FuelStatus
  ): NotificationInput | null {
    const levelOrder = [FuelLevel.EMPTY, FuelLevel.CRITICAL, FuelLevel.LOW, FuelLevel.MEDIUM, FuelLevel.HIGH, FuelLevel.FULL];
    const previousIndex = levelOrder.indexOf(previousLevel);
    const currentIndex = levelOrder.indexOf(currentLevel);
    
    // Only notify on downgrades
    if (currentIndex < previousIndex) {
      const notifications = {
        [FuelLevel.EMPTY]: {
          title: '🚨 Fuel Empty!',
          message: 'Your fuel tank is completely empty! Emergency action needed.',
          priority: NotificationPriority.URGENT
        },
        [FuelLevel.CRITICAL]: {
          title: '⚠️ Critical Fuel Level!',
          message: `Only ${currentStatus.daysRemaining} days of fuel remaining!`,
          priority: NotificationPriority.HIGH
        },
        [FuelLevel.LOW]: {
          title: '🔥 Low Fuel Warning!',
          message: `Fuel level is low. ${currentStatus.daysRemaining} days remaining.`,
          priority: NotificationPriority.HIGH
        },
        [FuelLevel.MEDIUM]: {
          title: '⚡ Fuel Level Decreased',
          message: `Fuel dropped to ${currentStatus.percentage}%. Monitor your spending.`,
          priority: NotificationPriority.NORMAL
        }
      };
      
      const notification = notifications[currentLevel];
      if (notification) {
        return {
          type: NotificationType.FUEL_LOW,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          actionData: {
            previousLevel,
            currentLevel,
            percentage: currentStatus.percentage,
            daysRemaining: currentStatus.daysRemaining
          }
        };
      }
    }
    
    return null;
  }
  
  private createBigSpendNotification(
    expense: Expense,
    previousDays: number,
    currentDays: number
  ): NotificationInput {
    const daysDifference = previousDays - currentDays;
    
    return {
      type: NotificationType.BIG_SPEND,
      title: '🚨 Big Spend Alert!',
      message: `₹${expense.amount} spent on ${expense.category}. Days reduced from ${previousDays} → ${currentDays}`,
      priority: NotificationPriority.HIGH,
      actionData: {
        expenseId: expense.id,
        amount: expense.amount,
        category: expense.category,
        daysDifference,
        previousDays,
        currentDays
      }
    };
  }
  
  private createCriticalFuelNotification(fuelStatus: FuelStatus): NotificationInput {
    return {
      type: NotificationType.FUEL_EMPTY,
      title: fuelStatus.level === FuelLevel.EMPTY ? '🆘 Emergency!' : '⚠️ Critical Alert!',
      message: fuelStatus.warningMessage || 'Your fuel is critically low!',
      priority: NotificationPriority.URGENT,
      actionData: {
        fuelLevel: fuelStatus.level,
        percentage: fuelStatus.percentage,
        daysRemaining: fuelStatus.daysRemaining
      }
    };
  }
  
  // Achievement system
  checkAndUnlockAchievements(
    user: UserProfile,
    analytics: SpendingAnalytics,
    fuelStatus: FuelStatus,
    expenses: Expense[]
  ): Achievement[] {
    const newAchievements: Achievement[] = [];
    
    // Fuel Efficiency Achievements
    if (fuelStatus.percentage > 80 && fuelStatus.daysRemaining > 25) {
      newAchievements.push(this.createAchievement(
        AchievementType.FUEL_EFFICIENT,
        'Fuel Master',
        'Maintained high fuel levels with efficient spending',
        AchievementTier.GOLD
      ));
    }
    
    // Savings Streak Achievements
    if (analytics.savingsStreak >= 7) {
      const tier = analytics.savingsStreak >= 30 ? AchievementTier.PLATINUM :
                   analytics.savingsStreak >= 14 ? AchievementTier.GOLD :
                   AchievementTier.SILVER;
      
      newAchievements.push(this.createAchievement(
        AchievementType.SAVINGS_STREAK,
        `${analytics.savingsStreak} Day Saver`,
        `Saved money for ${analytics.savingsStreak} consecutive days`,
        tier
      ));
    }
    
    // Budget Master Achievement
    if (analytics.budgetAdherence >= 0.9) {
      newAchievements.push(this.createAchievement(
        AchievementType.BUDGET_MASTER,
        'Budget Master',
        'Stayed within budget with 90% accuracy',
        AchievementTier.GOLD
      ));
    }
    
    // Expense Logger Achievement
    if (expenses.length >= 100) {
      const tier = expenses.length >= 500 ? AchievementTier.PLATINUM :
                   expenses.length >= 250 ? AchievementTier.GOLD :
                   AchievementTier.SILVER;
      
      newAchievements.push(this.createAchievement(
        AchievementType.EXPENSE_LOGGER,
        'Diligent Tracker',
        `Logged ${expenses.length} expenses`,
        tier
      ));
    }
    
    // Category Saver Achievement
    const topCategorySpending = analytics.categoryBreakdown[0];
    if (topCategorySpending && topCategorySpending.percentage < 30) {
      newAchievements.push(this.createAchievement(
        AchievementType.CATEGORY_SAVER,
        'Balanced Spender',
        'No single category dominates your spending',
        AchievementTier.SILVER
      ));
    }
    
    return newAchievements;
  }
  
  private createAchievement(
    type: AchievementType,
    title: string,
    description: string,
    tier: AchievementTier
  ): Achievement {
    const icons = {
      [AchievementType.FUEL_EFFICIENT]: '⛽',
      [AchievementType.SAVINGS_STREAK]: '🔥',
      [AchievementType.BUDGET_MASTER]: '🎯',
      [AchievementType.EXPENSE_LOGGER]: '📝',
      [AchievementType.CATEGORY_SAVER]: '⚖️',
      [AchievementType.EMERGENCY_FUND]: '🛡️',
      [AchievementType.INVESTMENT_STARTER]: '📈',
      [AchievementType.BILL_TRACKER]: '📋'
    };
    
    return {
      id: `${type}_${Date.now()}`,
      type,
      title,
      description,
      tier,
      icon: icons[type] || '🏆',
      unlockedAt: new Date(),
      progress: {
        current: 100,
        target: 100,
        percentage: 100
      },
      rewards: this.getAchievementRewards(type, tier)
    };
  }
  
  private getAchievementRewards(type: AchievementType, tier: AchievementTier): Achievement['rewards'] {
    const baseRewards = {
      [AchievementTier.BRONZE]: 50,
      [AchievementTier.SILVER]: 100,
      [AchievementTier.GOLD]: 200,
      [AchievementTier.PLATINUM]: 500
    };
    
    return [{
      title: 'Achievement Points',
      description: `Earned ${baseRewards[tier]} points`,
      type: 'badge'
    }];
  }
  
  // Game scoring system
  calculateGameScore(
    achievements: Achievement[],
    analytics: SpendingAnalytics,
    fuelStatus: FuelStatus
  ): GameScore {
    // Calculate total points from achievements
    const achievementPoints = achievements.reduce((total, achievement) => {
      const tierPoints = {
        [AchievementTier.BRONZE]: 50,
        [AchievementTier.SILVER]: 100,
        [AchievementTier.GOLD]: 200,
        [AchievementTier.PLATINUM]: 500
      };
      return total + tierPoints[achievement.tier];
    }, 0);
    
    // Bonus points for fuel efficiency
    const fuelBonus = Math.floor(fuelStatus.percentage * 2);
    
    // Bonus points for budget adherence
    const budgetBonus = Math.floor(analytics.budgetAdherence * 200);
    
    const totalPoints = achievementPoints + fuelBonus + budgetBonus;
    
    // Calculate level (every 1000 points = 1 level)
    const level = Math.floor(totalPoints / 1000) + 1;
    const levelProgress = (totalPoints % 1000) / 10; // Percentage progress to next level
    const nextLevelPoints = (level * 1000) - totalPoints;
    
    // Determine rank
    const rank = this.calculateRank(totalPoints, level);
    
    return {
      totalPoints,
      level,
      levelProgress,
      nextLevelPoints,
      streak: {
        current: analytics.savingsStreak,
        best: analytics.savingsStreak, // TODO: Track historical best
        type: 'savings'
      },
      badges: achievements.map(a => a.id),
      rank
    };
  }
  
  private calculateRank(totalPoints: number, level: number): string {
    if (level >= 50) return '💎 Diamond Saver';
    if (level >= 25) return '🥇 Gold Budgeter';
    if (level >= 15) return '🥈 Silver Tracker';
    if (level >= 10) return '🥉 Bronze Spender';
    if (level >= 5) return '🌟 Rising Star';
    return '🌱 Beginner';
  }
  
  // Progress tracking
  trackExpenseImpact(
    expense: Expense,
    previousBalance: number,
    newBalance: number,
    previousDays: number,
    newDays: number
  ): {
    impactScore: number;
    message: string;
    color: string;
  } {
    const balanceImpact = previousBalance - newBalance;
    const daysImpact = previousDays - newDays;
    
    let impactScore = 0;
    let message = '';
    let color = '#6b7280'; // gray
    
    if (daysImpact >= 7) {
      impactScore = 5; // Very high impact
      message = `💥 Major expense! Lost ${daysImpact} days of fuel`;
      color = '#ef4444'; // red
    } else if (daysImpact >= 3) {
      impactScore = 4; // High impact
      message = `⚠️ Big expense! Lost ${daysImpact} days of fuel`;
      color = '#f59e0b'; // amber
    } else if (daysImpact >= 1) {
      impactScore = 3; // Medium impact
      message = `📉 Expense impact: ${daysImpact} day${daysImpact > 1 ? 's' : ''} lost`;
      color = '#f59e0b'; // amber
    } else {
      impactScore = 1; // Low impact
      message = `✅ Small expense, minimal impact`;
      color = '#22c55e'; // green
    }
    
    return { impactScore, message, color };
  }
}

// Export singleton instance
export default GamificationEngine.getInstance();