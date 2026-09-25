import { useEffect, useState } from "react"
import axios from "axios"
import { ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { resendOtp, verifyOtp } from "@/api/authApi"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

interface OtpModalProps {
  phone: string
  onClose: () => void
}

const OTP_LENGTH = 6
const OTP_TTL = 300
const RESEND_COOLDOWN = 60

function OtpModal({ phone, onClose }: OtpModalProps) {
  const navigate = useNavigate()

  const [otp, setOtp] = useState("")
  const [timeLeft, setTimeLeft] = useState(OTP_TTL)
  const [resendTime, setResendTime] = useState(RESEND_COOLDOWN)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")

  // Đếm ngược OTP và thời gian chờ gửi lại
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0))
      setResendTime((prev) => Math.max(prev - 1, 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleVerifyOtp = async () => {
    setError("")

    if (otp.length !== OTP_LENGTH) {
      setError("Vui lòng nhập đầy đủ 6 số OTP.")
      return
    }

    if (timeLeft <= 0) {
      setError("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.")
      return
    }

    try {
      setVerifyLoading(true)

      await verifyOtp(phone, otp)

      toast.success("Kích hoạt thành công!", {
        description: "Tài khoản của bạn đã được kích hoạt.",
      })

      navigate("/login")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Mã OTP không chính xác hoặc đã hết hạn."
        )
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.")
      }
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTime > 0 || resendLoading) return

    setError("")

    try {
      setResendLoading(true)

      await resendOtp(phone)

      setOtp("")
      setTimeLeft(OTP_TTL)
      setResendTime(RESEND_COOLDOWN)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Không thể gửi lại mã OTP.")
      } else {
        setError("Có lỗi xảy ra. Vui lòng thử lại.")
      }
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent>
        {/* Header */}
        <DialogHeader className="items-center text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>

          <DialogTitle>Xác thực tài khoản</DialogTitle>

          <DialogDescription>
            Chúng tôi đã gửi mã OTP gồm 6 số đến{" "}
            <span className="font-medium text-foreground">{phone}</span>
          </DialogDescription>
        </DialogHeader>

        {/* 6 ô OTP */}
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="otp">Mã OTP</FieldLabel>

          <InputOTP
            id="otp"
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            disabled={timeLeft <= 0}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }, (_, index) => (
                <InputOTPSlot key={index} index={index} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <FieldError>{error}</FieldError>
        </Field>

        {/* Countdown */}
        <FieldDescription className="text-center">
          {timeLeft > 0 ? (
            <>
              Mã OTP hết hạn sau{" "}
              <span className="font-medium text-foreground">
                {formatTime(timeLeft)}
              </span>
            </>
          ) : (
            <span className="text-destructive">Mã OTP đã hết hạn.</span>
          )}
        </FieldDescription>

        {/* Verify */}
        <Button
          type="button"
          onClick={handleVerifyOtp}
          disabled={verifyLoading || timeLeft <= 0}
          className="w-full"
        >
          {verifyLoading && <Spinner />}

          {verifyLoading ? "Đang xác thực..." : "Xác thực"}
        </Button>

        <Separator />

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Bạn chưa nhận được mã?
          </p>

          <Button
            type="button"
            variant="link"
            onClick={handleResendOtp}
            disabled={resendTime > 0 || resendLoading}
          >
            {resendLoading && <Spinner />}

            {resendLoading
              ? "Đang gửi..."
              : resendTime > 0
                ? `Gửi lại mã (${resendTime}s)`
                : "Gửi lại mã"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default OtpModal
