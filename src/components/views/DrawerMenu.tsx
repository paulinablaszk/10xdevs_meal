import { Menu } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface DrawerMenuProps {
  className?: string
}

export function DrawerMenu({ className }: DrawerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[240px]">
        <nav className="flex flex-col gap-4 pt-8 px-2">
          <a
            href="/recipes"
            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            onClick={() => setIsOpen(false)}
          >
            Przepisy
          </a>
          <a
            href="/recipes/new"
            className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors duration-200"
            onClick={() => setIsOpen(false)}
          >
            Dodaj przepis
          </a>
          <button
            onClick={() => {
              // TODO: Implement logout
              setIsOpen(false)
            }}
            className="text-lg font-medium text-left text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            Wyloguj
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
} 