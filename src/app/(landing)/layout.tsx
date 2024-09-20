import { APP_TITLE } from "@/lib/constants";
import { type ReactNode } from "react";
import { type Metadata } from "next";
import { Footer } from "./_components/footer";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "A time tracker and workflow optimization tool",
};

function LandingPageLayout({ children }: { children: ReactNode }) {
  return (
    <>

      {children}
      <Footer />
    </>
  );
}

export default LandingPageLayout;
