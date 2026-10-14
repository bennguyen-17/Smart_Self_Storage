import type { ReactNode } from "react"
import { motion } from "motion/react"

import {
  MOTION_ENABLED,
  VIEWPORT,
  fadeUp,
  staggerChildren,
} from "../motion/presets"

interface RevealProps {
  children: ReactNode
  className?: string
}

/** Một khối hiện nhẹ khi cuộn tới. Dùng cho khối nội dung chính, không bọc cả section. */
export function Reveal({ children, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial={MOTION_ENABLED ? "hidden" : false}
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

/** Danh sách có các phần tử hiện lần lượt (stagger). Dùng cùng RevealItem. */
export function RevealList({ children, className }: RevealProps) {
  return (
    <motion.ul
      className={className}
      variants={staggerChildren}
      initial={MOTION_ENABLED ? "hidden" : false}
      whileInView="shown"
      viewport={VIEWPORT}
    >
      {children}
    </motion.ul>
  )
}

export function RevealItem({ children, className }: RevealProps) {
  return (
    <motion.li className={className} variants={fadeUp}>
      {children}
    </motion.li>
  )
}
