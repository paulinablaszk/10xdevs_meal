import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '../db/supabase.client';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({
    session: null,
    loading: true
  });

  useEffect(() => {
    let mounted = true;

    // Funkcja do aktualizacji stanu, która sprawdza czy komponent jest nadal zamontowany
    const updateState = (session: Session | null) => {
      if (mounted) {
        setState({
          session,
          loading: false
        });
      }
    };

    // Pobierz aktualną sesję
    supabaseClient.auth.getSession()
      .then(({ data: { session } }) => {
        updateState(session);
      })
      .catch((error) => {
        console.error('Błąd podczas pobierania sesji:', error);
        updateState(null);
      });

    // Nasłuchuj zmian sesji
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      updateState(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
} 