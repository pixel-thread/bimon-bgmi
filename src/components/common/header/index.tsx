import HamburgerMenu from "@/src/components/HamburgerMenu";
import DesktopNavigation from "../../DesktopNavigation";

export const Header = () => {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                PUBGMI
              </h1>
            </div>
            <DesktopNavigation />
          </div>
        </div>
      </header>
      <HamburgerMenu />
    </>
  );
};
