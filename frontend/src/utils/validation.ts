import * as z from "zod"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^0\d{9}$/
const IDENTITY_NUMBER_REGEX = /^[0-9]{12}$/

export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

/**
 * Nguồn duy nhất cho các quy tắc mật khẩu (BR-02).
 * Vừa dùng để render checklist trực tiếp, vừa dùng để build Zod schema bên dưới.
 */
export const passwordRules: PasswordRule[] = [
  { label: "Ít nhất 8 ký tự", test: (password) => password.length >= 8 },
  { label: "Có chữ hoa", test: (password) => /[A-Z]/.test(password) },
  { label: "Có chữ thường", test: (password) => /[a-z]/.test(password) },
  { label: "Có chữ số", test: (password) => /\d/.test(password) },
  {
    label: "Có ký tự đặc biệt",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export const loginSchema = z.object({
  identifier: z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập email hoặc số điện thoại",
      })
      return
    }

    if (!EMAIL_REGEX.test(value) && !PHONE_REGEX.test(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Email hoặc số điện thoại không hợp lệ",
      })
    }
  }),
  password: z.string().superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: "custom", message: "Mật khẩu không được để trống" })
    }
  }),
})

export const registerSchema = z
  .object({
    fullName: z.string().superRefine((value, ctx) => {
      if (!value.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Họ và tên không được để trống",
        })
        return
      }

      if (/\d/.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Họ và tên không được chứa ký tự số",
        })
      }
    }),
    identityNumber: z.string().superRefine((value, ctx) => {
      if (!value.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Số CCCD không được để trống",
        })
        return
      }

      if (!IDENTITY_NUMBER_REGEX.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Số CCCD phải chứa đúng 12 chữ số",
        })
      }
    }),
    email: z.string().superRefine((value, ctx) => {
      if (!value.trim()) {
        ctx.addIssue({ code: "custom", message: "Email không được để trống" })
        return
      }

      if (!EMAIL_REGEX.test(value)) {
        ctx.addIssue({ code: "custom", message: "Email không hợp lệ" })
      }
    }),
    phone: z.string().superRefine((value, ctx) => {
      if (!value.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Số điện thoại không được để trống",
        })
        return
      }

      if (!PHONE_REGEX.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số",
        })
      }
    }),
    password: z.string().superRefine((value, ctx) => {
      if (!value) {
        ctx.addIssue({ code: "custom", message: "Mật khẩu không được để trống" })
        return
      }

      if (!passwordRules.every((rule) => rule.test(value))) {
        ctx.addIssue({
          code: "custom",
          message: "Mật khẩu chưa đạt yêu cầu bảo mật",
        })
      }
    }),
    confirmPassword: z.string().superRefine((value, ctx) => {
      if (!value.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Vui lòng xác nhận mật khẩu",
        })
      }
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
