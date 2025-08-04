import { supabaseClient } from '../../db/supabase.client';
import type { AuthError, AuthResponse } from '../../types';

export class AuthService {
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          status: 'error',
          message: error.message
        };
      }

      return {
        status: 'ok'
      };
    } catch (error) {
      console.error('Błąd logowania:', error);
      return {
        status: 'error',
        message: 'Wystąpił nieoczekiwany błąd podczas logowania.'
      };
    }
  }

  static async logout(): Promise<void> {
    await supabaseClient.auth.signOut();
  }

  static async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  }
} 