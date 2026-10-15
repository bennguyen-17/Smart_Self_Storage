import { Agentation } from "agentation"
import AppRouter from "./router"

export function App() {
  return (
    <>
      <AppRouter />
      {import.meta.env.VITE_ENABLE_AGENTATION === "true" && <Agentation />}
    </>
  )
}

export default App
