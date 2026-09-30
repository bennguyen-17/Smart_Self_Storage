"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface VantaDotsBackgroundProps {
    backgroundColor?: number;
    color?: number;
    color2?: number;
    size?: number;
    spacing?: number;
    showLines?: boolean;
    scale?: number;
    scaleMobile?: number;
}

export default function VantaDotsBackground({
    backgroundColor = 0x0f172a,
    color = 0x38bdf8,
    color2 = 0x818cf8,
    size = 3.2,
    spacing = 35.0,
    showLines = true,
    scale = 1.0,
    scaleMobile = 1.0,
}: VantaDotsBackgroundProps = {}) {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);

    useEffect(() => {
        let effect: any = null;

        const loadVanta = async () => {
            try {
                // @ts-ignore
                const vantaModule = await import("vanta/dist/vanta.dots.min");
                const DOTS = vantaModule.default || vantaModule;

                if (!vantaEffect && vantaRef.current) {
                    effect = DOTS({
                        el: vantaRef.current,
                        THREE: THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.0,
                        minWidth: 200.0,
                        scale,
                        scaleMobile,
                        backgroundColor,
                        color,
                        color2,
                        size,
                        spacing,
                        showLines,
                    });
                    setVantaEffect(effect);
                }
            } catch (err) {
                console.error("Vanta DOTS load error:", err);
            }
        };

        loadVanta();

        // Dọn dẹp bộ nhớ khi component bị unmount
        return () => {
            if (effect) effect.destroy();
        };
    }, [backgroundColor, color, color2, size, spacing, showLines, scale, scaleMobile]);

    return (
        <div
            ref={vantaRef}
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
