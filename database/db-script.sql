-- ============================================================================
-- DATABASE SCRIPT: SMART STORAGE SYSTEM (BẢN MASTER HOÀN CHỈNH TOÀN HỆ THỐNG)
-- PROJECT: SWP391 - FALL 2026
-- SYSTEM: Smart Self-Storage Management System
-- DIALECT: MySQL 8.0+ / MariaDB 10.4+
-- ENCODING: UTF-8 (utf8mb4_unicode_ci)
-- ============================================================================

DROP DATABASE IF EXISTS smart_storage;
CREATE DATABASE smart_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_storage;

-- Đảm bảo kết nối dùng chuẩn UTF-8 toàn vẹn tiếng Việt
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Tắt kiểm tra khóa ngoại để khởi tạo sạch sẽ không bị xung đột thứ tự
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TABLE: Role (Phân quyền người dùng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Role;
CREATE TABLE Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(50) NOT NULL UNIQUE,
    roleTitle VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLE: Facility (Cơ sở lưu trữ chuỗi toàn quốc)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Facility;
CREATE TABLE Facility (
    facilityId INT AUTO_INCREMENT PRIMARY KEY,
    facilityName VARCHAR(100) NOT NULL,
    facilityCode VARCHAR(20) NOT NULL UNIQUE,
    layoutType VARCHAR(10) NOT NULL DEFAULT 'A',
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLE: Account (Tài khoản người dùng - Đăng nhập bằng SĐT)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Account;
CREATE TABLE Account (
    accountId INT AUTO_INCREMENT PRIMARY KEY,
    roleId INT NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    fullName VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('UNVERIFIED', 'ACTIVE', 'SUSPENDED', 'CLOSED') NOT NULL DEFAULT 'UNVERIFIED',
    otpCode VARCHAR(10) NULL,
    otpExpiryTime DATETIME NULL,
    failedAttempts INT NOT NULL DEFAULT 0,
    firstFailedAt DATETIME NULL,
    lockUntil DATETIME NULL,
    mustChangePassword BOOLEAN NOT NULL DEFAULT FALSE,
    deletionScheduledAt DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_role FOREIGN KEY (roleId) REFERENCES Role (roleId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLE: CustomerProfile (Hồ sơ khách hàng gắn CCCD / Mã số thuế)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS CustomerProfile;
CREATE TABLE CustomerProfile (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    identityNumber VARCHAR(20) NOT NULL UNIQUE,
    bankName VARCHAR(100) NULL,
    bankAccountNumber VARCHAR(50) NULL,
    bankAccountName VARCHAR(100) NULL,
    CONSTRAINT fk_customer_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLE: EmployeeProfile (Hồ sơ nhân viên / Quản lý gắn với cơ sở)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS EmployeeProfile;
CREATE TABLE EmployeeProfile (
    employeeId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    facilityId INT NOT NULL,
    CONSTRAINT fk_employee_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_employee_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABLE: ActivityLog (Nhật ký hành động hệ thống)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS ActivityLog;
CREATE TABLE ActivityLog (
    activityLogId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    facilityId INT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    INDEX idx_activity_facility_created (facilityId, createdAt),
    CONSTRAINT fk_activity_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_activity_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABLE: AuditLog (Nhật ký quẹt mã PIN ra vào cổng cơ sở IoT 24/7)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS AuditLog;
CREATE TABLE AuditLog (
    auditLogId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    facilityId INT NULL,
    customerId INT NULL,
    action VARCHAR(100) NOT NULL,
    openedAt DATETIME NULL,
    reason VARCHAR(500) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLE: Floor (Tầng của cơ sở lưu trữ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Floor;
CREATE TABLE Floor (
    floorId INT AUTO_INCREMENT PRIMARY KEY,
    facilityId INT NOT NULL,
    floorName VARCHAR(50) NOT NULL,
    maxLoadPerM2 DECIMAL(10, 2),
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_floor_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABLE: UnitType (Quy chuẩn kích thước & điều kiện bảo quản kho)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS UnitType;
CREATE TABLE UnitType (
    unitTypeId INT AUTO_INCREMENT PRIMARY KEY,
    typeName VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,
    storageCondition ENUM('NORMAL', 'CLIMATE_CONTROLLED') NOT NULL DEFAULT 'NORMAL',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. TABLE: StorageUnit (Ngăn kho / Buồng kho thực tế)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS StorageUnit;
CREATE TABLE StorageUnit (
    unitCode VARCHAR(50) PRIMARY KEY,
    floorId INT NOT NULL,
    unitTypeId INT NOT NULL,
    status ENUM('AVAILABLE', 'HOLD', 'RESERVED', 'RENTED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_unit_floor FOREIGN KEY (floorId) REFERENCES Floor (floorId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_unit_type FOREIGN KEY (unitTypeId) REFERENCES UnitType (unitTypeId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. TABLE: Price (Bảng giá thuê & Mức cọc tiêu chuẩn)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Price;
CREATE TABLE Price (
    priceId INT AUTO_INCREMENT PRIMARY KEY,
    unitTypeId INT NOT NULL,
    dailyPrice DECIMAL(12, 2) NOT NULL,
    monthlyPrice DECIMAL(12, 2) NOT NULL,
    depositAmount DECIMAL(12, 2) NOT NULL,
    climateSurchargePercent DECIMAL(5, 2) DEFAULT 0.00,
    effectiveFrom DATE NOT NULL,
    effectiveTo DATE,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_price_unittype FOREIGN KEY (unitTypeId) REFERENCES UnitType (unitTypeId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. TABLE: FeeItem (Danh mục biểu phí phạt, ưu đãi & bồi thường hư hỏng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS FeePolicy;
DROP TABLE IF EXISTS FeeItem;
CREATE TABLE FeeItem (
    feeItemId INT AUTO_INCREMENT PRIMARY KEY,
    feeCode VARCHAR(50) NOT NULL UNIQUE,
    feeName VARCHAR(150) NOT NULL,
    category ENUM('PENALTY', 'DISCOUNT', 'DAMAGE', 'SURCHARGE') NOT NULL DEFAULT 'PENALTY',
    calcType ENUM('PERCENT', 'FIXED') NOT NULL DEFAULT 'FIXED',
    feeValue DECIMAL(12, 2) NOT NULL,
    unitBasis VARCHAR(50) NOT NULL DEFAULT 'TOTAL_BILL',
    description VARCHAR(255) NULL,
    isWaiveDeposit BOOLEAN DEFAULT FALSE,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 13. TABLE: Shift (Ca trực vận hành)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Shift;
CREATE TABLE Shift (
    shiftId INT AUTO_INCREMENT PRIMARY KEY,
    shiftName VARCHAR(50) NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Shift (shiftId, shiftName, startTime, endTime, status) VALUES
(1, 'Ca Sáng', '07:00:00', '12:00:00', 'ACTIVE'),
(2, 'Ca Chiều', '12:00:00', '16:00:00', 'ACTIVE'),
(3, 'Ca Tối', '16:00:00', '20:00:00', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 14. TABLE: StaffShift (Phân công ca trực nhân viên tại cơ sở)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS StaffShift;
CREATE TABLE StaffShift (
    staffShiftId INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT NOT NULL,
    facilityId INT NOT NULL,
    shiftId INT NOT NULL,
    workDate DATE NOT NULL,
    status ENUM('SCHEDULED', 'ATTENDED', 'COMPLETED', 'ABSENT', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT fk_staffshift_employee FOREIGN KEY (employeeId) REFERENCES EmployeeProfile (employeeId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_staffshift_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON UPDATE CASCADE,
    CONSTRAINT fk_staffshift_shift FOREIGN KEY (shiftId) REFERENCES Shift (shiftId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. TABLE: Reservation (Đơn giữ chỗ / Đặt trước kho)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Reservation;
CREATE TABLE Reservation (
    reservationId INT AUTO_INCREMENT PRIMARY KEY,
    reservationCode VARCHAR(50) NOT NULL UNIQUE,
    accountId INT NOT NULL,
    unitCode VARCHAR(50) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    rentalType ENUM('DAILY', 'MONTHLY') NOT NULL,
    rentalAmount DECIMAL(12, 2) NOT NULL,
    depositAmount DECIMAL(12, 2) NOT NULL,
    penaltyAmount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    holdExpiresAt DATETIME,
    CONSTRAINT fk_reservation_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON UPDATE CASCADE,
    CONSTRAINT fk_reservation_unit FOREIGN KEY (unitCode) REFERENCES StorageUnit (unitCode) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. TABLE: Contract (Hợp đồng thuê kho - Chu trình 7 trạng thái)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Contract;
CREATE TABLE Contract (
    contractId INT AUTO_INCREMENT PRIMARY KEY,
    reservationId INT NOT NULL UNIQUE,
    activatedAt DATETIME,
    terminatedAt DATETIME,
    status ENUM('INITIATED', 'PENDING_CHECKIN', 'ACTIVE', 'OVERDUE', 'TERMINATED', 'COMPLETED', 'FORFEITED', 'CANCELLED') NOT NULL DEFAULT 'INITIATED',
    forfeitProcessed BOOLEAN NOT NULL DEFAULT FALSE,
    cancelReason VARCHAR(255),
    refundBankName VARCHAR(100),
    refundAccountNumber VARCHAR(50),
    refundAccountName VARCHAR(100),
    signedFullName VARCHAR(100),
    signedIdentityNumber VARCHAR(50),
    signedPhone VARCHAR(20),
    signedEmail VARCHAR(255),
    contractPdfUrl VARCHAR(255),
    dailyOverdueFee DECIMAL(12, 2) DEFAULT 50000.00,
    overdueLiquidationDays INT DEFAULT 30,
    CONSTRAINT fk_contract_reservation FOREIGN KEY (reservationId) REFERENCES Reservation (reservationId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. TABLE: Payment (Hóa đơn và Giao dịch thanh toán)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Payment;
CREATE TABLE Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    invoiceType ENUM('DEP', 'EXT', 'PEN', 'CMP', 'REF', 'INITIAL_RENTAL', 'MONTHLY_RENEWAL', 'OVERDUE_FEE', 'INSPECTION_DAMAGE') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    paidAmount DECIMAL(12, 2),
    remainingAmount DECIMAL(12, 2),
    receiptUrl VARCHAR(500), -- Đường dẫn ảnh biên lai chuyển khoản hoàn tiền cọc
    issuedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueAt DATETIME NOT NULL,
    status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    paymentMethod ENUM('BANK_TRANSFER', 'CASH'),
    transactionCode VARCHAR(100),
    paymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    gatewayTransactionId VARCHAR(100),
    paidAt DATETIME,
    CONSTRAINT fk_payment_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. TABLE: Image (Ảnh hệ thống và ảnh nghiệp vụ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Image;
CREATE TABLE Image (
    imageId INT AUTO_INCREMENT PRIMARY KEY,
    typeCode TINYINT NOT NULL COMMENT '1 = ảnh hệ thống, 2 = ảnh nghiệp vụ',
    category VARCHAR(40) NOT NULL,
    facilityId INT NULL,
    contractId INT NULL,
    paymentId INT NULL,
    storagePath VARCHAR(500) NOT NULL,
    originalFileName VARCHAR(255) NOT NULL,
    contentType VARCHAR(100) NOT NULL,
    fileSize BIGINT UNSIGNED NOT NULL,
    uploadedBy INT NULL COMMENT 'accountId của người tải ảnh lên',
    uploadedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    imageStatus ENUM('PENDING', 'LINKED') NOT NULL DEFAULT 'PENDING',
    CONSTRAINT chk_image_type_category CHECK (
        (typeCode = 1 AND category IN ('FACILITY_COVER', 'UNITS_ALL', 'UNIT_STANDARD', 'UNIT_CLIMATE'))
        OR
        (typeCode = 2 AND category IN ('CHECKOUT_INSPECTION', 'REFUND_RECEIPT', 'FORFEIT_EVIDENCE'))
    ),
    CONSTRAINT fk_image_facility FOREIGN KEY (facilityId)
        REFERENCES Facility (facilityId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_image_contract FOREIGN KEY (contractId)
        REFERENCES Contract (contractId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_image_payment FOREIGN KEY (paymentId)
        REFERENCES Payment (paymentId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_image_uploader FOREIGN KEY (uploadedBy)
        REFERENCES Account (accountId) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT uq_image_facility_category UNIQUE (facilityId, category),
    INDEX idx_image_contract_category_uploaded (contractId, category, uploadedAt),
    INDEX idx_image_payment_category (paymentId, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------------------------------------------------------
-- 19. TABLE: GatePin (Mã PIN động mở cổng IoT cơ sở 15s - 30s)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS GatePin;
CREATE TABLE GatePin (
    gatePinId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    pinCode VARCHAR(6) NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    generatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    CONSTRAINT fk_gatepin_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. (Bảng FeeItem đã được hợp nhất tại mục 11.1 phục vụ cả Phụ thu, Phạt, Ưu đãi & Nghiệm thu hư hại)
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- 20. TABLE: SupportTicket (Yêu cầu hỗ trợ & Xử lý sự cố kỹ thuật SLA)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS SupportTicket;
CREATE TABLE SupportTicket (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticketCode VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL, -- INCIDENT, EARLY_TERMINATION
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, IN_PROGRESS, RESOLVED
    customerId INT NOT NULL,
    facilityId INT NULL,
    unitCode VARCHAR(50) NULL,
    contractId INT NULL,
    title VARCHAR(200) NULL,
    description TEXT NULL,
    desiredDate DATE NULL,
    assignedStaffId INT NULL,
    slaDeadline DATETIME NULL,
    acceptedAt DATETIME NULL,
    isSlaBreached BOOLEAN NOT NULL DEFAULT FALSE,
    identityVerified BOOLEAN NOT NULL DEFAULT FALSE,
    resolutionNote TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolvedAt DATETIME NULL,
    CONSTRAINT fk_ticket_customer FOREIGN KEY (customerId) REFERENCES CustomerProfile (customerId) ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- Bật lại ràng buộc khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================================
-- DỮ LIỆU KHỞI TẠO ĐẦY ĐỦ (MASTER SEED DATA) CHO TOÀN BỘ 7 CƠ SỞ KHO
-- ============================================================================

-- 1. Phân quyền (Roles)
INSERT INTO Role (roleId, roleName, roleTitle) VALUES
(1, 'ADMIN', 'Quản trị viên Hệ thống'),
(2, 'BOM', 'Ban Giám Đốc'),
(3, 'MANAGER', 'Quản lý cơ sở'),
(4, 'STAFF', 'Nhân viên cơ sở'),
(5, 'CUSTOMER', 'Khách hàng');

-- 2. 7 Cơ sở kho toàn quốc (Khớp 100% tài liệu Take note.txt)
INSERT INTO Facility (facilityId, facilityName, facilityCode, layoutType, address, phone, status) VALUES
(1, 'SmartStorage Cầu Giấy', 'HN01', 'A', 'Số 391 Cầu Giấy, Q. Cầu Giấy, Hà Nội', '02439100001', 'ACTIVE'),
(2, 'SmartStorage Thanh Xuân', 'HN02', 'B', 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', '02439100002', 'ACTIVE'),
(3, 'SmartStorage Quận 1', 'HCM01', 'A', 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', '02839100001', 'ACTIVE'),
(4, 'SmartStorage Quận 7', 'HCM02', 'B', 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', '02839100002', 'ACTIVE'),
(5, 'SmartStorage Thủ Đức', 'HCM03', 'B', 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', '02839100003', 'ACTIVE'),
(6, 'SmartStorage Hải Châu', 'DN01', 'A', 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', '02369100001', 'ACTIVE'),
(7, 'SmartStorage Ninh Kiều', 'CT01', 'B', 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', '02929100001', 'ACTIVE');

-- 3. Tài khoản người dùng (Accounts)
-- Mật khẩu mặc định dev/test: 123456@Test (BCrypt: $2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW)
INSERT INTO Account (accountId, roleId, phone, fullName, email, password, status) VALUES
-- 1. Admin hệ thống & Ban Giám Đốc BOM
(1, 1, '0900000001', 'Trần Tuấn Anh', 'admin@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(2, 2, '0900000002', 'Phạm Minh Tuấn', 'bom@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- 2. Quản lý chi nhánh (Managers) cho ĐẦY ĐỦ 7 CƠ SỞ (Facility 1 -> 7)
(3, 3, '0900000003', 'Trần Văn Quản', 'manager.hn01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(4, 3, '0900000004', 'Hoàng Minh Đức', 'manager.hn02@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(5, 3, '0900000005', 'Lê Thị Thu Trang', 'manager.hcm01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(6, 3, '0900000006', 'Đỗ Đức Anh', 'manager.hcm02@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(7, 3, '0900000007', 'Vũ Đình Trọng', 'manager.hcm03@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(8, 3, '0900000008', 'Nguyễn Thanh Tùng', 'manager.dn01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(9, 3, '0900000009', 'Bùi Tuấn Kiệt', 'manager.ct01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- 3. Nhân viên vận hành tại cơ sở (Staffs) - Đúng 3 nhân viên / 1 cơ sở (21 nhân viên)
-- Cơ sở 1: HN-01 (Cầu Giấy, Hà Nội)
(10, 4, '0901000001', 'Nguyễn Văn Hùng', 'staff.hn01.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(11, 4, '0901000002', 'Lê Thị Ánh Tuyết', 'staff.hn01.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(12, 4, '0901000003', 'Phạm Hoàng Nam', 'staff.hn01.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 2: HN-02 (Thanh Xuân, Hà Nội)
(13, 4, '0902000001', 'Đỗ Quang Huy', 'staff.hn02.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(14, 4, '0902000002', 'Ngô Thu Phương', 'staff.hn02.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(15, 4, '0902000003', 'Trần Minh Quân', 'staff.hn02.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 3: HCM-01 (Quận 1, TP.HCM)
(16, 4, '0903000001', 'Phạm Thị Lan Hương', 'staff.hcm01.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(17, 4, '0903000002', 'Võ Hoàng Việt', 'staff.hcm01.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(18, 4, '0903000003', 'Huỳnh Ngọc Thảo', 'staff.hcm01.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 4: HCM-02 (Quận 7, TP.HCM)
(19, 4, '0904000001', 'Đinh Văn Thắng', 'staff.hcm02.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(20, 4, '0904000002', 'Nguyễn Mai Chi', 'staff.hcm02.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(21, 4, '0904000003', 'Lý Gia Huy', 'staff.hcm02.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 5: HCM-03 (Thủ Đức, TP.HCM)
(22, 4, '0905000001', 'Bùi Đức Trọng', 'staff.hcm03.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(23, 4, '0905000002', 'Dương Thúy Hằng', 'staff.hcm03.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(24, 4, '0905000003', 'Trịnh Quốc Hưng', 'staff.hcm03.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 6: DN-01 (Hải Châu, Đà Nẵng)
(25, 4, '0906000001', 'Phan Văn Hòa', 'staff.dn01.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(26, 4, '0906000002', 'Trần Thanh Trúc', 'staff.dn01.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(27, 4, '0906000003', 'Đặng Hữu Tài', 'staff.dn01.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- Cơ sở 7: CT-01 (Ninh Kiều, Cần Thơ)
(28, 4, '0907000001', 'Nguyễn Tấn Đạt', 'staff.ct01.1@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(29, 4, '0907000002', 'Vũ Thị Ngọc Hà', 'staff.ct01.2@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(30, 4, '0907000003', 'Hồ Quốc Thái', 'staff.ct01.3@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- 4. Khách hàng cá nhân (Customers) - Tên người thật 100%
(31, 5, '0918610258', 'Nguyễn Hoàng Gia Bảo', 'nguyenhoanggiabao17082006@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(32, 5, '0987654321', 'Trần Thu Hà', 'customer.ha@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(33, 5, '0933445566', 'Trần Thị Bích Ngọc', 'bichngoc.tran@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(34, 5, '0977889900', 'Lê Hữu Đạt', 'dat.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(35, 5, '0966778899', 'Lê Hoàng Long', 'hoanglong.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(36, 5, '0944556677', 'Vũ Mai Phương', 'maiphuong.vu@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
-- === KHÁCH HÀNG 7 (Dành riêng test Level 7 - Đóng/xóa tài khoản): Nguyễn Văn Demo ===
(37, 5, '0901234567', 'Nguyễn Văn Demo', 'demo.closure@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE');

-- 4. Hồ sơ khách hàng (CustomerProfiles gắn CCCD 12 số chuẩn)
INSERT INTO CustomerProfile (customerId, accountId, identityNumber, bankName, bankAccountNumber, bankAccountName) VALUES
(1, 31, '079206001708', 'MBBank', '0918610258', 'NGUYEN HOANG GIA BAO'),
(2, 32, '079201098765', 'Vietcombank', '079201098765', 'TRAN THU HA'),
(3, 33, '001202023456', 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(4, 34, '079202087654', 'Techcombank', '079202087654', 'LE HUU DAT'),
(5, 35, '048201034567', 'VietinBank', '108876543210', 'LE HOANG LONG'),
(6, 36, '092201045678', 'ACB', '246813579', 'VU MAI PHUONG'),
(7, 37, '079201099999', 'Techcombank', '1903678999999', 'NGUYEN VAN DEMO');

-- 5. Hồ sơ nhân viên & Quản lý cơ sở (EmployeeProfiles gắn với từng cơ sở)
INSERT INTO EmployeeProfile (employeeId, accountId, facilityId) VALUES
-- Quản lý 7 cơ sở (Managers)
(1, 3, 1),  -- Quản lý HN-01
(2, 4, 2),  -- Quản lý HN-02
(3, 5, 3),  -- Quản lý HCM-01
(4, 6, 4),  -- Quản lý HCM-02
(5, 7, 5),  -- Quản lý HCM-03
(6, 8, 6),  -- Quản lý DN-01
(7, 9, 7),  -- Quản lý CT-01
-- Nhân viên 7 cơ sở (Mỗi cơ sở đúng 3 Staffs)
(8, 10, 1),  -- Staff 1 HN-01
(9, 11, 1),  -- Staff 2 HN-01
(10, 12, 1), -- Staff 3 HN-01
(11, 13, 2), -- Staff 1 HN-02
(12, 14, 2), -- Staff 2 HN-02
(13, 15, 2), -- Staff 3 HN-02
(14, 16, 3), -- Staff 1 HCM-01
(15, 17, 3), -- Staff 2 HCM-01
(16, 18, 3), -- Staff 3 HCM-01
(17, 19, 4), -- Staff 1 HCM-02
(18, 20, 4), -- Staff 2 HCM-02
(19, 21, 4), -- Staff 3 HCM-02
(20, 22, 5), -- Staff 1 HCM-03
(21, 23, 5), -- Staff 2 HCM-03
(22, 24, 5), -- Staff 3 HCM-03
(23, 25, 6), -- Staff 1 DN-01
(24, 26, 6), -- Staff 2 DN-01
(25, 27, 6), -- Staff 3 DN-01
(26, 28, 7), -- Staff 1 CT-01
(27, 29, 7), -- Staff 2 CT-01
(28, 30, 7); -- Staff 3 CT-01

-- 6. Danh sách Tầng cho 7 Cơ sở (Mỗi cơ sở chuẩn hóa 2 tầng: Tầng Trệt, Tầng 1)
INSERT INTO Floor (floorId, facilityId, floorName, maxLoadPerM2, status) VALUES
-- HN-01 (Cơ sở 1 - Mẫu Layout A 2 tầng: 22 ô kho)
(1, 1, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(2, 1, 'Tầng 1', 500.00, 'ACTIVE'),

-- HN-02 (Cơ sở 2 - Mẫu Layout B 2 tầng: 20 ô kho)
(3, 2, 'Tầng Trệt', 1200.00, 'ACTIVE'),
(4, 2, 'Tầng 1', 600.00, 'ACTIVE'),

-- HCM-01 (Cơ sở 3 - Mẫu Layout A 2 tầng: 22 ô kho)
(5, 3, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(6, 3, 'Tầng 1', 500.00, 'ACTIVE'),

-- HCM-02 (Cơ sở 4 - Mẫu Layout B 2 tầng: 20 ô kho)
(7, 4, 'Tầng Trệt', 1200.00, 'ACTIVE'),
(8, 4, 'Tầng 1', 600.00, 'ACTIVE'),

-- HCM-03 (Cơ sở 5 - Mẫu Layout B 2 tầng: 20 ô kho)
(9, 5, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(10, 5, 'Tầng 1', 500.00, 'ACTIVE'),

-- DN-01 (Cơ sở 6 - Mẫu Layout A 2 tầng: 22 ô kho)
(11, 6, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(12, 6, 'Tầng 1', 500.00, 'ACTIVE'),

-- CT-01 (Cơ sở 7 - Mẫu Layout B 2 tầng: 20 ô kho)
(13, 7, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(14, 7, 'Tầng 1', 600.00, 'ACTIVE');

-- 7. Loại kho chuẩn (UnitTypes - Chiều cao cố định 2.0m)
INSERT INTO UnitType (unitTypeId, typeName, size, storageCondition, status) VALUES
(1, 'Size S (Tủ cá nhân)', '1.0m x 1.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(2, 'Size M (Phòng vừa)', '1.5m x 2.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(3, 'Size L (Phòng lớn)', '2.0m x 3.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(4, 'Size XL (Kho doanh nghiệp)', '2.5m x 4.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(5, 'Size M - Climate (Kho mát VIP)', '1.5m x 2.0m x 2.0m', 'CLIMATE_CONTROLLED', 'ACTIVE'),
(6, 'Size L - Climate (Kho mát VIP)', '2.0m x 3.0m x 2.0m', 'CLIMATE_CONTROLLED', 'ACTIVE'),
(7, 'Size XL - Climate (Kho mát VIP)', '2.5m x 4.0m x 2.0m', 'CLIMATE_CONTROLLED', 'ACTIVE');

-- 8. Bảng giá thuê chuẩn & Mức cọc (Prices)
INSERT INTO Price (priceId, unitTypeId, dailyPrice, monthlyPrice, depositAmount, climateSurchargePercent, effectiveFrom, effectiveTo, status) VALUES
(1, 1, 30000.00, 600000.00, 500000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(2, 2, 60000.00, 1200000.00, 1000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(3, 3, 120000.00, 2400000.00, 2000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(4, 4, 200000.00, 4000000.00, 3000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(5, 5, 60000.00, 1200000.00, 1000000.00, 20.00, '2026-01-01', NULL, 'ACTIVE'),
(6, 6, 120000.00, 2400000.00, 2000000.00, 20.00, '2026-01-01', NULL, 'ACTIVE'),
(7, 7, 200000.00, 4000000.00, 3000000.00, 20.00, '2026-01-01', NULL, 'ACTIVE');

-- 8.1. Biểu phí phạt quá hạn, chiết khấu & bồi thường hư hỏng (FeeItems)
INSERT INTO FeeItem (feeItemId, feeCode, feeName, category, calcType, feeValue, unitBasis, description, isWaiveDeposit, status) VALUES
-- 1. Ưu Đãi Thuê Khách Hàng 6 Tháng
(7, 'DISCOUNT_6M', 'Ưu Đãi Thuê Khách Hàng 6 Tháng', 'DISCOUNT', 'PERCENT', 10.00, 'CONTRACT_TOTAL', 'Chiết khấu 10% tổng tiền thuê cho hợp đồng từ 6 tháng', FALSE, 'ACTIVE'),

-- 2. Ưu Đãi Thuê Khách Hàng 12 Tháng
(8, 'DISCOUNT_12M', 'Ưu Đãi Thuê Khách Hàng 12 Tháng', 'DISCOUNT', 'PERCENT', 15.00, 'CONTRACT_TOTAL', 'Chiết khấu 15% tổng tiền thuê cho hợp đồng dài hạn từ 12 tháng', FALSE, 'ACTIVE'),

-- 3. Ưu Đãi Thuê Khách Hàng 3 Tháng
(16, 'DISCOUNT_3M', 'Ưu Đãi Thuê Khách Hàng 3 Tháng', 'DISCOUNT', 'PERCENT', 5.00, 'CONTRACT_TOTAL', 'Chiết khấu 5% tổng tiền thuê cho hợp đồng dài hạn từ 12 tháng', FALSE, 'ACTIVE'),

-- 4. Phí vệ sinh kho
(10, 'DMG_CLEANING', 'Phí vệ sinh kho', 'DAMAGE', 'FIXED', 150000.00, 'PER_REQUEST', 'Dọn dẹp rác cơ bản hoặc vệ sinh kho sau khi trả kho', FALSE, 'ACTIVE'),

-- 5. Mất chìa khóa cơ mở tủ
(11, 'DMG_LOST_KEY', 'Mất chìa khóa cơ mở tủ', 'DAMAGE', 'FIXED', 200000.00, 'PER_REQUEST', 'Đền bù làm lại chìa khóa cơ / thay ổ khóa tủ cá nhân', FALSE, 'ACTIVE'),

-- 6. Phí sơn lại / vá điểm trầy xước
(12, 'DMG_WALL_SCRATCH', 'Phí sơn lại / vá điểm trầy xước', 'DAMAGE', 'FIXED', 300000.00, 'PER_REQUEST', 'Xử lý trầy xước, dặm vá sơn bề mặt vách ngăn', FALSE, 'ACTIVE'),

-- 7. Hư hỏng bóng đèn / ổ cắm
(13, 'DMG_ELECTRIC_BROKEN', 'Hư hỏng bóng đèn / ổ cắm', 'DAMAGE', 'FIXED', 300000.00, 'PER_REQUEST', 'Thay thế bóng đèn LED hoặc ổ cắm điện bị cháy hỏng', FALSE, 'ACTIVE'),

-- 8. Vách ngăn ô kho bị móp / thủng
(14, 'DMG_WALL_DENT', 'Vách ngăn ô kho bị móp / thủng', 'DAMAGE', 'FIXED', 500000.00, 'PER_REQUEST', 'Gia cố hoặc thay tấm vách panel ngăn ô kho bị va đập móp méo', FALSE, 'ACTIVE'),

-- 9. Hư hỏng cửa kho / khóa cửa chính
(15, 'DMG_DOOR_BROKEN', 'Hư hỏng cửa kho / khóa cửa chính', 'DAMAGE', 'FIXED', 1000000.00, 'PER_REQUEST', 'Sửa chữa cửa cuốn, thay thế khóa cửa chính ô kho', FALSE, 'ACTIVE'),

-- 10. Thu phạt kho quá hạn
(4, 'OVERDUE_DAILY_RATE', 'Thu phạt kho quá hạn', 'PENALTY', 'FIXED', 50000.00, 'PER_DAY', 'Khi quá ngày trả kho mà khách không đến trả kho cũng không gia hạn', FALSE, 'ACTIVE');


-- 9. Danh mục Ngăn kho thực tế (StorageUnits) phân bổ trên cả 7 cơ sở (Chuẩn 2 tầng)
INSERT INTO StorageUnit (unitCode, floorId, unitTypeId, status) VALUES
-- === CƠ SỞ 1: HN-01 (Cầu Giấy, Hà Nội - Mẫu Layout A: 22 Ô Kho) ===
-- Floor 1 (Trệt): 6 Ô Kho XL (4 thường, 2 kho mát)
('HN01-G-XL01', 1, 4, 'AVAILABLE'),
('HN01-G-XL02', 1, 4, 'RENTED'),
('HN01-G-XL03', 1, 7, 'AVAILABLE'),
('HN01-G-XL04', 1, 4, 'AVAILABLE'),
('HN01-G-XL05', 1, 4, 'AVAILABLE'),
('HN01-G-XL06', 1, 7, 'AVAILABLE'),
-- Floor 2 (Tầng 1): 8 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('HN01-F1-S01', 2, 1, 'RENTED'),
('HN01-F1-S02', 2, 1, 'AVAILABLE'),
('HN01-F1-S03', 2, 1, 'AVAILABLE'),
('HN01-F1-S04', 2, 1, 'AVAILABLE'),
('HN01-F1-S05', 2, 1, 'AVAILABLE'),
('HN01-F1-S06', 2, 1, 'AVAILABLE'),
('HN01-F1-S07', 2, 1, 'MAINTENANCE'),
('HN01-F1-S08', 2, 1, 'AVAILABLE'),
('HN01-F1-M01', 2, 2, 'AVAILABLE'),
('HN01-F1-M02', 2, 2, 'RENTED'),
('HN01-F1-M03', 2, 2, 'AVAILABLE'),
('HN01-F1-M04', 2, 5, 'RESERVED'),
('HN01-F1-M05', 2, 5, 'AVAILABLE'),
('HN01-F1-L01', 2, 3, 'AVAILABLE'),
('HN01-F1-L02', 2, 3, 'AVAILABLE'),
('HN01-F1-L03', 2, 6, 'AVAILABLE'),

-- === CƠ SỞ 2: HN-02 (Thanh Xuân, Hà Nội - Mẫu Layout B: 20 Ô Kho) ===
-- Floor 3 (Trệt): 8 Ô Kho XL (5 thường, 3 kho mát)
('HN02-G-XL01', 3, 4, 'RENTED'),
('HN02-G-XL02', 3, 4, 'AVAILABLE'),
('HN02-G-XL03', 3, 7, 'AVAILABLE'),
('HN02-G-XL04', 3, 4, 'RESERVED'),
('HN02-G-XL05', 3, 4, 'AVAILABLE'),
('HN02-G-XL06', 3, 4, 'AVAILABLE'),
('HN02-G-XL07', 3, 7, 'AVAILABLE'),
('HN02-G-XL08', 3, 7, 'AVAILABLE'),
-- Floor 4 (Tầng 1): 4 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('HN02-F1-S01', 4, 1, 'AVAILABLE'),
('HN02-F1-S02', 4, 1, 'RENTED'),
('HN02-F1-S03', 4, 1, 'AVAILABLE'),
('HN02-F1-S04', 4, 1, 'AVAILABLE'),
('HN02-F1-M01', 4, 2, 'AVAILABLE'),
('HN02-F1-M02', 4, 2, 'RENTED'),
('HN02-F1-M03', 4, 5, 'AVAILABLE'),
('HN02-F1-M04', 4, 2, 'RENTED'),
('HN02-F1-M05', 4, 5, 'AVAILABLE'),
('HN02-F1-L01', 4, 3, 'AVAILABLE'),
('HN02-F1-L02', 4, 3, 'AVAILABLE'),
('HN02-F1-L03', 4, 6, 'AVAILABLE'),

-- === CƠ SỞ 3: HCM-01 (Quận 1, TP.HCM - Mẫu Layout A: 22 Ô Kho) ===
-- Floor 5 (Trệt): 6 Ô Kho XL (4 thường, 2 kho mát)
('HCM01-G-XL01', 5, 4, 'RENTED'),
('HCM01-G-XL02', 5, 4, 'AVAILABLE'),
('HCM01-G-XL03', 5, 7, 'AVAILABLE'),
('HCM01-G-XL04', 5, 4, 'AVAILABLE'),
('HCM01-G-XL05', 5, 4, 'AVAILABLE'),
('HCM01-G-XL06', 5, 7, 'AVAILABLE'),
-- Floor 6 (Tầng 1): 8 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('HCM01-F1-S01', 6, 1, 'RENTED'),
('HCM01-F1-S02', 6, 1, 'AVAILABLE'),
('HCM01-F1-S03', 6, 1, 'AVAILABLE'),
('HCM01-F1-S04', 6, 1, 'AVAILABLE'),
('HCM01-F1-S05', 6, 1, 'AVAILABLE'),
('HCM01-F1-S06', 6, 1, 'AVAILABLE'),
('HCM01-F1-S07', 6, 1, 'MAINTENANCE'),
('HCM01-F1-S08', 6, 1, 'AVAILABLE'),
('HCM01-F1-M01', 6, 2, 'AVAILABLE'),
('HCM01-F1-M02', 6, 2, 'RENTED'),
('HCM01-F1-M03', 6, 2, 'AVAILABLE'),
('HCM01-F1-M04', 6, 5, 'RESERVED'),
('HCM01-F1-M05', 6, 5, 'AVAILABLE'),
('HCM01-F1-L01', 6, 3, 'AVAILABLE'),
('HCM01-F1-L02', 6, 3, 'AVAILABLE'),
('HCM01-F1-L03', 6, 6, 'AVAILABLE'),

-- === CƠ SỞ 4: HCM-02 (Quận 7, TP.HCM - Mẫu Layout B: 20 Ô Kho) ===
-- Floor 7 (Trệt): 8 Ô Kho XL (5 thường, 3 kho mát)
('HCM02-G-XL01', 7, 4, 'RENTED'),
('HCM02-G-XL02', 7, 4, 'AVAILABLE'),
('HCM02-G-XL03', 7, 7, 'AVAILABLE'),
('HCM02-G-XL04', 7, 4, 'AVAILABLE'),
('HCM02-G-XL05', 7, 4, 'AVAILABLE'),
('HCM02-G-XL06', 7, 4, 'AVAILABLE'),
('HCM02-G-XL07', 7, 7, 'AVAILABLE'),
('HCM02-G-XL08', 7, 7, 'AVAILABLE'),
-- Floor 8 (Tầng 1): 4 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('HCM02-F1-S01', 8, 1, 'AVAILABLE'),
('HCM02-F1-S02', 8, 1, 'RENTED'),
('HCM02-F1-S03', 8, 1, 'AVAILABLE'),
('HCM02-F1-S04', 8, 1, 'AVAILABLE'),
('HCM02-F1-M01', 8, 2, 'RESERVED'),
('HCM02-F1-M02', 8, 2, 'RENTED'),
('HCM02-F1-M03', 8, 5, 'AVAILABLE'),
('HCM02-F1-M04', 8, 2, 'AVAILABLE'),
('HCM02-F1-M05', 8, 5, 'AVAILABLE'),
('HCM02-F1-L01', 8, 3, 'AVAILABLE'),
('HCM02-F1-L02', 8, 3, 'AVAILABLE'),
('HCM02-F1-L03', 8, 6, 'AVAILABLE'),

-- === CƠ SỞ 5: HCM-03 (Thủ Đức, TP.HCM - Mẫu Layout B: 20 Ô Kho) ===
-- Floor 9 (Trệt): 8 Ô Kho XL (5 thường, 3 kho mát)
('HCM03-G-XL01', 9, 4, 'AVAILABLE'),
('HCM03-G-XL02', 9, 4, 'RENTED'),
('HCM03-G-XL03', 9, 7, 'AVAILABLE'),
('HCM03-G-XL04', 9, 4, 'AVAILABLE'),
('HCM03-G-XL05', 9, 4, 'AVAILABLE'),
('HCM03-G-XL06', 9, 4, 'AVAILABLE'),
('HCM03-G-XL07', 9, 7, 'AVAILABLE'),
('HCM03-G-XL08', 9, 7, 'AVAILABLE'),
-- Floor 10 (Tầng 1): 4 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('HCM03-F1-S01', 10, 1, 'AVAILABLE'),
('HCM03-F1-S02', 10, 1, 'RESERVED'),
('HCM03-F1-S03', 10, 1, 'AVAILABLE'),
('HCM03-F1-S04', 10, 1, 'AVAILABLE'),
('HCM03-F1-M01', 10, 2, 'RENTED'),
('HCM03-F1-M02', 10, 2, 'RENTED'),
('HCM03-F1-M03', 10, 5, 'AVAILABLE'),
('HCM03-F1-M04', 10, 2, 'AVAILABLE'),
('HCM03-F1-M05', 10, 5, 'AVAILABLE'),
('HCM03-F1-L01', 10, 3, 'AVAILABLE'),
('HCM03-F1-L02', 10, 3, 'AVAILABLE'),
('HCM03-F1-L03', 10, 6, 'AVAILABLE'),

-- === CƠ SỞ 6: DN-01 (Hải Châu, Đà Nẵng - Mẫu Layout A: 22 Ô Kho) ===
-- Floor 11 (Trệt): 6 Ô Kho XL (4 thường, 2 kho mát)
('DN01-G-XL01', 11, 4, 'RENTED'),
('DN01-G-XL02', 11, 4, 'AVAILABLE'),
('DN01-G-XL03', 11, 7, 'AVAILABLE'),
('DN01-G-XL04', 11, 4, 'AVAILABLE'),
('DN01-G-XL05', 11, 4, 'AVAILABLE'),
('DN01-G-XL06', 11, 7, 'AVAILABLE'),
-- Floor 12 (Tầng 1): 8 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('DN01-F1-S01', 12, 1, 'RENTED'),
('DN01-F1-S02', 12, 1, 'RENTED'),
('DN01-F1-S03', 12, 1, 'AVAILABLE'),
('DN01-F1-S04', 12, 1, 'RESERVED'),
('DN01-F1-S05', 12, 1, 'AVAILABLE'),
('DN01-F1-S06', 12, 1, 'AVAILABLE'),
('DN01-F1-S07', 12, 1, 'MAINTENANCE'),
('DN01-F1-S08', 12, 1, 'AVAILABLE'),
('DN01-F1-M01', 12, 2, 'RENTED'),
('DN01-F1-M02', 12, 2, 'AVAILABLE'),
('DN01-F1-M03', 12, 2, 'AVAILABLE'),
('DN01-F1-M04', 12, 5, 'AVAILABLE'),
('DN01-F1-M05', 12, 5, 'AVAILABLE'),
('DN01-F1-L01', 12, 3, 'AVAILABLE'),
('DN01-F1-L02', 12, 3, 'AVAILABLE'),
('DN01-F1-L03', 12, 6, 'AVAILABLE'),

-- === CƠ SỞ 7: CT-01 (Ninh Kiều, Cần Thơ - Mẫu Layout B: 20 Ô Kho) ===
-- Floor 13 (Trệt): 8 Ô Kho XL (5 thường, 3 kho mát)
('CT01-G-XL01', 13, 4, 'RENTED'),
('CT01-G-XL02', 13, 4, 'RENTED'),
('CT01-G-XL03', 13, 7, 'AVAILABLE'),
('CT01-G-XL04', 13, 4, 'AVAILABLE'),
('CT01-G-XL05', 13, 4, 'AVAILABLE'),
('CT01-G-XL06', 13, 4, 'AVAILABLE'),
('CT01-G-XL07', 13, 7, 'AVAILABLE'),
('CT01-G-XL08', 13, 7, 'AVAILABLE'),
-- Floor 14 (Tầng 1): 4 ô S, 5 ô M (3 thường, 2 mát), 3 ô L (2 thường, 1 mát)
('CT01-F1-S01', 14, 1, 'AVAILABLE'),
('CT01-F1-S02', 14, 1, 'RENTED'),
('CT01-F1-S03', 14, 1, 'AVAILABLE'),
('CT01-F1-S04', 14, 1, 'AVAILABLE'),
('CT01-F1-M01', 14, 2, 'AVAILABLE'),
('CT01-F1-M02', 14, 2, 'AVAILABLE'),
('CT01-F1-M03', 14, 5, 'AVAILABLE'),
('CT01-F1-M04', 14, 2, 'RENTED'),
('CT01-F1-M05', 14, 5, 'AVAILABLE'),
('CT01-F1-L01', 14, 3, 'AVAILABLE'),
('CT01-F1-L02', 14, 3, 'AVAILABLE'),
('CT01-F1-L03', 14, 6, 'AVAILABLE');

-- Cập nhật trạng thái StorageUnit tương ứng
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN02-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN02-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM02-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM02-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM03-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM03-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'DN01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'DN01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-S02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'CT01-F1-L01';

-- Cập nhật trạng thái StorageUnit tương ứng
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN01-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN02-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HN02-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HN02-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HN02-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM01-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM02-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM02-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM02-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM02-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM03-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'HCM03-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'HCM03-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'HCM03-F1-S02';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'DN01-F1-L01';
UPDATE StorageUnit SET status = 'RESERVED' WHERE unitCode = 'DN01-F1-L02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-L03';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-M01';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M02';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M03';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M04';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-M05';
UPDATE StorageUnit SET status = 'RENTED' WHERE unitCode = 'DN01-F1-S01';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'DN01-F1-S02';
UPDATE StorageUnit SET status = 'AVAILABLE' WHERE unitCode = 'CT01-F1-L01';

-- 14. Đơn đặt chỗ mẫu (Reservations) đồng đều 10 loại cho mỗi tài khoản khách hàng
INSERT INTO Reservation (reservationId, reservationCode, accountId, unitCode, startDate, endDate, rentalType, rentalAmount, depositAmount, penaltyAmount, status, createdAt, holdExpiresAt) VALUES
(1, 'CTR-HN01-081126-1001', 31, 'HN01-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(2, 'CTR-HN01-151126-1002', 31, 'HN01-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(3, 'CTR-HN01-041126-1003', 31, 'HN01-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(4, 'CTR-HN01-201026-1004', 31, 'HN01-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(5, 'CTR-HN01-151026-1005', 31, 'HN01-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(6, 'CTR-HN01-101026-1006', 31, 'HN01-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(7, 'CTR-HN01-250926-1007', 31, 'HN01-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(8, 'CTR-HN01-040826-1008', 31, 'HN01-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(9, 'CTR-HN01-011026-1009', 31, 'HN01-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(10, 'CTR-HN01-010826-1010', 31, 'HN01-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(11, 'CTR-HN02-081126-1011', 32, 'HN02-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(12, 'CTR-HN02-151126-1012', 32, 'HN02-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(13, 'CTR-HN02-041126-1013', 32, 'HN02-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(14, 'CTR-HN02-201026-1014', 32, 'HN02-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(15, 'CTR-HN02-151026-1015', 32, 'HN02-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(16, 'CTR-HN02-101026-1016', 32, 'HN02-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(17, 'CTR-HN02-250926-1017', 32, 'HN02-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(18, 'CTR-HN02-040826-1018', 32, 'HN02-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(19, 'CTR-HN02-011026-1019', 32, 'HN02-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(20, 'CTR-HN02-010826-1020', 32, 'HN02-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(21, 'CTR-HCM01-081126-1021', 33, 'HCM01-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(22, 'CTR-HCM01-151126-1022', 33, 'HCM01-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(23, 'CTR-HCM01-041126-1023', 33, 'HCM01-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(24, 'CTR-HCM01-201026-1024', 33, 'HCM01-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(25, 'CTR-HCM01-151026-1025', 33, 'HCM01-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(26, 'CTR-HCM01-101026-1026', 33, 'HCM01-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(27, 'CTR-HCM01-250926-1027', 33, 'HCM01-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(28, 'CTR-HCM01-040826-1028', 33, 'HCM01-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(29, 'CTR-HCM01-011026-1029', 33, 'HCM01-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(30, 'CTR-HCM01-010826-1030', 33, 'HCM01-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(31, 'CTR-HCM02-081126-1031', 34, 'HCM02-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(32, 'CTR-HCM02-151126-1032', 34, 'HCM02-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(33, 'CTR-HCM02-041126-1033', 34, 'HCM02-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(34, 'CTR-HCM02-201026-1034', 34, 'HCM02-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(35, 'CTR-HCM02-151026-1035', 34, 'HCM02-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(36, 'CTR-HCM02-101026-1036', 34, 'HCM02-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(37, 'CTR-HCM02-250926-1037', 34, 'HCM02-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(38, 'CTR-HCM02-040826-1038', 34, 'HCM02-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(39, 'CTR-HCM02-011026-1039', 34, 'HCM02-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(40, 'CTR-HCM02-010826-1040', 34, 'HCM02-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(41, 'CTR-HCM03-081126-1041', 35, 'HCM03-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(42, 'CTR-HCM03-151126-1042', 35, 'HCM03-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(43, 'CTR-HCM03-041126-1043', 35, 'HCM03-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(44, 'CTR-HCM03-201026-1044', 35, 'HCM03-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(45, 'CTR-HCM03-151026-1045', 35, 'HCM03-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(46, 'CTR-HCM03-101026-1046', 35, 'HCM03-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(47, 'CTR-HCM03-250926-1047', 35, 'HCM03-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(48, 'CTR-HCM03-040826-1048', 35, 'HCM03-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(49, 'CTR-HCM03-011026-1049', 35, 'HCM03-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(50, 'CTR-HCM03-010826-1050', 35, 'HCM03-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(51, 'CTR-DN01-081126-1051', 36, 'DN01-F1-L01', '2026-11-08', '2026-12-08', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-06 14:00:00', NULL),
(52, 'CTR-DN01-151126-1052', 36, 'DN01-F1-L02', '2026-11-15', '2026-12-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-11-07 10:00:00', NULL),
(53, 'CTR-DN01-041126-1053', 36, 'DN01-F1-L03', '2026-11-04', '2026-12-04', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CANCELLED', '2026-11-01 09:00:00', NULL),
(54, 'CTR-DN01-201026-1054', 36, 'DN01-F1-M01', '2026-10-25', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-18 10:00:00', NULL),
(55, 'CTR-DN01-151026-1055', 36, 'DN01-F1-M02', '2026-10-15', '2026-11-20', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-14 09:00:00', NULL),
(56, 'CTR-DN01-101026-1056', 36, 'DN01-F1-M03', '2026-10-10', '2026-11-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-09 10:00:00', NULL),
(57, 'CTR-DN01-250926-1057', 36, 'DN01-F1-M04', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 700000.00, 'CONFIRMED', '2026-09-24 09:00:00', NULL),
(58, 'CTR-DN01-040826-1058', 36, 'DN01-F1-M05', '2026-08-04', '2026-10-04', 'MONTHLY', 2400000.00, 1000000.00, 1500000.00, 'CONFIRMED', '2026-08-01 08:30:00', NULL),
(59, 'CTR-DN01-011026-1059', 36, 'DN01-F1-S01', '2026-10-01', '2026-12-01', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-28 09:00:00', NULL),
(60, 'CTR-DN01-010826-1060', 36, 'DN01-F1-S02', '2026-08-01', '2026-09-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL),
(61, 'CTR-CT01-010826-1061', 37, 'CT01-F1-L01', '2026-08-01', '2026-09-01', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-07-28 10:00:00', NULL);

-- 15. Hợp đồng thuê kho (Contracts) đồng đều 10 loại cho mỗi tài khoản khách hàng
INSERT INTO Contract (contractId, reservationId, activatedAt, terminatedAt, status, cancelReason, refundBankName, refundAccountNumber, refundAccountName) VALUES
(1, 1, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(2, 2, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(3, 3, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(4, 4, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'MBBank', '0918610258', 'NGUYEN HOANG GIA BAO'),
(5, 5, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'MBBank', '0918610258', 'NGUYEN HOANG GIA BAO'),
(6, 6, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(7, 7, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(8, 8, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(9, 9, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(10, 10, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'MBBank', '0918610258', 'NGUYEN HOANG GIA BAO'),
(11, 11, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(12, 12, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(13, 13, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(14, 14, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Vietcombank', '079201098765', 'TRAN THU HA'),
(15, 15, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'Vietcombank', '079201098765', 'TRAN THU HA'),
(16, 16, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(17, 17, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(18, 18, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(19, 19, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(20, 20, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'Vietcombank', '079201098765', 'TRAN THU HA'),
(21, 21, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(22, 22, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(23, 23, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(24, 24, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(25, 25, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(26, 26, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(27, 27, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(28, 28, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(29, 29, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(30, 30, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(31, 31, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(32, 32, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(33, 33, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(34, 34, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Techcombank', '079202087654', 'LE HUU DAT'),
(35, 35, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'Techcombank', '079202087654', 'LE HUU DAT'),
(36, 36, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(37, 37, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(38, 38, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(39, 39, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(40, 40, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'Techcombank', '079202087654', 'LE HUU DAT'),
(41, 41, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(42, 42, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(43, 43, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(44, 44, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'VietinBank', '108876543210', 'LE HOANG LONG'),
(45, 45, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'VietinBank', '108876543210', 'LE HOANG LONG'),
(46, 46, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(47, 47, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(48, 48, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(49, 49, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(50, 50, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'VietinBank', '108876543210', 'LE HOANG LONG'),
(51, 51, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(52, 52, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(53, 53, NULL, '2026-11-05 00:00:00', 'CANCELLED', 'NO_SHOW', NULL, NULL, NULL),
(54, 54, NULL, '2026-10-20 15:00:00', 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'ACB', '246813579', 'VU MAI PHUONG'),
(55, 55, '2026-10-15 09:00:00', NULL, 'ACTIVE', 'EARLY_TERMINATION', 'ACB', '246813579', 'VU MAI PHUONG'),
(56, 56, '2026-10-10 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(57, 57, '2026-09-25 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(58, 58, '2026-08-04 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(59, 59, '2026-10-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(60, 60, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'ACB', '246813579', 'VU MAI PHUONG'),
(61, 61, '2026-08-01 09:00:00', '2026-09-01 10:00:00', 'COMPLETED', NULL, 'Techcombank', '1903678999999', 'NGUYEN VAN DEMO');

-- Đóng băng thông tin Snapshot bất biến (Họ tên, CCCD, SĐT, Email) và URL file PDF hợp đồng
UPDATE Contract c
JOIN Reservation r ON c.reservationId = r.reservationId
JOIN Account a ON r.accountId = a.accountId
LEFT JOIN CustomerProfile cp ON a.accountId = cp.accountId
SET 
  c.signedFullName = a.fullName,
  c.signedPhone = a.phone,
  c.signedEmail = a.email,
  c.signedIdentityNumber = COALESCE(cp.identityNumber, ''),
  c.contractPdfUrl = CONCAT('/uploads/contracts/', r.reservationCode, '.pdf');

-- 16. Hóa đơn và Thanh toán (Payments) chuẩn mã định danh BR-37
INSERT INTO Payment (paymentId, contractId, invoiceNumber, invoiceType, amount, paidAmount, remainingAmount, receiptUrl, issuedAt, dueAt, status, paymentMethod, transactionCode, paymentStatus, gatewayTransactionId, paidAt) VALUES
(1, 1, 'DEP-CTR-HN01-081126-1001', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1001', 'SUCCESS', 'VNP1001', '2026-11-06 14:05:00'),
(2, 2, 'DEP-CTR-HN01-151126-1002', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1002', 'SUCCESS', 'VNP1002', '2026-11-07 10:05:00'),
(3, 3, 'DEP-CTR-HN01-041126-1003', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1003', 'FAILED', 'VNP1003', '2026-11-01 09:05:00'),
(4, 4, 'DEP-CTR-HN01-201026-1004', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1004', 'SUCCESS', 'VNP1004', '2026-10-18 10:05:00'),
(5, 4, 'REF-HN01-20261021-1004', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1004', 'SUCCESS', 'REF1004', '2026-10-21 10:00:00'),
(6, 5, 'DEP-CTR-HN01-151026-1005', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1005', 'SUCCESS', 'VNP1005', '2026-10-15 09:00:00'),
(7, 6, 'DEP-CTR-HN01-101026-1006', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1006', 'SUCCESS', 'VNP1006', '2026-10-10 09:00:00'),
(8, 7, 'DEP-CTR-HN01-250926-1007', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1007', 'SUCCESS', 'VNP1007', '2026-09-25 09:00:00'),
(9, 7, 'PEN-HN01-20261108-1007', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(10, 8, 'DEP-CTR-HN01-040826-1008', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1008', 'SUCCESS', 'VNP1008', '2026-08-04 09:00:00'),
(11, 8, 'PEN-HN01-20261108-1008', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(12, 9, 'DEP-CTR-HN01-011026-1009', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1009', 'SUCCESS', 'VNP1009', '2026-10-01 09:00:00'),
(13, 10, 'DEP-CTR-HN01-010826-1010', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1010', 'SUCCESS', 'VNP1010', '2026-08-01 09:00:00'),
(14, 10, 'REF-HN01-20260901-1010', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1010', 'SUCCESS', 'REF1010', '2026-09-01 11:00:00'),
(15, 11, 'DEP-CTR-HN02-081126-1011', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1011', 'SUCCESS', 'VNP1011', '2026-11-06 14:05:00'),
(16, 12, 'DEP-CTR-HN02-151126-1012', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1012', 'SUCCESS', 'VNP1012', '2026-11-07 10:05:00'),
(17, 13, 'DEP-CTR-HN02-041126-1013', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1013', 'FAILED', 'VNP1013', '2026-11-01 09:05:00'),
(18, 14, 'DEP-CTR-HN02-201026-1014', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1014', 'SUCCESS', 'VNP1014', '2026-10-18 10:05:00'),
(19, 14, 'REF-HN02-20261021-1014', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1014', 'SUCCESS', 'REF1014', '2026-10-21 10:00:00'),
(20, 15, 'DEP-CTR-HN02-151026-1015', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1015', 'SUCCESS', 'VNP1015', '2026-10-15 09:00:00'),
(21, 16, 'DEP-CTR-HN02-101026-1016', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1016', 'SUCCESS', 'VNP1016', '2026-10-10 09:00:00'),
(22, 17, 'DEP-CTR-HN02-250926-1017', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1017', 'SUCCESS', 'VNP1017', '2026-09-25 09:00:00'),
(23, 17, 'PEN-HN02-20261108-1017', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(24, 18, 'DEP-CTR-HN02-040826-1018', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1018', 'SUCCESS', 'VNP1018', '2026-08-04 09:00:00'),
(25, 18, 'PEN-HN02-20261108-1018', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(26, 19, 'DEP-CTR-HN02-011026-1019', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1019', 'SUCCESS', 'VNP1019', '2026-10-01 09:00:00'),
(27, 20, 'DEP-CTR-HN02-010826-1020', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1020', 'SUCCESS', 'VNP1020', '2026-08-01 09:00:00'),
(28, 20, 'REF-HN02-20260901-1020', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1020', 'SUCCESS', 'REF1020', '2026-09-01 11:00:00'),
(29, 21, 'DEP-CTR-HCM01-081126-1021', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1021', 'SUCCESS', 'VNP1021', '2026-11-06 14:05:00'),
(30, 22, 'DEP-CTR-HCM01-151126-1022', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1022', 'SUCCESS', 'VNP1022', '2026-11-07 10:05:00'),
(31, 23, 'DEP-CTR-HCM01-041126-1023', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1023', 'FAILED', 'VNP1023', '2026-11-01 09:05:00'),
(32, 24, 'DEP-CTR-HCM01-201026-1024', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1024', 'SUCCESS', 'VNP1024', '2026-10-18 10:05:00'),
(33, 24, 'REF-HCM01-20261021-1024', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1024', 'SUCCESS', 'REF1024', '2026-10-21 10:00:00'),
(34, 25, 'DEP-CTR-HCM01-151026-1025', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1025', 'SUCCESS', 'VNP1025', '2026-10-15 09:00:00'),
(35, 26, 'DEP-CTR-HCM01-101026-1026', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1026', 'SUCCESS', 'VNP1026', '2026-10-10 09:00:00'),
(36, 27, 'DEP-CTR-HCM01-250926-1027', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1027', 'SUCCESS', 'VNP1027', '2026-09-25 09:00:00'),
(37, 27, 'PEN-HCM01-20261108-1027', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(38, 28, 'DEP-CTR-HCM01-040826-1028', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1028', 'SUCCESS', 'VNP1028', '2026-08-04 09:00:00'),
(39, 28, 'PEN-HCM01-20261108-1028', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(40, 29, 'DEP-CTR-HCM01-011026-1029', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1029', 'SUCCESS', 'VNP1029', '2026-10-01 09:00:00'),
(41, 30, 'DEP-CTR-HCM01-010826-1030', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1030', 'SUCCESS', 'VNP1030', '2026-08-01 09:00:00'),
(42, 30, 'REF-HCM01-20260901-1030', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1030', 'SUCCESS', 'REF1030', '2026-09-01 11:00:00'),
(43, 31, 'DEP-CTR-HCM02-081126-1031', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1031', 'SUCCESS', 'VNP1031', '2026-11-06 14:05:00'),
(44, 32, 'DEP-CTR-HCM02-151126-1032', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1032', 'SUCCESS', 'VNP1032', '2026-11-07 10:05:00'),
(45, 33, 'DEP-CTR-HCM02-041126-1033', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1033', 'FAILED', 'VNP1033', '2026-11-01 09:05:00'),
(46, 34, 'DEP-CTR-HCM02-201026-1034', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1034', 'SUCCESS', 'VNP1034', '2026-10-18 10:05:00'),
(47, 34, 'REF-HCM02-20261021-1034', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1034', 'SUCCESS', 'REF1034', '2026-10-21 10:00:00'),
(48, 35, 'DEP-CTR-HCM02-151026-1035', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1035', 'SUCCESS', 'VNP1035', '2026-10-15 09:00:00'),
(49, 36, 'DEP-CTR-HCM02-101026-1036', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1036', 'SUCCESS', 'VNP1036', '2026-10-10 09:00:00'),
(50, 37, 'DEP-CTR-HCM02-250926-1037', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1037', 'SUCCESS', 'VNP1037', '2026-09-25 09:00:00'),
(51, 37, 'PEN-HCM02-20261108-1037', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(52, 38, 'DEP-CTR-HCM02-040826-1038', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1038', 'SUCCESS', 'VNP1038', '2026-08-04 09:00:00'),
(53, 38, 'PEN-HCM02-20261108-1038', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(54, 39, 'DEP-CTR-HCM02-011026-1039', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1039', 'SUCCESS', 'VNP1039', '2026-10-01 09:00:00'),
(55, 40, 'DEP-CTR-HCM02-010826-1040', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1040', 'SUCCESS', 'VNP1040', '2026-08-01 09:00:00'),
(56, 40, 'REF-HCM02-20260901-1040', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1040', 'SUCCESS', 'REF1040', '2026-09-01 11:00:00'),
(57, 41, 'DEP-CTR-HCM03-081126-1041', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1041', 'SUCCESS', 'VNP1041', '2026-11-06 14:05:00'),
(58, 42, 'DEP-CTR-HCM03-151126-1042', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1042', 'SUCCESS', 'VNP1042', '2026-11-07 10:05:00'),
(59, 43, 'DEP-CTR-HCM03-041126-1043', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1043', 'FAILED', 'VNP1043', '2026-11-01 09:05:00'),
(60, 44, 'DEP-CTR-HCM03-201026-1044', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1044', 'SUCCESS', 'VNP1044', '2026-10-18 10:05:00'),
(61, 44, 'REF-HCM03-20261021-1044', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1044', 'SUCCESS', 'REF1044', '2026-10-21 10:00:00'),
(62, 45, 'DEP-CTR-HCM03-151026-1045', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1045', 'SUCCESS', 'VNP1045', '2026-10-15 09:00:00'),
(63, 46, 'DEP-CTR-HCM03-101026-1046', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1046', 'SUCCESS', 'VNP1046', '2026-10-10 09:00:00'),
(64, 47, 'DEP-CTR-HCM03-250926-1047', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1047', 'SUCCESS', 'VNP1047', '2026-09-25 09:00:00'),
(65, 47, 'PEN-HCM03-20261108-1047', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(66, 48, 'DEP-CTR-HCM03-040826-1048', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1048', 'SUCCESS', 'VNP1048', '2026-08-04 09:00:00'),
(67, 48, 'PEN-HCM03-20261108-1048', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(68, 49, 'DEP-CTR-HCM03-011026-1049', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1049', 'SUCCESS', 'VNP1049', '2026-10-01 09:00:00'),
(69, 50, 'DEP-CTR-HCM03-010826-1050', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1050', 'SUCCESS', 'VNP1050', '2026-08-01 09:00:00'),
(70, 50, 'REF-HCM03-20260901-1050', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1050', 'SUCCESS', 'REF1050', '2026-09-01 11:00:00'),
(71, 51, 'DEP-CTR-DN01-081126-1051', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-06 14:00:00', '2026-11-08 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1051', 'SUCCESS', 'VNP1051', '2026-11-06 14:05:00'),
(72, 52, 'DEP-CTR-DN01-151126-1052', 'DEP', 4400000.00, 2000000.00, 2400000.00, NULL, '2026-11-07 10:00:00', '2026-11-15 23:59:59', 'PARTIALLY_PAID', 'BANK_TRANSFER', 'TXN_VNP_1052', 'SUCCESS', 'VNP1052', '2026-11-07 10:05:00'),
(73, 53, 'DEP-CTR-DN01-041126-1053', 'DEP', 4400000.00, 2000000.00, 0.00, NULL, '2026-11-01 09:00:00', '2026-11-04 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1053', 'FAILED', 'VNP1053', '2026-11-01 09:05:00'),
(74, 54, 'DEP-CTR-DN01-201026-1054', 'DEP', 2200000.00, 1000000.00, 0.00, NULL, '2026-10-18 10:00:00', '2026-10-25 23:59:59', 'CANCELLED', 'BANK_TRANSFER', 'TXN_VNP_1054', 'SUCCESS', 'VNP1054', '2026-10-18 10:05:00'),
(75, 54, 'REF-DN01-20261021-1054', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-20 15:30:00', '2026-10-22 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1054', 'SUCCESS', 'REF1054', '2026-10-21 10:00:00'),
(76, 55, 'DEP-CTR-DN01-151026-1055', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-14 09:05:00', '2026-10-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1055', 'SUCCESS', 'VNP1055', '2026-10-15 09:00:00'),
(77, 56, 'DEP-CTR-DN01-101026-1056', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-10-09 10:05:00', '2026-10-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1056', 'SUCCESS', 'VNP1056', '2026-10-10 09:00:00'),
(78, 57, 'DEP-CTR-DN01-250926-1057', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-24 09:05:00', '2026-09-25 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1057', 'SUCCESS', 'VNP1057', '2026-09-25 09:00:00'),
(79, 57, 'PEN-DN01-20261108-1057', 'OVERDUE_FEE', 700000.00, 0.00, 700000.00, NULL, '2026-10-26 00:00:00', '2026-11-08 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(80, 58, 'DEP-CTR-DN01-040826-1058', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-08-01 08:35:00', '2026-08-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1058', 'SUCCESS', 'VNP1058', '2026-08-04 09:00:00'),
(81, 58, 'PEN-DN01-20261108-1058', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-05 00:00:00', '2026-11-04 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(82, 59, 'DEP-CTR-DN01-011026-1059', 'DEP', 1700000.00, 1700000.00, 0.00, NULL, '2026-09-28 09:05:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1059', 'SUCCESS', 'VNP1059', '2026-10-01 09:00:00'),
(83, 60, 'DEP-CTR-DN01-010826-1060', 'DEP', 1100000.00, 1100000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1060', 'SUCCESS', 'VNP1060', '2026-08-01 09:00:00'),
(84, 60, 'REF-DN01-20260901-1060', 'REF', 500000.00, 500000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'REF_TXN_1060', 'SUCCESS', 'REF1060', '2026-09-01 11:00:00'),
(85, 61, 'DEP-CTR-CT01-010826-1061', 'DEP', 4400000.00, 4400000.00, 0.00, NULL, '2026-07-28 10:05:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TXN_VNP_1061', 'SUCCESS', 'VNP1061', '2026-08-01 09:00:00'),
(86, 61, 'REF-CT01-20260901-1061', 'REF', 2000000.00, 2000000.00, 0.00, NULL, '2026-09-01 10:30:00', '2026-09-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_010926_1061', 'SUCCESS', 'TCB0109261061', '2026-09-01 11:00:00');

-- 17. Mã PIN động mở cổng IoT 24/7 (GatePins)
INSERT INTO GatePin (gatePinId, contractId, pinCode, status, generatedAt, expiresAt) VALUES
(1, 5, '904400', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(2, 6, '313680', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(3, 9, '565668', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59'),
(4, 15, '257209', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(5, 16, '340049', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(6, 19, '567928', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59'),
(7, 25, '302527', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(8, 26, '933234', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(9, 29, '281524', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59'),
(10, 35, '211626', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(11, 36, '366263', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(12, 39, '174343', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59'),
(13, 45, '573016', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(14, 46, '341573', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(15, 49, '480330', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59'),
(16, 55, '206352', 'ACTIVE', '2026-10-15 09:00:00', '2026-11-20 23:59:59'),
(17, 56, '542133', 'ACTIVE', '2026-10-10 09:00:00', '2026-11-25 23:59:59'),
(18, 59, '973799', 'ACTIVE', '2026-10-01 09:00:00', '2026-12-01 23:59:59');

-- 18. Nhật ký quẹt cổng cơ sở (AuditLogs)
INSERT INTO AuditLog (auditLogId, accountId, facilityId, customerId, action, openedAt, reason, createdAt) VALUES
(1, 31, 1, 1, 'GATE_ACCESS_GRANTED - HN-01 Cổng Chính', '2026-10-15 08:30:15', 'Mã PIN động hợp lệ', '2026-10-15 08:30:15'),
(2, 32, 2, 2, 'GATE_ACCESS_GRANTED - HN-02 Cổng Chính', '2026-10-16 10:15:40', 'Mã PIN động hợp lệ', '2026-10-16 10:15:40'),
(3, 33, 3, 3, 'GATE_ACCESS_GRANTED - HCM-01 Cổng Chính', '2026-10-17 14:20:10', 'Mã PIN động hợp lệ', '2026-10-17 14:20:10'),
(4, 34, 4, 4, 'GATE_ACCESS_GRANTED - HCM-02 Cổng Chính', '2026-10-18 09:45:00', 'Mã PIN động hợp lệ', '2026-10-18 09:45:00'),
(5, 35, 5, 5, 'GATE_ACCESS_GRANTED - HCM-03 Cổng Chính', '2026-10-19 11:20:00', 'Mã PIN động hợp lệ', '2026-10-19 11:20:00'),
(6, 36, 6, 6, 'GATE_ACCESS_GRANTED - DN-01 Cổng Chính', '2026-10-20 14:15:00', 'Mã PIN động hợp lệ', '2026-10-20 14:15:00');

-- 19. Yêu cầu hỗ trợ & Sự cố vận hành SLA (SupportTickets)
INSERT INTO SupportTicket (id, ticketCode, type, status, customerId, facilityId, unitCode, contractId, title, description, desiredDate, assignedStaffId, slaDeadline, isSlaBreached, identityVerified, resolutionNote, createdAt, resolvedAt) VALUES
(1, 'TCK-202611-0001', 'EARLY_TERMINATION', 'SUBMITTED', 1, 1, 'HN01-F1-M02', 5, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 10, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(2, 'TCK-202611-0002', 'EARLY_TERMINATION', 'CANCELLED', 1, 1, 'HN01-F1-M03', 6, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 10, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(3, 'TCK-202610-0003', 'INCIDENT', 'RESOLVED', 1, 1, 'HN01-F1-S01', 9, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 10, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(4, 'TCK-202610-0004', 'MAINTENANCE', 'RESOLVED', 1, 1, 'HN01-F1-S01', 9, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 10, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),
(5, 'TCK-202611-0005', 'EARLY_TERMINATION', 'SUBMITTED', 2, 2, 'HN02-F1-M02', 15, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 13, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(6, 'TCK-202611-0006', 'EARLY_TERMINATION', 'CANCELLED', 2, 2, 'HN02-F1-M03', 16, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 13, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(7, 'TCK-202610-0007', 'INCIDENT', 'RESOLVED', 2, 2, 'HN02-F1-S01', 19, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 13, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(8, 'TCK-202610-0008', 'MAINTENANCE', 'RESOLVED', 2, 2, 'HN02-F1-S01', 19, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 13, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),
(9, 'TCK-202611-0009', 'EARLY_TERMINATION', 'SUBMITTED', 3, 3, 'HCM01-F1-M02', 25, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 16, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(10, 'TCK-202611-0010', 'EARLY_TERMINATION', 'CANCELLED', 3, 3, 'HCM01-F1-M03', 26, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 16, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(11, 'TCK-202610-0011', 'INCIDENT', 'RESOLVED', 3, 3, 'HCM01-F1-S01', 29, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 16, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(12, 'TCK-202610-0012', 'MAINTENANCE', 'RESOLVED', 3, 3, 'HCM01-F1-S01', 29, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 16, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),
(13, 'TCK-202611-0013', 'EARLY_TERMINATION', 'SUBMITTED', 4, 4, 'HCM02-F1-M02', 35, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 19, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(14, 'TCK-202611-0014', 'EARLY_TERMINATION', 'CANCELLED', 4, 4, 'HCM02-F1-M03', 36, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 19, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(15, 'TCK-202610-0015', 'INCIDENT', 'RESOLVED', 4, 4, 'HCM02-F1-S01', 39, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 19, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(16, 'TCK-202610-0016', 'MAINTENANCE', 'RESOLVED', 4, 4, 'HCM02-F1-S01', 39, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 19, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),
(17, 'TCK-202611-0017', 'EARLY_TERMINATION', 'SUBMITTED', 5, 5, 'HCM03-F1-M02', 45, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 22, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(18, 'TCK-202611-0018', 'EARLY_TERMINATION', 'CANCELLED', 5, 5, 'HCM03-F1-M03', 46, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 22, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(19, 'TCK-202610-0019', 'INCIDENT', 'RESOLVED', 5, 5, 'HCM03-F1-S01', 49, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 22, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(20, 'TCK-202610-0020', 'MAINTENANCE', 'RESOLVED', 5, 5, 'HCM03-F1-S01', 49, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 22, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),
(21, 'TCK-202611-0021', 'EARLY_TERMINATION', 'SUBMITTED', 6, 6, 'DN01-F1-M02', 55, 'Yêu cầu trả kho trước hạn', 'Khách hàng xin trả kho sớm vào ngày 08/11/2026', '2026-11-08', 25, '2026-11-08 18:00:00', 0, 1, NULL, '2026-11-06 08:30:00', NULL),
(22, 'TCK-202611-0022', 'EARLY_TERMINATION', 'CANCELLED', 6, 6, 'DN01-F1-M03', 56, 'Yêu cầu trả kho trước hạn', 'Khách hàng hẹn trả kho ngày 05/11/2026', '2026-11-05', 25, '2026-11-05 18:00:00', 1, 1, 'Khách hàng không đến cơ sở nghiệm thu vào ngày hẹn 05/11/2026. Lịch hẹn trả kho đã tự động đóng. Hợp đồng tiếp tục duy trì.', '2026-11-02 09:00:00', '2026-11-06 00:00:00'),
(23, 'TCK-202610-0023', 'INCIDENT', 'RESOLVED', 6, 6, 'DN01-F1-S01', 59, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 25, '2026-10-10 18:00:00', 0, 1, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(24, 'TCK-202610-0024', 'MAINTENANCE', 'RESOLVED', 6, 6, 'DN01-F1-S01', 59, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản.', NULL, 25, '2026-10-25 18:00:00', 0, 1, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn.', '2026-10-24 10:00:00', '2026-10-24 11:30:00');

-- Nhật ký hoạt động No-Show tự động (ActivityLog)
INSERT INTO ActivityLog (accountId, facilityId, action, description, createdAt) VALUES
(31, 1, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #3, ô HN01-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(31, 1, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0002 (ô HN01-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #6 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05'),
(32, 2, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #13, ô HN02-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(32, 2, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0006 (ô HN02-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #16 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05'),
(33, 3, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #23, ô HCM01-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(33, 3, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0010 (ô HCM01-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #26 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05'),
(34, 4, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #33, ô HCM02-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(34, 4, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0014 (ô HCM02-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #36 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05'),
(35, 5, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #43, ô HCM03-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(35, 5, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0018 (ô HCM03-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #46 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05'),
(36, 6, 'NO_SHOW_CANCELLED', 'Tự động hủy do No-Show hợp đồng #53, ô DN01-F1-L03 (ngày hẹn: 2026-11-04). Tịch thu 100% tiền cọc do quá hạn check-in.', '2026-11-05 00:00:05'),
(36, 6, 'EARLY_TERMINATION_NO_SHOW', 'Hệ thống tự động hủy lịch hẹn trả kho #TCK-202611-0022 (ô DN01-F1-M03) do khách hàng không đến nghiệm thu ngày 05/11/2026. Hợp đồng #56 vẫn tiếp tục ACTIVE.', '2026-11-06 00:00:05');

DELETE FROM Image WHERE typeCode = 1 AND facilityId IN (1, 2, 3, 4, 5, 6, 7);

INSERT INTO Image (typeCode, category, facilityId, contractId, paymentId, storagePath, originalFileName, contentType, fileSize, uploadedBy, uploadedAt, imageStatus) VALUES
(1, 'FACILITY_COVER', 1, NULL, NULL, 'facilities/FACILITY_COVER/hn01_cover.jpg', 'hn01_cover.jpg', 'image/jpeg', 99068, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 1, NULL, NULL, 'facilities/UNIT_STANDARD/hn01_standard.jpg', 'hn01_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 1, NULL, NULL, 'facilities/UNIT_CLIMATE/hn01_climate.jpg', 'hn01_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 2, NULL, NULL, 'facilities/FACILITY_COVER/hn02_cover.jpg', 'hn02_cover.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 2, NULL, NULL, 'facilities/UNIT_STANDARD/hn02_standard.jpg', 'hn02_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 2, NULL, NULL, 'facilities/UNIT_CLIMATE/hn02_climate.jpg', 'hn02_climate.jpg', 'image/jpeg', 99068, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 3, NULL, NULL, 'facilities/FACILITY_COVER/hcm01_cover.jpg', 'hcm01_cover.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 3, NULL, NULL, 'facilities/UNIT_STANDARD/hcm01_standard.jpg', 'hcm01_standard.jpg', 'image/jpeg', 99068, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 3, NULL, NULL, 'facilities/UNIT_CLIMATE/hcm01_climate.jpg', 'hcm01_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 4, NULL, NULL, 'facilities/FACILITY_COVER/hcm02_cover.jpg', 'hcm02_cover.jpg', 'image/jpeg', 91573, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 4, NULL, NULL, 'facilities/UNIT_STANDARD/hcm02_standard.jpg', 'hcm02_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 4, NULL, NULL, 'facilities/UNIT_CLIMATE/hcm02_climate.jpg', 'hcm02_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 5, NULL, NULL, 'facilities/FACILITY_COVER/hcm03_cover.jpg', 'hcm03_cover.jpg', 'image/jpeg', 117386, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 5, NULL, NULL, 'facilities/UNIT_STANDARD/hcm03_standard.jpg', 'hcm03_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 5, NULL, NULL, 'facilities/UNIT_CLIMATE/hcm03_climate.jpg', 'hcm03_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 6, NULL, NULL, 'facilities/FACILITY_COVER/dn01_cover.jpg', 'dn01_cover.jpg', 'image/jpeg', 56263, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 6, NULL, NULL, 'facilities/UNIT_STANDARD/dn01_standard.jpg', 'dn01_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 6, NULL, NULL, 'facilities/UNIT_CLIMATE/dn01_climate.jpg', 'dn01_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED'),
(1, 'FACILITY_COVER', 7, NULL, NULL, 'facilities/FACILITY_COVER/ct01_cover.jpg', 'ct01_cover.jpg', 'image/jpeg', 117488, 1, NOW(), 'LINKED'),
(1, 'UNIT_STANDARD', 7, NULL, NULL, 'facilities/UNIT_STANDARD/ct01_standard.jpg', 'ct01_standard.jpg', 'image/jpeg', 110665, 1, NOW(), 'LINKED'),
(1, 'UNIT_CLIMATE', 7, NULL, NULL, 'facilities/UNIT_CLIMATE/ct01_climate.jpg', 'ct01_climate.jpg', 'image/jpeg', 85989, 1, NOW(), 'LINKED');

-- 20. Biên bản nghiệm thu kiểm tra trả kho (Inspections & InspectionItems)
-- (Không có biên bản vi phạm phát sinh)



-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU SMART STORAGE SYSTEM
-- ============================================================================
