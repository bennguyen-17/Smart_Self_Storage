import { useCallback, useEffect, useRef } from "react"

import personalStorageBoxesImg from "@/assets/landing/personal-storage-boxes.jpg"
import { USE_CASES_SECTION } from "../content/copy"
import { SectionHeading } from "./SectionHeading"

export function UseCasesSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const scrollPosRef = useRef(0)

  const baseCards = [
    {
      title: "Khám phá sơ đồ kho 2D, chọn vị trí ô kho ưng ý",
      src: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Mở cổng & kho 24/7 bằng bàn phím số mã PIN bảo mật",
      src: "https://images.unsplash.com/photo-1592933517664-ef7151097c5f?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Hành lang kho tự quản hiện đại, sạch sẽ & thông thoáng",
      src: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Khóa điện tử bảo mật cao, chủ động ra vào 24/7",
      src: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Hết mùa cất lại, bảo quản đồ cá nhân & thùng chuyển dọn",
      src: personalStorageBoxesImg,
    },
    {
      title: "Dọn nhà sửa tổ, gửi đồ nội thất gia đình liền tay",
      src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Lưu trữ hồ sơ, tài liệu doanh nghiệp bảo mật tuyệt đối",
      src: "https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Kho hàng kinh doanh & thương mại điện tử chuyên nghiệp",
      src: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
    },
  ]

  // Lặp 3 lần để cuộn vòng lặp liên tục không bị khựng ở 2 đầu
  const loopCards = [...baseCards, ...baseCards, ...baseCards]

  // Cập nhật góc xoay 3D và tỷ lệ từng thẻ theo khoảng cách tới tâm khung nhìn
  const updateCardCurves = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const containerCenter = container.scrollLeft + container.clientWidth / 2
    const stepDist = Math.max(container.clientWidth * 0.28, 250)

    cardRefs.current.forEach((el) => {
      if (!el) return
      const cardCenter = el.offsetLeft + el.offsetWidth / 2
      const dist = cardCenter - containerCenter
      const offset = dist / stepDist
      const absOffset = Math.abs(offset)
      const clampedAbs = Math.min(absOffset, 2.2)

      const scale = Math.max(0.72, 1.02 - clampedAbs * 0.16)
      const rotateY = Math.sign(offset) * Math.min(Math.abs(offset) * 20, 30)
      const opacity = Math.max(0.48, 1 - clampedAbs * 0.24)
      const zIndex = Math.round((3 - clampedAbs) * 10)

      el.style.transform = `perspective(1000px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      el.style.opacity = opacity.toFixed(3)
      el.style.zIndex = `${zIndex}`
    })
  }, [])

  // Đặt vị trí cuộn ban đầu vào đoạn giữa của 3 bản sao
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      const initialScroll = container.scrollWidth / 3
      container.scrollLeft = initialScroll
      scrollPosRef.current = initialScroll
      updateCardCurves()
    }
  }, [updateCardCurves])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationFrameId: number

    const step = () => {
      if (!isDragging.current && container) {
        // Cộng dồn vào ref số thực vì scrollLeft trên trình duyệt tự làm tròn thành số nguyên
        scrollPosRef.current += 0.65

        const oneThird = container.scrollWidth / 3
        if (scrollPosRef.current >= oneThird * 2) {
          scrollPosRef.current -= oneThird
        } else if (scrollPosRef.current <= 0) {
          scrollPosRef.current += oneThird
        }
        container.scrollLeft = scrollPosRef.current
      }
      updateCardCurves()
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [updateCardCurves])

  const handleStart = (pageX: number) => {
    const container = scrollRef.current
    if (!container) return
    isDragging.current = true
    startX.current = pageX - container.offsetLeft
    scrollLeftStart.current = container.scrollLeft
    scrollPosRef.current = container.scrollLeft
  }

  const handleMove = (pageX: number) => {
    if (!isDragging.current) return
    const container = scrollRef.current
    if (!container) return
    const x = pageX - container.offsetLeft
    const walk = (x - startX.current) * 1.4
    const nextScroll = scrollLeftStart.current - walk
    container.scrollLeft = nextScroll
    scrollPosRef.current = nextScroll
    updateCardCurves()
  }

  const handleEnd = () => {
    isDragging.current = false
    if (scrollRef.current) {
      scrollPosRef.current = scrollRef.current.scrollLeft
    }
  }

  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="use-cases-title"
          title={
            <span className="italic">
              <span className="block font-black text-foreground">Cần bao nhiêu chỗ,</span>
              <span className="block ml-7 sm:ml-12 md:ml-18 font-black l-gradient-title">
                có bấy nhiêu kho
              </span>
            </span>
          }
          lead={USE_CASES_SECTION.lead}
        />

        <div
          ref={scrollRef}
          onMouseLeave={handleEnd}
          onMouseDown={(e) => handleStart(e.pageX)}
          onMouseMove={(e) => handleMove(e.pageX)}
          onMouseUp={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].pageX)}
          onTouchMove={(e) => handleMove(e.touches[0].pageX)}
          onTouchEnd={handleEnd}
          onScroll={updateCardCurves}
          className="relative flex w-full select-none items-center gap-4 sm:gap-5 overflow-x-auto pt-8 pb-12 cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {loopCards.map((card, index) => (
            <div
              key={card.src + index}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              style={{
                willChange: "transform, opacity",
                transformOrigin: "center center",
              }}
              className="group relative h-[320px] w-[230px] shrink-0 sm:h-[355px] sm:w-[255px] md:h-[385px] md:w-[285px] overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-slate-100 text-left shadow-2xl transition-[box-shadow,border-color] duration-300 dark:border-slate-800 dark:bg-slate-900"
            >
              <img
                src={card.src}
                alt={card.title}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              <div className="relative z-10 flex h-full flex-col justify-end p-4.5 sm:p-5 pb-5">
                <h3 className="text-sm sm:text-base font-bold leading-snug text-white drop-shadow-md [text-wrap:balance]">
                  {card.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
