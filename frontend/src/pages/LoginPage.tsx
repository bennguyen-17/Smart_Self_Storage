import { Link } from "react-router-dom"

import AuthLayout from "@/components/AuthLayout"
import LoginForm from "@/components/LoginForm"

function LoginPage() {
  return (
    <AuthLayout
      headerAction={
        <>
          <span className="text-muted-foreground">Chưa có tài khoản?</span>

          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  )
}

export default LoginPage
