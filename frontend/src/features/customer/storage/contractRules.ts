/**
 * Chỉ hợp đồng ACTIVE mới được gia hạn online.
 * - OVERDUE: phải đến quầy nộp phạt và gia hạn (US-20).
 * - Trạng thái khác (PENDING_CHECKIN, TERMINATED, FORFEITED, CANCELED, giá trị lạ): không gia hạn.
 * Whitelist: chỉ cho phép đúng ACTIVE, mọi trạng thái lạ đều bị chặn.
 * FE chặn để trải nghiệm tốt; BE vẫn phải chặn API /contracts/{id}/extend.
 */
export function canExtendOnline(status: string): boolean {
  return status === "ACTIVE"
}

/**
 * Cách gia hạn theo trạng thái hợp đồng (US-12, chốt với nhóm ngày 12/10):
 * - ONLINE: ACTIVE → nút Gia hạn bấm được.
 * - AT_COUNTER: OVERDUE → nút Gia hạn hiện nhưng bị khóa, kèm thông báo đến quầy gặp nhân viên.
 * - NONE: các trạng thái khác (TERMINATED, FORFEITED, CANCELED, PENDING_CHECKIN, giá trị lạ) → ẩn nút.
 */
export type ExtendMode = "ONLINE" | "AT_COUNTER" | "NONE"

export function extendModeOf(status: string): ExtendMode {
  if (canExtendOnline(status)) return "ONLINE"
  if (status === "OVERDUE") return "AT_COUNTER"
  return "NONE"
}

export const AT_COUNTER_NOTE = "Quá hạn: Vui lòng đến gặp nhân viên trực tiếp để thanh toán nợ"
