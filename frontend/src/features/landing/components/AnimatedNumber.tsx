import { useEffect } from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react"

import { DURATION, EASE_OUT_QUART, MOTION_ENABLED } from "../motion/presets"

interface AnimatedNumberProps {
  value: number
  format: (n: number) => string
  className?: string
}

/** Số chuyển mượt tới giá trị mới (tween 400ms); reduced motion thì đổi ngay. */
export function AnimatedNumber({
  value,
  format,
  className,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion()
  const mv = useMotionValue(value)
  const text = useTransform(mv, (n) => format(n))

  useEffect(() => {
    if (reduce || !MOTION_ENABLED) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: DURATION.base,
      ease: EASE_OUT_QUART,
    })
    return () => controls.stop()
  }, [value, reduce, mv])

  // Số đang chạy đổi chữ ở mỗi khung hình: ẩn khỏi trình đọc màn hình,
  // chỉ để giá trị cuối cho vùng aria-live đọc một lần.
  return (
    <>
      <motion.span className={className} aria-hidden>
        {text}
      </motion.span>
      <span className="sr-only">{format(value)}</span>
    </>
  )
}
