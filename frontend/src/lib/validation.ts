import * as z from "zod"
import { OTHER_BANK, resolveBankName } from "./banks"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^0\d{9}$/
const IDENTITY_NUMBER_REGEX = /^[0-9]{12}$/

export interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

/**
 * Nguồn duy nhất cho các quy tắc mật khẩu.
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

const loginPasswordSchema = z.string().superRefine((value, ctx) => {
  if (!value) {
    ctx.addIssue({ code: "custom", message: "Mật khẩu không được để trống" })
  }
})

const validateIdentifier = (value: string, ctx: z.RefinementCtx) => {
  const trimmed = value.trim()
  if (!trimmed) {
    ctx.addIssue({ code: "custom", message: "Vui lòng nhập Email hoặc Số điện thoại" })
    return
  }

  if (trimmed.includes("@")) {
    if (!EMAIL_REGEX.test(trimmed)) {
      ctx.addIssue({ code: "custom", message: "Địa chỉ Email không đúng định dạng" })
    }
  } else {
    if (!PHONE_REGEX.test(trimmed)) {
      ctx.addIssue({
        code: "custom",
        message: "Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số",
      })
    }
  }
}

/** Đăng nhập khách hàng: hỗ trợ Số điện thoại hoặc Email. */
export const loginSchema = z.object({
  phone: z.string().superRefine(validateIdentifier),
  password: loginPasswordSchema,
})

/** Đăng nhập nội bộ: hỗ trợ Số điện thoại hoặc Email. */
export const internalLoginSchema = z.object({
  phone: z.string().superRefine(validateIdentifier),
  password: loginPasswordSchema,
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
    // Thông tin nhận hoàn cọc: không bắt buộc, nhưng nếu điền thì phải đủ cả 3.
    bankName: z.string().max(100, "Tên ngân hàng tối đa 100 ký tự"),
    bankNameCustom: z.string().max(100, "Tên ngân hàng tối đa 100 ký tự"),
    bankAccountNumber: z.string().max(50, "Số tài khoản tối đa 50 ký tự"),
    bankAccountName: z.string().max(100, "Tên chủ tài khoản tối đa 100 ký tự"),
  })
  .superRefine((data, ctx) => {
    const bankNameSelection = data.bankName.trim()
    const bankName = resolveBankName(bankNameSelection, data.bankNameCustom)
    const bankAccountNumber = data.bankAccountNumber.trim()
    const bankAccountName = data.bankAccountName.trim()

    if (!bankName && !bankAccountNumber && !bankAccountName) return

    if (!bankName) {
      ctx.addIssue({
        code: "custom",
        path: [bankNameSelection === OTHER_BANK ? "bankNameCustom" : "bankName"],
        message:
          bankNameSelection === OTHER_BANK
            ? "Vui lòng nhập tên ngân hàng"
            : "Vui lòng chọn ngân hàng",
      })
    }

    if (!/^\d{6,20}$/.test(bankAccountNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["bankAccountNumber"],
        message: "Số tài khoản phải gồm 6–20 chữ số",
      })
    }

    if (!/^[\p{L}\s.]+$/u.test(bankAccountName)) {
      ctx.addIssue({
        code: "custom",
        path: ["bankAccountName"],
        message: "Tên chủ tài khoản chỉ gồm chữ cái và khoảng trắng",
      })
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type InternalLoginFormValues = z.infer<typeof internalLoginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
