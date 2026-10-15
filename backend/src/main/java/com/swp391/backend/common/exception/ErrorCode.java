package com.swp391.backend.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    // 400 BAD REQUEST
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "Yêu cầu không hợp lệ."),
    INVALID_PARAM(HttpStatus.BAD_REQUEST, "Tham số đầu vào không đúng định dạng."),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST, "Xác thực dữ liệu thất bại."),

    // 401 UNAUTHORIZED
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn."),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không chính xác."),

    // 403 FORBIDDEN
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập tài nguyên này."),

    // 404 NOT FOUND
    NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu yêu cầu."),
    ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."),
    UNIT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy ô kho."),
    CONTRACT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng."),
    RESERVATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy đơn đặt chỗ."),

    // 409 CONFLICT
    ALREADY_EXISTS(HttpStatus.CONFLICT, "Dữ liệu đã tồn tại trong hệ thống."),
    UNIT_OCCUPIED(HttpStatus.CONFLICT, "Ô kho đã có người thuê hoặc đang được giữ chỗ."),

    // 500 INTERNAL SERVER ERROR
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống nội bộ, vui lòng thử lại sau.");

    private final HttpStatus httpStatus;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
