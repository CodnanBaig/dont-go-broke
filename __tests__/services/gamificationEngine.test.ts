import { GamificationEngine } from '@/services/gamificationEngine';
import { FuelLevel } from '@/types';

describe('GamificationEngine', () => {
  let engine: GamificationEngine;

  beforeEach(() => {
    engine = GamificationEngine.getInstance();
  });

  it('should calculate fuel level correctly', () => {
    // Test full fuel level
    expect(engine.calculateFuelLevel(100)).toBe(FuelLevel.FULL);
    expect(engine.calculateFuelLevel(80)).toBe(FuelLevel.HIGH);
    expect(engine.calculateFuelLevel(40)).toBe(FuelLevel.MEDIUM);
    expect(engine.calculateFuelLevel(15)).toBe(FuelLevel.LOW);
    expect(engine.calculateFuelLevel(7)).toBe(FuelLevel.CRITICAL);
    expect(engine.calculateFuelLevel(2)).toBe(FuelLevel.EMPTY);
  });

  it('should calculate fuel color correctly', () => {
    // Test fuel colors
    expect(engine.calculateFuelColor(FuelLevel.FULL)).toBe('#22c55e');
    expect(engine.calculateFuelColor(FuelLevel.HIGH)).toBe('#22c55e');
    expect(engine.calculateFuelColor(FuelLevel.MEDIUM)).toBe('#f59e0b');
    expect(engine.calculateFuelColor(FuelLevel.LOW)).toBe('#ef4444');
    expect(engine.calculateFuelColor(FuelLevel.CRITICAL)).toBe('#991b1b');
    expect(engine.calculateFuelColor(FuelLevel.EMPTY)).toBe('#991b1b');
  });

  it('should generate appropriate notifications based on fuel level', () => {
    // Test critical fuel notification
    const criticalNotification = engine.generateFuelNotification(FuelLevel.CRITICAL, 5, 10000);
    expect(criticalNotification.title).toContain('Critical');
    expect(criticalNotification.priority).toBe('high');

    // Test low fuel notification
    const lowNotification = engine.generateFuelNotification(FuelLevel.LOW, 15, 10000);
    expect(lowNotification.title).toContain('Low');
    expect(lowNotification.priority).toBe('normal');

    // Test full fuel notification
    const fullNotification = engine.generateFuelNotification(FuelLevel.FULL, 90, 10000);
    expect(fullNotification.title).toContain('Full');
    expect(fullNotification.priority).toBe('normal');
  });

  it('should calculate streaks correctly', () => {
    // Test savings streak calculation
    const dates = [
      new Date('2023-01-10'),
      new Date('2023-01-09'),
      new Date('2023-01-08'),
      new Date('2023-01-06'), // Break in streak
      new Date('2023-01-05'),
    ];
    
    const streak = engine.calculateSavingsStreak(dates);
    expect(streak).toBe(3); // 3 consecutive days
  });

  it('should calculate achievement progress', () => {
    // Test achievement progress calculation
    const progress = engine.calculateAchievementProgress(50, 100);
    expect(progress).toBe(50);

    const maxProgress = engine.calculateAchievementProgress(150, 100);
    expect(maxProgress).toBe(100); // Should cap at 100%
  });

  it('should generate score multipliers based on streaks', () => {
    // Test score multipliers
    expect(engine.calculateScoreMultiplier(1)).toBe(1);
    expect(engine.calculateScoreMultiplier(7)).toBe(1.5);
    expect(engine.calculateScoreMultiplier(30)).toBe(2);
    expect(engine.calculateScoreMultiplier(100)).toBe(3);
  });
});