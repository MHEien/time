import { FloatingNav } from "@/components/ui/floating-navbar";

const navItems = [
  {
    name: "Home",
    link: "#",
  },
  {
    name: "Features",
    link: "#features",
  },
  {
    name: "Pricing",
    link: "#pricing",
  },
  {
    name: "Team",
    link: "#team",
  },
];

export const Header = () => {
  return (
    <header className="px-2 py-4 lg:py-6">
        <FloatingNav navItems={navItems} />
    </header>
  );
};
