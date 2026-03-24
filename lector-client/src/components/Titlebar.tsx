import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Titlebar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-20 h-[70px] flex items-center border-b-4 border-border bg-secondary-background px-5">
      {/* Logo - Always on left */}
      <Button variant="default" size="icon" className="shrink-0" asChild>
        <a href="/" className="text-[22px] font-logo font-black" style={{ WebkitTextStroke: "1px black" }}>
          L
        </a>
      </Button>

      {/* Desktop Navigation - Centered Buttons */}
      <div className="hidden sm:flex items-center justify-center flex-1 gap-2">
        {["Scans", "Upload", "About"].map((link) => (
          <Button key={link} variant="neutral" asChild>
            <a href={`/${link.toLowerCase()}`}>{link}</a>
          </Button>
        ))}
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="flex sm:hidden ml-auto">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="neutral" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[250px] rounded-none border-l-4 border-border"
          >
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 mt-8 px-4">
              {["Scans", "Upload", "About"].map((link) => (
                <a
                  key={link}
                  href={`/${link.toLowerCase()}`}
                  className="w-full px-3 py-2 font-heading text-base rounded-base
                             border-2 border-transparent hover:border-border
                             hover:bg-main hover:text-main-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </nav>
            <SheetFooter className="mt-auto pt-4 border-t-2 border-border">
              <SheetClose asChild>
                <Button variant="neutral" className="w-full">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
