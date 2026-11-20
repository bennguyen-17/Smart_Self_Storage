"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/common/theme-provider";

interface VantaDotsBackgroundProps {
  backgroundColor?: number | string;
  color?: number | string;
  size?: number;
  spacing?: number;
}

function createParticleTexture(isDark: boolean): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (isDark) {
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.22, "rgba(125, 211, 252, 0.95)");
      gradient.addColorStop(0.5, "rgba(56, 189, 248, 0.65)");
      gradient.addColorStop(0.8, "rgba(14, 165, 233, 0.15)");
      gradient.addColorStop(1, "rgba(2, 132, 199, 0)");
    } else {
      gradient.addColorStop(0, "rgba(29, 78, 216, 1)");
      gradient.addColorStop(0.35, "rgba(37, 99, 235, 0.98)");
      gradient.addColorStop(0.65, "rgba(2, 132, 199, 0.75)");
      gradient.addColorStop(0.85, "rgba(56, 189, 248, 0.35)");
      gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function VantaDotsBackground({
  backgroundColor,
  color,
  size = 4.2,
  spacing = 22.0,
}: VantaDotsBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const effectiveBg = backgroundColor ?? (isDark ? 0x090e17 : 0xf0f4f8);
  const effectiveColor = color ?? (isDark ? 0x38bdf8 : 0x1d4ed8);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      4000
    );

    const baseCamY = 90;
    const baseCamZ = 380;
    camera.position.set(0, baseCamY, baseCamZ);
    camera.lookAt(0, -10, 0);

    const targetCamera = {
      x: 0,
      y: baseCamY,
      rotX: -0.18,
      rotY: 0,
    };

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new THREE.Color(effectiveBg), 1);

    container.replaceChildren(renderer.domElement);

    const particleTexture = createParticleTexture(isDark);
    const gridX = 48;
    const gridZ = 48;
    const numPoints = (gridX * 2 + 1) * (gridZ * 2 + 1);

    const positions = new Float32Array(numPoints * 3);
    const initialCoords = new Float32Array(numPoints * 3);

    let pIndex = 0;
    let maxDist = 0;

    for (let ix = -gridX; ix <= gridX; ix++) {
      for (let iz = -gridZ; iz <= gridZ; iz++) {
        const px = ix * spacing;
        const pz = iz * spacing - 40;
        const dist = Math.sqrt(px * px + pz * pz);
        if (dist > maxDist) maxDist = dist;

        positions[pIndex * 3] = px;
        positions[pIndex * 3 + 1] = -100;
        positions[pIndex * 3 + 2] = pz;

        initialCoords[pIndex * 3] = px;
        initialCoords[pIndex * 3 + 1] = pz;
        initialCoords[pIndex * 3 + 2] = dist;

        pIndex++;
      }
    }

    const waveGeometry = new THREE.BufferGeometry();
    waveGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Nền sáng dùng NormalBlending và hạt lớn hơn vì AdditiveBlending bị chìm trên nền trắng
    const waveMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(effectiveColor),
      size: isDark ? size : size * 1.35,
      map: particleTexture,
      transparent: true,
      opacity: isDark ? 0.88 : 0.95,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });

    const waveField = new THREE.Points(waveGeometry, waveMaterial);
    scene.add(waveField);

    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;

      targetCamera.x = normX * 60;
      targetCamera.y = baseCamY - normY * 70;
      targetCamera.rotX = -0.18 - normY * 0.12;
      targetCamera.rotY = -normX * 0.14;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    let time = 0;
    let entranceRadius = 0;
    const entranceSpeed = maxDist / 75;

    const animate = () => {
      time += 0.022;

      if (entranceRadius < maxDist + 200) {
        entranceRadius += entranceSpeed;
      }

      const posAttr = waveGeometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < numPoints; i++) {
        const px = initialCoords[i * 3];
        const pz = initialCoords[i * 3 + 1];
        const dist = initialCoords[i * 3 + 2];

        const entranceFactor = Math.min(
          1,
          Math.max(0, (entranceRadius - dist) / 140)
        );

        const domeCurve = -Math.pow(dist * 0.0028, 2) * 22;
        const ripple = Math.sin(dist * 0.018 - time * 1.8) * 12;
        const targetY = (domeCurve + ripple) * entranceFactor;

        arr[i * 3 + 1] = targetY;
      }
      posAttr.needsUpdate = true;

      camera.position.x += (targetCamera.x - camera.position.x) * 0.035;
      camera.position.y += (targetCamera.y - camera.position.y) * 0.035;
      camera.rotation.x += (targetCamera.rotX - camera.rotation.x) * 0.035;
      camera.rotation.y += (targetCamera.rotY - camera.rotation.y) * 0.035;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      waveGeometry.dispose();
      waveMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [effectiveBg, effectiveColor, isDark, size, spacing]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
    />
  );
}
