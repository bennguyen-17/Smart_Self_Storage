import { useCallback, useEffect, useRef } from "react"

import personalStorageBoxesImg from "@/assets/landing/personal-storage-boxes.jpg"
import qrScanStorageImg from "@/assets/landing/qr-scan-storage.jpg"
import { USE_CASES_SECTION } from "../content/copy"
import { SectionHeading } from "./SectionHeading"

export function UseCasesSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeftStart = useRef(0)
  const scrollPosRef = useRef(0)

  // Danh sách các thẻ kho bãi & công nghệ thông minh (Mã QR, Kho tự quản, Thùng đồ, Pallet...)
  const baseCards = [
    {
      title: "Khám phá sơ đồ kho 2D, chọn vị trí ô kho ưng ý",
      src: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Mở cửa kho tự động 24/7 bằng quét mã QR & mã PIN",
      src: qrScanStorageImg,
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

  // Nhân bản danh sách 3 lần để tạo hiệu ứng cuộn vô tận mượt mà tuyệt đối
  const loopCards = [...baseCards, ...baseCards, ...baseCards]

  // Tính toán phối cảnh 3 mặt cắt liền khối theo dạng bình phong vòm cong:
  // - Mặt cắt chính giữa: Ảnh nằm ngay ngắn 0 độ, to nhất, rõ nét nhất
  // - Mặt cắt bên phải: Xoay nghiêng dương (+Y) để mép ngoài lùi về sau, hướng vào tâm
  // - Mặt cắt bên trái: Xoay nghiêng âm (-Y) để mép ngoài lùi về sau, hướng vào tâm
  const updateCardCurves = useCallback(() => {
    const container = scrollRef.current
    if (!container) return

    const containerCenter = container.scrollLeft + container.clientWidth / 2
    // Khoảng cách chuẩn giữa các thẻ để tính chính xác tâm và 2 bên
    const stepDist = Math.max(container.clientWidth * 0.28, 280)

    cardRefs.current.forEach((el) => {
      if (!el) return
      const cardCenter = el.offsetLeft + el.offsetWidth / 2
      const dist = cardCenter - containerCenter
      const offset = dist / stepDist
      const absOffset = Math.abs(offset)
      const clampedAbs = Math.min(absOffset, 2.2)

      // Hệ số thu nhỏ tỉ lệ theo hình vòm: Tâm to nhất (1.02), hai bên nhỏ dần
      const scale = Math.max(0.72, 1.02 - clampedAbs * 0.16)
      // Góc xoay phối cảnh 3D cánh cung chuẩn xác:
      // Thẻ bên phải (offset > 0) xoay dương (+Y) để mép ngoài nghiêng lùi về sau
      // Thẻ bên trái (offset < 0) xoay âm (-Y) để mép ngoài nghiêng lùi về sau
      const rotateY = Math.sign(offset) * Math.min(Math.abs(offset) * 20, 30)
      // Độ trong suốt nhẹ nhàng tạo chiều sâu
      const opacity = Math.max(0.48, 1 - clampedAbs * 0.24)
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
      const initialScroll = container.scrollWidth / 3
      container.scrollLeft = initialScroll
      scrollPosRef.current = initialScroll
      updateCardCurves()
    }
  }, [updateCardCurves])

  // Tự động cuộn liên tục qua các ảnh với tốc độ êm ái dùng biến float accumulator (không dừng khi hover chuột)
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    let animationFrameId: number

    const step = () => {
      if (!isDragging.current && container) {
        // Cộng dồn vào biến float để tránh lỗi trình duyệt làm tròn số nguyên của scrollLeft
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

  // Kéo chuột hoặc chạm vuốt sang ngang (Drag / Swipe to scroll)
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

        {/* DÃY CUỘN 3D VÒM CONG 3 MẶT CẮT LIÊN KẾT (TỰ CUỘN LIÊN TỤC KHÔNG BỊ DỪNG KHI DÍ CHUỘT) */}
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
          className="relative flex w-full select-none items-center gap-4 sm:gap-6 overflow-x-auto pt-10 pb-16 cursor-grab active:cursor-grabbing [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
