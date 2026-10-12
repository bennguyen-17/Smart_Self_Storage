import { useEffect, useRef } from "react"
import * as THREE from "three"

interface ThreeBackgroundProps {
  theme?: "dark" | "light" | string
  className?: string
}

export default function ThreeBackground({
  theme = "dark",
  className = "",
}: ThreeBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isDark = theme === "dark"

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? 0x030712 : 0x07152b)

    // Camera setup
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000)
    camera.position.set(0, 10, 42)
    camera.lookAt(0, 0, 0)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)

    // Lighting (Midnight Navy / Cyan luminescent palette)
    const ambientLight = new THREE.AmbientLight(
      isDark ? 0x061530 : 0x0c2755,
      isDark ? 2.2 : 2.8
    )
    scene.add(ambientLight)

    // Vibrant cyan point light
    const cyanLight = new THREE.PointLight(0x00e5ff, isDark ? 4.5 : 3.5, 120)
    cyanLight.position.set(25, 20, 25)
    scene.add(cyanLight)

    // Deep sapphire / royal blue point light
    const blueLight = new THREE.PointLight(0x1d4ed8, isDark ? 4.0 : 3.0, 120)
    blueLight.position.set(-25, 15, 20)
    scene.add(blueLight)

    // Subtle violet glow
    const purpleLight = new THREE.PointLight(0x818cf8, isDark ? 2.5 : 2.0, 100)
    purpleLight.position.set(0, 25, 15)
    scene.add(purpleLight)

    // 3D Wave Geometry: Large dense grid
    const cols = 80
    const rows = 60
    const geometry = new THREE.PlaneGeometry(120, 90, cols, rows)
    const posAttribute = geometry.attributes.position

    // Store base vertices
    const baseCoords: Array<{ x: number; y: number; z: number }> = []
    for (let i = 0; i < posAttribute.count; i++) {
      baseCoords.push({
        x: posAttribute.getX(i),
        y: posAttribute.getY(i),
        z: posAttribute.getZ(i),
      })
    }

    // Material with metallic luster and specular reflections
    const material = new THREE.MeshStandardMaterial({
      color: isDark ? 0x041126 : 0x08254f, // Xanh đen midnight navy
      roughness: 0.32,
      metalness: 0.68,
      flatShading: false,
      wireframe: false,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2.7
    mesh.position.set(0, -12, -8)
    scene.add(mesh)

    // Mouse parallax tracking
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })

    // Resize handling
    const handleResize = () => {
      if (!container) return
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    window.addEventListener("resize", handleResize)

    // Animation Loop
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()

      // Smooth mouse easing
      targetX += (mouseX * 5 - targetX) * 0.04
      targetY += (mouseY * 3 - targetY) * 0.04

      camera.position.x = targetX
      camera.position.y = 10 - targetY
      camera.lookAt(0, -2, 0)

      // Light oscillation for dynamic glowing waves
      cyanLight.position.x = 25 + Math.sin(time * 0.8) * 10
      cyanLight.position.z = 25 + Math.cos(time * 0.6) * 8
      blueLight.position.x = -25 - Math.cos(time * 0.7) * 8

      // Fluid Wave Calculation
      const pos = geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const base = baseCoords[i]
        const z =
          Math.sin(base.x * 0.09 + time * 1.1) *
            Math.cos(base.y * 0.09 + time * 0.9) *
            3.8 +
          Math.sin(base.x * 0.18 + time * 1.6) * 1.6 +
          Math.cos(base.y * 0.16 - time * 1.3) * 1.4

        pos.setZ(i, z)
      }

      pos.needsUpdate = true
      geometry.computeVertexNormals()

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)

      geometry.dispose()
      material.dispose()
      renderer.dispose()

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    />
  )
}
