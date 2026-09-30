import { useCallback, useEffect, useRef, useState } from "react"

import {
  USE_CASES,
  USE_CASES_SECTION,
  type EstimatorPresetId,
} from "../content/copy"
import { SectionHeading } from "./SectionHeading"

interface UseCasesSectionProps {
  onTry?: (presetId: EstimatorPresetId) => void
}

export function UseCasesSection({ onTry: _onTry }: UseCasesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)

  // Danh sách các thẻ kho bãi & công nghệ thông minh (Mã QR, Kho tự quản, Thùng đồ, Pallet...)
  const baseCards = [
    {
      title: "Khám phá sơ đồ kho 2D, chọn vị trí ô kho ưng ý",
      src: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Mở cửa kho tự động 24/7 bằng quét mã QR & mã PIN",
      src: "/images/qr-scan-storage.jpg",
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
      src: "/images/personal-storage-boxes.jpg",
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

  // Nhân bản danh sách 3 lần để tạo hiệu ứng cuộn vô tận mượt mà tuyệt đối
  const loopCards = [...baseCards, ...baseCards, ...baseCards]

  // Tính toán phối cảnh vòm cong 3D chuẩn xác theo đúng sơ đồ đối xứng:
  // - Thẻ giữa (Green): To nhất, thẳng đứng trực diện 0 độ, đỉnh và đáy cao/thấp nhất
  // - Thẻ bên trong (Blue): Nhỏ hơn, xoay nghiêng vòm cánh cung, cạnh giáp tâm cao hơn cạnh ngoài
  // - Thẻ bên ngoài (Pink): Nhỏ nhất, góc nghiêng sâu hơn, cạnh giáp tâm cao hơn cạnh ngoài
  const updateCardCurves = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const containerCenter = container.scrollLeft + container.clientWidth / 2
    // Khoảng cách chuẩn giữa các thẻ để tính chính xác tâm, cạnh 1 (blue) và cạnh 2 (pink)
    const stepDist = Math.max(container.clientWidth * 0.32, 280)

    cardRefs.current.forEach((el) => {
      if (!el) return
      const cardCenter = el.offsetLeft + el.offsetWidth / 2
      const dist = cardCenter - containerCenter
      const offset = dist / stepDist
      const absOffset = Math.abs(offset)
      const clampedAbs = Math.min(absOffset, 2.2)

      // Hệ số thu nhỏ tỉ lệ theo hình vòm elip (Tâm to, hai bên nhỏ dần)
      const scale = Math.max(0.62, 1.05 - clampedAbs * 0.22)
      // Góc xoay phối cảnh 3D cánh cung: thẻ bên trái xoay dương (+Y), thẻ bên phải xoay âm (-Y)
      const rotateY = -Math.sign(offset) * Math.min(Math.abs(offset) * 23, 34)
      // Độ trong suốt nhẹ nhàng tạo chiều sâu
      const opacity = Math.max(0.45, 1 - clampedAbs * 0.26)
      // Thứ tự zIndex: Thẻ giữa luôn nổi trên các thẻ bên cạnh
      const zIndex = Math.round((3 - clampedAbs) * 10)

      el.style.transform = `perspective(1000px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`
      el.style.opacity = opacity.toFixed(3)
      el.style.zIndex = `${zIndex}`
    })
  }, [])

  // Khởi tạo vị trí cuộn ban đầu ở giữa danh sách
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollLeft = container.scrollWidth / 3
      updateCardCurves()
    }
  }, [updateCardCurves])

  // Tự động cuộn liên tục qua các ảnh với tốc độ êm ái
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationFrameId: number

    const step = () => {
      if (!isHovered && !isDragging.current && container) {
        container.scrollLeft += 0.38 // Tốc độ trôi êm ái, liên tục

        const oneThird = container.scrollWidth / 3
        if (container.scrollLeft >= oneThird * 2) {
          container.scrollLeft -= oneThird
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += oneThird
        }
      }
      updateCardCurves()
      animationFrameId = requestAnimationFrame(step)
    }

    animationFrameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationFrameId)
  }, [isHovered, updateCardCurves])

  // Kéo chuột sang ngang (Drag-to-scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollRef.current
    if (!container) return
    isDragging.current = true
    startX.current = e.pageX - container.offsetLeft
    scrollLeftStart.current = container.scrollLeft
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
    const container = scrollRef.current
    if (!container) return
    const x = e.pageX - container.offsetLeft
    const walk = (x - startX.current) * 1.5
    container.scrollLeft = scrollLeftStart.current - walk
    updateCardCurves()
  }

  const handleMouseUpOrLeave = () => {
    isDragging.current = false
  }

  return (
    <section
      id="use-cases"
      aria-labelledby="use-cases-title"
      className="relative overflow-hidden py-(--l-section-space)"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        {/* TIÊU ĐỀ SECTION */}
        <SectionHeading
          id="use-cases-title"
          title={
            <span className="italic">
              <span className="block font-black text-foreground">Cần bao nhiêu chỗ,</span>
              <span className="block ml-8 sm:ml-14 md:ml-20 font-black l-gradient-title">
                có bấy nhiêu kho
              </span>
            </span>
          }
          lead={USE_CASES_SECTION.lead}
        />

        {/* DÃY CUỘN 3D VÒM CONG ĐỐI XỨNG THEO BẢN VẼ */}
        <div
          ref={scrollRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false)
            handleMouseUpOrLeave()
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onScroll={updateCardCurves}
          className="relative flex w-full select-none items-center gap-4 sm:gap-6 overflow-x-auto pt-10 pb-16 cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [perspective:1200px]"
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
              className="group relative h-[360px] w-[260px] shrink-0 sm:h-[400px] sm:w-[290px] md:h-[440px] md:w-[320px] overflow-hidden rounded-[2.25rem] border border-slate-200/80 bg-slate-100 text-left shadow-2xl transition-[box-shadow,border-color] duration-300 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Background Image with Zoom on Hover */}
              <img
                src={card.src}
                alt={card.title}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
              />

              {/* Ambient Dark Gradient for Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

              {/* Bottom Title */}
              <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-6 pb-6">
                <h3 className="text-base sm:text-lg font-bold leading-snug text-white drop-shadow-md [text-wrap:balance]">
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


