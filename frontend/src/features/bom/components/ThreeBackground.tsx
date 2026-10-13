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

    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(isDark ? 0x030712 : 0xf1f5f9)
    scene.fog = new THREE.FogExp2(isDark ? 0x030712 : 0xf1f5f9, 0.015)

    // Camera setup
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000)
    camera.position.set(0, 12, 45)
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

    // Group to hold all delicate wave lines
    const waveGroup = new THREE.Group()
    waveGroup.rotation.x = -Math.PI / 7
    waveGroup.rotation.y = -0.08
    waveGroup.position.set(0, -6, 0)
    scene.add(waveGroup)

    // 1. TẠO CÁC GỢN MẢNH DI CHUYỂN (Delicate 3D luminous wave ripples)
    const numLines = 36 // 36 gợn sóng mảnh
    const pointsPerLine = 160
    const linesData: Array<{
      line: THREE.Line
      geometry: THREE.BufferGeometry
      basePositions: Float32Array
      depthIndex: number
      speedMult: number
      freqX: number
      freqZ: number
      amp: number
    }> = []

    for (let l = 0; l < numLines; l++) {
      const positions = new Float32Array(pointsPerLine * 3)
      const basePositions = new Float32Array(pointsPerLine * 3)
      const zPos = (l - numLines / 2) * 2.2 // Khoảng cách chiều sâu giữa các gợn

      for (let p = 0; p < pointsPerLine; p++) {
        const x = (p / (pointsPerLine - 1) - 0.5) * 110 // Độ rộng sóng ngang
        const y = 0
        const z = zPos

        positions[p * 3] = x
        positions[p * 3 + 1] = y
        positions[p * 3 + 2] = z

        basePositions[p * 3] = x
        basePositions[p * 3 + 1] = y
        basePositions[p * 3 + 2] = z
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

      // Tính màu sắc chuyển dần từ Cyan neon sang Sapphire & Indigo
      let lineColor: THREE.Color
      let opacity: number

      if (isDark) {
        // Tông xanh đen: Đan xen giữa Cyan neon (#00f0ff), Sky Blue (#38bdf8), và Sapphire (#1d4ed8)
        if (l % 3 === 0) {
          lineColor = new THREE.Color(0x00f0ff) // Cyan neon nổi bật
          opacity = 0.65
        } else if (l % 3 === 1) {
          lineColor = new THREE.Color(0x38bdf8) // Sky blue thanh mảnh
          opacity = 0.45
        } else {
          lineColor = new THREE.Color(0x1d4ed8) // Sapphire trầm sâu
          opacity = 0.28
        }
      } else {
        // Tông sáng: Màu Sky & Blue đậm rõ nét trên nền trắng ngọc
        if (l % 3 === 0) {
          lineColor = new THREE.Color(0x0284c7) // Sky 600
          opacity = 0.55
        } else if (l % 3 === 1) {
          lineColor = new THREE.Color(0x2563eb) // Blue 600
          opacity = 0.4
        } else {
          lineColor = new THREE.Color(0x0ea5e9) // Sky 500
          opacity = 0.3
        }
      }

      const material = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: opacity,
        blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
        linewidth: 1, // Đường kẻ mảnh tinh tế
      })

      const line = new THREE.Line(geometry, material)
      waveGroup.add(line)

      linesData.push({
        line,
        geometry,
        basePositions,
        depthIndex: l,
        speedMult: 0.8 + (l % 5) * 0.1,
        freqX: 0.065 + (l % 4) * 0.015,
        freqZ: 0.04 + (l % 3) * 0.01,
        amp: 2.2 + (l % 5) * 0.6,
      })
    }

    // 2. DẢI LỤA SƯƠNG MỜ MỎNG ĐỆM PHÍA DƯỚI (Ethereal sheer ribbons)
    const ribbonGeom = new THREE.PlaneGeometry(110, 80, 50, 30)
    const ribbonMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x0284c7 : 0xbae6fd,
      transparent: true,
      opacity: isDark ? 0.045 : 0.22, // Trong suốt, chỉ tạo độ mịn
      wireframe: false,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.DoubleSide,
    })
    const ribbonMesh = new THREE.Mesh(ribbonGeom, ribbonMat)
    ribbonMesh.rotation.x = -Math.PI / 2.3
    ribbonMesh.position.set(0, -10, 0)
    waveGroup.add(ribbonMesh)

    // 3. TẠO CÁC HẠT BỤI PHÁT SÁNG NHẸ NHÀNG (Floating luminous dust particles)
    const particleCount = 100
    const particleGeom = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 100
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 35
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 70
    }
    particleGeom.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.2,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeom, particleMat)
    scene.add(particles)

    // Mouse Parallax
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
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()

      // Mouse Parallax mượt mà
      targetX += (mouseX * 4 - targetX) * 0.03
      targetY += (mouseY * 2.5 - targetY) * 0.03

      camera.position.x = targetX
      camera.position.y = 12 - targetY
      camera.lookAt(0, -2, 0)

      // Cập nhật từng gợn sóng mảnh di chuyển
      for (let i = 0; i < linesData.length; i++) {
        const item = linesData[i]
        const pos = item.geometry.attributes.position as THREE.BufferAttribute
        const base = item.basePositions
        const t = time * item.speedMult
        const lIndex = item.depthIndex

        for (let p = 0; p < pointsPerLine; p++) {
          const bx = base[p * 3]
          const bz = base[p * 3 + 2]

          // Thuật toán sóng kép tạo các gợn mảnh uốn lượn nhịp nhàng
          const waveY =
            Math.sin(bx * item.freqX + t * 0.9 + lIndex * 0.18) * item.amp +
            Math.cos(bx * 0.12 - t * 1.2 + lIndex * 0.12) * (item.amp * 0.45) +
            Math.sin(bz * 0.08 + t * 0.7) * 1.2

          pos.setY(p, waveY)
        }

        pos.needsUpdate = true
      }

      // Xoay nhẹ các hạt bụi không gian
      particles.rotation.y = time * 0.02

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)

      linesData.forEach((item) => {
        item.geometry.dispose()
        ;(item.line.material as THREE.Material).dispose()
      })
      ribbonGeom.dispose()
      ribbonMat.dispose()
      particleGeom.dispose()
      particleMat.dispose()
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
