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
    roleName VARCHAR(50) NOT NULL UNIQUE
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
    action VARCHAR(100) NOT NULL,
    description TEXT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    CONSTRAINT fk_activity_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE
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
    status ENUM('AVAILABLE', 'HOLD', 'RESERVED', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RENTED', 'MAINTENANCE', 'OVERDUE') NOT NULL DEFAULT 'AVAILABLE',
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
-- 12. TABLE: Promotion (Chương trình khuyến mãi & Chiết khấu)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Promotion;
CREATE TABLE Promotion (
    promotionId INT AUTO_INCREMENT PRIMARY KEY,
    promotionName VARCHAR(100) NOT NULL,
    promotionType ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    discountValue DECIMAL(12, 2) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. TABLE: PromotionUnitType (Liên kết Khuyến mãi - Loại kho áp dụng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS PromotionUnitType;
CREATE TABLE PromotionUnitType (
    promotionId INT NOT NULL,
    unitTypeId INT NOT NULL,
    PRIMARY KEY (promotionId, unitTypeId),
    CONSTRAINT fk_promounit_promotion FOREIGN KEY (promotionId) REFERENCES Promotion (promotionId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_promounit_unittype FOREIGN KEY (unitTypeId) REFERENCES UnitType (unitTypeId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. TABLE: Shift (Ca trực vận hành)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Shift;
CREATE TABLE Shift (
    shiftId INT AUTO_INCREMENT PRIMARY KEY,
    shiftName VARCHAR(50) NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. TABLE: StaffShift (Phân công ca trực nhân viên tại cơ sở)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS StaffShift;
CREATE TABLE StaffShift (
    staffShiftId INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT NOT NULL,
    facilityId INT NOT NULL,
    shiftId INT NOT NULL,
    workDate DATE NOT NULL,
    status ENUM('SCHEDULED', 'ATTENDED', 'ABSENT', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT fk_staffshift_employee FOREIGN KEY (employeeId) REFERENCES EmployeeProfile (employeeId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_staffshift_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON UPDATE CASCADE,
    CONSTRAINT fk_staffshift_shift FOREIGN KEY (shiftId) REFERENCES Shift (shiftId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. TABLE: Reservation (Đơn giữ chỗ / Đặt trước kho)
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
-- 17. TABLE: Contract (Hợp đồng thuê kho - Chu trình 7 trạng thái)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Contract;
CREATE TABLE Contract (
    contractId INT AUTO_INCREMENT PRIMARY KEY,
    reservationId INT NOT NULL UNIQUE,
    pdfUrl VARCHAR(255),
    activatedAt DATETIME,
    terminatedAt DATETIME,
    status ENUM('INITIATED', 'PENDING_CHECKIN', 'ACTIVE', 'OVERDUE', 'TERMINATED', 'FORFEITED', 'CANCELED') NOT NULL DEFAULT 'INITIATED',
    cancelReason VARCHAR(50),
    refundBankName VARCHAR(100),
    refundAccountNumber VARCHAR(50),
    refundAccountName VARCHAR(100),
    CONSTRAINT fk_contract_reservation FOREIGN KEY (reservationId) REFERENCES Reservation (reservationId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. TABLE: Payment (Hóa đơn và Giao dịch thanh toán)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Payment;
CREATE TABLE Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    invoiceType ENUM('DEP', 'REF', 'INITIAL_RENTAL', 'MONTHLY_RENEWAL', 'OVERDUE_FEE', 'INSPECTION_DAMAGE') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    paidAmount DECIMAL(12, 2),
    remainingAmount DECIMAL(12, 2),
    pdfUrl VARCHAR(255),
    issuedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueAt DATETIME NOT NULL,
    status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    paymentMethod ENUM('VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH', 'VIETQR'),
    transactionCode VARCHAR(100),
    paymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    gatewayTransactionId VARCHAR(100),
    paidAt DATETIME,
    CONSTRAINT fk_payment_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
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
-- 20. TABLE: FeeItem (Danh mục biểu phí phụ thu / Bồi thường hư hỏng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS FeeItem;
CREATE TABLE FeeItem (
    feeItemId INT AUTO_INCREMENT PRIMARY KEY,
    feeName VARCHAR(100) NOT NULL,
    unitPrice DECIMAL(12, 2) NOT NULL,
    description VARCHAR(255),
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. TABLE: Inspection (Biên bản kiểm tra kho khi bàn giao / trả kho)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Inspection;
CREATE TABLE Inspection (
    inspectionId INT AUTO_INCREMENT PRIMARY KEY,
    paymentId INT NOT NULL,
    employeeId INT NOT NULL,
    inspectionDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    conditionStatus ENUM('CLEAN_PASS', 'DAMAGED_DIRTY') NOT NULL,
    CONSTRAINT fk_inspection_payment FOREIGN KEY (paymentId) REFERENCES Payment (paymentId) ON UPDATE CASCADE,
    CONSTRAINT fk_inspection_employee FOREIGN KEY (employeeId) REFERENCES EmployeeProfile (employeeId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. TABLE: InspectionItem (Chi tiết các hạng mục bồi thường hư hỏng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS InspectionItem;
CREATE TABLE InspectionItem (
    inspectionItemId INT AUTO_INCREMENT PRIMARY KEY,
    inspectionId INT NOT NULL,
    feeItemId INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    amount DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_inspitem_inspection FOREIGN KEY (inspectionId) REFERENCES Inspection (inspectionId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inspitem_feeitem FOREIGN KEY (feeItemId) REFERENCES FeeItem (feeItemId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. TABLE: SupportTicket (Yêu cầu hỗ trợ & Xử lý sự cố kỹ thuật SLA)
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
INSERT INTO Role (roleId, roleName) VALUES
(1, 'ADMIN'),
(2, 'BOM'),
(3, 'MANAGER'),
(4, 'STAFF'),
(5, 'CUSTOMER');

-- 2. 7 Cơ sở kho toàn quốc (Khớp 100% tài liệu Take note.txt)
INSERT INTO Facility (facilityId, facilityName, facilityCode, layoutType, address, phone, status) VALUES
(1, 'SmartStorage Cầu Giấy', 'HN-01', 'A', 'Số 391 Cầu Giấy, Q. Cầu Giấy, Hà Nội', '02439100001', 'ACTIVE'),
(2, 'SmartStorage Thanh Xuân', 'HN-02', 'B', 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', '02439100002', 'ACTIVE'),
(3, 'SmartStorage Quận 1', 'HCM-01', 'A', 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', '02839100001', 'ACTIVE'),
(4, 'SmartStorage Quận 7', 'HCM-02', 'B', 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', '02839100002', 'ACTIVE'),
(5, 'SmartStorage Thủ Đức', 'HCM-03', 'B', 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', '02839100003', 'ACTIVE'),
(6, 'SmartStorage Hải Châu', 'DN-01', 'A', 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', '02369100001', 'ACTIVE'),
(7, 'SmartStorage Ninh Kiều', 'CT-01', 'B', 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', '02929100001', 'ACTIVE');

-- 3. Tài khoản người dùng (Accounts)
-- Mật khẩu mặc định dev/test: 123456@Test (BCrypt: $2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW)
INSERT INTO Account (accountId, roleId, phone, fullName, email, password, status) VALUES
-- Admin hệ thống & Ban Giám Đốc BOM
(1, 1, '0900000001', 'Quản Trị Viên Hệ Thống', 'admin@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(2, 2, '0900000002', 'Ban Giám Đốc Điều Hành (BOM)', 'bom@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- Quản lý chi nhánh (Managers) cho ĐẦY ĐỦ 7 CƠ SỞ (Facility 1 -> 7)
(3, 3, '0900000003', 'Trần Văn Quản Lý', 'manager.hn01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(4, 3, '0900000004', 'Hoàng Minh Quản Lý', 'manager.hn02@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(5, 3, '0900000005', 'Lê Thị Quản Lý', 'manager.hcm01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(6, 3, '0900000006', 'Đỗ Đức Quản Lý', 'manager.hcm02@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(7, 3, '0900000007', 'Vũ Đình Quản Lý', 'manager.hcm03@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(8, 3, '0900000008', 'Nguyễn Thanh Quản Lý', 'manager.dn01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(9, 3, '0900000009', 'Bùi Tuấn Quản Lý', 'manager.ct01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- Nhân viên vận hành tại cơ sở (Staffs)
(10, 4, '0900000010', 'Nguyễn Văn Nhân Viên', 'staff.hn01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(11, 4, '0900000011', 'Phạm Thị Nhân Viên', 'staff.hcm01@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(12, 4, '0900000012', 'Đinh Văn Nhân Viên', 'staff.hcm02@smartstorage.vn', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),

-- Khách hàng cá nhân & Doanh nghiệp (Customers)
(13, 5, '0912345678', 'Nguyễn Khách Hàng A', 'customer.a@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(14, 5, '0987654321', 'Công Ty Cổ Phần SmartRetail', 'smartretail@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(15, 5, '0933445566', 'Trần Thị Bích Ngọc', 'bichngoc.tran@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(16, 5, '0977889900', 'Công Ty TNHH Logistics Express', 'logistics.express@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(17, 5, '0966778899', 'Lê Hoàng Long', 'hoanglong.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(18, 5, '0944556677', 'Vũ Mai Phương', 'maiphuong.vu@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE');

-- 4. Hồ sơ khách hàng (CustomerProfiles gắn CCCD 12 số chuẩn)
INSERT INTO CustomerProfile (customerId, accountId, identityNumber) VALUES
(1, 13, '001201012345'),
(2, 14, '079201098765'),
(3, 15, '001202023456'),
(4, 16, '079202087654'),
(5, 17, '048201034567'),
(6, 18, '092201045678');

-- 5. Hồ sơ nhân viên & Quản lý cơ sở (EmployeeProfiles gắn với từng cơ sở)
INSERT INTO EmployeeProfile (employeeId, accountId, facilityId) VALUES
(1, 3, 1),  -- Quản lý HN-01
(2, 4, 2),  -- Quản lý HN-02
(3, 5, 3),  -- Quản lý HCM-01
(4, 6, 4),  -- Quản lý HCM-02
(5, 7, 5),  -- Quản lý HCM-03
(6, 8, 6),  -- Quản lý DN-01
(7, 9, 7),  -- Quản lý CT-01
(8, 10, 1), -- Nhân viên HN-01
(9, 11, 3), -- Nhân viên HCM-01
(10, 12, 4); -- Nhân viên HCM-02

-- 6. Danh sách Tầng cho 7 Cơ sở (Mỗi cơ sở chuẩn hóa 3 tầng: Tầng Trệt, Tầng 1, Tầng 2)
INSERT INTO Floor (floorId, facilityId, floorName, maxLoadPerM2, status) VALUES
-- HN-01 (Cơ sở 1 - Mẫu Layout A 3 tầng)
(1, 1, 'Tầng Trệt (Sảnh & Kho XL)', 1000.00, 'ACTIVE'),
(2, 1, 'Tầng 1 (Kho S, M, L)', 500.00, 'ACTIVE'),
(3, 1, 'Tầng 2 (Kho S, M, L)', 500.00, 'ACTIVE'),

-- HN-02 (Cơ sở 2 - Mẫu Layout B 3 tầng)
(4, 2, 'Tầng Trệt (Kho XL Logistics)', 1200.00, 'ACTIVE'),
(5, 2, 'Tầng 1 (Kho M & L)', 600.00, 'ACTIVE'),
(6, 2, 'Tầng 2 (Kho M & L)', 600.00, 'ACTIVE'),

-- HCM-01 (Cơ sở 3 - Mẫu Layout A 3 tầng VIP 100% Kho mát)
(7, 3, 'Tầng Trệt (Kho Mát XL VIP)', 1000.00, 'ACTIVE'),
(8, 3, 'Tầng 1 (Kho Mát M & L)', 500.00, 'ACTIVE'),
(9, 3, 'Tầng 2 (Kho Mát M & L)', 500.00, 'ACTIVE'),

-- HCM-02 (Cơ sở 4 - Mẫu Layout B 3 tầng)
(10, 4, 'Tầng Trệt (Kho XL Pallet)', 1200.00, 'ACTIVE'),
(11, 4, 'Tầng 1 (Kho M & L)', 600.00, 'ACTIVE'),
(12, 4, 'Tầng 2 (Kho M & L)', 600.00, 'ACTIVE'),

-- HCM-03 (Cơ sở 5 - Mẫu Layout B 3 tầng)
(13, 5, 'Tầng Trệt (Kho XL Startup)', 1000.00, 'ACTIVE'),
(14, 5, 'Tầng 1 (Kho M & L)', 500.00, 'ACTIVE'),
(15, 5, 'Tầng 2 (Kho M & L)', 500.00, 'ACTIVE'),

-- DN-01 (Cơ sở 6 - Mẫu Layout A 3 tầng)
(16, 6, 'Tầng Trệt (Kho XL)', 1000.00, 'ACTIVE'),
(17, 6, 'Tầng 1 (Kho S, M, L)', 500.00, 'ACTIVE'),
(18, 6, 'Tầng 2 (Kho S, M, L)', 500.00, 'ACTIVE'),

-- CT-01 (Cơ sở 7 - Mẫu Layout B 3 tầng)
(19, 7, 'Tầng Trệt (Kho XL Hàng mẫu)', 1000.00, 'ACTIVE'),
(20, 7, 'Tầng 1 (Kho M & L)', 600.00, 'ACTIVE'),
(21, 7, 'Tầng 2 (Kho M & L)', 600.00, 'ACTIVE');

-- 7. Loại kho chuẩn (UnitTypes - Chiều cao cố định 2.0m)
INSERT INTO UnitType (unitTypeId, typeName, size, storageCondition, status) VALUES
(1, 'Size S (Tủ cá nhân)', '1.0m x 1.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(2, 'Size M (Phòng vừa)', '1.5m x 2.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(3, 'Size L (Phòng lớn)', '2.0m x 3.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(4, 'Size XL (Kho doanh nghiệp)', '2.5m x 4.0m x 2.0m', 'NORMAL', 'ACTIVE'),
(5, 'Size M - Climate (Kho mát VIP)', '1.5m x 2.0m x 2.0m', 'CLIMATE_CONTROLLED', 'ACTIVE'),
(6, 'Size L - Climate (Kho mát VIP)', '2.0m x 3.0m x 2.0m', 'CLIMATE_CONTROLLED', 'ACTIVE');

-- 8. Bảng giá thuê chuẩn & Mức cọc (Prices)
INSERT INTO Price (priceId, unitTypeId, dailyPrice, monthlyPrice, depositAmount, climateSurchargePercent, effectiveFrom, effectiveTo, status) VALUES
(1, 1, 30000.00, 600000.00, 500000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(2, 2, 60000.00, 1200000.00, 1000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(3, 3, 120000.00, 2400000.00, 2000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(4, 4, 200000.00, 4000000.00, 3000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(5, 5, 60000.00, 1200000.00, 1000000.00, 20.00, '2026-01-01', NULL, 'ACTIVE'),
(6, 6, 120000.00, 2400000.00, 2000000.00, 20.00, '2026-01-01', NULL, 'ACTIVE');

-- 9. Danh mục Ngăn kho thực tế (StorageUnits) phân bổ trên cả 7 cơ sở
INSERT INTO StorageUnit (unitCode, floorId, unitTypeId, status) VALUES
-- === CƠ SỞ 1: HN-01 (Cầu Giấy, Hà Nội) ===
-- Floor 1 (Trệt): 10 Ô Kho XL
('HN01-G-XL01', 1, 4, 'AVAILABLE'),
('HN01-G-XL02', 1, 4, 'OCCUPIED'),
('HN01-G-XL03', 1, 4, 'AVAILABLE'),
('HN01-G-XL04', 1, 4, 'AVAILABLE'),
('HN01-G-XL05', 1, 4, 'UNDER_MAINTENANCE'),
('HN01-G-XL06', 1, 4, 'AVAILABLE'),
('HN01-G-XL07', 1, 4, 'HOLD'),
('HN01-G-XL08', 1, 4, 'AVAILABLE'),
('HN01-G-XL09', 1, 4, 'OCCUPIED'),
('HN01-G-XL10', 1, 4, 'AVAILABLE'),
-- Floor 2 (Tầng 1): 8 ô S, 6 ô M, 4 ô L
('HN01-F1-S01', 2, 1, 'AVAILABLE'),
('HN01-F1-S02', 2, 1, 'OCCUPIED'),
('HN01-F1-S03', 2, 1, 'AVAILABLE'),
('HN01-F1-S04', 2, 1, 'OCCUPIED'),
('HN01-F1-S05', 2, 1, 'AVAILABLE'),
('HN01-F1-S06', 2, 1, 'AVAILABLE'),
('HN01-F1-S07', 2, 1, 'UNDER_MAINTENANCE'),
('HN01-F1-S08', 2, 1, 'AVAILABLE'),
('HN01-F1-M01', 2, 2, 'OCCUPIED'),
('HN01-F1-M02', 2, 2, 'AVAILABLE'),
('HN01-F1-M03', 2, 2, 'AVAILABLE'),
('HN01-F1-M04', 2, 2, 'HOLD'),
('HN01-F1-M05', 2, 2, 'AVAILABLE'),
('HN01-F1-M06', 2, 2, 'AVAILABLE'),
('HN01-F1-L01', 2, 3, 'AVAILABLE'),
('HN01-F1-L02', 2, 3, 'OCCUPIED'),
('HN01-F1-L03', 2, 3, 'AVAILABLE'),
('HN01-F1-L04', 2, 3, 'AVAILABLE'),
-- Floor 3 (Tầng 2): 6 ô S, 8 ô M, 4 ô L
('HN01-F2-S01', 3, 1, 'AVAILABLE'),
('HN01-F2-S02', 3, 1, 'OCCUPIED'),
('HN01-F2-S03', 3, 1, 'AVAILABLE'),
('HN01-F2-S04', 3, 1, 'AVAILABLE'),
('HN01-F2-S05', 3, 1, 'AVAILABLE'),
('HN01-F2-S06', 3, 1, 'AVAILABLE'),
('HN01-F2-M01', 3, 2, 'AVAILABLE'),
('HN01-F2-M02', 3, 2, 'AVAILABLE'),
('HN01-F2-M03', 3, 2, 'OCCUPIED'),
('HN01-F2-M04', 3, 2, 'HOLD'),
('HN01-F2-M05', 3, 2, 'AVAILABLE'),
('HN01-F2-M06', 3, 2, 'AVAILABLE'),
('HN01-F2-M07', 3, 2, 'AVAILABLE'),
('HN01-F2-M08', 3, 2, 'AVAILABLE'),
('HN01-F2-L01', 3, 3, 'UNDER_MAINTENANCE'),
('HN01-F2-L02', 3, 3, 'AVAILABLE'),
('HN01-F2-L03', 3, 3, 'OCCUPIED'),
('HN01-F2-L04', 3, 3, 'AVAILABLE'),

-- === CƠ SỞ 2: HN-02 (Thanh Xuân, Hà Nội - Mẫu B: 15 Ô Kho) ===
('HN02-G-XL01', 4, 4, 'OCCUPIED'),
('HN02-G-XL02', 4, 4, 'AVAILABLE'),
('HN02-G-XL03', 4, 4, 'AVAILABLE'),
('HN02-G-XL04', 4, 4, 'OCCUPIED'),
('HN02-G-XL05', 4, 4, 'AVAILABLE'),
('HN02-F1-M01', 5, 2, 'AVAILABLE'),
('HN02-F1-M02', 5, 2, 'OCCUPIED'),
('HN02-F1-M03', 5, 2, 'AVAILABLE'),
('HN02-F1-L01', 5, 3, 'OCCUPIED'),
('HN02-F1-L02', 5, 3, 'AVAILABLE'),
('HN02-F2-M01', 6, 2, 'AVAILABLE'),
('HN02-F2-M02', 6, 2, 'AVAILABLE'),
('HN02-F2-M03', 6, 2, 'AVAILABLE'),
('HN02-F2-L01', 6, 3, 'AVAILABLE'),
('HN02-F2-L02', 6, 3, 'OCCUPIED'),

-- === CƠ SỞ 3: HCM-01 (Quận 1, TP.HCM - Mẫu A VIP: 46 Ô Kho Mát) ===
('HCM01-G-XL01', 7, 6, 'OCCUPIED'),
('HCM01-G-XL02', 7, 6, 'AVAILABLE'),
('HCM01-G-XL03', 7, 6, 'AVAILABLE'),
('HCM01-G-XL04', 7, 6, 'OCCUPIED'),
('HCM01-G-XL05', 7, 6, 'AVAILABLE'),
('HCM01-G-XL06', 7, 6, 'AVAILABLE'),
('HCM01-G-XL07', 7, 6, 'AVAILABLE'),
('HCM01-G-XL08', 7, 6, 'AVAILABLE'),
('HCM01-G-XL09', 7, 6, 'AVAILABLE'),
('HCM01-G-XL10', 7, 6, 'AVAILABLE'),
('HCM01-F1-S01', 8, 1, 'AVAILABLE'),
('HCM01-F1-S02', 8, 1, 'AVAILABLE'),
('HCM01-F1-S03', 8, 1, 'AVAILABLE'),
('HCM01-F1-S04', 8, 1, 'AVAILABLE'),
('HCM01-F1-S05', 8, 1, 'AVAILABLE'),
('HCM01-F1-S06', 8, 1, 'AVAILABLE'),
('HCM01-F1-S07', 8, 1, 'AVAILABLE'),
('HCM01-F1-S08', 8, 1, 'AVAILABLE'),
('HCM01-F1-M01', 8, 5, 'OCCUPIED'),
('HCM01-F1-M02', 8, 5, 'AVAILABLE'),
('HCM01-F1-M03', 8, 5, 'HOLD'),
('HCM01-F1-M04', 8, 5, 'AVAILABLE'),
('HCM01-F1-M05', 8, 5, 'AVAILABLE'),
('HCM01-F1-M06', 8, 5, 'AVAILABLE'),
('HCM01-F1-L01', 8, 6, 'AVAILABLE'),
('HCM01-F1-L02', 8, 6, 'OCCUPIED'),
('HCM01-F1-L03', 8, 6, 'AVAILABLE'),
('HCM01-F1-L04', 8, 6, 'AVAILABLE'),
('HCM01-F2-S01', 9, 1, 'AVAILABLE'),
('HCM01-F2-S02', 9, 1, 'AVAILABLE'),
('HCM01-F2-S03', 9, 1, 'AVAILABLE'),
('HCM01-F2-S04', 9, 1, 'AVAILABLE'),
('HCM01-F2-S05', 9, 1, 'AVAILABLE'),
('HCM01-F2-S06', 9, 1, 'AVAILABLE'),
('HCM01-F2-S07', 9, 1, 'AVAILABLE'),
('HCM01-F2-S08', 9, 1, 'AVAILABLE'),
('HCM01-F2-M01', 9, 5, 'AVAILABLE'),
('HCM01-F2-M02', 9, 5, 'OCCUPIED'),
('HCM01-F2-M03', 9, 5, 'AVAILABLE'),
('HCM01-F2-M04', 9, 5, 'AVAILABLE'),
('HCM01-F2-M05', 9, 5, 'AVAILABLE'),
('HCM01-F2-M06', 9, 5, 'AVAILABLE'),
('HCM01-F2-L01', 9, 6, 'AVAILABLE'),
('HCM01-F2-L02', 9, 6, 'AVAILABLE'),
('HCM01-F2-L03', 9, 6, 'AVAILABLE'),
('HCM01-F2-L04', 9, 6, 'AVAILABLE'),

-- === CƠ SỞ 4: HCM-02 (Quận 7, TP.HCM - Mẫu B: 15 Ô Kho) ===
('HCM02-G-XL01', 10, 4, 'OCCUPIED'),
('HCM02-G-XL02', 10, 4, 'OCCUPIED'),
('HCM02-G-XL03', 10, 4, 'AVAILABLE'),
('HCM02-G-XL04', 10, 4, 'AVAILABLE'),
('HCM02-G-XL05', 10, 4, 'AVAILABLE'),
('HCM02-F1-M01', 11, 2, 'AVAILABLE'),
('HCM02-F1-M02', 11, 2, 'OCCUPIED'),
('HCM02-F1-M03', 11, 2, 'AVAILABLE'),
('HCM02-F1-L01', 11, 3, 'AVAILABLE'),
('HCM02-F1-L02', 11, 3, 'OCCUPIED'),
('HCM02-F2-M01', 12, 2, 'AVAILABLE'),
('HCM02-F2-M02', 12, 2, 'AVAILABLE'),
('HCM02-F2-M03', 12, 2, 'AVAILABLE'),
('HCM02-F2-L01', 12, 3, 'AVAILABLE'),
('HCM02-F2-L02', 12, 3, 'AVAILABLE'),

-- === CƠ SỞ 5: HCM-03 (Thủ Đức, TP.HCM - Mẫu B: 15 Ô Kho) ===
('HCM03-G-XL01', 13, 4, 'AVAILABLE'),
('HCM03-G-XL02', 13, 4, 'OCCUPIED'),
('HCM03-G-XL03', 13, 4, 'AVAILABLE'),
('HCM03-G-XL04', 13, 4, 'AVAILABLE'),
('HCM03-G-XL05', 13, 4, 'AVAILABLE'),
('HCM03-F1-M01', 14, 2, 'AVAILABLE'),
('HCM03-F1-M02', 14, 2, 'OCCUPIED'),
('HCM03-F1-M03', 14, 2, 'AVAILABLE'),
('HCM03-F1-L01', 14, 3, 'AVAILABLE'),
('HCM03-F1-L02', 14, 3, 'AVAILABLE'),
('HCM03-F2-M01', 15, 2, 'AVAILABLE'),
('HCM03-F2-M02', 15, 2, 'AVAILABLE'),
('HCM03-F2-M03', 15, 2, 'AVAILABLE'),
('HCM03-F2-L01', 15, 3, 'AVAILABLE'),
('HCM03-F2-L02', 15, 3, 'AVAILABLE'),

-- === CƠ SỞ 6: DN-01 (Hải Châu, Đà Nẵng - Mẫu A: 46 Ô Kho) ===
('DN01-G-XL01', 16, 4, 'AVAILABLE'),
('DN01-G-XL02', 16, 4, 'AVAILABLE'),
('DN01-G-XL03', 16, 4, 'AVAILABLE'),
('DN01-G-XL04', 16, 4, 'AVAILABLE'),
('DN01-G-XL05', 16, 4, 'AVAILABLE'),
('DN01-G-XL06', 16, 4, 'AVAILABLE'),
('DN01-G-XL07', 16, 4, 'AVAILABLE'),
('DN01-G-XL08', 16, 4, 'AVAILABLE'),
('DN01-G-XL09', 16, 4, 'AVAILABLE'),
('DN01-G-XL10', 16, 4, 'AVAILABLE'),
('DN01-F1-S01', 17, 1, 'AVAILABLE'),
('DN01-F1-S02', 17, 1, 'OCCUPIED'),
('DN01-F1-S03', 17, 1, 'AVAILABLE'),
('DN01-F1-S04', 17, 1, 'AVAILABLE'),
('DN01-F1-S05', 17, 1, 'AVAILABLE'),
('DN01-F1-S06', 17, 1, 'AVAILABLE'),
('DN01-F1-S07', 17, 1, 'AVAILABLE'),
('DN01-F1-S08', 17, 1, 'AVAILABLE'),
('DN01-F1-M01', 17, 2, 'AVAILABLE'),
('DN01-F1-M02', 17, 2, 'AVAILABLE'),
('DN01-F1-M03', 17, 2, 'AVAILABLE'),
('DN01-F1-M04', 17, 2, 'AVAILABLE'),
('DN01-F1-M05', 17, 2, 'AVAILABLE'),
('DN01-F1-M06', 17, 2, 'AVAILABLE'),
('DN01-F1-L01', 17, 3, 'AVAILABLE'),
('DN01-F1-L02', 17, 3, 'AVAILABLE'),
('DN01-F1-L03', 17, 3, 'AVAILABLE'),
('DN01-F1-L04', 17, 3, 'AVAILABLE'),
('DN01-F2-S01', 18, 1, 'AVAILABLE'),
('DN01-F2-S02', 18, 1, 'AVAILABLE'),
('DN01-F2-S03', 18, 1, 'AVAILABLE'),
('DN01-F2-S04', 18, 1, 'AVAILABLE'),
('DN01-F2-S05', 18, 1, 'AVAILABLE'),
('DN01-F2-S06', 18, 1, 'AVAILABLE'),
('DN01-F2-S07', 18, 1, 'AVAILABLE'),
('DN01-F2-S08', 18, 1, 'AVAILABLE'),
('DN01-F2-M01', 18, 2, 'AVAILABLE'),
('DN01-F2-M02', 18, 2, 'AVAILABLE'),
('DN01-F2-M03', 18, 2, 'AVAILABLE'),
('DN01-F2-M04', 18, 2, 'AVAILABLE'),
('DN01-F2-M05', 18, 2, 'AVAILABLE'),
('DN01-F2-M06', 18, 2, 'AVAILABLE'),
('DN01-F2-L01', 18, 3, 'AVAILABLE'),
('DN01-F2-L02', 18, 3, 'AVAILABLE'),
('DN01-F2-L03', 18, 3, 'AVAILABLE'),
('DN01-F2-L04', 18, 3, 'AVAILABLE'),

-- === CƠ SỞ 7: CT-01 (Ninh Kiều, Cần Thơ - Mẫu B: 15 Ô Kho) ===
('CT01-G-XL01', 19, 4, 'AVAILABLE'),
('CT01-G-XL02', 19, 4, 'OCCUPIED'),
('CT01-G-XL03', 19, 4, 'AVAILABLE'),
('CT01-G-XL04', 19, 4, 'AVAILABLE'),
('CT01-G-XL05', 19, 4, 'AVAILABLE'),
('CT01-F1-M01', 20, 2, 'OCCUPIED'),
('CT01-F1-M02', 20, 2, 'AVAILABLE'),
('CT01-F1-M03', 20, 2, 'AVAILABLE'),
('CT01-F1-L01', 20, 3, 'AVAILABLE'),
('CT01-F1-L02', 20, 3, 'AVAILABLE'),
('CT01-F2-M01', 21, 2, 'AVAILABLE'),
('CT01-F2-M02', 21, 2, 'AVAILABLE'),
('CT01-F2-M03', 21, 2, 'AVAILABLE'),
('CT01-F2-L01', 21, 3, 'AVAILABLE'),
('CT01-F2-L02', 21, 3, 'AVAILABLE');

-- 10. Ca trực vận hành (Shifts)
INSERT INTO Shift (shiftId, shiftName, startTime, endTime, status) VALUES
(1, 'Ca Sáng (Mở cổng & Kiểm tra sáng)', '06:00:00', '14:00:00', 'ACTIVE'),
(2, 'Ca Chiều (Vận hành & Hỗ trợ khách)', '14:00:00', '22:00:00', 'ACTIVE'),
(3, 'Ca Đêm (Giám sát an ninh IoT)', '22:00:00', '06:00:00', 'ACTIVE');

-- 11. Phân công ca trực mẫu (StaffShifts)
INSERT INTO StaffShift (staffShiftId, employeeId, facilityId, shiftId, workDate, status) VALUES
(1, 8, 1, 1, '2026-09-25', 'ATTENDED'),
(2, 9, 3, 2, '2026-09-25', 'ATTENDED'),
(3, 10, 4, 1, '2026-09-25', 'SCHEDULED');

-- 12. Chương trình khuyến mãi (Promotions)
INSERT INTO Promotion (promotionId, promotionName, promotionType, discountValue, startDate, endDate, status) VALUES
(1, 'Khuyến mãi Khai trương mùa Thu (-20%)', 'PERCENTAGE', 20.00, '2026-09-01', '2026-10-31', 'ACTIVE'),
(2, 'Ưu đãi Doanh nghiệp thuê dài hạn (-500k)', 'FIXED_AMOUNT', 500000.00, '2026-09-01', '2026-12-31', 'ACTIVE');

INSERT INTO PromotionUnitType (promotionId, unitTypeId) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4);

-- 13. Danh mục bồi thường hư hỏng / vệ sinh (FeeItems)
INSERT INTO FeeItem (feeItemId, feeName, unitPrice, description, status) VALUES
(1, 'Phí vệ sinh rác thông thường', 150000.00, 'Dọn dẹp rác cơ bản để lại trong kho', 'ACTIVE'),
(2, 'Phí vệ sinh chuyên sâu / tẩy rửa ố dầu mỡ', 400000.00, 'Tẩy rửa vết ố, dầu mỡ, chất lỏng bám sàn', 'ACTIVE'),
(3, 'Phí sửa chữa chốt khóa / tay nắm cửa', 250000.00, 'Thay thế chốt khóa cửa kho bị bẻ hỏng', 'ACTIVE'),
(4, 'Phí sơn vá lại vách ngăn kho', 350000.00, 'Xử lý trầy xước, đục khoét trên panel vách kho', 'ACTIVE'),
(5, 'Phí đền bù hư hỏng nan cửa cuốn', 1200000.00, 'Hư hỏng nan cửa cuốn, kẹt ray do ngoại lực', 'ACTIVE');

-- 14. Đơn giữ chỗ mẫu (Reservations) phân bổ đều các cơ sở
INSERT INTO Reservation (reservationId, reservationCode, accountId, unitCode, startDate, endDate, rentalType, rentalAmount, depositAmount, penaltyAmount, status, createdAt, holdExpiresAt) VALUES
-- HN-01
(1, 'RES-HN01-202609-001', 13, 'HN01-G-XL02', '2026-09-01', '2026-10-01', 'MONTHLY', 4000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-08-30 09:00:00', NULL),
(2, 'RES-HN01-202609-002', 14, 'HN01-F1-M01', '2026-09-15', '2026-12-15', 'MONTHLY', 3600000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-14 14:30:00', NULL),
(3, 'RES-HN01-202609-003', 15, 'HN01-F1-S02', '2026-09-20', '2026-10-20', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-19 11:00:00', NULL),
(4, 'RES-HN01-202609-004', 16, 'HN01-F1-L02', '2026-08-01', '2026-09-01', 'MONTHLY', 2400000.00, 2000000.00, 120000.00, 'CONFIRMED', '2026-07-30 08:00:00', NULL), -- Quá hạn
(5, 'RES-HN01-202609-005', 17, 'HN01-F2-M03', '2026-09-25', '2026-10-25', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-24 16:00:00', NULL),
-- HN-02
(6, 'RES-HN02-202609-001', 14, 'HN02-G-XL01', '2026-09-10', '2026-11-10', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-08 10:00:00', NULL),
(7, 'RES-HN02-202609-002', 17, 'HN02-F1-M02', '2026-09-12', '2026-10-12', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-10 15:00:00', NULL),
-- HCM-01 (Kho mát)
(8, 'RES-HCM01-202609-001', 15, 'HCM01-G-XL01', '2026-09-05', '2026-12-05', 'MONTHLY', 8640000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-09-03 09:30:00', NULL),
(9, 'RES-HCM01-202609-002', 13, 'HCM01-F1-M01', '2026-09-18', '2026-10-18', 'MONTHLY', 1440000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-17 14:00:00', NULL),
-- HCM-02
(10, 'RES-HCM02-202609-001', 16, 'HCM02-G-XL01', '2026-09-02', '2026-11-02', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-08-31 16:00:00', NULL),
-- HCM-03
(11, 'RES-HCM03-202609-001', 14, 'HCM03-G-XL02', '2026-09-05', '2026-10-05', 'MONTHLY', 4000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-04 10:30:00', NULL),
-- DN-01
(12, 'RES-DN01-202609-001', 18, 'DN01-G-XL01', '2026-09-15', '2026-10-15', 'MONTHLY', 2400000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-09-14 09:00:00', NULL),
-- CT-01
(13, 'RES-CT01-202609-001', 16, 'CT01-G-XL02', '2026-09-10', '2026-11-10', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-09 11:20:00', NULL);

-- 15. Hợp đồng thuê kho (Contracts) đa dạng trạng thái (ACTIVE, OVERDUE, PENDING_CHECKIN)
INSERT INTO Contract (contractId, reservationId, pdfUrl, activatedAt, terminatedAt, status, cancelReason, refundBankName, refundAccountNumber, refundAccountName) VALUES
(1, 1, '/contracts/HD-HN01-202609-001.pdf', '2026-09-01 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(2, 2, '/contracts/HD-HN01-202609-002.pdf', '2026-09-15 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(3, 3, '/contracts/HD-HN01-202609-003.pdf', '2026-09-20 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(4, 4, '/contracts/HD-HN01-202609-004.pdf', '2026-08-01 00:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL), -- Quá hạn BR-18
(5, 5, '/contracts/HD-HN01-202609-005.pdf', '2026-09-25 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(6, 6, '/contracts/HD-HN02-202609-001.pdf', '2026-09-10 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(7, 7, '/contracts/HD-HN02-202609-002.pdf', '2026-09-12 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(8, 8, '/contracts/HD-HCM01-202609-001.pdf', '2026-09-05 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(9, 9, '/contracts/HD-HCM01-202609-002.pdf', '2026-09-18 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(10, 10, '/contracts/HD-HCM02-202609-001.pdf', '2026-09-02 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(11, 11, '/contracts/HD-HCM03-202609-001.pdf', '2026-09-05 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(12, 12, '/contracts/HD-DN01-202609-001.pdf', '2026-09-15 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(13, 13, '/contracts/HD-CT01-202609-001.pdf', '2026-09-10 00:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL);

-- 16. Hóa đơn và Thanh toán (Payments)
INSERT INTO Payment (paymentId, contractId, invoiceNumber, invoiceType, amount, paidAmount, remainingAmount, pdfUrl, issuedAt, dueAt, status, paymentMethod, transactionCode, paymentStatus, gatewayTransactionId, paidAt) VALUES
-- Hóa đơn tiền thuê ban đầu (INITIAL_RENTAL)
(1, 1, 'INV-HN01-2609-001', 'INITIAL_RENTAL', 4000000.00, 4000000.00, 0.00, '/invoices/INV-001.pdf', '2026-08-30 09:15:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_998811', 'SUCCESS', 'VNP14882711', '2026-08-30 09:20:00'),
(2, 2, 'INV-HN01-2609-002', 'INITIAL_RENTAL', 3600000.00, 3600000.00, 0.00, '/invoices/INV-002.pdf', '2026-09-14 14:40:00', '2026-09-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'MB_BANK_882910', 'SUCCESS', 'FT2625718991', '2026-09-14 14:45:00'),
(3, 3, 'INV-HN01-2609-003', 'INITIAL_RENTAL', 600000.00, 600000.00, 0.00, '/invoices/INV-003.pdf', '2026-09-19 11:10:00', '2026-09-20 23:59:59', 'PAID', 'VIETQR', 'VIETQR_992102', 'SUCCESS', 'QR992102', '2026-09-19 11:15:00'),
(4, 4, 'INV-HN01-2609-004', 'OVERDUE_FEE', 120000.00, 0.00, 120000.00, '/invoices/INV-004.pdf', '2026-09-02 00:00:00', '2026-09-05 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(5, 5, 'INV-HN01-2609-005', 'INITIAL_RENTAL', 1200000.00, 1200000.00, 0.00, '/invoices/INV-005.pdf', '2026-09-24 16:10:00', '2026-09-25 23:59:59', 'PAID', 'MOMO', 'MOMO_881902', 'SUCCESS', 'MM881902', '2026-09-24 16:15:00'),
(6, 6, 'INV-HN02-2609-001', 'INITIAL_RENTAL', 8000000.00, 8000000.00, 0.00, '/invoices/INV-006.pdf', '2026-09-08 10:15:00', '2026-09-10 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_882199', 'SUCCESS', 'VNP882199', '2026-09-08 10:20:00'),
(7, 7, 'INV-HN02-2609-002', 'INITIAL_RENTAL', 1200000.00, 1200000.00, 0.00, '/invoices/INV-007.pdf', '2026-09-10 15:10:00', '2026-09-12 23:59:59', 'PAID', 'VIETQR', 'VIETQR_339102', 'SUCCESS', 'QR339102', '2026-09-10 15:15:00'),
(8, 8, 'INV-HCM01-2609-001', 'INITIAL_RENTAL', 8640000.00, 8640000.00, 0.00, '/invoices/INV-008.pdf', '2026-09-03 09:40:00', '2026-09-05 23:59:59', 'PAID', 'BANK_TRANSFER', 'VCB_772910', 'SUCCESS', 'VCB772910', '2026-09-03 09:45:00'),
(9, 9, 'INV-HCM01-2609-002', 'INITIAL_RENTAL', 1440000.00, 1440000.00, 0.00, '/invoices/INV-009.pdf', '2026-09-17 14:10:00', '2026-09-18 23:59:59', 'PAID', 'MOMO', 'MOMO_339102', 'SUCCESS', 'MM339102', '2026-09-17 14:15:00'),
(10, 10, 'INV-HCM02-2609-001', 'INITIAL_RENTAL', 8000000.00, 8000000.00, 0.00, '/invoices/INV-010.pdf', '2026-08-31 16:10:00', '2026-09-02 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_552199', 'SUCCESS', 'VNP552199', '2026-08-31 16:15:00'),
(11, 11, 'INV-HCM03-2609-001', 'INITIAL_RENTAL', 4000000.00, 4000000.00, 0.00, '/invoices/INV-011.pdf', '2026-09-04 10:40:00', '2026-09-05 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_992102', 'SUCCESS', 'TCB992102', '2026-09-04 10:45:00'),
(12, 12, 'INV-DN01-2609-001', 'INITIAL_RENTAL', 2400000.00, 2400000.00, 0.00, '/invoices/INV-012.pdf', '2026-09-14 09:10:00', '2026-09-15 23:59:59', 'PAID', 'VIETQR', 'VIETQR_771920', 'SUCCESS', 'QR771920', '2026-09-14 09:15:00'),
(13, 13, 'INV-CT01-2609-001', 'INITIAL_RENTAL', 8000000.00, 8000000.00, 0.00, '/invoices/INV-013.pdf', '2026-09-09 11:30:00', '2026-09-10 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_119201', 'SUCCESS', 'VNP119201', '2026-09-09 11:35:00');

-- 17. Mã PIN động mở cổng IoT 24/7 (GatePins)
INSERT INTO GatePin (gatePinId, contractId, pinCode, status, generatedAt, expiresAt) VALUES
(1, 1, '839201', 'ACTIVE', '2026-09-25 18:00:00', '2026-09-25 18:00:30'),
(2, 2, '194726', 'EXPIRED', '2026-09-25 17:59:00', '2026-09-25 17:59:30'),
(3, 3, '551920', 'ACTIVE', '2026-09-25 18:02:00', '2026-09-25 18:02:30'),
(4, 5, '339102', 'ACTIVE', '2026-09-25 18:05:00', '2026-09-25 18:05:30'),
(5, 8, '771920', 'ACTIVE', '2026-09-25 18:08:00', '2026-09-25 18:08:30');

-- 18. Nhật ký quẹt cổng cơ sở (AuditLogs)
INSERT INTO AuditLog (auditLogId, accountId, facilityId, customerId, action, openedAt, reason, createdAt) VALUES
(1, 13, 1, 1, 'GATE_ACCESS_GRANTED - HN-01 Cổng Chính', '2026-09-25 08:30:15', 'Mã PIN động hợp lệ', '2026-09-25 08:30:15'),
(2, 14, 1, 2, 'GATE_ACCESS_GRANTED - HN-01 Thang máy hàng', '2026-09-25 10:15:40', 'Mã PIN động hợp lệ', '2026-09-25 10:15:40'),
(3, 15, 3, 3, 'GATE_ACCESS_GRANTED - HCM-01 Cổng VIP', '2026-09-25 14:20:10', 'Mã PIN động hợp lệ', '2026-09-25 14:20:10'),
(4, 16, 4, 4, 'GATE_ACCESS_GRANTED - HCM-02 Cổng Xe Tải', '2026-09-25 15:45:00', 'Mã PIN động hợp lệ', '2026-09-25 15:45:00');

-- 19. Yêu cầu hỗ trợ & Sự cố vận hành SLA (SupportTickets)
INSERT INTO SupportTicket (id, ticketCode, type, status, customerId, facilityId, unitCode, contractId, title, description, desiredDate, assignedStaffId, slaDeadline, isSlaBreached, identityVerified, resolutionNote, createdAt, resolvedAt) VALUES
(1, 'TK-HN01-202609-001', 'INCIDENT', 'RESOLVED', 1, 1, 'HN01-G-XL02', 1, 'Mã PIN mở cổng đôi lúc phản hồi chậm', 'Khách hàng quẹt cổng chính mất 5-10s để IoT nhận tín hiệu', NULL, 8, '2026-09-20 18:00:00', FALSE, TRUE, 'Đã cấu hình reset module controller cổng chính và tối ưu cache PIN', '2026-09-20 14:00:00', '2026-09-20 15:30:00'),
(2, 'TK-HN01-202609-002', 'INCIDENT', 'IN_PROGRESS', 2, 1, 'HN01-F1-M01', 2, 'Cần mượn xe nâng pallet tầng trệt', 'Doanh nghiệp nhập thêm 2 kiện hàng nặng cần xe kéo tay trợ lực', NULL, 8, '2026-09-25 13:00:00', FALSE, TRUE, NULL, '2026-09-25 09:00:00', NULL),
(3, 'TK-HCM01-202609-001', 'INCIDENT', 'RESOLVED', 3, 3, 'HCM01-G-XL01', 8, 'Kiểm tra độ ẩm kho mát VIP', 'Yêu cầu nhân viên kiểm tra nhiệt độ buồng kho rượu vang', NULL, 9, '2026-09-22 17:00:00', FALSE, TRUE, 'Nhiệt độ đo thực tế 23.5°C, độ ẩm 55%, đạt chuẩn bảo quản rượu vang', '2026-09-22 14:30:00', '2026-09-22 16:00:00'),
(4, 'TK-HN02-202609-001', 'EARLY_TERMINATION', 'SUBMITTED', 4, 2, 'HN02-G-XL01', 6, 'Yêu cầu trả kho trước hạn 15 ngày', 'Khách hàng đã chuyển văn phòng xong và muốn làm thủ tục nghiệm thu bàn giao kho sớm', '2026-10-15', NULL, NULL, FALSE, FALSE, NULL, '2026-09-24 10:00:00', NULL),
(5, 'TK-HCM02-202609-001', 'INCIDENT', 'IN_PROGRESS', 5, 4, 'HCM02-G-XL01', 10, 'Đèn chiếu sáng hành lang số 2 chập chờn', 'Đèn LED cảm biến phía trước cửa kho nhấp nháy vào ban đêm', NULL, 10, '2026-09-25 20:00:00', FALSE, TRUE, NULL, '2026-09-25 16:30:00', NULL);

-- ============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU SMART STORAGE SYSTEM
-- ============================================================================
