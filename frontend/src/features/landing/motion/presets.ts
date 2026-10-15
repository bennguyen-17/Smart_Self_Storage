// Thông số chuyển động của landing. Chỉnh tốc độ/cường độ theo feedback ở đây.
import type { Transition, Variants } from "motion/react"

/** false = tắt toàn bộ hiệu ứng của landing (vẫn hiển thị đủ nội dung). */
export const MOTION_ENABLED = true

export const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

export const DURATION = { fast: 0.2, base: 0.4, slow: 0.6 } as const

export const STAGGER = 0.06

/** Điểm bắt đầu của hiệu ứng hiện khi cuộn tới. Không bắt đầu từ opacity 0 để nội dung luôn đọc được. */
export const REVEAL = { y: 16, fromOpacity: 0.4 } as const

/** Cho phép hiệu ứng kích hoạt mỗi khi lướt tới (không chỉ 1 lần) */
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

/** Hero: ảnh hé dần từ dưới lên bằng clip-path. */
export const clipReveal: Variants = {
  hidden: { clipPath: "inset(12% 0% 0% 0% round 28px)", scale: 1.04 },
  shown: {
    clipPath: "inset(0% 0% 0% 0% round 28px)",
    scale: 1,
    transition: { duration: 1, ease: EASE_OUT_QUART },
  },
}

/** Hero: tiêu đề → mô tả → CTA lần lượt xuất hiện khi tải trang. */
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
