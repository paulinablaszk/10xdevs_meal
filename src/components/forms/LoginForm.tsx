import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { AlertAIError } from "../AlertAIError";

const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres e-mail.").max(255),
  password: z.string().min(1, "Hasło jest wymagane"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    // TODO: Implementacja logiki logowania
    console.log(data);
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
        {errors.email && (
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
        {errors.password && (
          <AlertAIError className="mt-2" message={errors.password.message} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </Button>
        
        <div className="flex justify-between text-sm">
          <a
            href="/auth/register"
            className="text-blue-200 hover:text-blue-100"
          >
            Zarejestruj się
          </a>
          <a
            href="/auth/reset-request"
            className="text-blue-200 hover:text-blue-100"
          >
            Zapomniałeś hasła?
          </a>
        </div>
      </div>
    </form>
  );
} 