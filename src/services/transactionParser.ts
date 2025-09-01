import { ParsedExpense, ExpenseCategory } from '@/types';

export interface SMSParsingResult {
  expense: ParsedExpense | null;
  confidence: number;
  errors: string[];
  metadata: {
    detectedBank?: string;
    transactionType?: string;
    rawAmount?: string;
    rawDescription?: string;
  };
}

export class TransactionParser {
  private static instance: TransactionParser;
  
  public static getInstance(): TransactionParser {
    if (!TransactionParser.instance) {
      TransactionParser.instance = new TransactionParser();
    }
    return TransactionParser.instance;
  }
  
  // Main parsing method
  parseMessage(message: string): SMSParsingResult {
    const cleanedMessage = this.cleanMessage(message);
    
    // Try different parsing strategies
    const results = [
      this.parseIndianBankSMS(cleanedMessage),
      this.parseGenericSpendingSMS(cleanedMessage),
      this.parseUPITransaction(cleanedMessage),
      this.parseCardTransaction(cleanedMessage)
    ];
    
    // Return the result with highest confidence
    const bestResult = results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return bestResult;
  }
  
  private cleanMessage(message: string): string {
    return message
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s₹.,-]/g, ' ') // Keep only word chars, spaces, and common symbols
      .toLowerCase();
  }
  
  // Parse Indian bank SMS formats
  private parseIndianBankSMS(message: string): SMSParsingResult {
    const patterns = [
      // HDFC Bank pattern: "Rs 500.00 debited from A/c XX1234 on 01-Jan-24 at AMAZON INDIA"
      /(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:debited|spent|paid)\s*(?:from|on)\s*.*?(?:at|to|for)\s*([a-zA-Z0-9\s]+)/i,
      
      // SBI pattern: "Your A/c XX1234 debited by Rs.500.00 on 01JAN24 Info: AMAZON"
      /(?:debited|spent)\s*(?:by\s*)?(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*.*?(?:info:?\s*|at\s*|to\s*)([a-zA-Z0-9\s]+)/i,
      
      // ICICI pattern: "Rs.500 spent on your ICICI Card xx1234 at AMAZON on 01-Jan"
      /(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*spent\s*.*?(?:at|on|to)\s*([a-zA-Z0-9\s]+)/i,
      
      // Axis Bank pattern: "Dear Customer, Rs 500 has been debited from your account ending 1234"
      /(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:has been\s*)?(?:debited|spent|paid)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const description = match[2] ? match[2].trim() : this.extractDescription(message);
        const category = this.inferCategory(description);
        const detectedBank = this.detectBank(message);
        
        return {
          expense: {
            amount,
            description: this.formatDescription(description),
            category,
            source: 'sms',
            confidence: 0.85,
            rawMessage: message
          },
          confidence: 0.85,
          errors: [],
          metadata: {
            detectedBank,
            transactionType: 'debit',
            rawAmount: match[1],
            rawDescription: description
          }
        };
      }
    }
    
    return { expense: null, confidence: 0, errors: ['No matching bank pattern found'], metadata: {} };
  }
  
  // Parse UPI transaction messages
  private parseUPITransaction(message: string): SMSParsingResult {
    const patterns = [
      // UPI pattern: "UPI/P2P/313718221/PAYTM/amazon@paytm/Rs.500/01Jan24"
      /upi.*?(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      
      // PayTM pattern: "Rs.500 sent to AMAZON via PayTM UPI on 01-Jan-24"
      /(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:sent to|paid to|transferred to)\s*([a-zA-Z0-9\s]+)\s*via\s*.*?upi/i,
      
      // Google Pay pattern: "You paid Rs.500 to AMAZON using Google Pay"
      /(?:you\s*)?paid\s*(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*to\s*([a-zA-Z0-9\s]+)/i,
      
      // PhonePe pattern: "You have successfully paid Rs 500 to AMAZON"
      /(?:successfully\s*)?paid\s*(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*to\s*([a-zA-Z0-9\s]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const description = match[2] ? match[2].trim() : 'UPI Payment';
        const category = this.inferCategory(description);
        
        return {
          expense: {
            amount,
            description: this.formatDescription(description),
            category,
            source: 'sms',
            confidence: 0.8,
            rawMessage: message
          },
          confidence: 0.8,
          errors: [],
          metadata: {
            transactionType: 'upi',
            rawAmount: match[1],
            rawDescription: description
          }
        };
      }
    }
    
    return { expense: null, confidence: 0, errors: ['No UPI pattern matched'], metadata: {} };
  }
  
  // Parse card transaction messages
  private parseCardTransaction(message: string): SMSParsingResult {
    const patterns = [
      // Card transaction: "Your card ending 1234 used for Rs.500 at AMAZON on 01-Jan"
      /card.*?(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*at\s*([a-zA-Z0-9\s]+)/i,
      
      // Credit card: "Transaction of Rs 500 on your Credit Card xx1234 at AMAZON"
      /transaction.*?(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)\s*.*?at\s*([a-zA-Z0-9\s]+)/i,
      
      // Debit card: "ATM Cash Withdrawal Rs.500 from Card xx1234"
      /atm.*?withdrawal.*?(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        let description = match[2] ? match[2].trim() : 'Card Transaction';
        
        // Special case for ATM withdrawal
        if (message.includes('atm') || message.includes('withdrawal')) {
          description = 'ATM Withdrawal';
        }
        
        const category = this.inferCategory(description);
        
        return {
          expense: {
            amount,
            description: this.formatDescription(description),
            category,
            source: 'sms',
            confidence: 0.75,
            rawMessage: message
          },
          confidence: 0.75,
          errors: [],
          metadata: {
            transactionType: 'card',
            rawAmount: match[1],
            rawDescription: description
          }
        };
      }
    }
    
    return { expense: null, confidence: 0, errors: ['No card pattern matched'], metadata: {} };
  }
  
  // Generic spending SMS parser (fallback)
  private parseGenericSpendingSMS(message: string): SMSParsingResult {
    const amountPatterns = [
      /(?:rs\.?\s*|₹\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|inr)/i
    ];
    
    const spendingKeywords = ['spent', 'paid', 'debited', 'withdrawal', 'purchase', 'transaction'];
    
    // Check if message contains spending-related keywords
    const hasSpendingKeyword = spendingKeywords.some(keyword => 
      message.includes(keyword)
    );
    
    if (!hasSpendingKeyword) {
      return { 
        expense: null, 
        confidence: 0, 
        errors: ['No spending keywords found'], 
        metadata: {} 
      };
    }
    
    // Find amount
    for (const pattern of amountPatterns) {
      const match = message.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        
        if (amount > 0 && amount < 1000000) { // Reasonable amount range
          const description = this.extractDescription(message);
          const category = this.inferCategory(description);
          
          return {
            expense: {
              amount,
              description: this.formatDescription(description),
              category,
              source: 'sms',
              confidence: 0.6,
              rawMessage: message
            },
            confidence: 0.6,
            errors: [],
            metadata: {
              transactionType: 'generic',
              rawAmount: match[1],
              rawDescription: description
            }
          };
        }
      }
    }
    
    return { 
      expense: null, 
      confidence: 0, 
      errors: ['No valid amount found'], 
      metadata: {} 
    };
  }
  
  // Helper methods
  private detectBank(message: string): string | undefined {
    const bankKeywords = {
      'hdfc': 'HDFC Bank',
      'sbi': 'State Bank of India',
      'icici': 'ICICI Bank',
      'axis': 'Axis Bank',
      'kotak': 'Kotak Bank',
      'pnb': 'Punjab National Bank',
      'canara': 'Canara Bank',
      'union': 'Union Bank',
      'bob': 'Bank of Baroda',
      'indian': 'Indian Bank'
    };
    
    for (const [keyword, bankName] of Object.entries(bankKeywords)) {
      if (message.includes(keyword)) {
        return bankName;
      }
    }
    
    return undefined;
  }
  
  private extractDescription(message: string): string {
    // Remove common SMS prefixes and suffixes
    let description = message
      .replace(/dear\s+customer,?/i, '')
      .replace(/thank\s+you/i, '')
      .replace(/your\s+a\/c\s+\w+/i, '')
      .replace(/card\s+ending\s+\d+/i, '')
      .replace(/on\s+\d{2}[-\/]\d{2}[-\/]\d{2,4}/i, '')
      .replace(/at\s+\d{2}:\d{2}/i, '')
      .trim();
    
    // Extract merchant/vendor name
    const merchantPatterns = [
      /(?:at|to|for)\s+([a-zA-Z0-9\s]{3,20})/i,
      /info:?\s*([a-zA-Z0-9\s]{3,20})/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return 'Transaction';
  }
  
  private formatDescription(description: string): string {
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .slice(0, 50); // Limit length
  }
  
  private inferCategory(description: string): ExpenseCategory {
    const categoryKeywords = {
      [ExpenseCategory.FOOD]: ['amazon fresh', 'zomato', 'swiggy', 'dominos', 'mcdonald', 'kfc', 'food', 'restaurant', 'cafe', 'grocery', 'bigbasket', 'grofers'],
      [ExpenseCategory.TRANSPORT]: ['uber', 'ola', 'metro', 'petrol', 'fuel', 'bus', 'taxi', 'auto', 'rapido', 'transport'],
      [ExpenseCategory.ENTERTAINMENT]: ['netflix', 'amazon prime', 'spotify', 'hotstar', 'cinema', 'pvr', 'inox', 'movie', 'game', 'entertainment'],
      [ExpenseCategory.SHOPPING]: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'shopping', 'mall', 'store', 'fashion'],
      [ExpenseCategory.UTILITIES]: ['electricity', 'water', 'gas', 'internet', 'broadband', 'utility', 'bill payment'],
      [ExpenseCategory.HEALTHCARE]: ['pharmacy', 'doctor', 'hospital', 'medicine', 'health', 'medical', 'apollo', 'medplus'],
      [ExpenseCategory.SUBSCRIPTION]: ['subscription', 'monthly', 'yearly', 'plan', 'membership'],
      [ExpenseCategory.OTHERS]: ['atm', 'withdrawal', 'cash', 'transfer']
    };
    
    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }
    
    return ExpenseCategory.OTHERS;
  }
  
  // Bulk parsing for multiple messages
  parseMultipleMessages(messages: string[]): SMSParsingResult[] {
    return messages.map(message => this.parseMessage(message));
  }
  
  // Validation helpers
  validateParsedExpense(expense: ParsedExpense): boolean {
    return expense.amount > 0 && 
           expense.amount < 1000000 && 
           expense.description.length > 0 &&
           Object.values(ExpenseCategory).includes(expense.category);
  }
  
  // Get parsing statistics
  getParsingStats(results: SMSParsingResult[]): {
    totalMessages: number;
    successfullyParsed: number;
    averageConfidence: number;
    categoryDistribution: Record<string, number>;
  } {
    const successfulResults = results.filter(r => r.expense !== null);
    
    const categoryDistribution: Record<string, number> = {};
    successfulResults.forEach(result => {
      if (result.expense) {
        const category = result.expense.category;
        categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
      }
    });
    
    return {
      totalMessages: results.length,
      successfullyParsed: successfulResults.length,
      averageConfidence: successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length 
        : 0,
      categoryDistribution
    };
  }
}

// Export singleton instance
export default TransactionParser.getInstance();