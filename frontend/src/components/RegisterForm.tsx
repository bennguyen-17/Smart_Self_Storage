import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Circle, Eye, EyeOff } from "lucide-react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { Link } from "react-router-dom"
import { cn } from "cn"

import { register } from "@/api/authApi"
import {
  passwordRules,
  registerSchema,
  type RegisterFormValues,
} from "@/utils/validation"

import OtpModal from "./OtpModal"
import PolicyDialog, { type PolicyTab } from "@/components/PolicyDialog"
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
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

          <Input
            {...field}
            id={field.name}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
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
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>

          <InputGroup>
            <InputGroupInput
              {...field}
              id={field.name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
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
              >
                {visible ? <EyeOff /> : <Eye />}
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
        <h1 className="text-xl font-bold">Tạo tài khoản mới</h1>
        <p className="text-xs text-muted-foreground">
          Đăng ký nhanh chóng để nhận mã mở kho tự quản
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2.5">
          <TextField
            control={form.control}
            name="fullName"
            label="Họ và tên đầy đủ"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
          />

          {/* CCCD + SĐT */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="identityNumber"
              label="Số CCCD"
              placeholder="12 chữ số CCCD"
              maxLength={12}
            />

            <TextField
              control={form.control}
              name="phone"
              label="Số điện thoại"
              placeholder="0988 xxx xxx"
              type="tel"
              maxLength={10}
              autoComplete="tel"
            />
          </div>

          {/* Email + Mật khẩu */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="email"
              label="Email"
              placeholder="name@email.com"
              type="email"
              autoComplete="email"
            />

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
          </div>

          {/* Xác nhận mật khẩu */}
          <PasswordField
            control={form.control}
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            visible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
          />

          {/* Checklist quy tắc mật khẩu */}
          {showPasswordRules && (
            <ul className="space-y-1">
              {passwordRuleResults.map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors",
                    rule.met ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {rule.met ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Circle className="size-3.5" />
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

              <span className="text-[11px] leading-tight text-muted-foreground">
                Tôi đồng ý với{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("terms")}
                  className="inline h-auto p-0 text-[11px] font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Điều khoản dịch vụ
                </Button>{" "}
                và{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("privacy")}
                  className="inline h-auto p-0 text-[11px] font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Chính sách bảo mật kho
                </Button>
                .
              </span>
            </label>

            {agreementError && (
              <p role="alert" className="mt-1.5 text-sm text-destructive">
                {agreementError}
              </p>
            )}
          </div>
        </div>

        {/* Register */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="mt-3.5 w-full bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
        </Button>

        {/* Lỗi từ Backend */}
        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Tạm thời - chỉ hiện khi dev, không lên production */}
        {import.meta.env.DEV && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => setShowOtp(true)}
          >
            Test OTP
          </Button>
        )}
      </form>

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
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
