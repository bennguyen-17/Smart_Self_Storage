// Báo cáo cơ sở (US-33): chia số liệu thành các bảng và dựng nội dung file CSV. Hàm thuần, kiểm bằng DDT.

import type { ManagerDashboard } from "./types"

export type MetricKind = "count" | "money" | "percent"

export interface MetricRow {
  label: string
  value: number
  kind: MetricKind
  /** Dòng tổng / dòng chính của bảng */
  emphasis?: boolean
  /** Ghi chú ngắn cạnh nhãn */
  note?: string
}

export interface ReportSection {
  key: "units" | "contracts" | "revenue" | "deposits" | "tickets"
  title: string
  rows: MetricRow[]
}

/** Tỷ lệ phần trăm an toàn khi mẫu số bằng 0 */
export function percentOf(part: number, total: number): number {
  if (!total) return 0
  return Math.round((part / total) * 1000) / 10
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
        { label: "Bảo trì / vệ sinh", value: d.maintenanceUnits, kind: "count" },
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
        { label: "Đã thanh lý", value: d.terminatedContracts, kind: "count" },
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
        { label: "Đã hoàn tiền", value: -d.totalRefunds, kind: "money", note: "trừ ra" },
        { label: "Doanh thu thuần", value: d.netRevenue, kind: "money", emphasis: true },
      ],
    },
    {
      // Tách riêng theo AC: cọc đang giữ không phải doanh thu; cọc tịch thu và miễn/giảm là dòng riêng
      key: "deposits",
      title: "Tiền cọc & miễn giảm",
      rows: [
        { label: "Cọc đang giữ", value: d.depositHolding, kind: "money", note: "không tính vào doanh thu" },
        { label: "Cọc bị tịch thu", value: d.forfeitedDeposit, kind: "money" },
        { label: "Đã miễn / giảm phí", value: d.waivedAmount, kind: "money" },
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

/** Các dòng CSV: Nhóm, Chỉ số, Giá trị (số thô để Excel tính toán được) */
export function reportCsvRows(d: ManagerDashboard): (string | number)[][] {
  return buildReportSections(d).flatMap((s) => s.rows.map((r) => [s.title, r.label, r.value]))
}

// ---- Dữ liệu cho biểu đồ ----

export type UnitSegmentKey = "occupied" | "reserved" | "available" | "maintenance"

export interface UnitSegment {
  key: UnitSegmentKey
  label: string
  count: number
  /** % trên tổng số ô, làm tròn 1 chữ số; tổng các phần = 100 (dồn phần lẻ vào phần lớn nhất) */
  percent: number
}

/** Thứ tự cố định (màu đi theo trạng thái, không theo thứ hạng): đang thuê, đã đặt cọc, còn trống, bảo trì */
export function unitMix(d: ManagerDashboard): UnitSegment[] {
  const raw: Omit<UnitSegment, "percent">[] = [
    { key: "occupied", label: "Đang thuê", count: d.occupiedUnits },
    { key: "reserved", label: "Đã đặt cọc", count: d.reservedUnits },
    { key: "available", label: "Còn trống", count: d.availableUnits },
    { key: "maintenance", label: "Bảo trì / vệ sinh", count: d.maintenanceUnits },
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

/** Độ dài thanh (%) so với giá trị lớn nhất theo trị tuyệt đối; giá trị khác 0 luôn có tối thiểu 2% để còn nhìn thấy */
export function barWidths(values: readonly number[]): number[] {
  const max = Math.max(0, ...values.map(Math.abs))
  if (max === 0) return values.map(() => 0)
  return values.map((v) => (v === 0 ? 0 : Math.max(2, Math.round((Math.abs(v) / max) * 1000) / 10)))
}

export interface DonutArc {
  key: UnitSegmentKey
  /** Vị trí bắt đầu và độ dài cung, tính theo % chu vi (0–100), đã trừ khe hở giữa các lát */
  start: number
  length: number
}

/**
 * Cung cho biểu đồ vành khuyên: bỏ lát 0 ô; giữa các lát chừa khe `gap` (% chu vi) để tách màu.
 * Chỉ có 1 lát thì vẽ trọn vòng, không chừa khe.
 */
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
