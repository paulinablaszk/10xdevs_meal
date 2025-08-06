import type { APIRoute } from "astro";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, locals, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    console.log("Attempting login for:", validatedData.email);

    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      console.error("Supabase auth error:", error);
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Nieprawidłowy email lub hasło",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!data.session) {
      console.error("No session in response");
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Brak danych sesji",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Ustawiamy ciasteczka sesji Supabase
    const { access_token, refresh_token } = data.session;

    cookies.set("sb-access-token", access_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dni
    });

    cookies.set("sb-refresh-token", refresh_token, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dni
    });

    return new Response(
      JSON.stringify({
        status: "ok",
        session: data.session,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Nieprawidłowe dane wejściowe",
          errors: error.errors,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "error",
        message: "Wystąpił nieoczekiwany błąd podczas logowania.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
