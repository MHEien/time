"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Layout, Zap, Menu } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { WavyBackground } from "@/components/ui/wavy-background";
import { SparklesCore } from "@/components/ui/sparkles";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";
import { HoverEffect } from "@/components/ui/card-hover-effect";
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

const features = [
  {
    title: "AI-Powered Insights",
    description: "Get intelligent suggestions to optimize your work schedule.",
    icon: <Zap className="h-10 w-10 text-blue-500" />,
    link: "#ai-insights"
  },
  {
    title: "Smart Scheduling",
    description: "Generate personalized work schedules based on your habits and goals.",
    icon: <Calendar className="h-10 w-10 text-green-500" />,
    link: "#smart-scheduling"
  },
  {
    title: "Real-time Adaptation",
    description: "Your AI assistant learns and adapts to your changing work patterns.",
    icon: <Clock className="h-10 w-10 text-purple-500" />,
    link: "#real-time-adaptation"
  },
  {
    title: "Desktop Activity Tracking",
    description: "Seamlessly monitor your application usage and work duration.",
    icon: <Layout className="h-10 w-10 text-yellow-500" />,
    link: "#activity-tracking"
  },
];

const people = [
  {
    id: 1,
    name: "Markus Heien",
    designation: "Fullstack Developer",
    image: "https://media.licdn.com/dms/image/v2/D4D03AQGF4GgnzQfEdA/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1693830979655?e=1732147200&v=beta&t=6bdxsxuYqrlYq2w6YLqWkzH3jsr-rCRjFv3gphum4fA",
  }
];


export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("home");
  const [showStaticNav, setShowStaticNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navOpacity, setNavOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setShowStaticNav(false);
      } else {
        setShowStaticNav(true);
      }
      setLastScrollY(currentScrollY);
      setNavOpacity(Math.max(1 - currentScrollY / 200, 0));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-opacity duration-300"
        style={{ opacity: navOpacity }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="#" className="text-xl font-bold">
                WorkflowAI
              </a>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.link}
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <FloatingNav navItems={navItems} />

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <WavyBackground className="w-full h-full">
          <div className="text-center z-10">
            <TextGenerateEffect words="WorkflowAI" className="text-6xl font-extrabold mb-6" />
            <div className="max-w-2xl mx-auto mb-8">
              <TypewriterEffect
                words={[
                  { text: "Revolutionize", className: "text-blue-500" },
                  { text: "Your", className: "text-blue-500" },
                  { text: "Workday", className: "text-blue-500" },
                  { text: "with", className: "text-blue-500" },
                  { text: "AI", className: "text-blue-500" },
                ]}
              />
            </div>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
            </Button>
          </div>
        </WavyBackground>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Powerful Features</h2>
        <HoverEffect items={features} />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 relative">
        <div className="absolute inset-0 w-full h-full">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="w-full max-w-sm bg-gray-800 rounded-lg p-8 backdrop-blur-sm bg-opacity-30">
              <h3 className="text-2xl font-bold mb-4">Free Plan</h3>
              <p className="text-3xl font-bold mb-4">$0 / month</p>
              <ul className="space-y-2 mb-6">
                <li>✓ Desktop activity tracking</li>
                <li>✓ Basic insights</li>
                <li>✓ 2 AI-generated schedules per month</li>
              </ul>
              <Button className="w-full">Get Started</Button>
            </div>
            <div className="w-full max-w-sm bg-blue-600 rounded-lg p-8 backdrop-blur-sm bg-opacity-30 relative">
              <h3 className="text-2xl font-bold mb-4">Premium Plan</h3>
              <p className="text-3xl font-bold mb-4">$19.99 / month</p>
              <ul className="space-y-2 mb-6">
                <li>✓ All Free Plan features</li>
                <li>✓ Unlimited AI-generated schedules</li>
                <li>✓ Advanced productivity insights</li>
                <li>✓ Priority support</li>
              </ul>
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">Subscribe Now</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="flex flex-wrap justify-center gap-10">
          <AnimatedTooltip items={people} />
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="text-center py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Workday?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Join thousands of professionals who have already optimized their work-life balance with WorkflowAI.
        </p>
        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
          Start Your Free Trial
        </Button>
      </section>

    </div>
  );
}