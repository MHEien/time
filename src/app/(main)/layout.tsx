import { type ReactNode } from "react";
import { Header } from "./_components/header";
import { Footer } from "./_components/footer";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
 
      {children}
      <Footer />
    </>
  );
};

export default MainLayout;
