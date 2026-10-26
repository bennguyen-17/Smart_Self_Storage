import { useState } from "react"
import axios from "axios"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, ChevronDown, Circle, Eye, EyeOff, List } from "lucide-react"
import { Controller, useForm, useWatch, type Control } from "react-hook-form"
import { Link } from "react-router-dom"
import { cn } from "cn"

import { register } from "../authApi"
import {
  passwordRules,
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation"
import { OTHER_BANK, resolveBankName, VIETNAM_BANKS } from "@/lib/banks"

import OtpModal from "./OtpModal"
import PolicyDialog, { type PolicyTab } from "@/components/common/PolicyDialog"
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

type TextFieldName =
  | "fullName"
  | "identityNumber"
  | "email"
  | "phone"
  | "bankAccountNumber"
  | "bankAccountName"

interface TextFieldProps {
  control: Control<RegisterFormValues>
  name: TextFieldName
  label: string
  placeholder: string
  type?: string
  maxLength?: number
  autoComplete?: string
  digitsOnly?: boolean
}

function TextField({
  control,
  name,
  label,
  placeholder,
  type = "text",
  maxLength,
  autoComplete,
  digitsOnly = false,
}: TextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name} className="text-xs font-semibold sm:text-sm">
            {label}
          </FieldLabel>

          <Input
            {...field}
            id={field.name}
            type={type}
            placeholder={placeholder}
            maxLength={maxLength}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            className="h-10 text-sm rounded-xl"
            onChange={(event) =>
              field.onChange(
                digitsOnly ? event.target.value.replace(/\D/g, "") : event.target.value
              )
            }
          />

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function BankNameField({ control }: { control: Control<RegisterFormValues> }) {
  return (
    <Controller
      name="bankName"
      control={control}
      render={({ field, fieldState }) => {
        if (field.value === OTHER_BANK) {
          return (
            <Controller
              name="bankNameCustom"
              control={control}
              render={({ field: customField, fieldState: customState }) => (
                <Field data-invalid={customState.invalid}>
                  <FieldLabel htmlFor={customField.name} className="text-xs font-semibold sm:text-sm">
                    Ngân hàng
                  </FieldLabel>

                  <div className="relative">
                    <Input
                      {...customField}
                      id={customField.name}
                      placeholder="Nhập tên ngân hàng"
                      maxLength={100}
                      autoFocus
                      aria-invalid={customState.invalid}
                      className="h-10 pr-10 text-sm rounded-xl"
                    />

                    <button
                      type="button"
                      title="Chọn ngân hàng từ danh sách"
                      aria-label="Chọn ngân hàng từ danh sách"
                      onClick={() => {
                        customField.onChange("")
                        field.onChange("")
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <List className="size-4" />
                    </button>
                  </div>

                  <FieldError errors={[customState.error]} />
                </Field>
              )}
            />
          )
        }

        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name} className="text-xs font-semibold sm:text-sm">
              Ngân hàng
            </FieldLabel>

            <div className="relative">
              <select
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                className={cn(
                  "h-10 w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 pr-9 text-sm font-semibold shadow-xs outline-none transition-colors cursor-pointer",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                  !field.value && "font-normal text-muted-foreground"
                )}
              >
                <option value="">— Chọn ngân hàng —</option>
                {VIETNAM_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
                <option value={OTHER_BANK}>{OTHER_BANK}</option>
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            </div>

            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
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
          <FieldLabel htmlFor={field.name} className="text-xs font-semibold sm:text-sm">
            {label}
          </FieldLabel>

          <InputGroup className="h-10 rounded-xl">
            <InputGroupInput
              {...field}
              id={field.name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
              className="text-sm"
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
                className="size-7"
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
      bankName: "",
      bankNameCustom: "",
      bankAccountNumber: "",
      bankAccountName: "",
    },
  })

  const { isSubmitting } = form.formState
  const password = useWatch({ control: form.control, name: "password" }) ?? ""
  const phone = useWatch({ control: form.control, name: "phone" }) ?? ""
  const email = useWatch({ control: form.control, name: "email" }) ?? ""
  const [registeredContact, setRegisteredContact] = useState<{ phone: string; email: string }>({
    phone: "",
    email: "",
  })

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
        bankName: resolveBankName(values.bankName, values.bankNameCustom),
        bankAccountNumber: values.bankAccountNumber.trim(),
        bankAccountName: values.bankAccountName.trim().toUpperCase(),
      })

      setRegisteredContact({ phone: values.phone, email: values.email })
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
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Tạo tài khoản mới</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Đăng ký nhanh chóng để nhận mã mở kho tự quản
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          {/* Hàng 1: Họ và tên + Số CCCD */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="fullName"
              label="Họ và tên đầy đủ"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />

            <TextField
              control={form.control}
              name="identityNumber"
              label="Số CCCD"
              placeholder="12 chữ số CCCD"
              maxLength={12}
            />
          </div>

          {/* Hàng 2: Số điện thoại + Email */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <TextField
              control={form.control}
              name="phone"
              label="Số điện thoại"
              placeholder="0988 xxx xxx"
              type="tel"
              maxLength={10}
              autoComplete="tel"
            />

            <TextField
              control={form.control}
              name="email"
              label="Email"
              placeholder="name@email.com"
              type="email"
              autoComplete="email"
            />
          </div>

          {/* Hàng 3: Mật khẩu + Xác nhận mật khẩu */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
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

            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
            />
          </div>

          {/* Checklist quy tắc mật khẩu */}
          {showPasswordRules && (
            <ul className="space-y-0.5">
              {passwordRuleResults.map((rule) => (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-[11px] transition-colors",
                    rule.met ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {rule.met ? (
                    <Check className="size-3" />
                  ) : (
                    <Circle className="size-3" />
                  )}

                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {/* Thông tin nhận hoàn cọc (không bắt buộc) */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 space-y-2">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Thông tin nhận hoàn cọc
              </p>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Không bắt buộc · Điền đủ 3 ô để hệ thống tự động hoàn tiền cọc khi hủy hoặc thanh lý hợp đồng.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <BankNameField control={form.control} />

              <TextField
                control={form.control}
                name="bankAccountNumber"
                label="Số tài khoản"
                placeholder="VD: 1029384756"
                maxLength={20}
                digitsOnly
              />

              <TextField
                control={form.control}
                name="bankAccountName"
                label="Chủ tài khoản"
                placeholder="NGUYEN VAN A"
                maxLength={100}
              />
            </div>
          </div>

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

              <span className="text-xs leading-normal text-muted-foreground">
                Tôi đồng ý với{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("terms")}
                  className="inline h-auto p-0 text-xs font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Điều khoản dịch vụ
                </Button>{" "}
                và{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setPolicyTab("privacy")}
                  className="inline h-auto p-0 text-xs font-semibold text-blue-600 underline dark:text-blue-400"
                >
                  Chính sách bảo mật kho
                </Button>
                .
              </span>
            </label>

            {agreementError && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {agreementError}
              </p>
            )}
          </div>
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 h-10 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
        >
          {isSubmitting && <Spinner />}

          {isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
        </Button>

        {/* Lỗi từ Backend */}
        {serverError && (
          <Alert variant="destructive" className="mt-2.5 py-1.5 text-xs">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
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
          phone={registeredContact.phone || phone || "0912345678"}
          email={registeredContact.email || email}
          onClose={() => setShowOtp(false)}
        />
      )}

      <PolicyDialog tab={policyTab} onClose={() => setPolicyTab(null)} />
    </div>
  )
}

export default RegisterForm