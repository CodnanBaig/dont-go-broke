import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Suggestion } from '@/types';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onActionPress?: (suggestion: Suggestion, actionId: string) => void;
  onDismiss?: (suggestionId: string) => void;
  maxVisible?: number;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  onActionPress,
  onDismiss,
  maxVisible = 3
}) => {
  const { triggerHaptic } = useHapticFeedback();
  
  const visibleSuggestions = suggestions.slice(0, maxVisible);

  if (visibleSuggestions.length === 0) {
    return (
      <View className="px-4 py-6">
        <View className="bg-dark-card rounded-2xl p-6 border border-dark-border items-center">
          <Ionicons name="bulb-outline" size={48} color="#6b7280" />
          <Text className="text-gray-400 text-lg text-center mt-4">
            No suggestions right now
          </Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            We'll analyze your spending and provide smart recommendations
          </Text>
        </View>
      </View>
    );
  }

  const handleActionPress = (suggestion: Suggestion, actionId: string) => {
    triggerHaptic('selection');
    onActionPress?.(suggestion, actionId);
  };

  const handleDismiss = (suggestionId: string) => {
    triggerHaptic('impactLight');
    onDismiss?.(suggestionId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'normal': return 'text-blue-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'alert-circle';
      case 'high': return 'warning';
      case 'normal': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  return (
    <View className="px-4">
      <Text className="text-white text-lg font-semibold mb-4">Smart Suggestions</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {visibleSuggestions.map((suggestion) => (
          <View 
            key={suggestion.id}
            className="bg-dark-card rounded-2xl p-4 mr-4 border border-dark-border w-80"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  suggestion.priority === 'urgent' ? 'bg-red-900/20' :
                  suggestion.priority === 'high' ? 'bg-orange-900/20' :
                  suggestion.priority === 'normal' ? 'bg-blue-900/20' :
                  'bg-green-900/20'
                }`}>
                  <Ionicons 
                    name={getPriorityIcon(suggestion.priority) as any} 
                    size={20} 
                    color={
                      suggestion.priority === 'urgent' ? '#f87171' :
                      suggestion.priority === 'high' ? '#fb923c' :
                      suggestion.priority === 'normal' ? '#60a5fa' :
                      '#4ade80'
                    } 
                  />
                </View>
                
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    {suggestion.title}
                  </Text>
                  <Text className="text-gray-400 text-sm mt-1">
                    {suggestion.description}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => handleDismiss(suggestion.id)}
                className="ml-2"
                accessibilityLabel="Dismiss suggestion"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            {suggestion.impact && (
              <View className="flex-row items-center mt-3">
                <View className="flex-row items-center mr-4">
                  <Ionicons name="trending-up" size={16} color="#22c55e" />
                  <Text className="text-green-400 text-xs ml-1">
                    +{suggestion.impact.daysGained || 0} days
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  <Ionicons name="cash" size={16} color="#f59e0b" />
                  <Text className="text-yellow-400 text-xs ml-1">
                    ₹{Math.round(suggestion.impact.moneySaved || 0)}
                  </Text>
                </View>
              </View>
            )}
            
            {suggestion.actionData && (
              <View className="flex-row mt-4">
                <TouchableOpacity
                  className="bg-fuel-full rounded-full px-4 py-2 flex-1 mr-2"
                  onPress={() => handleActionPress(suggestion, 'primary')}
                  accessibilityLabel="Take primary action on suggestion"
                  accessibilityRole="button"
                >
                  <Text className="text-white text-sm font-medium text-center">
                    {suggestion.action === 'save' ? 'Save Now' :
                     suggestion.action === 'invest' ? 'Invest' :
                     suggestion.action === 'reduce_spending' ? 'Cut Spending' :
                     suggestion.action === 'review_expenses' ? 'Review' :
                     suggestion.action === 'adjust_budget' ? 'Adjust Budget' :
                     'Take Action'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-dark-border rounded-full px-4 py-2 flex-1 ml-2"
                  onPress={() => handleActionPress(suggestion, 'secondary')}
                  accessibilityLabel="Learn more about this suggestion"
                  accessibilityRole="button"
                >
                  <Text className="text-gray-300 text-sm font-medium text-center">
                    Learn More
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default SmartSuggestions;