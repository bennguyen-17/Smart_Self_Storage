import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

interface SignedInPanelProps {
  fullName: string
  description: string
}

function SignedInPanel({ fullName, description }: SignedInPanelProps) {
  const { signOut } = useAuth()

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-8" />
      </div>

      <h1 className="mt-5 font-heading text-xl font-semibold">
        Đăng nhập thành công
      </h1>

      <p className="mt-2 font-medium">{fullName}</p>

      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <Button variant="outline" className="mt-6" onClick={signOut}>
        Đăng xuất
      </Button>
    </div>
  )
}

export default SignedInPanel
