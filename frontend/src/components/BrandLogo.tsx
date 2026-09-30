import { Link } from "react-router-dom"
import { Warehouse } from "lucide-react"

interface BrandLogoProps {
  internal?: boolean
}

function BrandLogo({ internal = false }: BrandLogoProps) {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
        <Warehouse className="size-5 sm:size-6" />
      </div>

      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            <span className="text-blue-600 dark:text-blue-500">Smart</span> Self Storage
          </span>
        </div>

        <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
          Hệ thống kho tự quản thông minh 24/7
        </div>
      </div>
    </Link>
  )
}

export default BrandLogo
