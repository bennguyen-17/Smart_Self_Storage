import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { Box, Clock3, Cloud, Settings, ShieldCheck, Warehouse } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface AuthLayoutProps {
  children: ReactNode
  headerAction?: ReactNode
}

const features = [
  {
    icon: ShieldCheck,
    title: "An toàn và bảo mật",
    description: "Dữ liệu được bảo vệ với tiêu chuẩn cao.",
  },
  {
    icon: Settings,
    title: "Quản lý dễ dàng",
    description: "Theo dõi và quản lý kho chỉ với vài thao tác.",
  },
  {
    icon: Clock3,
    title: "Truy cập mọi lúc, mọi nơi",
    description: "Quản lý kho của bạn trên mọi thiết bị.",
  },
]

const defaultHeaderAction = (
  <>
    <span className="text-muted-foreground">Đã có tài khoản?</span>

    <Link to="/login" className="font-medium text-primary hover:underline">
      Đăng nhập
    </Link>
  </>
)

function AuthLayout({
  children,
  headerAction = defaultHeaderAction,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Warehouse className="size-5" />
            </div>

            <span className="font-heading text-lg font-semibold tracking-tight">
              <span className="text-primary">Smart</span> Self Storage
            </span>
          </Link>

          {/* Header action */}
          <div className="hidden items-center gap-3 text-sm sm:flex">
            {headerAction}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center gap-16 px-6 py-12">
        {/* ================= LEFT ================= */}
        <section className="hidden flex-1 lg:block">
          <Badge variant="secondary">
            <Box />
            Quản lý kho lưu trữ thông minh
          </Badge>

          <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight text-balance">
            Không gian của bạn,
            <span className="block text-primary">
              được quản lý thông minh.
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-muted-foreground">
            Giải pháp quản lý kho lưu trữ hiện đại, an toàn và tiện lợi cho cá
            nhân và doanh nghiệp.
          </p>

          {/* FEATURES */}
          <div className="mt-8 space-y-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>

                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* STORAGE ILLUSTRATION */}
          <Card className="mt-10 max-w-md">
            <CardContent className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cloud className="size-6" />
              </div>

              <div className="flex size-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Warehouse className="size-8" />
              </div>

              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Box className="size-6" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================= FORM ================= */}
        <section className="flex w-full justify-center lg:w-[460px] lg:shrink-0">
          <Card className="w-full [--card-spacing:--spacing(6)]">
            <CardContent>{children}</CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

export default AuthLayout
