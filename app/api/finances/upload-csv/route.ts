import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentGateway } from "@prisma/client";

interface TransactionData {
  date: string;
  amount: number;
  type: 'revenue' | 'expense';
  description: string;
  category?: string;
  gateway?: 'stripe' | 'khalti';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and active product profile
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { 
        id: true, 
        activeProductProfileId: true,
        activeProductProfile: {
          select: { id: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.activeProductProfileId || !user.activeProductProfile) {
      return NextResponse.json({ error: "No active product profile found" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== 'text/csv') {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
    }

    // Parse CSV and calculate metrics (don't store raw CSV data)
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have at least a header row and one data row" }, { status: 400 });
    }

    // Parse CSV transactions for calculation purposes only
    const transactions = await parseCSVTransactions(lines, uploadType);
    
    if (transactions.length === 0) {
      return NextResponse.json({ error: "No valid transactions found in the CSV file" }, { status: 400 });
    }

    // Calculate financial metrics from parsed data
    const calculatedMetrics = await calculateFinancialMetrics(transactions, user.activeProductProfileId, user.id);

    // Store only the calculated metrics
    const financialMetrics = await db.financialMetrics.create({
      data: {
        id: `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productProfileId: user.activeProductProfileId,
        userId: user.id,
        ...calculatedMetrics,
        calculatedAt: new Date(),
        transactionCount: transactions.length
      }
    });

    // Update payment integration status
    if (uploadType === 'stripe' || uploadType === 'khalti') {
      await db.paymentIntegrations.upsert({
        where: {
          productProfileId_gateway: {
            productProfileId: user.activeProductProfileId,
            gateway: uploadType.toUpperCase() as PaymentGateway
          }
        },
        update: {
          isConnected: true,
          lastSync: new Date(),
          syncStatus: 'SYNC_COMPLETE'
        },
        create: {
          id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gateway: uploadType.toUpperCase() as PaymentGateway,
          isConnected: true,
          lastSync: new Date(),
          syncStatus: 'SYNC_COMPLETE',
          productProfileId: user.activeProductProfileId,
          userId: user.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${transactions.length} transactions and calculated financial metrics`,
      metrics: financialMetrics
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function parseCSVTransactions(lines: string[], uploadType: string): Promise<TransactionData[]> {
  // Improved CSV parsing to handle quoted values
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['date', 'amount', 'description'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
  }

  const transactions: TransactionData[] = [];
  const errors: string[] = [];

  // Parse each row with improved parsing
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const transactionData: any = {};
      
      headers.forEach((header, headerIndex) => {
        transactionData[header] = values[headerIndex] || '';
      });
      
      // Validate and parse date
      const dateStr = transactionData.date || transactionData.created_at;
      if (!dateStr) {
        errors.push(`Missing date in row ${i + 1}`);
        continue;
      }
      
      const parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) {
        errors.push(`Invalid date format in row ${i + 1}: ${dateStr}`);
        continue;
      }
      
      // Validate and parse amount
      // Fix amount parsing - remove any currency symbols
      const amountStr = (transactionData.amount || transactionData.gross || '0')
        .toString()
        .replace(/[$,\s]/g, ''); // Remove $, commas, and spaces
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount < 0) { // Allow 0 amounts
        errors.push(`Invalid amount in row ${i + 1}: ${transactionData.amount}`);
        continue;
      }
      
      transactions.push({
        date: parsedDate.toISOString(),
        amount: amount,
        type: (transactionData.type || (uploadType === 'expenses' ? 'expense' : 'revenue')) as 'revenue' | 'expense',
        description: transactionData.description || transactionData.customer_email || 'Transaction',
        category: transactionData.category || uploadType,
        gateway: (transactionData.gateway && transactionData.gateway.trim() !== '' 
          ? transactionData.gateway 
          : (uploadType === 'expenses' ? undefined : uploadType)) as 'stripe' | 'khalti' | undefined
      });
    } catch (rowError) {
      errors.push(`Error parsing row ${i + 1}: ${rowError}`);
    }
  }

  if (errors.length > 0) {
    console.warn('CSV parsing errors:', errors);
  }

  // Return parsed transactions for calculation only
  return transactions;
}

async function calculateFinancialMetrics(transactions: TransactionData[], productProfileId: string, userId: string) {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  // Current month transactions
  const currentMonthTransactions = transactions.filter(t => new Date(t.date) >= oneMonthAgo);
  
  // Calculate all metrics
  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyRevenue = currentMonthTransactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  
  // MRR calculation
  const monthlyRecurringRevenue = currentMonthTransactions
    .filter(t => t.type === 'revenue' && (
      t.category?.toLowerCase().includes('subscription') || 
      t.category?.toLowerCase().includes('monthly')
    ))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const oneTimePayments = monthlyRevenue - monthlyRecurringRevenue;
  
  // Active subscriptions count
  const activeSubscriptions = currentMonthTransactions
    .filter(t => t.type === 'revenue' && (
      t.category?.toLowerCase().includes('subscription') || 
      t.category?.toLowerCase().includes('monthly')
    ))
    .length;
  
  // ARPU calculation
  const uniqueCustomers = new Set(currentMonthTransactions.filter(t => t.type === 'revenue').map(t => t.description)).size;
  const averageRevenuePerUser = uniqueCustomers > 0 ? monthlyRevenue / uniqueCustomers : 0;
  
  // Growth rates (simplified for now)
  const revenueGrowthRate = 0; // Would need historical data
  const mrrGrowthRate = 0;
  const subscriptionGrowthRate = 0;
  
  // Cash runway calculations
  const currentCash = 15000; // Could be input from user or API
  const monthlyBurnRate = monthlyExpenses;
  const dailyBurnRate = monthlyBurnRate / 30;
  const dailyRevenue = monthlyRevenue / 30;
  const netDailyBurn = dailyBurnRate - dailyRevenue;
  
  const runwayDays = netDailyBurn > 0 ? Math.floor(currentCash / netDailyBurn) : 365 * 10;
  const runwayMonths = runwayDays / 30;
  
  const projectedCashDepletion = runwayDays < 3650 
    ? new Date(now.getTime() + (runwayDays * 24 * 60 * 60 * 1000))
    : null;

  return {
    totalRevenue,
    monthlyRecurringRevenue,
    oneTimePayments,
    averageRevenuePerUser,
    activeSubscriptions,
    revenueGrowthRate,
    mrrGrowthRate,
    subscriptionGrowthRate,
    totalExpenses,
    monthlyExpenses,
    currentCash,
    monthlyBurnRate,
    dailyBurnRate,
    dailyRevenue,
    netDailyBurn,
    runwayMonths,
    runwayDays,
    projectedCashDepletion
  };
}
