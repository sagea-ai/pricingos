import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
        activeProductProfileId: true 
      }
    });

    if (!user || !user.activeProductProfileId) {
      return NextResponse.json({ error: "No active product profile found" }, { status: 400 });
    }

    // Get latest financial metrics
    const latestMetrics = await db.financialMetrics.findFirst({
      where: { productProfileId: user.activeProductProfileId },
      orderBy: { calculatedAt: 'desc' }
    });

    // Get recent transactions
    const recentTransactions = await db.financialTransactions.findMany({
      where: { productProfileId: user.activeProductProfileId },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get payment integrations
    const paymentIntegrations = await db.paymentIntegrations.findMany({
      where: { productProfileId: user.activeProductProfileId }
    });

    return NextResponse.json({
      metrics: latestMetrics,
      transactions: recentTransactions,
      integrations: paymentIntegrations
    });

  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
