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
    scene.background = new THREE.Color(isDark ? 0x020713 : 0x07152b)

    // Camera setup
    const width = window.innerWidth
    const height = window.innerHeight
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
    camera.position.set(0, 5, 38)
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

    // Custom Fresnel Shader for silky dark satin waves with radiant cyan rim-light
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vElevation;
      uniform float uTime;
      uniform float uSpeed;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Elegant flowing curves mimicking dark silk / smoke ribbons
        float t = uTime * uSpeed;
        float wave1 = sin(pos.x * 0.07 + t * 0.8) * cos(pos.y * 0.06 + t * 0.6) * 5.2;
        float wave2 = sin(pos.x * 0.14 - pos.y * 0.08 + t * 1.1) * 2.4;
        float wave3 = cos(pos.x * 0.04 + pos.y * 0.04 - t * 0.5) * 3.0;
        
        pos.z += wave1 + wave2 + wave3;
        vElevation = pos.z;

        // Compute smooth normals dynamically
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec2 vUv;
      varying float vElevation;
      uniform vec3 uBaseColor;
      uniform vec3 uMidColor;
      uniform vec3 uGlowColor;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Fresnel factor: highlights the curving ridges with glowing cyan rim
        float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
        float sharpRim = pow(fresnel, 4.0); // Exact sharp cyan edge line
        float softRim = pow(fresnel, 2.0);  // Soft glow around ridges

        // Elevation gradient
        float elevNorm = clamp((vElevation + 8.0) / 16.0, 0.0, 1.0);

        // Blend colors
        vec3 color = uBaseColor;
        color = mix(color, uMidColor, softRim * 0.5 + elevNorm * 0.2);
        color = mix(color, uGlowColor, sharpRim * 1.6);

        gl_FragColor = vec4(color, 1.0);
      }
    `

    // Shader Uniforms
    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 0.75 },
      // Xanh đen deep navy obsidian
      uBaseColor: {
        value: new THREE.Color(isDark ? 0x020713 : 0x06193b),
      },
      // Mid sapphire blue
      uMidColor: {
        value: new THREE.Color(isDark ? 0x08254f : 0x0284c7),
      },
      // Luminous electric cyan rim
      uGlowColor: {
        value: new THREE.Color(isDark ? 0x00f0ff : 0x38bdf8),
      },
    }

    // High resolution plane for crisp smooth curves
    const geometry = new THREE.PlaneGeometry(130, 95, 120, 85)
    geometry.computeVertexNormals()

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      wireframe: false,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2.6
    mesh.rotation.z = -0.15
    mesh.position.set(0, -10, -6)
    scene.add(mesh)

    // Second ethereal ribbon mesh in the background for depth
    const geometry2 = new THREE.PlaneGeometry(140, 100, 80, 60)
    const uniforms2 = {
      uTime: { value: 10 },
      uSpeed: { value: 0.45 },
      uBaseColor: { value: new THREE.Color(isDark ? 0x01040a : 0x03122b) },
      uMidColor: { value: new THREE.Color(isDark ? 0x041328 : 0x0369a1) },
      uGlowColor: { value: new THREE.Color(isDark ? 0x0ea5e9 : 0x0284c7) },
    }
    const material2 = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniforms2,
      wireframe: false,
      transparent: true,
      opacity: 0.6,
    })
    const mesh2 = new THREE.Mesh(geometry2, material2)
    mesh2.rotation.x = -Math.PI / 2.9
    mesh2.position.set(5, -16, -18)
    scene.add(mesh2)

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
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()
      uniforms.uTime.value = time
      uniforms2.uTime.value = time + 15.0

      // Smooth mouse easing
      targetX += (mouseX * 4 - targetX) * 0.04
      targetY += (mouseY * 2.5 - targetY) * 0.04

      camera.position.x = targetX
      camera.position.y = 5 - targetY
      camera.lookAt(0, 0, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)

      geometry.dispose()
      geometry2.dispose()
      material.dispose()
      material2.dispose()
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
