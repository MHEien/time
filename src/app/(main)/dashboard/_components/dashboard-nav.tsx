"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileTextIcon, CreditCard, GearIcon, CalendarIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
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
    title: "Settings",
    href: "/dashboard/settings",
    icon: GearIcon,
  },
];

interface Props {
  className?: string;
}

export function DashboardNav({ className }: Props) {
  const path = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <nav className={cn("bg-zinc-800 rounded-lg p-4", className)}>
      <TextGenerateEffect words="WorkflowAI Dashboard" className="text-2xl font-bold mb-6 text-center" />
      {items.map((item, index) => (
        <Link href={item.href} key={item.href}>
          <motion.div
            className={cn(
              "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
              path === item.href ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white",
            )}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <item.icon className="mr-3 h-6 w-6" />
            <span>{item.title}</span>
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
        </Link>
      ))}
    </nav>
  );
}