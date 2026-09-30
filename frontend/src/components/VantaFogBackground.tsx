import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface VantaFogBackgroundProps {
  highlightColor?: number
  midtoneColor?: number
  lowlightColor?: number
  baseColor?: number
  blurFactor?: number
  zoom?: number
  speed?: number
  className?: string
}

export default function VantaFogBackground({
  highlightColor = 0xffc300,
  midtoneColor = 0xff1f00,
  lowlightColor = 0x2d00ff,
  baseColor = 0xffebeb,
  blurFactor = 0.6,
  zoom = 1.0,
  speed = 1.0,
  className,
}: VantaFogBackgroundProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const [, setVantaEffect] = useState<any>(null)

  useEffect(() => {
    let effect: any = null

    const loadVanta = async () => {
      try {
        // @ts-ignore
        const vantaModule = await import("vanta/dist/vanta.fog.min")
        const FOG = vantaModule.default || vantaModule

        if (vantaRef.current) {
          effect = FOG({
            el: vantaRef.current,
            THREE: THREE,
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
          setVantaEffect(effect)
        }
      } catch (err) {
        console.error("Vanta load error:", err)
      }
    }

    loadVanta()

    return () => {
      if (effect) effect.destroy()
    }
  }, [highlightColor, midtoneColor, lowlightColor, baseColor, blurFactor, zoom, speed])

  return (
    <div
      ref={vantaRef}
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    />
  )
}

