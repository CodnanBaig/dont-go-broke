import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CATEGORY_METADATA } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date | string;
  source: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ExpenseListProps {
  expenses: Expense[];
  showGrouping?: boolean;
  showActions?: boolean;
  emptyMessage?: string;
  onExpensePress?: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  showGrouping = true,
  showActions = true,
  emptyMessage = 'No expenses yet',
  onExpensePress,
  onExpenseDelete
}) => {
  const { triggerHaptic } = useHapticFeedback();
  
  // Group expenses by date
  const groupedExpenses = useMemo(() => {
    if (!showGrouping) {
      return [{ date: 'All', expenses }];
    }
    
    const groups: Record<string, Expense[]> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const dateKey = format(date, 'yyyy-MM-dd');
      const groupLabel = format(date, 'd MMMM yyyy');
      
      if (!groups[groupLabel]) {
        groups[groupLabel] = [];
      }
      groups[groupLabel].push(expense);
    });
    
    return Object.entries(groups).map(([date, groupExpenses]) => ({
      date,
      expenses: groupExpenses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })).sort((a, b) => 
      new Date(b.expenses[0].date).getTime() - new Date(a.expenses[0].date).getTime()
    );
  }, [expenses, showGrouping]);

  const handleExpensePress = (expense: Expense) => {
    triggerHaptic('selection');
    onExpensePress?.(expense);
  };

  const handleExpenseDelete = (expenseId: string, expenseDescription: string) => {
    triggerHaptic('impactLight');
    
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expenseDescription}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => triggerHaptic('selection')
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('notificationWarning');
            onExpenseDelete?.(expenseId);
          }
        }
      ]
    );
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (expenses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Ionicons name="receipt-outline" size={64} color="#6b7280" />
        <Text className="text-gray-400 text-lg text-center mt-4">
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {groupedExpenses.map((group) => (
        <View key={group.date} className="mb-6">
          {showGrouping && (
            <Text className="text-gray-400 text-sm font-medium mb-3 ml-1">
              {group.date}
            </Text>
          )}
          
          {group.expenses.map((expense) => {
            const categoryData = CATEGORY_METADATA[expense.category] || 
              CATEGORY_METADATA.Others;
            
            return (
              <TouchableOpacity
                key={expense.id}
                className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border"
                onPress={() => handleExpensePress(expense)}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
                accessibilityLabel={`Expense: ${expense.description}, Amount: ₹${expense.amount}`}
                accessibilityRole="button"
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-12 h-12 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: categoryData.color + '20' }}
                  >
                    <Ionicons 
                      name={categoryData.icon as any} 
                      size={24} 
                      color={categoryData.color} 
                    />
                  </View>
                  
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text 
                        className="text-white font-semibold text-base flex-1 mr-2" 
                        numberOfLines={1}
                      >
                        {expense.description}
                      </Text>
                      <Text className="text-fuel-low text-lg font-bold">
                        -₹{expense.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="text-gray-400 text-sm">
                          {expense.category}
                        </Text>
                        <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                        <Text className="text-gray-400 text-sm">
                          {formatTime(expense.createdAt)}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-sm">
                        {expense.source === 'sms' ? 'SMS' : 'Manual'}
                      </Text>
                    </View>
                  </View>
                  
                  {showActions && onExpenseDelete && (
                    <TouchableOpacity
                      className="ml-2"
                      onPress={() => handleExpenseDelete(expense.id, expense.description)}
                      accessibilityLabel={`Delete expense: ${expense.description}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  
                  {onExpensePress && (
                    <Ionicons name="chevron-forward" size={20} color="#6b7280" className="ml-2" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default ExpenseList;
