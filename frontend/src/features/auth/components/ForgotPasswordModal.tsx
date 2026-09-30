import { useState, type FormEvent } from "react"
import { KeyRound } from "lucide-react"
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
import { Input } from "@/components/ui/input"

interface ForgotPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
  const [identifier, setIdentifier] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!identifier.trim()) {
      setError("Vui lòng nhập số điện thoại hoặc email tài khoản")
      return
    }

    setError("")
    setIdentifier("")
    onOpenChange(false)

    toast.info("Chức năng khôi phục mật khẩu chưa khả dụng", {
      description: "Backend chưa có API gửi OTP khôi phục mật khẩu.",
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setError("")
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
              <KeyRound className="size-4" />
            </div>

            <div>
              <DialogTitle>Khôi phục mật khẩu</DialogTitle>
              <DialogDescription>
                Nhận mã OTP qua Email hoặc SĐT đăng ký
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="forgot-identifier">
              Số điện thoại hoặc Email tài khoản
            </FieldLabel>

            <Input
              id="forgot-identifier"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="0988 xxx xxx hoặc email@gmail.com"
              aria-invalid={Boolean(error)}
            />

            <FieldError>{error}</FieldError>
          </Field>

          <div className="space-y-1 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/60 dark:bg-blue-950/40">
            <div className="text-xs font-bold text-blue-800 dark:text-blue-300">
              Quy trình bảo mật 2 bước:
            </div>
            <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-400">
              Hệ thống sẽ gửi mã xác thực 6 chữ số (OTP) có hiệu lực trong 2 phút
              để bạn thiết lập lại mật khẩu mới.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>

            <Button type="submit" className="flex-1">
              Gửi mã OTP
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordModal
