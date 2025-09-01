import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import TransactionParser from '@/services/transactionParser';
import { useAppStore } from '@/stores';

// Sample SMS messages for testing
const SAMPLE_SMS = [
  "Rs 500.00 debited from A/c XX1234 on 01-Jan-24 at AMAZON INDIA",
  "Your A/c XX1234 debited by Rs.1200.00 on 01JAN24 Info: SWIGGY",
  "Rs.800 spent on your ICICI Card xx1234 at ZOMATO on 01-Jan",
  "Dear Customer, Rs 250 has been debited from your account ending 1234",
  "UPI/P2P/313718221/PAYTM/amazon@paytm/Rs.1500/01Jan24",
  "Rs.300 sent to FLIPKART via PayTM UPI on 01-Jan-24",
  "You paid Rs.2000 to MYNTRA using Google Pay",
  "You have successfully paid Rs 500 to OLA",
  "Your card ending 1234 used for Rs.1200 at BIGBASKET on 01-Jan",
  "Transaction of Rs 800 on your Credit Card xx1234 at NETFLIX",
  "ATM Cash Withdrawal Rs.5000 from Card xx1234"
];

export default function SMSTestScreen() {
  const [smsInput, setSmsInput] = useState('');
  const [parsingResult, setParsingResult] = useState<any>(null);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const { addExpense } = useAppStore();

  const handleParseSMS = () => {
    if (!smsInput.trim()) {
      Alert.alert('Error', 'Please enter an SMS message to parse');
      return;
    }

    try {
      const result = TransactionParser.parseMessage(smsInput);
      setParsingResult(result);
      
      if (result.expense) {
        // Add to recent expenses for display
        setRecentExpenses(prev => [result, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Parsing error:', error);
      Alert.alert('Error', 'Failed to parse SMS message');
    }
  };

  const handleAddExpense = () => {
    if (!parsingResult?.expense) {
      Alert.alert('Error', 'No parsed expense to add');
      return;
    }

    try {
      addExpense({
        amount: parsingResult.expense.amount,
        category: parsingResult.expense.category,
        description: parsingResult.expense.description,
        source: 'sms'
      });

      Alert.alert('Success', 'Expense added from SMS!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const handleUseSample = (sample: string) => {
    setSmsInput(sample);
  };

  const renderSampleItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      className="bg-dark-card border border-dark-border rounded-lg p-3 mb-2"
      onPress={() => handleUseSample(item)}
    >
      <Text className="text-gray-300 text-sm">{item}</Text>
    </TouchableOpacity>
  );

  const renderParsingResult = () => {
    if (!parsingResult) return null;

    return (
      <View className="bg-dark-card border border-dark-border rounded-xl p-4 mt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white text-lg font-semibold">Parsing Result</Text>
          <View 
            className={`px-2 py-1 rounded-full ${
              parsingResult.expense ? 'bg-green-900/30' : 'bg-red-900/30'
            }`}
          >
            <Text 
              className={`text-xs font-medium ${
                parsingResult.expense ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {parsingResult.confidence > 0 ? `${Math.round(parsingResult.confidence * 100)}%` : 'Failed'}
            </Text>
          </View>
        </View>

        {parsingResult.expense ? (
          <View>
            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Amount</Text>
              <Text className="text-white text-xl font-bold">
                ₹{parsingResult.expense.amount.toLocaleString('en-IN')}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Description</Text>
              <Text className="text-white text-base">
                {parsingResult.expense.description}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Category</Text>
              <Text className="text-white text-base">
                {parsingResult.expense.category}
              </Text>
            </View>

            <View className="mb-3">
              <Text className="text-gray-400 text-sm">Source</Text>
              <Text className="text-white text-base capitalize">
                {parsingResult.expense.source}
              </Text>
            </View>

            <View className="flex-row mt-4">
              <TouchableOpacity
                className="flex-1 bg-fuel-full rounded-xl py-3 mr-2"
                onPress={handleAddExpense}
              >
                <Text className="text-white text-center font-semibold">Add Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-700 rounded-xl py-3 ml-2"
                onPress={() => setParsingResult(null)}
              >
                <Text className="text-white text-center font-semibold">Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text className="text-red-400 text-base mb-2">Failed to parse SMS</Text>
            {parsingResult.errors.map((error: string, index: number) => (
              <Text key={index} className="text-gray-400 text-sm mb-1">• {error}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      <View className="flex-row items-center justify-between p-4 border-b border-dark-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-semibold">SMS Parser Test</Text>
        
        <View className="w-6" /> {/* Spacer */}
      </View>

      <ScrollView 
        className="flex-1 p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* SMS Input */}
        <View className="mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Enter SMS Message</Text>
          <View className="bg-dark-card border border-dark-border rounded-xl">
            <TextInput
              className="text-white text-base p-4 min-h-[100px]"
              placeholder="Paste an SMS transaction message here..."
              placeholderTextColor="#6b7280"
              value={smsInput}
              onChangeText={setSmsInput}
              multiline
              textAlignVertical="top"
            />
          </View>
          
          <TouchableOpacity
            className="bg-fuel-full rounded-xl py-3 mt-3"
            onPress={handleParseSMS}
            disabled={!smsInput.trim()}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Parse SMS
            </Text>
          </TouchableOpacity>
        </View>

        {/* Parsing Result */}
        {renderParsingResult()}

        {/* Sample Messages */}
        <View className="mt-6">
          <Text className="text-white text-lg font-semibold mb-3">Sample Messages</Text>
          <FlatList
            data={SAMPLE_SMS}
            renderItem={renderSampleItem}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}