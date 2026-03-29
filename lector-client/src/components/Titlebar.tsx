import { Menu, LogOut, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NAV_LINKS, ROUTES } from "@/constants";

export function Titlebar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed inset-x-0 top-0 z-20 h-17.5 flex items-center border-b-4 border-border bg-secondary-background px-5">
      <Button variant="default" size="icon" className="shrink-0" asChild>
        <Link to="/" className="text-[22px] font-logo font-black" style={{ WebkitTextStroke: "1px black" }}>
          L
        </Link>
      </Button>

      <div className="hidden sm:flex items-center gap-2 ml-6">
        {NAV_LINKS.map((link) => (
          <Button key={link.label} variant="neutral" asChild>
            <Link key={link.label} to={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>

      {user && (
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-background rounded-base border-2 border-border shadow-shadow">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <Button variant="neutral" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex sm:hidden ml-auto items-center gap-2">
        {user && (
          <div className="h-10 w-10 flex items-center justify-center rounded-base border-2 border-border bg-background shadow-shadow">
            <User className="h-4 w-4" />
          </div>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="neutral" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-65 rounded-none border-l-4 border-border p-0 gap-0 [&>button]:hidden"
          >
            <div className="px-5 py-4 border-b-2 border-border flex items-center justify-between">
              <span className="font-bold text-lg">Menu</span>
              <SheetClose asChild>
                <Button variant="neutral" size="icon" className="h-10 w-10 shrink-0">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>

            {user && (
              <div className="px-5 py-3.5 border-b-2 border-border flex items-center gap-2">
                <User className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
            )}

            <nav className="flex flex-col gap-3 px-5 py-4">
              {NAV_LINKS.map((item) => (
                <SheetClose key={item.label} asChild>
                  <Button variant="neutral" asChild className="w-full justify-start h-auto py-2">
                    <Link to={item.href} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="font-heading text-base">{item.label}</span>
                    </Link>
                  </Button>
                </SheetClose>
              ))}
            </nav>

            {user && (
              <div className="px-5 py-3 border-t-2 border-border mt-auto">
                <SheetClose asChild>
                  <Button variant="neutral" className="w-full" onClick={logout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </SheetClose>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
