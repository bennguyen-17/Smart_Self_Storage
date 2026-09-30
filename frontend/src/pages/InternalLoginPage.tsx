import InternalAuthLayout from "@/components/layouts/InternalAuthLayout"
import InternalLoginForm from "@/features/auth/components/InternalLoginForm"

function InternalLoginPage() {
  return (
    <InternalAuthLayout>
      <InternalLoginForm />
    </InternalAuthLayout>
  )
}

export default InternalLoginPage
