import type { ReactNode } from "react"
import { XIcon } from "lucide-react"

interface ProtoModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  icon?: ReactNode
  /** Tailwind max-width class, mặc định max-w-lg */
  maxWidth?: string
  children: ReactNode
}

/** Khung modal bám prototype staff.html (card-box + backdrop tối) */
function ProtoModal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = "max-w-lg",
  children,
}: ProtoModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card-box modal-animate-pop max-h-[90vh] w-full ${maxWidth} space-y-4 overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2.5">
            {icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base font-bold text-white shadow">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-extrabold text-title uppercase">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] font-medium text-muted">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default ProtoModal
