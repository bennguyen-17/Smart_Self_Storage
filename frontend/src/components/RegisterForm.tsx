import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Circle, Eye, EyeOff } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { Link } from "react-router-dom"
import { cn } from "cn"

import { register } from "@/api/authApi"
import {
  passwordRules,
  registerSchema,
  type RegisterFormValues,
} from "@/utils/validation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
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
import OtpModal from "./OtpModal"

type TextFieldName = "fullName" | "identityNumber" | "email" | "phone"

interface FieldConfig {
  name: TextFieldName
  label: string
  placeholder: string
  type: string
  maxLength?: number
  autoComplete?: string
}

const fields: FieldConfig[] = [
  {
    name: "fullName",
    label: "Họ và tên",
    placeholder: "Nhập họ và tên",
    type: "text",
    autoComplete: "name",
  },
  {
    name: "identityNumber",
    label: "Số CCCD",
    placeholder: "Nhập 12 số CCCD",
    type: "text",
    maxLength: 12,
  },
  {
    name: "email",
    label: "Email",
    placeholder: "example@gmail.com",
    type: "email",
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Số điện thoại",
    placeholder: "Nhập số điện thoại",
    type: "text",
    maxLength: 10,
    autoComplete: "tel",
  },
]

function RegisterForm() {
  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

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
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Tạo tài khoản
        </h2>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Điền thông tin bên dưới để bắt đầu sử dụng Smart Self Storage.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {/* 4 input thường */}
          {fields.map((fieldConfig) => (
            <Controller
              key={fieldConfig.name}
              name={fieldConfig.name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {fieldConfig.label}
                  </FieldLabel>

                  <Input
                    {...field}
                    id={field.name}
                    type={fieldConfig.type}
                    placeholder={fieldConfig.placeholder}
                    maxLength={fieldConfig.maxLength}
                    autoComplete={fieldConfig.autoComplete}
                    aria-invalid={fieldState.invalid}
                  />

                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}

          {/* Password */}
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Mật khẩu</FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={field.name}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false)
                      field.onBlur()
                    }}
                  />

                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>

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

                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {/* Confirm Password */}
          <Controller
            name="confirmPassword"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Xác nhận mật khẩu
                </FieldLabel>

                <InputGroup>
                  <InputGroupInput
                    {...field}
                    id={field.name}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />

                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={
                        showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                      }
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>

                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        {/* Register */}
        <Button type="submit" disabled={isSubmitting} className="mt-5 w-full">
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng ký..." : "Đăng ký ngay"}
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

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Đã có tài khoản?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>

      {showOtp && (
        <OtpModal phone={phone || "0912345678"} onClose={() => setShowOtp(false)} />
      )}
    </div>
  )
}

export default RegisterForm
