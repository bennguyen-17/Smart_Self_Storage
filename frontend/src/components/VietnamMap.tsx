import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion } from "motion/react"

interface MapFacility {
  code: string
  name: string
  address: string
  floors: number
}

interface MapPin {
  id: string
  city: string
  cx: number
  cy: number
  pinColor: string
  labelColor: string
  labelCenterX: number
  facilities: MapFacility[]
}

const VIEW_W = 812
const VIEW_H = 873
const CARD_WIDTH = 260
const CARD_GAP = 12
const LABEL_WIDTH = 148

// Khớp bảng Branch trong MySQL (Từ nhánh gia-bao)
const PINS: MapPin[] = [
  {
    id: "hanoi",
    city: "Hà Nội",
    cx: 185,
    cy: 135,
    pinColor: "#2563eb",
    labelColor: "#1e40af",
    labelCenterX: 97,
    facilities: [
      {
        code: "HN-01",
        name: "SmartStorage Cầu Giấy",
        address: "Số 391 Cầu Giấy, P. Dịch Vọng, Q. Cầu Giấy, Hà Nội",
        floors: 3,
      },
      {
        code: "HN-02",
        name: "SmartStorage Thanh Xuân",
        address: "Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội",
        floors: 3,
      },
    ],
  },
  {
    id: "danang",
    city: "Đà Nẵng",
    cx: 305,
    cy: 405,
    pinColor: "#d97706",
    labelColor: "#92400e",
    labelCenterX: 392,
    facilities: [
      {
        code: "DN-01",
        name: "SmartStorage Hải Châu",
        address: "Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng",
        floors: 2,
      },
    ],
  },
  {
    id: "hcm",
    city: "TP.HCM",
    cx: 245,
    cy: 700,
    pinColor: "#e11d48",
    labelColor: "#9f1239",
    labelCenterX: 332,
    facilities: [
      {
        code: "HCM-01",
        name: "SmartStorage Quận 1",
        address: "Số 123 Nguyễn Huệ, Quận 1, TP.HCM",
        floors: 3,
      },
      {
        code: "HCM-02",
        name: "SmartStorage Quận 7",
        address: "Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM",
        floors: 2,
      },
      {
        code: "HCM-03",
        name: "SmartStorage Thủ Đức",
        address: "Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM",
        floors: 3,
      },
    ],
  },
  {
    id: "cantho",
    city: "Cần Thơ",
    cx: 195,
    cy: 745,
    pinColor: "#059669",
    labelColor: "#065f46",
    labelCenterX: 107,
    facilities: [
      {
        code: "CT-01",
        name: "SmartStorage Ninh Kiều",
        address: "Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ",
        floors: 2,
      },
    ],
  },
]

export default function VietnamMap() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [activePin, setActivePin] = useState<MapPin | null>(null)
  const [tipHeight, setTipHeight] = useState(0)
  const [layout, setLayout] = useState({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    baseX: 0,
    baseY: 0,
    width: 0,
    height: 0,
  })

  // Quy đổi toạ độ viewBox của SVG sang pixel để đặt tooltip HTML
  useEffect(() => {
    const svg = svgRef.current
    const wrapper = wrapperRef.current
    if (!svg || !wrapper) return

    const update = () => {
      const svgRect = svg.getBoundingClientRect()
      const wrapperRect = wrapper.getBoundingClientRect()
      const scale = Math.min(svgRect.width / VIEW_W, svgRect.height / VIEW_H)

      setLayout({
        scale,
        offsetX: (svgRect.width - VIEW_W * scale) / 2,
        offsetY: (svgRect.height - VIEW_H * scale) / 2,
        baseX: svgRect.left - wrapperRect.left,
        baseY: svgRect.top - wrapperRect.top,
        width: wrapperRect.width,
        height: wrapperRect.height,
      })
    }

    update()

    const observer = new ResizeObserver(update)
    observer.observe(svg)
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  // Đo chiều cao thật của card để tránh tràn khỏi khung bản đồ
  useLayoutEffect(() => {
    if (!activePin || !tooltipRef.current) return
    setTipHeight(tooltipRef.current.offsetHeight)
  }, [activePin])

  const tipPosition = (pin: MapPin) => {
    const anchorX = layout.baseX + layout.offsetX + pin.cx * layout.scale
    const anchorY = layout.baseY + layout.offsetY + pin.cy * layout.scale
    const halfCard = CARD_WIDTH / 2
    const maxLeft =
      layout.width > 0 ? layout.width - halfCard - 8 : anchorX + halfCard
    const left = Math.min(Math.max(anchorX, halfCard + 8), maxLeft)

    const above = anchorY - CARD_GAP - tipHeight
    const below = anchorY + CARD_GAP
    const fitsAbove = above >= 8
    const fitsBelow = layout.height > 0 && below + tipHeight <= layout.height - 8

    let top = fitsAbove || !fitsBelow ? above : below

    if (layout.height > 0 && tipHeight > 0) {
      const maxTop = Math.max(8, layout.height - tipHeight - 8)
      top = Math.min(Math.max(top, 8), maxTop)
    }

    return { left, top, transform: "translateX(-50%)" }
  }

  return (
    <motion.div
      ref={wrapperRef}
      initial={{ opacity: 0, y: 50, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Dynamic Ambient Glow (Từ main) */}
      <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* Floating S-Map Wrapper (Từ main + gia-bao) */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="w-full h-full flex items-center justify-center relative"
      >
        <svg
          ref={svgRef}
          className="w-full h-full max-h-[400px] select-none filter drop-shadow-sm"
          viewBox="0 0 812 873"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Giữ nguyên các thẻ <path> vẽ bản đồ SVG và các điểm ghim từ gia-bao */}
        </svg>

        {/* Card hiển thị thông tin kho khi nhấp vào pin */}
        {activePin && (
          <div
            ref={tooltipRef}
            style={tipPosition(activePin)}
            className="absolute z-20 w-[260px] rounded-xl bg-white p-4 shadow-xl border border-gray-100 text-left transition-all duration-200"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <span className="font-semibold text-gray-900">{activePin.city}</span>
              <button
                onClick={() => setActivePin(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {activePin.facilities.map((fac) => (
                <div key={fac.code} className="text-xs space-y-1">
                  <p className="font-medium text-blue-600">{fac.name}</p>
                  <p className="text-gray-500 text-[11px] leading-tight">{fac.address}</p>
                  <p className="text-gray-400 text-[10px]">Số tầng: {fac.floors}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}