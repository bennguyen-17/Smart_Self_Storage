import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { useOutsideClick } from "@/hooks/use-outside-click"
import { cn } from "@/lib/utils"

export type CardType = {
  src: string
  title: string
  category: string
  content: ReactNode
}

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void
  currentIndex: number
}>({
  onCardClose: () => {},
  currentIndex: 0,
})

interface CarouselProps {
  items: ReactNode[]
  initialScroll?: number
}

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll
      checkScrollability()
    }
  }, [initialScroll])

  const checkScrollability = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 5)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -340, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 340, behavior: "smooth" })
    }
  }

  const handleCardClose = (index: number) => {
    if (carouselRef.current) {
      const isMobile = window.innerWidth < 768
      const cardWidth = isMobile ? 260 : 380
      const gap = isMobile ? 16 : 24
      const scrollPosition = (cardWidth + gap) * index
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      })
      setCurrentIndex(index)
    }
  }

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-auto overscroll-x-auto py-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className="flex flex-row justify-start gap-4 sm:gap-6 pb-2">
            {items.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: 0.08 * index,
                    ease: "easeOut",
                  },
                }}
                key={"card-wrap-" + index}
                className="flex-shrink-0"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Carousel Arrow Controls */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-card/90 shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Cuộn sang trái"
          >
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            className="relative z-40 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-card/90 shadow-sm backdrop-blur-md transition-all hover:bg-muted hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer"
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Cuộn sang phải"
          >
            <ArrowRight className="h-4 w-4 text-foreground" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  )
}

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: CardType
  index: number
  layout?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { onCardClose } = useContext(CarouselContext)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose()
      }
    }

    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = "auto"
    }
  }, [open])

  useOutsideClick(containerRef, () => handleClose())

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    onCardClose(index)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              ref={containerRef}
              className="relative z-[60] my-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8 md:p-10"
            >
              {/* Close Button */}
              <button
                className="sticky top-0 float-right -mt-2 -mr-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-md transition hover:bg-slate-200 hover:scale-105 cursor-pointer dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={handleClose}
                aria-label="Đóng chi tiết"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="clear-both">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1 text-xs sm:text-sm font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                  {card.category}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
                  {card.title}
                </h3>
              </div>

              <div className="mt-6">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="group relative flex h-96 w-[260px] sm:h-[440px] sm:w-[290px] md:h-[480px] md:w-[310px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-100 text-left shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl cursor-pointer dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Background Image with Zoom on Hover */}
        <img
          src={card.src}
          alt={card.title}
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Ambient Dark Gradient for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 pointer-events-none" />

        {/* Top Tag */}
        <div className="relative z-10 p-5 sm:p-6">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-sm">
            {card.category}
          </span>
        </div>

        {/* Bottom Title & Learn More Hint */}
        <div className="relative z-10 p-5 sm:p-6">
          <h3 className="text-xl sm:text-2xl font-bold leading-snug text-white drop-shadow-md [text-wrap:balance]">
            {card.title}
          </h3>

          <div className="mt-3 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-sky-300 transition group-hover:translate-x-1">
            <span>Chạm để xem chi tiết</span>
            <ArrowRight className="size-4" />
          </div>
        </div>
      </motion.button>
    </>
  )
}
