'use client'

import { AppLayout } from '@/components/layouts/app-layout'
import { TriggersContent } from './triggers-content'

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

interface ProductProfile {
  productName: string;
  currentPricingModel: string | null;
  currentPrice: string | null;
  market: string | null;
}

interface TriggersClientWrapperProps {
  organizations: Organization[];
  currentOrganization: Organization;
  user: User;
  productProfile: ProductProfile | null;
}

export function TriggersClientWrapper({ 
  organizations, 
  currentOrganization, 
  user, 
  productProfile 
}: TriggersClientWrapperProps) {
  return (
    <AppLayout 
      organizations={organizations}
      currentOrganization={currentOrganization}
      user={{
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        firstName: user.firstName,
        lastName: user.lastName
      }}
    >
      <TriggersContent 
        organizationName={currentOrganization.name}
        organizationId={currentOrganization.id}
        user={user}
        productProfile={productProfile}
      />
    </AppLayout>
  )
}
