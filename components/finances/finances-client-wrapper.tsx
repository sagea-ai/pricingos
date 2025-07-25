'use client'

import { useState } from "react";
import { AppLayout } from "@/components/layouts/app-layout";
import { FinancesContent } from "@/components/finances/finances-content";
import { useUser } from "@clerk/nextjs";

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface ProductProfile {
  productName: string;
  currentPricingModel: string | null;
  currentPrice: string | null;
  market: string | null;
}

interface FinancesClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  productProfile: ProductProfile | null;
}

export function FinancesClientWrapper({ 
  organizations, 
  currentOrganization: initialOrganization,
  productProfile,
}: FinancesClientWrapperProps) {
  const [currentOrganization, setCurrentOrganization] = useState(initialOrganization);
  const { user } = useUser();

  const handleOrganizationChange = (orgId: string) => {
    const newOrg = organizations.find(org => org.id === orgId);
    if (newOrg) {
      setCurrentOrganization(newOrg);
    }
  };

  return (
    <AppLayout
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrganizationChange}
      user={user}
    >
      <FinancesContent 
        organizationName={currentOrganization.name}
        organizationId={currentOrganization.id}
        productProfile={productProfile}
      />
    </AppLayout>
  );
}
