import { z } from "zod"

// Validação de email
export const emailSchema = z
  .string()
  .email("Email inválido")
  .min(3, "Email muito curto")
  .max(255, "Email muito longo")
  .toLowerCase()
  .trim()

// Validação de senha
export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(100, "Senha muito longa")
  .regex(/[A-Z]/, "Senha deve conter ao menos uma letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter ao menos uma letra minúscula")
  .regex(/[0-9]/, "Senha deve conter ao menos um número")
  .regex(/[^A-Za-z0-9]/, "Senha deve conter ao menos um caractere especial")

// Validação de nome
export const nameSchema = z
  .string()
  .min(2, "Nome muito curto")
  .max(100, "Nome muito longo")
  .trim()
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Nome contém caracteres inválidos")

// Validação de UUID
export const uuidSchema = z.string().uuid("ID inválido")

// Schema de registro
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// Schema de login
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
})

// Schema de recuperação de senha
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token inválido"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

// Sanitiza string para prevenir XSS
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove javascript:
    .replace(/on\w+=/gi, "") // Remove event handlers
}

// Valida e sanitiza input genérico
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => e.message).join(", ")
      throw new Error(`Validação falhou: ${message}`)
    }
    throw error
  }
}
