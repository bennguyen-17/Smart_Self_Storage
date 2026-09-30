import { useEffect, useRef } from "react"
import * as THREE from "three"
// @ts-ignore
import FOG from "vanta/dist/vanta.fog.min"

interface VantaFogBackgroundProps {
  className?: string
  highlightColor?: number
  midtoneColor?: number
  lowlightColor?: number
  baseColor?: number
  blurFactor?: number
  zoom?: number
  speed?: number
}

export function VantaFogBackground({
  className = "absolute inset-0 -z-10",
  highlightColor = 0xffc300,
  midtoneColor = 0xff1f00,
  lowlightColor = 0x2d00ff,
  baseColor = 0xffebeb,
  blurFactor = 0.6,
  zoom = 1.0,
  speed = 1.0,
}: VantaFogBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement | null>(null)
  const effectRef = useRef<any>(null)

  useEffect(() => {
    if (!vantaRef.current) return

    try {
      effectRef.current = FOG({
        el: vantaRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        highlightColor,
        midtoneColor,
        lowlightColor,
        baseColor,
        blurFactor,
        zoom,
        speed,
      })
    } catch (err) {
      console.error("Failed to initialize Vanta.js Fog effect:", err)
    }

    return () => {
      if (effectRef.current) {
        try {
          effectRef.current.destroy()
        } catch {
          // ignore cleanup error
        }
        effectRef.current = null
      }
    }
  }, [highlightColor, midtoneColor, lowlightColor, baseColor, blurFactor, zoom, speed])

  return (
    <div
      ref={vantaRef}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  )
}

export default VantaFogBackground
