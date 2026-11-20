import type { ManagerDashboard } from "./types"

export type MetricKind = "count" | "money" | "percent"

export interface MetricRow {
  label: string
  value: number
  kind: MetricKind
  emphasis?: boolean
  note?: string
}

export interface ReportSection {
  key: "units" | "contracts" | "revenue" | "deposits" | "tickets"
  title: string
  rows: MetricRow[]
}

export function percentOf(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
}

// Không trừ tiền hoàn cọc vì cọc không tính vào doanh thu (không dùng netRevenue từ BE)
export function revenueTotal(d: Pick<ManagerDashboard, "rentalRevenue" | "extensionRevenue" | "penaltyRevenue" | "compensationRevenue">): number {
  return d.rentalRevenue + d.extensionRevenue + d.penaltyRevenue + d.compensationRevenue
}

export function buildReportSections(d: ManagerDashboard): ReportSection[] {
  return [
    {
      key: "units",
      title: "Ô kho",
      rows: [
        { label: "Tổng số ô", value: d.totalUnits, kind: "count", emphasis: true },
        { label: "Còn trống", value: d.availableUnits, kind: "count" },
        { label: "Đang thuê", value: d.occupiedUnits, kind: "count" },
        { label: "Đã đặt cọc", value: d.reservedUnits, kind: "count" },
        { label: "Bảo trì", value: d.maintenanceUnits, kind: "count" },
        { label: "Tỷ lệ lấp đầy", value: d.occupancyRate, kind: "percent", emphasis: true },
      ],
    },
    {
      key: "contracts",
      title: "Hợp đồng",
      rows: [
        { label: "Đang hiệu lực", value: d.activeContracts, kind: "count" },
        { label: "Chờ nhận kho", value: d.pendingCheckinContracts, kind: "count" },
        { label: "Quá hạn", value: d.overdueContracts, kind: "count", emphasis: d.overdueContracts > 0 },
        { label: "Đã trả kho / hoàn tất", value: d.terminatedContracts, kind: "count" },
      ],
    },
    {
      key: "revenue",
      title: "Doanh thu",
      rows: [
        { label: "Tiền thuê", value: d.rentalRevenue, kind: "money" },
        { label: "Gia hạn", value: d.extensionRevenue, kind: "money" },
        { label: "Phạt trễ hạn", value: d.penaltyRevenue, kind: "money" },
        { label: "Truy thu đền bù", value: d.compensationRevenue, kind: "money" },
        { label: "Tổng doanh thu", value: revenueTotal(d), kind: "money", emphasis: true },
      ],
    },
    {
      // Tiền cọc và hoàn cọc tách riêng, không tính vào doanh thu
      key: "deposits",
      title: "Tiền cọc",
      rows: [
        { label: "Cọc đang giữ", value: d.depositHolding, kind: "money", note: "không tính vào doanh thu" },
        { label: "Đã hoàn cọc cho khách", value: d.totalRefunds, kind: "money" },
        { label: "Cọc bị tịch thu", value: d.forfeitedDeposit, kind: "money" },
      ],
    },
    {
      key: "tickets",
      title: "Yêu cầu hỗ trợ & SLA",
      rows: [
        { label: "Tổng yêu cầu", value: d.totalTickets, kind: "count" },
        { label: "Mới gửi", value: d.submittedTickets, kind: "count" },
        { label: "Đang xử lý", value: d.inProgressTickets, kind: "count" },
        { label: "Đã xử lý", value: d.resolvedTickets, kind: "count" },
        { label: "Trễ SLA", value: d.slaBreachedTickets, kind: "count", emphasis: d.slaBreachedTickets > 0 },
        { label: "Tỷ lệ đúng SLA", value: 100 - percentOf(d.slaBreachedTickets, d.totalTickets), kind: "percent" },
      ],
    },
  ]
}

// Xuất số thô để Excel tính toán được
export function reportCsvRows(d: ManagerDashboard, range: ReportRange = ALL_TIME): (string | number)[][] {
  return [
    ["Phạm vi", "Khoảng thời gian", rangeLabel(range)],
    ...buildReportSections(d).flatMap((s) => s.rows.map((r) => [s.title, r.label, r.value])),
  ]
}

// Khoảng lọc YYYY-MM-DD (gồm cả 2 đầu), chuỗi rỗng là không giới hạn
export interface ReportRange {
  from: string
  to: string
}

export const ALL_TIME: ReportRange = { from: "", to: "" }

