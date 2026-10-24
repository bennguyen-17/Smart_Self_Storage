import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Lock, Phone, UserShield } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { login, type LockedResponse } from "../authApi"
import { useAuth } from "@/context/AuthContext"
import {
  getRoleDestination,
  getRolePortalName,
  getRoleTitle,
  normalizeRole,
  type UserRole,
} from "@/lib/roles"
import {
  internalLoginSchema,
  type InternalLoginFormValues,
} from "@/lib/validation"

import SignedInPanel from "./SignedInPanel"
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

function InternalLoginForm() {
  const { user, isAuthenticated, signIn } = useAuth()
  const navigate = useNavigate()

  const [serverError, setServerError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<InternalLoginFormValues>({
    resolver: zodResolver(internalLoginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  })

  const { isSubmitting } = form.formState

  const onSubmit = async (values: InternalLoginFormValues) => {
    setServerError("")

    try {
      const data = await login(values.phone, values.password, "INTERNAL")

      if (!data?.token || !data?.user) {
        setServerError("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại sau.")
        return
      }

      const role = normalizeRole(data.user.role)

      if (role === "CUSTOMER") {
        setServerError("Tài khoản Khách hàng không có quyền truy cập Cổng Nội Bộ!")
        return
      }

      signIn({ token: data.token, user: { ...data.user, role } }, false)
      const destination = getRoleDestination(role)
      toast.success(`Đăng nhập thành công với vai trò ${getRoleTitle(role)}!`)
      navigate(destination)
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        setServerError("Có lỗi xảy ra. Vui lòng thử lại.")
        return
      }

      const status = error.response?.status
      const payload = error.response?.data as LockedResponse | undefined

      if (status === 403) {
        setServerError(
          payload?.message ||
            "Tài khoản Khách hàng không có quyền truy cập Cổng Nội Bộ!"
        )
        return
      }

      if (status === 401) {
        setServerError("Số điện thoại hoặc mật khẩu không chính xác")
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
    const role = normalizeRole(user.role)
    const destination = getRoleDestination(role)
    const portalName = getRolePortalName(role)

    return (
      <SignedInPanel
        fullName={user.fullName}
        description={`Bạn đang đăng nhập với vai trò ${getRoleTitle(role)}.`}
        action={
          <Link
            to={destination}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            Vào {portalName} →
          </Link>
        }
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

        <h1 className="text-xl font-bold text-foreground">Đăng nhập nội bộ</h1>
        <p className="text-xs text-muted-foreground">
          Dành cho Nhân viên, Quản lý chi nhánh, Ban giám đốc, Quản trị viên
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup className="gap-4">
          {/* Phone / Email */}
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Email hoặc Số điện thoại
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Phone />
                  </InputGroupAddon>

                  <InputGroupInput
                    {...field}
                    id={field.name}
                    placeholder="Email hoặc số điện thoại"
                    maxLength={100}
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
      </form>


      {/* HELPDESK */}
      <div className="mt-4 space-y-1 border-t pt-3 text-center text-xs text-muted-foreground">
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
