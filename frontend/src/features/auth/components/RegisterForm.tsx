import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Circle, Eye, EyeOff } from "lucide-react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { Link } from "react-router-dom"
import { cn } from "cn"

import { register } from "@/features/auth/api/authApi"
import {
  passwordRules,
  registerSchema,
  type RegisterFormValues,
} from "@/utils/validation"

import OtpModal from "./OtpModal"
import PolicyDialog, { type PolicyTab } from "@/components/common/PolicyDialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

type TextFieldName = "fullName" | "identityNumber" | "email" | "phone"

interface TextFieldProps {
  control: Control<RegisterFormValues>
  name: TextFieldName
  label: string
  placeholder: string
  type?: string
  maxLength?: number
  autoComplete?: string
}

function TextField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  maxLength,
  autoComplete,
}: TextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name} className="text-xs font-semibold sm:text-sm">
            {label}
          </FieldLabel>

          <Input
            {...field}
            id={field.name}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            className="h-10 text-sm rounded-xl"
          />

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function PasswordField({
  control,
  name,
  label,
  placeholder,
  visible,
  onToggle,
  onFocus,
  onBlur,
}: {
  control: Control<RegisterFormValues>
  name: "password" | "confirmPassword"
  label: string
  placeholder: string
  visible: boolean
  onToggle: () => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name} className="text-xs font-semibold sm:text-sm">
            {label}
          </FieldLabel>

          <InputGroup className="h-10 rounded-xl">
            <InputGroupInput
              {...field}
              id={field.name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
              className="text-sm"
              onFocus={onFocus}
              onBlur={() => {
                onBlur?.()
                field.onBlur()
              }}
            />

            <InputGroupAddon align="inline-end">
              <InputGroupButton
                onClick={onToggle}
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="size-7"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function RegisterForm() {
  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [agreementError, setAgreementError] = useState("")
  const [policyTab, setPolicyTab] = useState<PolicyTab | null>(null)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      identityNumber: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { isSubmitting } = form.formState
  const password = useWatch({ control: form.control, name: "password" }) ?? ""
  const phone = useWatch({ control: form.control, name: "phone" }) ?? ""

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError("")

    if (!agreed) {
      setAgreementError("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật kho")
      return
    }

    setAgreementError("")

    try {
      await register({
        fullName: values.fullName,
        identityNumber: values.identityNumber,
        email: values.email,
        phone: values.phone,
        password: values.password,
      })

      setShowOtp(true)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          setServerError(
            error.response.data?.message ||
              "Email, số điện thoại hoặc CCCD đã được đăng ký"
          )
        } else {
          setServerError(
            error.response?.data?.message ||
              "Đăng ký thất bại. Vui lòng thử lại."
          )
        }
      } else {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại.")
      }
    }
  }

  const passwordRuleResults = passwordRules.map((rule) => ({
    label: rule.label,
    met: rule.test(password),
  }))

  const allPasswordRulesMet = passwordRuleResults.every((rule) => rule.met)

  const showPasswordRules =
    (passwordFocused || password.length > 0) && !allPasswordRulesMet

  return (
    <div className="w-full">
      <div className="mb-4 space-y-1">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Tạo tài khoản mới</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Đăng ký nhanh chóng để nhận mã mở kho tự quản
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          {/* Hàng 1: Họ và tên + Số CCCD */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="fullName"
              label="Họ và tên đầy đủ"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />

            <TextField
              control={form.control}
              name="identityNumber"
              label="Số CCCD"
              placeholder="12 chữ số CCCD"
              maxLength={12}
            />
          </div>

          {/* Hàng 2: Số điện thoại + Email */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="phone"
              label="Số điện thoại"
              placeholder="0988 xxx xxx"
              type="tel"
              maxLength={10}
              autoComplete="tel"
            />

            <TextField
              control={form.control}
              name="email"
              label="Email"
              placeholder="name@email.com"
              type="email"
              autoComplete="email"
            />
          </div>

          {/* Hàng 3: Mật khẩu + Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <PasswordField
              control={form.control}
              name="password"
              label="Mật khẩu"
              placeholder="Tối thiểu 8 ký tự"
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />
          </div>

          {/* Checklist quy tắc mật khẩu */}
          {showPasswordRules && (
            <ul className="space-y-0.5">
              {passwordRuleResults.map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] transition-colors",
                    rule.met ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {rule.met ? (
                    <Check className="size-3" />
                  ) : (
                    <Circle className="size-3" />
                  )}

                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {/* Điều khoản */}
          <div className="pt-0.5">
            <label className="flex cursor-pointer items-start gap-2">
              <Checkbox
                checked={agreed}
                onCheckedChange={(checked) => {
                  setAgreed(checked === true)
                  setAgreementError("")
                }}
                className="mt-0.5"
              />

              <span className="text-xs leading-normal text-muted-foreground">
                Tôi đồng ý với{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("terms")}
                  className="inline h-auto p-0 text-xs font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Điều khoản dịch vụ
                </Button>{" "}
                và{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("privacy")}
                  className="inline h-auto p-0 text-xs font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Chính sách bảo mật kho
                </Button>
                .
              </span>
            </label>

            {agreementError && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {agreementError}
              </p>
            )}
          </div>
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 h-10 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
        >
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
        </Button>

        {/* Lỗi từ Backend */}
        {serverError && (
          <Alert variant="destructive" className="mt-2.5 py-1.5 text-xs">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Bạn là nhân viên hoặc quản lý cơ sở?{" "}
        <Link
          to="/internal_login"
          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          Vào cổng nội bộ
        </Link>
      </p>

      {showOtp && (
        <OtpModal
          phone={phone || "0912345678"}
          onClose={() => setShowOtp(false)}
        />
      )}

      <PolicyDialog tab={policyTab} onClose={() => setPolicyTab(null)} />
    </div>
  )
}

export default RegisterForm