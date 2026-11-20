// Cấu hình animation cho trang landing
import type { Transition, Variants } from "motion/react"

// Đổi thành false để tắt toàn bộ animation của landing
export const MOTION_ENABLED = true

export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

export const DURATION = { fast: 0.2, base: 0.4, slow: 0.6 } as const

export const STAGGER = 0.06

// Không bắt đầu từ opacity 0 để nội dung vẫn đọc được khi cuộn nhanh
export const REVEAL = { y: 16, fromOpacity: 0.4 } as const

export const VIEWPORT = { once: false, amount: 0.15 } as const

export const baseTransition: Transition = {
  duration: DURATION.base,
  ease: EASE_OUT_QUART,
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  shown: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION.slow, ease: EASE_OUT_QUART },
  },
}

export const staggerChildren: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: STAGGER } },
}

export const clipReveal: Variants = {
  hidden: { clipPath: "inset(12% 0% 0% 0% round 28px)", scale: 1.04 },
  shown: {
    clipPath: "inset(0% 0% 0% 0% round 28px)",
    scale: 1,
    transition: { duration: 1, ease: EASE_OUT_QUART },
  },
}

export const heroStagger: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
}

export const heroItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT_QUART },
  },
}
