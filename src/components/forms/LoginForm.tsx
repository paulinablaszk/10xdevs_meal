import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";
import { useEffect, useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        setError("root", {
          message: result.message || "Wystąpił błąd podczas logowania.",
        });
        return;
      }

      if (result.status === "error") {
        setError("root", {
          message: result.message || "Wystąpił błąd podczas logowania.",
        });
        return;
      }

      if (!result.session) {
        setError("root", {
          message: "Brak danych sesji w odpowiedzi.",
        });
        return;
      }

      // Sprawdź czy mamy parametr next w URL
      const params = new URLSearchParams(window.location.search);
      const nextUrl = params.get("next") || "/recipes";

      setRedirectUrl(nextUrl);
    } catch (error) {
      console.error("Błąd logowania:", error);
      setError("root", {
        message: "Wystąpił nieoczekiwany błąd podczas logowania.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm mx-auto">
      <div>
        <Input
          type="email"
          placeholder="E-mail"
          {...register("email")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.email && errors.email.message && (
          <AlertAIError className="mt-2" message={errors.email.message} />
        )}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Hasło"
          {...register("password")}
          className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
        {errors.password && errors.password.message && (
          <AlertAIError className="mt-2" message={errors.password.message} />
        )}
      </div>

      {errors.root && errors.root.message && <AlertAIError message={errors.root.message} />}

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <div className="flex justify-between text-sm">
          <a href="/auth/register" className="text-blue-200 hover:text-blue-100">
            Zarejestruj się
          </a>
          <a href="/auth/reset-request" className="text-blue-200 hover:text-blue-100">
            Zapomniałeś hasła?
          </a>
        </div>
      </div>
    </form>
  );
}
