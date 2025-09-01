import { 
  Achievement, 
  AchievementType, 
  AchievementTier, 
  AchievementProgress 
} from '@/types';
import { useAppStore } from '@/stores';
import { useNotificationStore, createAchievementNotification } from '@/stores/notificationStore';

class AchievementService {
  private static instance: AchievementService;
  
  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }
  
  // Define all achievements
  private achievements: Achievement[] = [
    {
      id: 'savings-streak-7',
      type: AchievementType.SAVINGS_STREAK,
      title: 'Savings Streak Starter',
      description: 'Save money for 7 consecutive days',
      tier: AchievementTier.BRONZE,
      icon: 'flame',
      progress: {
        current: 0,
        target: 7,
        percentage: 0
      }
    },
    {
      id: 'savings-streak-30',
      type: AchievementType.SAVINGS_STREAK,
      title: 'Savings Streak Master',
      description: 'Save money for 30 consecutive days',
      tier: AchievementTier.SILVER,
      icon: 'fire',
      progress: {
        current: 0,
        target: 30,
        percentage: 0
      }
    },
    {
      id: 'budget-master',
      type: AchievementType.BUDGET_MASTER,
      title: 'Budget Master',
      description: 'Stay within budget for an entire month',
      tier: AchievementTier.GOLD,
      icon: 'trophy',
      progress: {
        current: 0,
        target: 30,
        percentage: 0
      }
    },
    {
      id: 'category-saver-food',
      type: AchievementType.CATEGORY_SAVER,
      title: 'Food Frugal',
      description: 'Reduce food spending by 20% for a month',
      tier: AchievementTier.BRONZE,
      icon: 'restaurant',
      progress: {
        current: 0,
        target: 100,
        percentage: 0
      }
    },
    {
      id: 'fuel-efficient',
      type: AchievementType.FUEL_EFFICIENT,
      title: 'Fuel Efficient',
      description: 'Maintain over 50% fuel level for 14 days',
      tier: AchievementTier.SILVER,
      icon: 'speedometer',
      progress: {
        current: 0,
        target: 14,
        percentage: 0
      }
    },
    {
      id: 'emergency-fund-10k',
      type: AchievementType.EMERGENCY_FUND,
      title: 'Emergency Fund Starter',
      description: 'Save ₹10,000 for emergencies',
      tier: AchievementTier.GOLD,
      icon: 'shield',
      progress: {
        current: 0,
        target: 10000,
        percentage: 0
      }
    },
    {
      id: 'investment-starter',
      type: AchievementType.INVESTMENT_STARTER,
      title: 'Investment Beginner',
      description: 'Start investing with ₹1,000',
      tier: AchievementTier.BRONZE,
      icon: 'trending-up',
      progress: {
        current: 0,
        target: 1000,
        percentage: 0
      }
    },
    {
      id: 'bill-tracker-10',
      type: AchievementType.BILL_TRACKER,
      title: 'Bill Tracker Pro',
      description: 'Track 10 recurring bills',
      tier: AchievementTier.SILVER,
      icon: 'receipt',
      progress: {
        current: 0,
        target: 10,
        percentage: 0
      }
    },
    {
      id: 'expense-logger-100',
      type: AchievementType.EXPENSE_LOGGER,
      title: 'Expense Logging Expert',
      description: 'Log 100 expenses',
      tier: AchievementTier.GOLD,
      icon: 'list',
      progress: {
        current: 0,
        target: 100,
        percentage: 0
      }
    }
  ];
  
  // Get all achievements
  getAllAchievements(): Achievement[] {
    return this.achievements;
  }
  
  // Get achievement by ID
  getAchievementById(id: string): Achievement | undefined {
    return this.achievements.find(achievement => achievement.id === id);
  }
  
  // Update achievement progress
  updateAchievementProgress(achievementId: string, increment: number = 1): void {
    const achievement = this.achievements.find(a => a.id === achievementId);
    if (!achievement) return;
    
    const newCurrent = Math.min(achievement.progress.current + increment, achievement.progress.target);
    const newPercentage = Math.round((newCurrent / achievement.progress.target) * 100);
    
    achievement.progress.current = newCurrent;
    achievement.progress.percentage = newPercentage;
    
    // Check if achievement is unlocked
    if (newPercentage >= 100 && !achievement.unlockedAt) {
      this.unlockAchievement(achievement);
    }
  }
  
  // Unlock an achievement
  private unlockAchievement(achievement: Achievement): void {
    achievement.unlockedAt = new Date();
    
    // Send notification
    const notification = createAchievementNotification(
      achievement.title,
      achievement.description
    );
    useNotificationStore.getState().addNotification(notification);
    
    console.log(`🎉 Achievement Unlocked: ${achievement.title} - ${achievement.description}`);
  }
  
  // Check savings streak achievements
  checkSavingsStreak(): void {
    const { expenses } = useAppStore.getState();
    const today = new Date();
    
    // Calculate consecutive days with savings (positive balance changes)
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) {
      const previousDate = new Date(currentDate);
      previousDate.setDate(currentDate.getDate() - 1);
      
      const currentExpenses = expenses.filter(e => 
        new Date(e.date).toDateString() === currentDate.toDateString()
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const previousExpenses = expenses.filter(e => 
        new Date(e.date).toDateString() === previousDate.toDateString()
      ).reduce((sum, e) => sum + e.amount, 0);
      
      // If current day expenses are less than previous day, it's a saving day
      if (currentExpenses < previousExpenses) {
        streak++;
      } else {
        break;
      }
      
      currentDate = previousDate;
    }
    
    // Update streak achievements
    if (streak >= 7) {
      this.updateAchievementProgress('savings-streak-7', streak);
    }
    if (streak >= 30) {
      this.updateAchievementProgress('savings-streak-30', streak);
    }
  }
  
  // Check expense logger achievement
  checkExpenseLogger(): void {
    const { expenses } = useAppStore.getState();
    this.updateAchievementProgress('expense-logger-100', expenses.length);
  }
  
  // Check bill tracker achievement
  checkBillTracker(): void {
    const { recurringBills } = useAppStore.getState();
    const activeBills = recurringBills.filter(bill => bill.isActive);
    this.updateAchievementProgress('bill-tracker-10', activeBills.length);
  }
  
  // Check fuel efficient achievement
  checkFuelEfficient(): void {
    const { fuelStatus } = useAppStore.getState();
    
    // This would be checked over time in a real implementation
    // For now, we'll just check if fuel level is above 50%
    if (fuelStatus.percentage > 50) {
      this.updateAchievementProgress('fuel-efficient', 1);
    }
  }
  
  // Check emergency fund achievement
  checkEmergencyFund(): void {
    const { currentBalance } = useAppStore.getState();
    this.updateAchievementProgress('emergency-fund-10k', currentBalance);
  }
  
  // Check investment starter achievement
  checkInvestmentStarter(): void {
    // This would check for investment category expenses
    // For now, we'll simulate it
    const { expenses } = useAppStore.getState();
    const investmentExpenses = expenses.filter(e => e.category === 'Investment')
      .reduce((sum, e) => sum + e.amount, 0);
    
    this.updateAchievementProgress('investment-starter', investmentExpenses);
  }
  
  // Run all achievement checks
  runAchievementChecks(): void {
    this.checkSavingsStreak();
    this.checkExpenseLogger();
    this.checkBillTracker();
    this.checkFuelEfficient();
    this.checkEmergencyFund();
    this.checkInvestmentStarter();
  }
}

export default AchievementService.getInstance();