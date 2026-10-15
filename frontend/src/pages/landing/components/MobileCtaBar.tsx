import { useState } from "react"
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react"

import { CTA, ROUTES } from "../content/site"
import { DURATION, EASE_OUT_QUART } from "../motion/presets"
import { LandingLink } from "./LandingButton"

/** Thanh CTA dính dưới đáy, chỉ hiện dưới md và sau khi đã cuộn qua hero. */
export function MobileCtaBar() {
  const [visible, setVisible] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (y) =>
    setVisible(y > window.innerHeight * 0.6)
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mobile-cta"
          className="fixed inset-x-0 bottom-0 z-(--l-z-mobile-bar) border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: DURATION.base, ease: EASE_OUT_QUART }}
        >
          <LandingLink to={ROUTES.book} size="md" className="w-full justify-center shadow-lg shadow-blue-500/25">
            {CTA.book}
          </LandingLink>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
