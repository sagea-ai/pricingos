import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProductPageClient } from "@/components/product/product-page-client";

export default async function ProductPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { 
        hasCompletedOnboarding: true,
        id: true,
        firstName: true,
        lastName: true,
        activeProductProfile: {
          select: {
            id: true,
            productName: true
          }
        },
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
    });

    // If user doesn't exist or hasn't completed onboarding, redirect to onboarding
    if (!user || !user.hasCompletedOnboarding) {
      redirect("/onboarding");
    }

    // If user hasn't completed product profile, redirect to product profile
    if (!user.activeProductProfile) {
      redirect("/product-profile");
    }

    const organizations = user.organizationMemberships.map(membership => membership.organization);
    
    if (organizations.length === 0) {
      // User completed onboarding but has no organizations - redirect back to onboarding
      redirect("/onboarding");
    }
    
    const currentOrganization = organizations[0];

    return (
      <ProductPageClient 
        organizations={organizations}
        currentOrganization={currentOrganization}
      />
    );
  } catch (error) {
    console.error('Product page error:', error);
    redirect("/onboarding");
  }
}
