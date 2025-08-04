import { DrawerMenu } from './DrawerMenu';
import { useAuth } from '../AuthProvider';
import { supabaseClient } from '../../db/supabase.client';
import { Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

export function Navigation() {
  const { session } = useAuth();
  const [pathname, setPathname] = useState('');

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/auth/login';
  };

  const isActive = (path: string) => {
    if (path === '/recipes' && pathname === '/') return true;
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-gradient-to-r from-purple-500/20 via-purple-700/20 to-purple-900/20">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center gap-6">
          <DrawerMenu onLogout={handleLogout} className="md:hidden" pathname={pathname} />
          
          <a href="/recipes" className="flex items-center">
            <span className="font-bold text-lg text-white pl-3">10xDevs Meal</span>
          </a>
        </div>

        <div className="hidden md:flex ml-8">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <a
              href="/recipes"
              className={cn(
                "transition-colors hover:text-white duration-200",
                isActive('/recipes') ? "text-white" : "text-white/70"
              )}
            >
              Przepisy
            </a>
            <a
              href="/recipes/new"
              className={cn(
                "transition-colors hover:text-white duration-200",
                isActive('/recipes/new') ? "text-white" : "text-white/70"
              )}
            >
              Dodaj przepis
            </a>
            <button
              onClick={handleLogout}
              className="transition-colors hover:text-white text-white/70 duration-200"
            >
              Wyloguj
            </button>
          </nav>
        </div>

        <div className="ml-auto">
          {session && (
            <p className="text-sm text-white/70">
              {session.user.email}
            </p>
          )}
        </div>
      </div>
    </header>
  );
} 