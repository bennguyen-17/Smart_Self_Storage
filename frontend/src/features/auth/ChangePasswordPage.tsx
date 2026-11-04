import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import InternalAuthLayout from "@/components/layouts/InternalAuthLayout"
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/lib/http"
import { getRoleDestination, normalizeRole } from "@/lib/roles"
import { passwordRules } from "@/lib/validation"

import { changePassword } from "./changePasswordApi"
import { validatePasswordChange } from "./passwordChangeRules"

function ChangePasswordPage() {
  const { user, updateUser, signOut } = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFirstLogin = Boolean(user?.mustChangePassword)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage("")

    const validationError = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await changePassword(currentPassword, newPassword.trim())
      if (result?.success === false) {
        setErrorMessage(result.message || "Không thể đổi mật khẩu. Vui lòng thử lại.")
        return
      }

      updateUser({ mustChangePassword: false })
      toast.success("Đổi mật khẩu thành công!", {
        description: "Hãy dùng mật khẩu mới cho lần đăng nhập tiếp theo.",
      })
      navigate(getRoleDestination(normalizeRole(user?.role)), { replace: true })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate("/internal_login", { replace: true })
  }

  return (
    <InternalAuthLayout>
      <div className="w-full">
        <div className="mb-6 space-y-1 text-center">
          <div className="mb-1 inline-flex size-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-800/60 dark:bg-blue-900/40 dark:text-blue-400">
            {isFirstLogin ? <ShieldCheck className="size-5" /> : <KeyRound className="size-5" />}
          </div>

          <h1 className="text-xl font-bold text-foreground">
            {isFirstLogin ? "Đổi mật khẩu lần đầu" : "Đổi mật khẩu"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {user?.fullName ? `${user.fullName} · ` : ""}
            {user?.email || "Tài khoản nội bộ"}
          </p>
        </div>

        {isFirstLogin && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-[11.5px] leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            Tài khoản của bạn đang dùng mật khẩu tạm do quản trị viên cấp. Vui lòng đặt mật khẩu riêng
            để tiếp tục sử dụng hệ thống.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="current-password">
                {isFirstLogin ? "Mật khẩu tạm hiện tại" : "Mật khẩu hiện tại"}
                <span className="text-rose-500">*</span>
              </FieldLabel>

              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
                <InputGroupInput
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    aria-label={showCurrentPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
                  >
                    {showCurrentPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <FieldLabel htmlFor="new-password">
                Mật khẩu mới
                <span className="text-rose-500">*</span>
              </FieldLabel>

              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <KeyRound />
                </InputGroupAddon>
                <InputGroupInput
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  >
                    {showNewPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-2.5 text-[10px] dark:bg-slate-900/60">
              {passwordRules.map((rule) => {
                const passed = rule.test(newPassword.trim())
                return (
                  <div
                    key={rule.label}
                    className={`flex items-center gap-1.5 ${
                      passed
                        ? "text-emerald-600 font-bold dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    <span>{passed ? "✓" : "○"}</span>
                    <span>{rule.label}</span>
                  </div>
                )
              })}
            </div>

            <Field>
              <FieldLabel htmlFor="confirm-password">
                Xác nhận mật khẩu mới
                <span className="text-rose-500">*</span>
              </FieldLabel>

              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Lock />
                </InputGroupAddon>
                <InputGroupInput
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </div>

          {errorMessage && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting} className="mt-4 w-full">
            {isSubmitting && <Spinner />}
            {isSubmitting ? "Đang cập nhật..." : "Lưu mật khẩu mới"}
          </Button>
        </form>

        <div className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleLogout}
            className="font-semibold transition-colors hover:text-foreground"
            disabled={isSubmitting}
          >
            Đăng xuất để dùng tài khoản khác
          </button>
        </div>
      </div>
    </InternalAuthLayout>
  )
}

export default ChangePasswordPage
