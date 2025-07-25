"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  Blocks,
  ChevronsUpDown,
  LayoutDashboard,
  Plus,
  UserCircle,
  UserCog,
} from "lucide-react";
import { BsCreditCard2FrontFill, BsGlobeAmericas, BsStack } from "react-icons/bs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link";
import { PiCodeBold, PiPlugsFill } from "react-icons/pi";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BiSolidGift } from "react-icons/bi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { SiReasonstudios } from "react-icons/si";
import { FaEuroSign } from "react-icons/fa";
import { AiFillProduct } from "react-icons/ai";

const useSubscription = () => {
  return {
    tier: "FREE",
    isActive: true,
    expiresAt: null,
  };
};

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "4.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut",
  duration: 0.2,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};


interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface User {
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

interface SessionNavBarProps {
  organizations?: Organization[];
  currentOrganization?: Organization;
  onOrganizationChange?: (orgId: string) => void;
  user?: User;
  hasTrialBanner?: boolean; // New prop to indicate if trial banner is shown
}

export function SessionNavBar({ 
  organizations = [], 
  currentOrganization, 
  onOrganizationChange, 
  user,
  hasTrialBanner = false // Default to false
}: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { tier } = useSubscription();
    
  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r bg-amber-50  dark:bg-amber-400 dark:text-amber-900",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col text-muted-foreground"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col">
            {/* Logo Section */}
            <div className="flex h-16 w-full shrink-0 items-center dark:invert border-b px-3">
              <div className="flex items-center gap-3">
                <Image src="/logo.png"
                  alt="PricingOS"
                  width={42}
                  height={42}
                  className="h-9 w-9 rounded-md">
                </Image>
                <motion.span
                  variants={variants}
                  className="text-lg font-semibold text-foreground"
                >
                  {!isCollapsed && "PricingOS"}
                </motion.span>
              </div>
            </div>

            {/* Organization Switcher */}
            <div className="flex h-14 w-full shrink-0 items-center border-b px-3">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="w-full" asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex w-full items-center justify-start gap-3 px-0 h-8"
                  >
                    <Avatar className="h-6 w-6 rounded-md bg-amber-200">
                      <AvatarFallback className="rounded-md text-xs bg-amber-200 text-amber-800">
                        {currentOrganization?.name?.[0]?.toUpperCase() || 'O'}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      variants={variants}
                      className="flex flex-1 items-center justify-between"
                    >
                      {!isCollapsed && (
                        <>
                          <span className="text-sm font-medium text-left truncate">
                            {currentOrganization?.name || 'Select Organization'}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                        </>
                      )}
                    </motion.div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => onOrganizationChange?.(org.id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6 rounded-md bg-amber-200">
                        <AvatarFallback className="rounded-md text-xs bg-amber-200 text-amber-800">
                          {org.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{org.name}</span>
                        <span className="text-xs text-muted-foreground">{org.slug}</span>
                      </div>
                      {currentOrganization?.id === org.id && (
                        <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    asChild
                    className="flex items-center gap-2"
                  >
                    <Link href="/settings/members">
                      <UserCog className="h-4 w-4" /> Manage members
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="flex items-center gap-2"
                  >
                    <Link href="/settings/integrations">
                      <Blocks className="h-4 w-4" /> Integrations
                    </Link>
                  </DropdownMenuItem>
                  {tier !== 'FREE' && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/select-org"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create or join an organization
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Navigation */}
            <div className="flex h-full w-full flex-col px-3 py-4">
              <ScrollArea className="flex-1">
                <div className="space-y-1">
                  {/* Main Navigation */}
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("dashboard") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Dashboard"}
                      </motion.span>
                    </Link>
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-1">
                    <div className="px-2 py-1">
                      <motion.span variants={variants} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {!isCollapsed && "Core"}
                      </motion.span>
                    </div>

                    <Link
                      href="/product"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("product") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <AiFillProduct className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Product Builder"}
                      </motion.span>
                    </Link>


                    <Link
                      href="/testing"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("testing") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <SiReasonstudios className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Pricing Simulator"}
                      </motion.span>
                    </Link>
                    <Link
                      href="/finances"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("finances") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <FaEuroSign className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Finances"}
                      </motion.span>
                    </Link>
                    <Link
                      href="/triggers"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("triggers") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <BsStack className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Setup Triggers"}
                      </motion.span>
                    </Link>

                  </div>

                  <Separator className="my-3" />

                  {/* Billing & Usage */}
                  <div className="space-y-1">
                    <div className="px-2 py-1">
                      <motion.span variants={variants} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {!isCollapsed && "Billing & Usage"}
                      </motion.span>
                    </div>
                    
                    <Link
                      href="/billing"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("billing") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <BsCreditCard2FrontFill className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Billing"}
                      </motion.span>
                    </Link>
                    
                    <Link
                      href="/refer"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("refer") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <BiSolidGift className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Refer a Friend"}
                      </motion.span>
                    </Link>
                  </div>

                  <Separator className="my-3" />

                  {/* Account */}
                  <div className="space-y-1">
                    <div className="px-2 py-1">
                      <motion.span variants={variants} className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {!isCollapsed && "Account"}
                      </motion.span>
                    </div>
                    
                    <Link
                      href="/profile"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname === "/profile" && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <UserCircle className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Profile"}
                      </motion.span>
                    </Link>
                    
                    <Link
                      href="/organization"
                      className={cn(
                        "flex h-9 w-full items-center gap-3 rounded-lg px-2 text-sm font-medium transition-colors hover:bg-amber-50 hover:text-amber-700",
                        pathname?.includes("organization") && "bg-amber-100 text-amber-700",
                      )}
                    >
                      <UserCog className="h-4 w-4 shrink-0" />
                      <motion.span variants={variants} className="truncate">
                        {!isCollapsed && "Teams"}
                      </motion.span>
                    </Link>
                    
                  </div>
                </div>
              </ScrollArea>

              {/* Bottom Section */}
              <div className="mt-4 space-y-1 border-t pt-4">
                <div className="flex h-9 w-full items-center gap-3 rounded-lg px-2 transition-colors hover:bg-amber-50 hover:text-amber-700">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-4 h-4",
                        userButtonPopoverCard: "border shadow-lg",
                      }
                    }}
                  />
                    {!isCollapsed && (user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Account')}
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}