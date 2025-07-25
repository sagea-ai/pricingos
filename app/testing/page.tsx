import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TestingPageClient } from "@/components/testing/testing-page-client";

export const metadata = {
  title: "PricingOS Strategy Hub",
  description: "AI-powered pricing strategy tools and simulations"
}

export default async function PricingStrategyPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: {
      productProfile: true,
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

  if (!user || !user.hasCompletedOnboarding) {
    redirect("/onboarding");
  }

  if (!user.productProfile) {
    redirect("/product-profile");
  }

  const organizations = user.organizationMemberships.map(membership => membership.organization);
  const currentOrganization = organizations[0];

  if (!currentOrganization) {
    redirect("/onboarding");
  }

  return (
    <TestingPageClient 
      user={user}
      productProfile={user.productProfile}
      organizations={organizations}
      currentOrganization={currentOrganization}
    />
  );
}