export type RangePreset = "ALL" | "THIS_MONTH" | "LAST_MONTH" | "LAST_30_DAYS" | "CUSTOM"

export const RANGE_PRESET_LABEL: Record<RangePreset, string> = {
  ALL: "Từ trước đến nay",
  THIS_MONTH: "Tháng này",
  LAST_MONTH: "Tháng trước",
  LAST_30_DAYS: "30 ngày qua",
  CUSTOM: "Tùy chọn",
}

// today theo YYYY-MM-DD; CUSTOM trả null để giữ nguyên khoảng đang chọn
export function presetRange(preset: RangePreset, today: string): ReportRange | null {
  const [y, m] = today.split("-").map(Number)
  const firstOf = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`
  const lastOf = (year: number, month: number) => {
    const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`
  }
  if (preset === "ALL") return ALL_TIME
  if (preset === "THIS_MONTH") return { from: firstOf(y, m), to: today }
  if (preset === "LAST_MONTH") {
    const year = m === 1 ? y - 1 : y
    const month = m === 1 ? 12 : m - 1
    return { from: firstOf(year, month), to: lastOf(year, month) }
  }
  if (preset === "LAST_30_DAYS") {
    const from = new Date(Date.parse(`${today}T00:00:00Z`) - 29 * 86_400_000).toISOString().slice(0, 10)
    return { from, to: today }
  }
  return null
}

export function isReportRangeValid(range: ReportRange): boolean {
  return !range.from || !range.to || range.from <= range.to
}

const dmy = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

export function rangeLabel(range: ReportRange): string {
  if (range.from && range.to) return `Từ ${dmy(range.from)} đến ${dmy(range.to)}`
  if (range.from) return `Từ ${dmy(range.from)}`
  if (range.to) return `Đến ${dmy(range.to)}`
  return RANGE_PRESET_LABEL.ALL
}

export type UnitSegmentKey = "occupied" | "reserved" | "available" | "maintenance"

export interface UnitSegment {
  key: UnitSegmentKey
  label: string
  count: number
  // Tổng các phần luôn bằng 100 (dồn phần lẻ vào nhóm lớn nhất)
  percent: number
}

// Giữ thứ tự cố định theo trạng thái để màu biểu đồ không đổi
export function unitMix(d: ManagerDashboard): UnitSegment[] {
  const raw: Omit<UnitSegment, "percent">[] = [
    { key: "occupied", label: "Đang thuê", count: d.occupiedUnits },
    { key: "reserved", label: "Đã đặt cọc", count: d.reservedUnits },
    { key: "available", label: "Còn trống", count: d.availableUnits },
    { key: "maintenance", label: "Bảo trì", count: d.maintenanceUnits },
  ]
  const total = raw.reduce((s, r) => s + r.count, 0)
  if (total === 0) return raw.map((r) => ({ ...r, percent: 0 }))
  const segments = raw.map((r) => ({ ...r, percent: Math.round((r.count / total) * 1000) / 10 }))
  const drift = Math.round((100 - segments.reduce((s, r) => s + r.percent, 0)) * 10) / 10
  if (drift !== 0) {
    const biggest = segments.reduce((a, b) => (b.count > a.count ? b : a))
    biggest.percent = Math.round((biggest.percent + drift) * 10) / 10
  }
  return segments
}

// Giá trị khác 0 tối thiểu 2% để thanh vẫn nhìn thấy được
export function barWidths(values: readonly number[]): number[] {
  const max = Math.max(0, ...values.map(Math.abs))
  if (max === 0) return values.map(() => 0)
  return values.map((v) => (v === 0 ? 0 : Math.max(2, Math.round((Math.abs(v) / max) * 1000) / 10)))
}

export interface DonutArc {
  key: UnitSegmentKey
  // Tính theo % chu vi (0-100), đã trừ khe hở giữa các lát
  start: number
  length: number
}

// Chừa khe giữa các lát; chỉ có 1 lát thì vẽ trọn vòng
export function donutArcs(segments: readonly UnitSegment[], gap = 1): DonutArc[] {
  const visible = segments.filter((s) => s.percent > 0)
  if (visible.length === 1) return [{ key: visible[0].key, start: 0, length: 100 }]
  let cursor = 0
  return visible.map((s) => {
    const arc = { key: s.key, start: cursor, length: Math.max(0.5, Math.round((s.percent - gap) * 100) / 100) }
    cursor = Math.round((cursor + s.percent) * 100) / 100
    return arc
  })
}
