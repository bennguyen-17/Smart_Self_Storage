import { Link } from "react-router-dom"
import { Warehouse } from "lucide-react"

interface BrandLogoProps {
  internal?: boolean
}

function BrandLogo({ internal = false }: BrandLogoProps) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
        <Warehouse className="size-5" />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="text-base leading-tight font-bold">
            Smart Storage
          </span>

          {internal && (
            <span className="rounded-md border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              NỘI BỘ
            </span>
          )}
        </div>

        <div className="text-[11px] font-medium text-muted-foreground">
          Hệ thống cho thuê kho tự quản thông minh 24/7
        </div>
      </div>
    </Link>
  )
}

export default BrandLogo
