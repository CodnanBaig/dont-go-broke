import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  FlatList, 
  TextInput,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/stores';
import { CATEGORY_METADATA, ExpenseCategory } from '@/types';
import { router } from 'expo-router';
import SkeletonLoader from '@/components/SkeletonLoader';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function ExpensesScreen() {
  const { expenses, deleteExpense, isLoading, error } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Handle global error state
  React.useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);
  
  // Filter and sort expenses
  const processedExpenses = useMemo(() => {
    let result = [...expenses];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(expense => 
        expense.description.toLowerCase().includes(query) ||
        expense.category.toLowerCase().includes(query) ||
        expense.amount.toString().includes(query)
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      result = result.filter(expense => expense.category === selectedCategory);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
    
    return result;
  }, [expenses, selectedCategory, searchQuery, sortBy, sortOrder]);

  const handleAddExpense = () => {
    router.push('/add-expense');
  };

  const handleTestSMS = () => {
    router.push('/sms-test');
  };

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense-detail/${expenseId}`);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const renderExpenseItem = ({ item }: { item: typeof expenses[0] }) => {
    const categoryData = CATEGORY_METADATA[item.category];
    
    return (
      <TouchableOpacity
        className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border"
        onPress={() => handleExpensePress(item.id)}
        style={({ pressed }) => ({
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
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
                {item.description}
              </Text>
              <Text className="text-fuel-low text-lg font-bold">
                -₹{item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-gray-400 text-sm">
                  {item.category}
                </Text>
                <View className="w-1 h-1 bg-gray-600 rounded-full mx-2" />
                <Text className="text-gray-400 text-sm">
                  {formatTime(item.createdAt)}
                </Text>
              </View>
              <Text className="text-gray-400 text-sm">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#6b7280" className="ml-2" />
        </View>
      </TouchableOpacity>
    );
  };

  // Skeleton component for expense items
  const renderExpenseSkeleton = () => (
    <View className="bg-dark-card rounded-xl p-4 mb-3 border border-dark-border">
      <View className="flex-row items-center">
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <SkeletonLoader width="70%" height={18} />
            <SkeletonLoader width={80} height={20} />
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <SkeletonLoader width={60} height={14} />
              <View className="mx-2">
                <SkeletonLoader width={4} height={4} borderRadius={2} />
              </View>
              <SkeletonLoader width={80} height={14} />
            </View>
            <SkeletonLoader width={80} height={14} />
          </View>
        </View>
      </View>
    </View>
  );

  // Error display component
  const renderError = () => {
    if (!localError) return null;
    
    return (
      <View className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mx-4 mb-4">
        <View className="flex-row items-center">
          <Ionicons name="warning" size={20} color="#ef4444" />
          <Text className="text-red-400 font-medium ml-2">Error</Text>
        </View>
        <Text className="text-red-300 text-sm mt-1">{localError}</Text>
        <Pressable 
          className="mt-2 self-start"
          onPress={() => setLocalError(null)}
        >
          <Text className="text-green-400 text-sm font-medium">Dismiss</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ErrorBoundary>
      <SafeAreaView className="flex-1 bg-dark-bg">
        {isLoading && <LoadingOverlay message="Loading expenses..." />}
        
        {/* Error display */}
        {renderError()}
        
        {/* Header with Add Button */}
        <View className="flex-row items-center justify-between p-4 pb-2">
          <View>
            <Text className="text-white text-2xl font-bold">Expenses</Text>
            <Text className="text-gray-400 text-sm">
              {expenses.length} transaction{expenses.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          <View className="flex-row">
            <TouchableOpacity
              className="bg-gray-700 rounded-full w-12 h-12 items-center justify-center mr-2"
              onPress={handleTestSMS}
              accessibilityLabel="Test SMS parsing"
              accessibilityRole="button"
            >
              <Ionicons name="chatbox-ellipses" size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-fuel-full rounded-full w-12 h-12 items-center justify-center"
              onPress={handleAddExpense}
              accessibilityLabel="Add new expense"
              accessibilityRole="button"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-3">
          <View className="bg-dark-card border border-dark-border rounded-xl flex-row items-center px-4">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 py-3 px-3 text-white"
              placeholder="Search expenses..."
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search expenses"
              accessibilityHint="Enter text to search expenses by description, category, or amount"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters and Sorting */}
        <View className="flex-row items-center justify-between px-4 pb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="flex-1 max-h-16"
          >
            <TouchableOpacity
              className={`rounded-full px-4 py-2 mr-3 ${selectedCategory === null ? 'bg-fuel-full' : 'bg-dark-card border border-dark-border'}`}
              onPress={() => setSelectedCategory(null)}
              accessibilityLabel="Filter by all categories"
              accessibilityRole="button"
            >
              <Text className={`${selectedCategory === null ? 'text-white' : 'text-gray-400'} font-medium`}>
                All
              </Text>
            </TouchableOpacity>
            
            {Object.entries(CATEGORY_METADATA).map(([category, data]) => (
              <TouchableOpacity
                key={category}
                className={`rounded-full px-4 py-2 mr-3 ${selectedCategory === category ? 'bg-fuel-full' : 'bg-dark-card border border-dark-border'}`}
                onPress={() => setSelectedCategory(category)}
                accessibilityLabel={`Filter by ${category} category`}
                accessibilityRole="button"
              >
                <Text className={`${selectedCategory === category ? 'text-white' : 'text-gray-400'} font-medium`}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Sort Button */}
          <TouchableOpacity
            className="bg-dark-card border border-dark-border rounded-full w-10 h-10 items-center justify-center ml-2"
            onPress={toggleSortOrder}
            accessibilityLabel={`Sort by ${sortBy === 'date' ? 'date' : 'amount'}. Current order: ${sortOrder === 'desc' ? 'descending' : 'ascending'}`}
            accessibilityRole="button"
          >
            <Ionicons 
              name={sortBy === 'date' ? 'calendar' : 'cash'} 
              size={18} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        </View>

        {/* Active Filters Indicator */}
        {(selectedCategory || searchQuery || sortBy !== 'date' || sortOrder !== 'desc') && (
          <View className="px-4 pb-2">
            <View className="flex-row items-center">
              <Text className="text-gray-400 text-sm mr-2">Filters:</Text>
              {selectedCategory && (
                <View className="bg-fuel-full/20 rounded-full px-3 py-1 mr-2">
                  <Text className="text-fuel-full text-xs">{selectedCategory}</Text>
                </View>
              )}
              {searchQuery && (
                <View className="bg-blue-500/20 rounded-full px-3 py-1 mr-2">
                  <Text className="text-blue-400 text-xs">"{searchQuery}"</Text>
                </View>
              )}
              {sortBy !== 'date' && (
                <View className="bg-purple-500/20 rounded-full px-3 py-1 mr-2">
                  <Text className="text-purple-400 text-xs">
                    Sort by {sortBy} {sortOrder === 'desc' ? '↓' : '↑'}
                  </Text>
                </View>
              )}
              <Pressable onPress={clearFilters}>
                <Text className="text-gray-500 text-sm underline">Clear all</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Expenses List or Skeleton */}
        {isLoading ? (
          <View className="flex-1 px-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item}>
                {renderExpenseSkeleton()}
              </View>
            ))}
          </View>
        ) : processedExpenses.length > 0 ? (
          <FlatList
            data={processedExpenses}
            renderItem={renderExpenseItem}
            keyExtractor={(item) => item.id}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={False}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="receipt-outline" size={64} color="#6b7280" />
            <Text className="text-gray-400 text-lg text-center mt-4">
              {searchQuery || selectedCategory 
                ? `No expenses found for "${searchQuery || selectedCategory}"` 
                : 'No expenses yet'}
            </Text>
            <Text className="text-gray-500 text-sm text-center mt-2 mb-8">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filters' 
                : 'Add your first expense to start tracking'}
            </Text>
            
            {!searchQuery && !selectedCategory && (
              <View className="flex-row">
                <TouchableOpacity
                  className="bg-gray-700 rounded-xl px-6 py-3 mr-3"
                  onPress={handleTestSMS}
                >
                  <Text className="text-white font-semibold text-lg">Test SMS</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-fuel-full rounded-xl px-6 py-3"
                  onPress={handleAddExpense}
                >
                  <Text className="text-white font-semibold text-lg">Add Expense</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}