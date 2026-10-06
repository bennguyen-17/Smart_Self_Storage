package com.swp391.backend.dto.checkout;

import java.math.BigDecimal;

public class FeeDiscountRequest {
    private Integer discountPercent; // % miễn giảm (ví dụ 50, 100)
    private BigDecimal discountAmount; // Số tiền miễn giảm cụ thể (nếu nhập theo số tiền)
    private String reason; // Bắt buộc phải có lý do duyệt theo BR-48

    public FeeDiscountRequest() {
    }

    public Integer getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(Integer discountPercent) {
        this.discountPercent = discountPercent;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
