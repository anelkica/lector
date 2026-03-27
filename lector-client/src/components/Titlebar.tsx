import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS } from "@/constants";

export function Titlebar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-20 h-17.5 flex items-center border-b-4 border-border bg-secondary-background px-5">
      {/* logo */}
      <Button variant="default" size="icon" className="shrink-0" asChild>
        <Link to="/" className="text-[22px] font-logo font-black" style={{ WebkitTextStroke: "1px black" }}>
          L
        </Link>
      </Button>

      {/* desktop nav */}
      <div className="hidden sm:flex items-center justify-center flex-1 gap-2">
        {NAV_LINKS.map((link) => (
          <Button key={link.label} variant="neutral" asChild>
            <Link key={link.label} to={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>

      {/* mobile hamburger menu */}
      <div className="flex sm:hidden ml-auto">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="neutral" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-65 rounded-none border-l-4 border-border"
          >
            <SheetHeader className="px-5 py-4">
              <SheetTitle className="font-bold">Menu</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-3 font-heading text-lg rounded-base
                             hover:bg-main hover:text-main-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4 -translate-y-0.5 shrink-0" />
                  <span className="leading-none">{item.label}</span>
                </Link>
              ))}
            </nav>

            <SheetFooter className="mt-auto px-5 pb-6 pt-4">
              <SheetClose asChild>
                <Button variant="neutral" className="w-full py-5 text-lg">
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
