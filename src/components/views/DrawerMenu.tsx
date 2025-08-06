import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerMenuProps {
  className?: string;
  onLogout: () => void;
  pathname: string;
}

export function DrawerMenu({ className, onLogout, pathname }: DrawerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/recipes" && pathname === "/") return true;
    return pathname.startsWith(path);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <nav className="flex flex-col gap-4 pt-8 pl-6">
          <a
            href="/recipes"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/recipes") ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setIsOpen(false)}
          >
            Przepisy
          </a>
          <a
            href="/recipes/new"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/recipes/new") ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setIsOpen(false)}
          >
            Dodaj przepis
          </a>
          <button
            onClick={() => {
              onLogout();
              setIsOpen(false);
            }}
            className="text-sm font-medium text-left text-muted-foreground hover:text-primary transition-colors"
          >
            Wyloguj
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
