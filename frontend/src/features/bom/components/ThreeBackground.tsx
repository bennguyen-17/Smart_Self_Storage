import { useEffect, useRef } from "react"
import * as THREE from "three"

interface ThreeBackgroundProps {
  theme?: "dark" | "light" | string
  effectType?: "waves" | "fog"
  className?: string
}

export default function ThreeBackground({
  theme = "dark",
  effectType = "waves",
  className = "",
}: ThreeBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const effectInstance = useRef<any>(null)

  useEffect(() => {
    let effect: any = null
    let isCancelled = false

    const initVanta = async () => {
      try {
        if (typeof window !== "undefined") {
          ;(window as any).THREE = THREE
        }

        if (isCancelled || !vantaRef.current) return

        if (effectType === "waves") {
          // Dynamic import to avoid SSR issues
          const WAVES = (await import("vanta/dist/vanta.waves.min")).default

          if (isCancelled || !vantaRef.current) return

          // "Xanh đen" deep navy theme vs Light cyan theme
          const isDark = theme === "dark"

          effect = WAVES({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            // Xanh đen deep navy obsidian
            color: isDark ? 0x07152b : 0x0284c7,
            shininess: isDark ? 38.0 : 45.0,
            waveHeight: 16.0,
            waveSpeed: 0.7,
            zoom: 0.85,
          })
        } else {
          const FOG = (await import("vanta/dist/vanta.fog.min")).default

          if (isCancelled || !vantaRef.current) return

          const isDark = theme === "dark"

          effect = FOG({
            el: vantaRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            // Xanh đen palette
            highlightColor: isDark ? 0x38bdf8 : 0x0ea5e9,
            midtoneColor: isDark ? 0x0369a1 : 0x38bdf8,
            lowlightColor: isDark ? 0x020f26 : 0xbae6fd,
            baseColor: isDark ? 0x020617 : 0xf0f9ff,
            blurFactor: 0.6,
            speed: 1.0,
            zoom: 1.0,
          })
        }

        effectInstance.current = effect
      } catch (err) {
        console.warn("Could not initialize 3D background effect:", err)
      }
    }

    initVanta()

    return () => {
      isCancelled = true
      if (effectInstance.current) {
        try {
          effectInstance.current.destroy()
        } catch {
          // ignore cleanup error
        }
        effectInstance.current = null
      }
    }
  }, [theme, effectType])

  return (
    <div
      ref={vantaRef}
      className={`fixed inset-0 pointer-events-none -z-10 transition-opacity duration-700 ${className}`}
      style={{
        backgroundColor: theme === "dark" ? "#020617" : "#0f172a",
      }}
    />
  )
}
