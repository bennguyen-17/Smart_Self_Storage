import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Mail, UserShield } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { login, type LockedResponse } from "@/api/authApi"
import { useAuth } from "@/context/AuthContext"
import {
  internalLoginSchema,
  type InternalLoginFormValues,
} from "@/utils/validation"

import SignedInPanel from "@/components/SignedInPanel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

const DEMO_ROLES = [
  {
    label: "Staff Trực Ca",
    email: "staff@smartstorage.vn",
    password: "staff123",
    card: "border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950/30 dark:hover:bg-cyan-900/50",
    text: "text-cyan-800 dark:text-cyan-300",
    sub: "text-cyan-600 dark:text-cyan-400",
  },
  {
    label: "Manager Chi Nhánh",
    email: "manager@smartstorage.vn",
    password: "mgr123",
    card: "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50",
    text: "text-indigo-800 dark:text-indigo-300",
    sub: "text-indigo-600 dark:text-indigo-400",
  },
  {
    label: "BOM (Ban Giám Đốc)",
    email: "bom@smartstorage.vn",
    password: "bom123",
    card: "border-purple-200 bg-purple-50/50 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/30 dark:hover:bg-purple-900/50",
    text: "text-purple-800 dark:text-purple-300",
    sub: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "Admin Hệ Thống",
    email: "admin@smartstorage.vn",
    password: "admin123",
    card: "border-rose-200 bg-rose-50/50 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:hover:bg-rose-900/50",
    text: "text-rose-800 dark:text-rose-300",
    sub: "text-rose-600 dark:text-rose-400",
  },
]

function InternalLoginForm() {
  const { user, isAuthenticated, signIn } = useAuth()

  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<InternalLoginFormValues>({
    resolver: zodResolver(internalLoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: InternalLoginFormValues) => {
    setServerError("")

    try {
      const data = await login(values.identifier, values.password)

      if (!data?.token || !data?.user) {
        setServerError("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại sau.")
        return
      }

      signIn({ token: data.token, user: data.user }, false)
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại.")
        return
      }

      const status = error.response?.status
      const payload = error.response?.data as LockedResponse | undefined

      if (status === 401) {
        setServerError("Email hoặc mật khẩu không chính xác")
        return
      }

      if (status === 423) {
        setServerError(
          payload?.message ||
            "Tài khoản đang bị tạm khóa do nhập sai quá nhiều lần."
        )
        return
      }

      setServerError(
        payload?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      )
    }
  }

  const handleForgotPassword = () => {
    toast.info("Liên hệ IT để đặt lại mật khẩu", {
      description:
        "Vui lòng liên hệ Trưởng bộ phận hoặc Quản trị viên hệ thống.",
    })
  }

  if (isAuthenticated && user) {
    return (
      <SignedInPanel
        fullName={user.fullName}
        description="Bạn đang truy cập cổng thông tin nội bộ."
      />
    )
  }

  return (
    <div className="w-full">
      {/* HEADER FORM */}
      <div className="mb-6 space-y-1 text-center">
        <div className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/60 dark:bg-blue-900/40 dark:text-blue-400">
          <UserShield className="size-5" />
        </div>

        <h1 className="text-xl font-bold">Đăng nhập nội bộ</h1>
        <p className="text-xs text-muted-foreground">
          Dành cho Nhân viên, Quản lý chi nhánh, BOM, Admin
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-4">
          {/* Email */}
          <Controller
            name="identifier"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Email được cấp
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Mail />
                  </InputGroupAddon>

                  <InputGroupInput
                    {...field}
                    id={field.name}
                    placeholder="name@smartstorage.vn"
                    autoComplete="username"
                    aria-invalid={fieldState.invalid}
                  />
                </InputGroup>

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
                <FieldLabel htmlFor={field.name}>
                  Mật khẩu
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock />
                  </InputGroupAddon>

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

                <div className="flex justify-end pt-0.5">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    className="h-auto p-0 text-xs font-medium text-blue-600 dark:text-blue-400"
                  >
                    Quên mật khẩu?
                  </Button>
                </div>
              </Field>
            )}
          />
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="mt-4 w-full"
        >
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập hệ thống"}
        </Button>

        {serverError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Tạm thời - chỉ hiện khi dev, không lên production */}
        {import.meta.env.DEV && (
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="text-[11px] font-bold text-muted-foreground">
              ⚡ Chọn nhanh vai trò để demo:
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((role) => (
                <Button
                  key={role.email}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue("identifier", role.email)
                    form.setValue("password", role.password)
                  }}
                  className={`h-auto w-full flex-col items-start justify-start gap-0 whitespace-normal rounded-xl p-2 text-left font-normal ${role.card}`}
                >
                  <div className={`text-[11px] font-bold ${role.text}`}>
                    {role.label}
                  </div>
                  <div className={`text-[10px] ${role.sub}`}>{role.email}</div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* HELPDESK */}
      <div className="mt-5 space-y-1 border-t pt-4 text-center text-xs text-muted-foreground">
        <div>Gặp sự cố đăng nhập tài khoản nội bộ?</div>
        <div className="text-[11.5px] font-medium">
          Liên hệ IT:{" "}
          <span className="font-bold text-blue-600 dark:text-blue-400">
            1900 391 391
          </span>
        </div>
      </div>
    </div>
  )
}

export default InternalLoginForm
