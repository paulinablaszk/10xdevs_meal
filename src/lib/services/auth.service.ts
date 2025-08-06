import { supabaseClient } from "../../db/supabase.client";
import type { AuthResponse } from "../../types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          status: "error",
          message: error.message,
        };
      }

      return {
        status: "ok",
      };
    } catch (error) {
      console.error("Błąd logowania:", error);
      return {
        status: "error",
        message: "Wystąpił nieoczekiwany błąd podczas logowania.",
      };
    }
  },

  async logout(): Promise<void> {
    await supabaseClient.auth.signOut();
  },

  async getSession() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    return session;
  },
};
