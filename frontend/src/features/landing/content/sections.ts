// Thứ tự và bật/tắt section của landing. Đổi thứ tự mảng để đổi thứ tự trên trang;
// enabled: false để ẩn section (tự ẩn luôn link trên nav).

export type SectionId =
  | "use-cases"
  | "estimator"
  | "pricing"
  | "facilities"
  | "process"
  | "testimonials"
  | "faq"
  | "final-cta"

export interface SectionConfig {
  id: SectionId
  /** Nhãn trên thanh điều hướng; bỏ trống = không hiện trên nav. */
  navLabel?: string
  enabled: boolean
}

export const SECTIONS: readonly SectionConfig[] = [
  { id: "use-cases", enabled: true },
  { id: "estimator", navLabel: "Tính cỡ kho", enabled: true },
  { id: "pricing", navLabel: "Bảng giá", enabled: true },
  { id: "facilities", navLabel: "Cơ sở", enabled: true },
  { id: "process", navLabel: "Cách thuê", enabled: true },
  { id: "testimonials", enabled: false },
  { id: "faq", navLabel: "Hỏi đáp", enabled: true },
  { id: "final-cta", enabled: true },
]

export const enabledSections = SECTIONS.filter((s) => s.enabled)
export const navSections = enabledSections.filter((s) => s.navLabel)

export const isSectionEnabled = (id: SectionId) =>
  enabledSections.some((s) => s.id === id)
