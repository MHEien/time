import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomTabsProps {
  tabs: { title: string; value: string }[];
  activeTab: string;
  setActiveTab: (value: string) => void;
}

export const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
