import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TransactionType, PaymentGateway } from "@prisma/client";

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

    // Parse CSV - Fix the parsing logic
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV file must have at least a header row and one data row" }, { status: 400 });
    }

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
      return NextResponse.json({ error: `Missing required headers: ${missingHeaders.join(', ')}` }, { status: 400 });
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

    if (transactions.length === 0) {
      return NextResponse.json({ 
        error: "No valid transactions found in the CSV file",
        details: errors 
      }, { status: 400 });
    }

    // Store transactions in database
    const createdTransactions = [];
    
    for (const transaction of transactions) {
      try {
        const created = await db.financialTransactions.create({
          data: {
            id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: transaction.amount,
            type: transaction.type.toUpperCase() as TransactionType,
            description: transaction.description,
            category: transaction.category,
            gateway: transaction.gateway ? transaction.gateway.toUpperCase() as PaymentGateway : null,
            date: new Date(transaction.date),
            productProfileId: user.activeProductProfileId,
            userId: user.id,
            metadata: {
              uploadType,
              uploadedAt: new Date().toISOString(),
              source: 'csv_upload'
            }
          }
        });
        createdTransactions.push(created);
      } catch (dbError) {
        console.error('Error creating transaction:', dbError);
        errors.push(`Failed to save transaction: ${transaction.description}`);
      }
    }

    // Update payment integration status if transactions were created
    if (createdTransactions.length > 0 && (uploadType === 'stripe' || uploadType === 'khalti')) {
      try {
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
      } catch (integrationError) {
        console.error('Error updating payment integration:', integrationError);
      }
    }

    // Calculate and update financial metrics
    await updateFinancialMetrics(user.activeProductProfileId, user.id);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdTransactions.length} transactions`,
      transactionsCreated: createdTransactions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updateFinancialMetrics(productProfileId: string, userId: string) {
  try {
    // Get all transactions for this product profile
    const transactions = await db.financialTransactions.findMany({
      where: { productProfileId },
      orderBy: { date: 'desc' }
    });

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    // Current month transactions
    const currentMonthTransactions = transactions.filter(t => t.date >= oneMonthAgo);
    
    // Calculate metrics
    const totalRevenue = transactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyRevenue = currentMonthTransactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = currentMonthTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    
    // MRR calculation (subscription revenue)
    const monthlyRecurringRevenue = currentMonthTransactions
      .filter(t => t.type === 'REVENUE' && (
        t.category?.toLowerCase().includes('subscription') || 
        t.category?.toLowerCase().includes('monthly')
      ))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const oneTimePayments = monthlyRevenue - monthlyRecurringRevenue;
    
    // Active subscriptions count
    const activeSubscriptions = currentMonthTransactions
      .filter(t => t.type === 'REVENUE' && (
        t.category?.toLowerCase().includes('subscription') || 
        t.category?.toLowerCase().includes('monthly')
      ))
      .length;
    
    // ARPU calculation
    const uniqueCustomers = new Set(currentMonthTransactions.filter(t => t.type === 'REVENUE').map(t => t.description)).size;
    const averageRevenuePerUser = uniqueCustomers > 0 ? monthlyRevenue / uniqueCustomers : 0;
    
    // Growth rates (compare current vs previous month)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    const previousMonthTransactions = transactions.filter(t => t.date >= twoMonthsAgo && t.date < oneMonthAgo);
    
    const previousMonthRevenue = previousMonthTransactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + t.amount, 0);
    const revenueGrowthRate = previousMonthRevenue > 0 ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;
    
    const previousMonthMRR = previousMonthTransactions
      .filter(t => t.type === 'REVENUE' && (
        t.category?.toLowerCase().includes('subscription') || 
        t.category?.toLowerCase().includes('monthly')
      ))
      .reduce((sum, t) => sum + t.amount, 0);
    const mrrGrowthRate = previousMonthMRR > 0 ? ((monthlyRecurringRevenue - previousMonthMRR) / previousMonthMRR) * 100 : 0;
    
    const previousMonthSubscriptions = previousMonthTransactions
      .filter(t => t.type === 'REVENUE' && (
        t.category?.toLowerCase().includes('subscription') || 
        t.category?.toLowerCase().includes('monthly')
      ))
      .length;
    const subscriptionGrowthRate = previousMonthSubscriptions > 0 ? ((activeSubscriptions - previousMonthSubscriptions) / previousMonthSubscriptions) * 100 : 0;
    
    // Cash runway calculations
    const currentCash = 15000; // Default/simulated value - in real app this would come from balance API
    const monthlyBurnRate = monthlyExpenses;
    const dailyBurnRate = monthlyBurnRate / 30;
    const dailyRevenue = monthlyRevenue / 30;
    const netDailyBurn = dailyBurnRate - dailyRevenue;
    
    const runwayDays = netDailyBurn > 0 ? Math.floor(currentCash / netDailyBurn) : 365 * 10;
    const runwayMonths = runwayDays / 30;
    
    const projectedCashDepletion = new Date(now.getTime() + (runwayDays * 24 * 60 * 60 * 1000));

    // Upsert financial metrics
    await db.financialMetrics.upsert({
      where: {
        productProfileId_calculatedAt: {
          productProfileId,
          calculatedAt: now
        }
      },
      update: {
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
        projectedCashDepletion,
        transactionCount: transactions.length,
        updatedAt: now
      },
      create: {
        id: `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productProfileId,
        userId,
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
        projectedCashDepletion,
        calculatedAt: now,
        transactionCount: transactions.length
      }
    });

  } catch (error) {
    console.error('Error updating financial metrics:', error);
  }
}
