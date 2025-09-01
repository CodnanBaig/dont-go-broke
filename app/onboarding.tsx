import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppStore } from '@/stores';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  SlideInRight,
  SlideOutLeft
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Fuel Tracker',
    description: 'Transform your finances into a fuel tracking adventure! Monitor your money like fuel in a tank.',
    icon: 'speedometer'
  },
  {
    id: 2,
    title: 'Track Your Fuel',
    description: 'See how many days your money will last. Watch your fuel gauge and get alerts when running low.',
    icon: 'battery-charging'
  },
  {
    id: 3,
    title: 'Smart Suggestions',
    description: 'Get AI-powered tips to save money, invest wisely, and optimize your spending patterns.',
    icon: 'bulb'
  },
  {
    id: 4,
    title: 'Set Your Salary',
    description: 'Let\'s start by setting up your monthly income to calculate your fuel levels.',
    icon: 'wallet'
  }
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [salaryAmount, setSalaryAmount] = useState('');
  const { setSalary, setUser } = useAppStore();
  const scrollRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const amount = parseFloat(salaryAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid salary amount to continue');
      return;
    }

    // Set up initial user and salary
    setSalary(amount);
    setUser({
      id: 'user_' + Date.now(),
      name: 'User',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      onboardingCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    Alert.alert(
      '🎉 Welcome Aboard!',
      `Wallet recharged with ₹${amount.toLocaleString()}! You're all set to start tracking your fuel.`,
      [
        {
          text: 'Let\'s Go!',
          onPress: () => {
            router.replace('/(tabs)');
          }
        }
      ]
    );
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-dark-bg">
      {/* Progress Indicator */}
      <View className="flex-row justify-center p-4">
        {onboardingSteps.map((_, index) => (
          <View
            key={index}
            className={`w-2 h-2 rounded-full mx-1 ${
              index <= currentStep ? 'bg-fuel-full' : 'bg-gray-600'
            }`}
          />
        ))}
      </View>

      <ScrollView 
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Content */}
        <View className="flex-1 justify-center px-8">
          <Animated.View 
            entering={FadeInUp.duration(800).springify()}
            className="items-center mb-12"
          >
            {/* Icon */}
            <View className="w-24 h-24 bg-fuel-full/20 rounded-full items-center justify-center mb-8">
              <Ionicons 
                name={currentStepData.icon as any} 
                size={48} 
                color="#22c55e" 
              />
            </View>

            {/* Title */}
            <Text className="text-white text-3xl font-bold text-center mb-4">
              {currentStepData.title}
            </Text>

            {/* Description */}
            <Text className="text-gray-300 text-lg text-center leading-6">
              {currentStepData.description}
            </Text>
          </Animated.View>

          {/* Salary Input (only on last step) */}
          {isLastStep && (
            <Animated.View 
              entering={FadeInDown.duration(800).springify()}
              className="mb-8"
            >
              <Text className="text-white text-lg font-semibold mb-4">
                Monthly Salary
              </Text>
              
              <View className="bg-dark-card border border-dark-border rounded-xl p-4 flex-row items-center">
                <Text className="text-gray-400 text-xl mr-3">₹</Text>
                <TextInput
                  className="flex-1 text-white text-xl"
                  placeholder="Enter your monthly salary"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={salaryAmount}
                  onChangeText={setSalaryAmount}
                  autoFocus
                />
              </View>
              
              <Text className="text-gray-400 text-sm mt-2">
                This helps us calculate how many days your money will last
              </Text>
            </Animated.View>
          )}

          {/* Features Preview (for middle steps) */}
          {currentStep === 1 && (
            <Animated.View 
              entering={SlideInRight.duration(700).springify()}
              className="mb-8"
            >
              <View className="bg-dark-card rounded-xl p-6 border border-dark-border">
                <View className="flex-row items-center mb-4">
                  <View className="w-16 h-16 bg-fuel-full rounded-full items-center justify-center mr-4">
                    <Text className="text-white text-2xl font-bold">25</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">Days Remaining</Text>
                    <Text className="text-gray-400">Based on your spending</Text>
                  </View>
                </View>
                
                <View className="h-2 bg-gray-700 rounded-full">
                  <View 
                    className="h-2 bg-fuel-medium rounded-full"
                    style={{ width: '60%' }}
                  />
                </View>
                
                <Text className="text-fuel-medium text-sm mt-2 font-medium">
                  60% Fuel Remaining
                </Text>
              </View>
            </Animated.View>
          )}

          {currentStep === 2 && (
            <Animated.View 
              entering={SlideInRight.duration(700).springify()}
              className="mb-8"
            >
              <View className="bg-dark-card rounded-xl p-6 border border-dark-border">
                <Text className="text-fuel-full text-lg font-semibold mb-3">💡 Smart Tip</Text>
                <Text className="text-gray-300 mb-4">
                  "You're spending 40% on food. Cook at home more often to save ₹3,000 this month!"
                </Text>
                
                <View className="flex-row">
                  <TouchableOpacity className="bg-fuel-full rounded-lg px-4 py-2 mr-3">
                    <Text className="text-white font-medium">Apply Tip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity className="bg-gray-600 rounded-lg px-4 py-2">
                    <Text className="text-white font-medium">Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="p-8">
        <View className="flex-row justify-between items-center">
          {currentStep > 0 ? (
            <TouchableOpacity
              className="flex-row items-center bg-gray-700 rounded-xl px-6 py-4"
              onPress={handlePrevious}
              style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
              accessibilityLabel="Go to previous onboarding step"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            className="flex-row items-center bg-fuel-full rounded-xl px-8 py-4"
            onPress={handleNext}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
            accessibilityLabel={isLastStep ? "Complete onboarding" : "Go to next onboarding step"}
            accessibilityRole="button"
          >
            <Text className="text-white font-semibold text-lg mr-2">
              {isLastStep ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={isLastStep ? "checkmark" : "chevron-forward"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}