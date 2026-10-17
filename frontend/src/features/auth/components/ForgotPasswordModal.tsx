import { useState, type FormEvent } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { passwordRules } from "@/utils/validation"
import { requestForgotPasswordOtp, resetPassword } from "../authApi"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function ForgotPasswordModal({
  open,
  onOpenChange,
  onSuccess,
}: ForgotPasswordModalProps) {
  // Step 1: Nhập identifier gửi OTP. Step 2: Nhập OTP & Mật khẩu mới. Step 3: Hoàn tất.
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [identifier, setIdentifier] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  const resetState = () => {
    setStep(1)
    setIdentifier("")
    setOtpCode("")
    setNewPassword("")
    setConfirmPassword("")
    setShowPassword(false)
    setShowConfirmPassword(false)
    setIsLoading(false)
    setIsResending(false)
    setResendCooldown(0)
    setErrorMessage("")
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState()
      onOpenChange(false)
    }
  }

  // Bắt đầu đếm ngược thời gian gửi lại OTP
  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Bước 1: Yêu cầu gửi mã OTP về email
  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    const trimmed = identifier.trim()
    if (!trimmed) {
      setErrorMessage("Vui lòng nhập Email tài khoản.")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setErrorMessage("Vui lòng nhập địa chỉ Email hợp lệ!")
      return
    }

    setIsLoading(true)
    try {
      const res = await requestForgotPasswordOtp(trimmed)
      if (res?.success) {
        toast.success("Mã OTP đã được gửi!", {
          description:
            res.message || "Vui lòng kiểm tra hộp thư email của bạn.",
        })
        setStep(2)
        startCooldown()
      } else {
        setErrorMessage(
          res?.message || "Không thể gửi mã OTP. Vui lòng kiểm tra lại thông tin."
        )
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Không tìm thấy tài khoản phù hợp với thông tin đã nhập."
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setErrorMessage("")

    try {
      const res = await requestForgotPasswordOtp(identifier.trim())
      if (res?.success) {
        toast.success("Đã gửi lại mã OTP thành công!")
        startCooldown()
      } else {
        setErrorMessage(res?.message || "Không thể gửi lại mã OTP.")
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "Lỗi khi gửi lại OTP. Vui lòng thử lại sau."
      )
    } finally {
      setIsResending(false)
    }
  }

  // Bước 2: Xác nhận OTP & Đổi mật khẩu mới
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    const trimmedOtp = otpCode.trim()
    if (!trimmedOtp || trimmedOtp.length < 6) {
      setErrorMessage("Vui lòng nhập đầy đủ mã OTP 6 chữ số.")
      return
    }

    if (!newPassword) {
      setErrorMessage("Vui lòng nhập mật khẩu mới.")
      return
    }

    // Kiểm tra các điều kiện an toàn mật khẩu
    const failedRules = passwordRules.filter((r) => !r.test(newPassword))
    if (failedRules.length > 0) {
      setErrorMessage("Mật khẩu chưa đáp ứng đủ các tiêu chuẩn bảo mật.")
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.")
      return
    }

    setIsLoading(true)
    try {
      const res = await resetPassword(identifier.trim(), trimmedOtp, newPassword)
      if (res?.success) {
        setStep(3)
        toast.success("Đặt lại mật khẩu thành công!", {
          description: "Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ.",
        })
        setTimeout(() => {
          handleClose(false)
          onSuccess?.()
        }, 2000)
      } else {
        setErrorMessage(
          res?.message || "Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại mã OTP."
        )
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 1 && (
          <>
            <DialogHeader className="items-center text-center space-y-2 pt-2">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <KeyRound className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold sm:text-xl">
                  Quên mật khẩu?
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Nhập địa chỉ email tài khoản của bạn để nhận mã OTP xác thực đặt lại mật khẩu.
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleRequestOtp} className="mt-4 space-y-4">
              <Field data-invalid={Boolean(errorMessage)}>
                <FieldLabel htmlFor="forgot-identifier" className="text-xs font-semibold">
                  Email tài khoản
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup className="h-10">
                  <InputGroupAddon align="inline-start">
                    <Mail className="size-4 text-slate-400" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="forgot-identifier"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value)
                      if (errorMessage) setErrorMessage("")
                    }}
                    placeholder="Nhập địa chỉ email (ví dụ: nguyenvan@gmail.com)"
                    autoComplete="email"
                    autoFocus
                    aria-invalid={Boolean(errorMessage)}
                    disabled={isLoading}
                  />
                </InputGroup>

                {errorMessage && <FieldError>{errorMessage}</FieldError>}
              </Field>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  disabled={isLoading || !identifier.trim()}
                >
                  {isLoading && <Spinner className="mr-2" />}
                  {isLoading ? "Đang gửi mã..." : "Gửi mã OTP qua Email"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                    disabled={isLoading}
                  >
                    Hủy & quay lại đăng nhập
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="-mt-1 mb-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setErrorMessage("")
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>Quay lại nhập email</span>
              </button>
            </div>

            <DialogHeader className="items-center text-center space-y-2 pt-1">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                <Lock className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold sm:text-xl">
                  Thiết lập mật khẩu mới
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-muted-foreground">
                  Mã OTP đã được gửi tới email <b>{identifier}</b>
                </DialogDescription>
              </div>
            </DialogHeader>

            <form onSubmit={handleResetPassword} className="mt-2 space-y-3.5">
              {/* Nhập mã OTP */}
              <Field data-invalid={Boolean(errorMessage)}>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="otp-input" className="text-xs font-semibold">
                    Mã xác thực OTP (6 chữ số)
                    <span className="text-rose-500">*</span>
                  </FieldLabel>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                  >
                    <RefreshCw
                      className={`size-3 ${isResending ? "animate-spin" : ""}`}
                    />
                    <span>
                      {resendCooldown > 0
                        ? `Gửi lại sau (${resendCooldown}s)`
                        : "Gửi lại OTP"}
                    </span>
                  </button>
                </div>

                <InputGroup>
                  <InputGroupInput
                    id="otp-input"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Nhập 6 số OTP (VD: 123456)"
                    className="font-mono text-center tracking-widest text-base font-black"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    disabled={isLoading}
                  />
                </InputGroup>
              </Field>

              {/* Mật khẩu mới */}
              <Field>
                <FieldLabel htmlFor="new-password" className="text-xs font-semibold">
                  Mật khẩu mới
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock className="size-4 text-slate-400" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ẩn" : "Hiện"}
                      className="size-7"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              {/* Checklist độ mạnh mật khẩu */}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-50 p-2.5 text-[10px] dark:bg-slate-900/60">
                {passwordRules.map((rule) => {
                  const pass = rule.test(newPassword)
                  return (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 ${
                        pass
                          ? "text-emerald-600 font-bold dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <span>{pass ? "✓" : "○"}</span>
                      <span>{rule.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Xác nhận mật khẩu mới */}
              <Field>
                <FieldLabel htmlFor="confirm-password" className="text-xs font-semibold">
                  Xác nhận lại mật khẩu mới
                  <span className="text-rose-500">*</span>
                </FieldLabel>

                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Lock className="size-4 text-slate-400" />
                  </InputGroupAddon>
                  <InputGroupInput
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? "Ẩn" : "Hiện"}
                      className="size-7"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20"
                  disabled={isLoading || !otpCode || !newPassword}
                >
                  {isLoading && <Spinner className="mr-2" />}
                  {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => handleClose(false)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
                    disabled={isLoading}
                  >
                    Hủy & đóng
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>

            <h3 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
              Đặt lại mật khẩu thành công!
            </h3>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Mật khẩu mới của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu
              này để đăng nhập ngay bây giờ.
            </p>

            <Button
              type="button"
              onClick={() => handleClose(false)}
              className="mt-5 rounded-xl bg-blue-600 px-6 font-bold hover:bg-blue-700"
            >
              Đăng nhập ngay
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordModal
