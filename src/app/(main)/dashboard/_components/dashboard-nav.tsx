"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarIcon, CreditCard, GearIcon, OpenInNewWindowIcon as IntegrationsIcon, PersonIcon as UserIcon, GlobeIcon, ChevronDownIcon, GitHubLogoIcon} from "@/components/icons";
import { usePathname, useRouter } from "next/navigation";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const items = [
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: CalendarIcon,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "GitHub",
    href: "/dashboard/github",
    icon: GitHubLogoIcon,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: GearIcon,
    subItems: [
      {
        title: "Integrations",
        href: "/dashboard/settings/integrations",
        icon: IntegrationsIcon,
      },
      {
        title: "Account",
        href: "/dashboard/account",
        icon: UserIcon,
      },
      {
        title: "Locale",
        href: "/dashboard/settings/locale",
        icon: GlobeIcon,
      },
    ],
  },
];

interface Props {
  className?: string;
}

export function DashboardNav({ className }: Props) {
  const path = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const router = useRouter();

  const handleItemClick = (item: typeof items[0]) => {
    if (item.subItems) {
      setExpandedItem(expandedItem === item.title ? null : item.title);
    } else {
      router.push(item.href);
    }
  };

  const renderNavItem = (item: typeof items[0], index: number, depth = 0) => (
    <div key={item.href}>
      <motion.div
        className={cn(
          "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
          path === item.href ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
          depth > 0 && "pl-8"
        )}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => handleItemClick(item)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center">
          <item.icon className="mr-3 h-6 w-6" />
          <span>{item.title}</span>
        </div>
        {item.subItems && (
          <ChevronDownIcon
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              expandedItem === item.title && "transform rotate-180"
            )}
          />
        )}
        {hoveredIndex === index && (
          <motion.div
            className="absolute inset-0 z-0 bg-blue-500 rounded-md"
            layoutId="hoverBackground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
      <AnimatePresence>
        {item.subItems && expandedItem === item.title && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {item.subItems.map((subItem, subIndex) =>
              renderNavItem(subItem, parseInt(`${index}${subIndex}`, 10), depth + 1)
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <nav className={cn("bg-zinc-800 h-screen flex flex-col rounded-lg p-4", className)}>
      <TextGenerateEffect words="WorkflowAI Dashboard" className="text-2xl font-bold mb-6 text-center" />
      {items.map((item, index) => renderNavItem(item, index))}
    </nav>
  );
}