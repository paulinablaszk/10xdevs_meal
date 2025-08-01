import { DrawerMenu } from "./DrawerMenu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <DrawerMenu className="mr-4 md:hidden" />
        <div className="mr-4 hidden md:flex">
          <nav className="flex items-center space-x-8 px-6 text-sm font-medium">
            <a
              href="/recipes"
              className="transition-colors hover:text-primary text-muted-foreground duration-200"
            >
              Przepisy
            </a>
            <a
              href="/recipes/new"
              className="transition-colors hover:text-primary text-muted-foreground duration-200"
            >
              Dodaj przepis
            </a>
            <button
              onClick={() => {
                // TODO: Implement logout
              }}
              className="transition-colors hover:text-primary text-muted-foreground duration-200"
            >
              Wyloguj
            </button>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1" />
          <nav className="flex items-center">
            <a href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-primary">MealPlanner</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
} 