import { useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { login } from "@/lib/api/services/auth.service"

const loginSchema = z.object({
  email: z.email("Vul een geldig e-mailadres in"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login({
        email: values.email,
        password: values.password,
      })

      navigate("/dashboard")
    } catch (error) {
      if (error instanceof Response) {
        let message = "Login mislukt"

        try {
          const data = (await error.json()) as { detail?: string }
          if (data.detail) {
            message = data.detail
          }
        } catch {
          // ignore json parse failure
        }

        setError("root", { message })
        return
      }

      setError("root", { message: "Er ging iets mis tijdens het inloggen" })
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login op je account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Vul je email en wachtwoord in om in te loggen
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>

        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Wachtwoord</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Wachtwoord vergeten?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>

        {errors.root && (
          <FieldError className="text-center">{errors.root.message}</FieldError>
        )}

        <Field>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Bezig..." : "Login"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}