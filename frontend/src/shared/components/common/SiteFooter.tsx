import { useState } from "react"
import PolicyDialog, { type PolicyTab } from "@/components/common/PolicyDialog"
import { Button } from "@/components/ui/button"

function SiteFooter() {
  const [policyTab, setPolicyTab] = useState<PolicyTab | null>(null)

  return (
    <>
      <footer className="w-full shrink-0 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/95 px-4 sm:px-8 py-2.5 text-xs text-slate-500 dark:text-slate-400 mt-auto transition-colors shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full">
          <div className="flex items-center space-x-2 text-center md:text-left text-[11px] sm:text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">© 2026 Smart Storage</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <Button
              type="button"
              variant="link"
              onClick={() => setPolicyTab("privacy")}
              className="h-auto p-0 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              • Chính sách bảo mật kho
            </Button>

            <Button
              type="button"
              variant="link"
              onClick={() => setPolicyTab("terms")}
              className="h-auto p-0 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              • Điều khoản dịch vụ
            </Button>

            <a
              href="tel:1900391391"
              className="inline-flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <i className="fa-solid fa-phone-volume text-blue-500"></i>
              <span>Hotline: 1900 391 391</span>
            </a>
          </div>
        </div>
      </footer>

      <PolicyDialog tab={policyTab} onClose={() => setPolicyTab(null)} />
    </>
  )
}

export default SiteFooter
