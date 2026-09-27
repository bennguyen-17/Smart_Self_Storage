import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"

import { login } from "@/api/authApi"
import { loginSchema, type LoginFormValues } from "@/utils/validation"

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

function LoginForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("")

    try {
      const data = await login(values.phone, values.password)

      if (data?.token) {
        localStorage.setItem("token", data.token)
        if (data?.userInfo || data?.user) {
          localStorage.setItem("user", JSON.stringify(data.userInfo || data.user))
        }
      }

      setSuccess(true)
      setTimeout(() => {
        navigate("/portal")
      }, 1000)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setServerError(
            error.response.data?.message ||
              "Số điện thoại hoặc mật khẩu không đúng."
          )
        } else {
          setServerError(
            error.response?.data?.message ||
              "Đăng nhập thất bại. Vui lòng thử lại."
          )
        }
      } else {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại.")
      }
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </div>

        <h2 className="mt-5 font-heading text-xl font-semibold">
          Đăng nhập thành công!
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          Đang chuyển hướng vào Cổng đặt kho...
        </p>

        <Link
          to="/portal"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
        >
          Truy cập Sơ đồ kho & Dịch vụ &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Đăng nhập
        </h2>

        <p className="mt-1.5 text-sm text-muted-foreground">
          Nhập số điện thoại và mật khẩu để truy cập hệ thống.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {/* Phone */}
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Số điện thoại</FieldLabel>

                <Input
                  {...field}
                  id={field.name}
                  placeholder="0988123456"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  aria-invalid={fieldState.invalid}
                />

                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

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
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
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

                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        <Button type="submit" disabled={isSubmitting} className="mt-5 w-full">
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        {/* Lỗi từ Backend */}
        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-medium text-primary hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}

export default LoginForm