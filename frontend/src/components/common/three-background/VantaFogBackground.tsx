"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export default function VantaFogBackground() {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<any>(null);

    useEffect(() => {
        let effect: any = null;

        const loadVanta = async () => {
            try {
                // Import dynamic vanta.fog trên client
                // @ts-ignore
                const vantaModule = await import("vanta/dist/vanta.fog.min");
                const FOG = vantaModule.default || vantaModule;

                if (!vantaEffect && vantaRef.current) {
                    effect = FOG({
                        el: vantaRef.current,
                        THREE: THREE,
                        mouseControls: true,
                        touchControls: true,
                        gyroControls: false,
                        minHeight: 200.0,
                        minWidth: 200.0,
                        // Tùy chỉnh màu sắc theo bảng màu bạn chọn
                        highlightColor: 0xffc300,
                        midtoneColor: 0xff1f00,
                        lowlightColor: 0x2d00ff,
                        baseColor: 0xffebeb,
                        blurFactor: 0.6,
                        zoom: 1.0,
                        speed: 1.0,
                    });
                    setVantaEffect(effect);
                }
            } catch (err) {
                console.error("Vanta load error:", err);
            }
        };

        loadVanta();

        // Dọn dẹp bộ nhớ khi component bị unmount
        return () => {
            if (effect) effect.destroy();
        };
    }, []);

    return (
        <div
            ref={vantaRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: -1,
            }}
        />
    );
}
