/**
 * US-12 / BR-29: chỉ hợp đồng ACTIVE mới được gia hạn online.
 * - OVERDUE: phải đến quầy nộp phạt và gia hạn (US-20).
 * - Trạng thái khác (PENDING_CHECKIN, TERMINATED, FORFEITED, CANCELED, giá trị lạ): không gia hạn.
 * Whitelist: chỉ cho phép đúng ACTIVE, mọi trạng thái lạ đều bị chặn.
 * FE chặn để trải nghiệm tốt; BE vẫn phải chặn API /contracts/{id}/extend.
 */
export function canExtendOnline(status: string): boolean {
  return status === "ACTIVE"
}
