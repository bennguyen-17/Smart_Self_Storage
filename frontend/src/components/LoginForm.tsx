import { useEffect, useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { login, type LockedResponse } from "@/api/authApi"
import { useAuth } from "@/context/AuthContext"
import { loginSchema, type LoginFormValues } from "@/utils/validation"

import ForgotPasswordModal from "@/components/ForgotPasswordModal"
import SignedInPanel from "@/components/SignedInPanel"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

const LOCK_SECONDS = 15 * 60

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.86c2.26-2.09 3.56-5.17 3.56-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function LoginForm() {
  const { user, isAuthenticated, signIn } = useAuth()

  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [lockRemaining, setLockRemaining] = useState(0)
  const [showForgot, setShowForgot] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState
  const isLocked = lockRemaining > 0

  useEffect(() => {
    if (!isLocked) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setLockRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isLocked])

  const onSubmit = async (values: LoginFormValues) => {
    if (isLocked) {
      return
    }

    setServerError("")

    try {
      const data = await login(values.phone, values.password)

      if (!data?.token || !data?.user) {
        setServerError("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại sau.")
        return
      }

      signIn({ token: data.token, user: data.user }, remember)
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại.")
        return
      }

      const status = error.response?.status
      const payload = error.response?.data as LockedResponse | undefined

      if (status === 401) {
        setServerError("Số điện thoại hoặc mật khẩu không chính xác")
        return
      }

      if (status === 423) {
        setServerError("")
        setLockRemaining(payload?.retryAfterSeconds ?? LOCK_SECONDS)
        return
      }

      setServerError(
        payload?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      )
    }
  }

  const handleGoogleLogin = () => {
    toast.info("Đăng nhập Google chưa khả dụng", {
      description: "Backend chưa có API xác thực Google OAuth.",
    })
  }

  if (isAuthenticated && user) {
    return (
      <SignedInPanel
        fullName={user.fullName}
        description="Chào mừng bạn trở lại với Smart Self Storage."
      />
    )
  }

  return (
    <div className="w-full">
      <div className="mb-4 space-y-1">
        <h1 className="text-xl font-bold">Chào mừng quý khách</h1>
        <p className="text-xs text-muted-foreground">
          Đăng nhập để xem mã mở khóa phòng &amp; quản lý hợp đồng
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-3.5">
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
                  placeholder="0988 xxx xxx"
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
                    placeholder="••••••••"
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

          {/* Remember me + Forgot password */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground select-none">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              Ghi nhớ đăng nhập
            </label>

            <Button
              type="button"
              variant="link"
              onClick={() => setShowForgot(true)}
              className="h-auto p-0 text-xs font-semibold text-blue-600 dark:text-blue-400"
            >
              Quên mật khẩu?
            </Button>
          </div>
        </FieldGroup>

        {/* Banner khóa tài khoản */}
        {isLocked && (
          <Alert variant="destructive" className="mt-4">
            <Lock />

            <AlertTitle>Tài khoản tạm thời bị khóa</AlertTitle>

            <AlertDescription>
              Tài khoản của bạn tạm thời bị khóa 15 phút do nhập sai mật khẩu 5
              lần. Vui lòng thử lại sau: {formatCountdown(lockRemaining)}
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isLocked}
          className="mt-3.5 w-full"
        >
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        {/* Lỗi từ Backend */}
        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Divider */}
        <div className="relative flex items-center py-3">
          <Separator className="flex-1" />
          <span className="mx-3 text-[11px] font-medium text-muted-foreground">
            hoặc
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          Tiếp tục với Google
        </Button>
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

      <ForgotPasswordModal open={showForgot} onOpenChange={setShowForgot} />
    </div>
  )
}

export default LoginForm
