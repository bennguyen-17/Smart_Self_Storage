import { useState } from "react"

import PolicyDialog, { type PolicyTab } from "@/components/PolicyDialog"
import { Button } from "@/components/ui/button"

function SiteFooter() {
  const [policyTab, setPolicyTab] = useState<PolicyTab | null>(null)

  return (
    <>
      <footer className="flex w-full shrink-0 flex-wrap items-center justify-between gap-y-1 border-t bg-card px-6 py-3 text-xs text-muted-foreground sm:px-10">
        <div>© 2026 Smart Storage</div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            type="button"
            variant="link"
            onClick={() => setPolicyTab("privacy")}
            className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            • Chính sách bảo mật kho
          </Button>

          <Button
            type="button"
            variant="link"
            onClick={() => setPolicyTab("terms")}
            className="h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            • Điều khoản dịch vụ
          </Button>

          <a href="tel:1900391391" className="font-medium hover:text-foreground">
            • Hotline: 1900 391 391
          </a>
        </div>
      </footer>

      <PolicyDialog tab={policyTab} onClose={() => setPolicyTab(null)} />
    </>
  )
}

export default SiteFooter
