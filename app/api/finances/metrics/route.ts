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

    // Get latest financial metrics - using correct model name
    const latestMetrics = await db.financialMetrics.findFirst({
      where: { productProfileId: user.activeProductProfileId },
      orderBy: { calculatedAt: 'desc' }
    });

    // Get payment integrations - using correct model name
    const paymentIntegrations = await db.gatewayConnection.findMany({
      where: { productProfileId: user.activeProductProfileId }
    });

    // Get historical metrics for trends (last 6 months)
    const historicalMetrics = await db.financialMetrics.findMany({
      where: { productProfileId: user.activeProductProfileId },
      orderBy: { calculatedAt: 'desc' },
      take: 6
    });

    return NextResponse.json({
      metrics: latestMetrics,
      historical: historicalMetrics,
      integrations: paymentIntegrations
    });

  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
