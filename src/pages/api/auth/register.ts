import type { APIRoute } from "astro";
import { z } from "zod";

const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/(?=.*[A-Za-z])(?=.*\d)/, "Hasło musi zawierać co najmniej jedną literę i cyfrę"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są takie same",
    path: ["confirmPassword"],
  });

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const { error } = await locals.supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
        data: {
          email_confirmed: true, // To pozwoli na natychmiastowe logowanie
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Ten adres email jest już zarejestrowany.",
          }),
          { status: 409 }
        );
      }

      return new Response(
        JSON.stringify({
          status: "error",
          message: error.message,
        }),
        { status: 400 }
      );
    }

    // Automatycznie zaloguj użytkownika
    const { data: signInData, error: signInError } = await locals.supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message:
            "Konto zostało utworzone, ale wystąpił błąd podczas logowania. Spróbuj się zalogować.",
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        message: "Rejestracja zakończona sukcesem. Przekierowuję...",
        session: signInData.session,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Nieprawidłowe dane wejściowe",
          errors: error.errors,
        }),
        { status: 400 }
      );
    }

    console.error("Błąd rejestracji:", error);
    return new Response(
      JSON.stringify({
        status: "error",
        message: "Wystąpił nieoczekiwany błąd podczas rejestracji.",
      }),
      { status: 500 }
    );
  }
};
