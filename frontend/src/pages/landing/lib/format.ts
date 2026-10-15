// Định dạng tiền riêng cho landing, để landing không phụ thuộc @/lib/format (chưa có trên main).

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

/** 1500000 → "1.500.000 ₫" */
export function formatVnd(amount: number): string {
  return vndFormatter.format(amount)
}
