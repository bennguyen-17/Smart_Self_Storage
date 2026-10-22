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
    status ENUM('INITIATED', 'PENDING_CHECKIN', 'ACTIVE', 'OVERDUE', 'TERMINATED', 'COMPLETED', 'FORFEITED', 'CANCELED') NOT NULL DEFAULT 'INITIATED',
    cancelReason VARCHAR(255),
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
    invoiceType ENUM('DEP', 'EXT', 'PEN', 'CMP', 'REF', 'INITIAL_RENTAL', 'MONTHLY_RENEWAL', 'OVERDUE_FEE', 'INSPECTION_DAMAGE') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    paidAmount DECIMAL(12, 2),
    remainingAmount DECIMAL(12, 2),
    pdfUrl VARCHAR(255),
    issuedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueAt DATETIME NOT NULL,
    status ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
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
(31, 5, '0912345678', 'Nguyễn Thành Long', 'customer.long@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(32, 5, '0987654321', 'Trần Thu Hà', 'customer.ha@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(33, 5, '0933445566', 'Trần Thị Bích Ngọc', 'bichngoc.tran@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(34, 5, '0977889900', 'Lê Hữu Đạt', 'dat.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(35, 5, '0966778899', 'Lê Hoàng Long', 'hoanglong.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(36, 5, '0944556677', 'Vũ Mai Phương', 'maiphuong.vu@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE');

-- 4. Hồ sơ khách hàng (CustomerProfiles gắn CCCD 12 số chuẩn)
INSERT INTO CustomerProfile (customerId, accountId, identityNumber) VALUES
(1, 31, '001201012345'),
(2, 32, '079201098765'),
(3, 33, '001202023456'),
(4, 34, '079202087654'),
(5, 35, '048201034567'),
(6, 36, '092201045678');

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
('HN01-G-XL07', 1, 4, 'RESERVED'),
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
('HN01-F1-M01', 2, 2, 'AVAILABLE'),
('HN01-F1-M02', 2, 2, 'AVAILABLE'),
('HN01-F1-M03', 2, 2, 'AVAILABLE'),
('HN01-F1-M04', 2, 2, 'RESERVED'),
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
('HN01-F2-M04', 3, 2, 'RESERVED'),
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
('HCM01-F1-M03', 8, 5, 'AVAILABLE'),
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
('HCM02-G-XL02', 10, 4, 'UNDER_MAINTENANCE'),
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
(1, 'Ca Sáng', '08:00:00', '12:00:00', 'ACTIVE'),
(2, 'Ca Chiều', '12:00:00', '16:00:00', 'ACTIVE'),
(3, 'Ca Tối', '16:00:00', '20:00:00', 'ACTIVE');

-- 11. Phân công ca trực mẫu (StaffShifts)
INSERT INTO StaffShift (staffShiftId, employeeId, facilityId, shiftId, workDate, status) VALUES
(1, 8, 1, 1, '2026-10-18', 'ATTENDED'),
(2, 9, 1, 2, '2026-10-18', 'ATTENDED'),
(3, 10, 1, 3, '2026-10-18', 'SCHEDULED'),
(4, 11, 2, 1, '2026-10-18', 'ATTENDED'),
(5, 14, 3, 1, '2026-10-18', 'ATTENDED'),
(6, 17, 4, 1, '2026-10-18', 'ATTENDED'),
(7, 20, 5, 1, '2026-10-18', 'ATTENDED'),
(8, 23, 6, 1, '2026-10-18', 'ATTENDED'),
(9, 26, 7, 1, '2026-10-18', 'ATTENDED');

-- 12. Chương trình khuyến mãi (Promotions)
INSERT INTO Promotion (promotionId, promotionName, promotionType, discountValue, startDate, endDate, status) VALUES
(1, 'Khuyến mãi Khai trương mùa Thu (-20%)', 'PERCENTAGE', 20.00, '2026-09-01', '2026-10-31', 'ACTIVE'),
(2, 'Ưu đãi Doanh nghiệp thuê dài hạn (-500k)', 'FIXED_AMOUNT', 500000.00, '2026-09-01', '2026-12-31', 'ACTIVE');

INSERT INTO PromotionUnitType (promotionId, unitTypeId) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4);

-- 13. Danh mục bồi thường hư hỏng / vệ sinh (FeeItems theo chuẩn BR-33)
INSERT INTO FeeItem (feeItemId, feeName, unitPrice, description, status) VALUES
(1, 'Phí vệ sinh kho', 150000.00, 'Dọn dẹp rác cơ bản hoặc vệ sinh kho sau khi trả kho', 'ACTIVE'),
(2, 'Mất chìa khóa cơ mở tủ', 200000.00, 'Đền bù làm lại chìa khóa cơ / thay ổ khóa tủ cá nhân', 'ACTIVE'),
(3, 'Phí sơn lại / vá điểm trầy xước', 300000.00, 'Xử lý trầy xước, dặm vá sơn bề mặt vách ngăn', 'ACTIVE'),
(4, 'Hư hỏng bóng đèn / ổ cắm', 300000.00, 'Thay thế bóng đèn LED hoặc ổ cắm điện bị cháy hỏng', 'ACTIVE'),
(5, 'Vách ngăn ô kho bị móp / thủng', 500000.00, 'Gia cố hoặc thay tấm vách panel ngăn ô kho bị va đập móp méo', 'ACTIVE'),
(6, 'Hư hỏng cửa kho / khóa cửa chính', 1000000.00, 'Sửa chữa cửa cuốn, thay thế khóa cửa chính ô kho', 'ACTIVE');

-- 14. Đơn đặt chỗ mẫu (Reservations) trải dài 07/2026 - 10/2026 (Chuẩn mã: CTR-[Mã Cơ Sở]-[DDMMYY]-[4 số])
INSERT INTO Reservation (reservationId, reservationCode, accountId, unitCode, startDate, endDate, rentalType, rentalAmount, depositAmount, penaltyAmount, status, createdAt, holdExpiresAt) VALUES
-- HĐ 1: HN-01 (Đã kết thúc đúng hạn 15/09/2026, hoàn cọc)
(1, 'CTR-HN01-150726-1001', 31, 'HN01-F1-M01', '2026-07-15', '2026-09-15', 'MONTHLY', 2400000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-07-14 09:00:00', NULL),

-- HĐ 2: HCM-01 (Trả kho trước hạn 25/09/2026, trừ 150k vệ sinh, hoàn cọc)
(2, 'CTR-HCM01-200726-1002', 32, 'HCM01-F1-M02', '2026-07-20', '2026-10-20', 'MONTHLY', 4320000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-07-19 14:00:00', NULL),

-- HĐ 3: HN-01 (No-Show ngày 05/10/2026 -> 00:00:00 ngày 06/10 tự hủy, tịch thu 100% cọc)
(3, 'CTR-HN01-051026-1003', 33, 'HN01-F1-M02', '2026-10-05', '2026-11-05', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-10-03 14:00:00', NULL),

-- HĐ 4: HN-02 (Khách tự hủy ngày 27/09 trước ngày bắt đầu 02/10 >= 4 ngày, hoàn 100% cọc)
(4, 'CTR-HN02-250926-1004', 34, 'HN02-F1-M03', '2026-10-02', '2026-11-02', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-25 10:00:00', NULL),

-- HĐ 5: HCM-02 (Quá hạn > 30 ngày từ 01/08/2026 -> 02/09/2026 tịch thu tài sản FORFEITED)
(5, 'CTR-HCM02-010726-1005', 35, 'HCM02-G-XL02', '2026-07-01', '2026-08-01', 'MONTHLY', 4000000.00, 3000000.00, 1500000.00, 'CONFIRMED', '2026-06-29 08:00:00', NULL),

-- HĐ 6: HN-01 (Quá hạn 17 ngày từ 01/10/2026 -> nợ phạt 850.000đ OVERDUE)
(6, 'CTR-HN01-010926-1006', 36, 'HN01-F1-L02', '2026-09-01', '2026-10-01', 'MONTHLY', 2400000.00, 2000000.00, 850000.00, 'CONFIRMED', '2026-08-30 08:30:00', NULL),

-- HĐ 7: HN-01 (ACTIVE - Kho XL 3 tháng 01/09/2026 -> 01/12/2026)
(7, 'CTR-HN01-010926-1007', 31, 'HN01-G-XL02', '2026-09-01', '2026-12-01', 'MONTHLY', 12000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-08-30 09:00:00', NULL),

-- HĐ 8: HN-01 (ACTIVE - Kho S 3 tháng 15/09/2026 -> 15/12/2026)
(8, 'CTR-HN01-150926-1008', 32, 'HN01-F1-S02', '2026-09-15', '2026-12-15', 'MONTHLY', 1800000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-14 10:00:00', NULL),

-- HĐ 9: HN-01 (ACTIVE - Kho S 20/08/2026 -> 20/09/2026, đã gia hạn thêm 2 tháng đến 20/11/2026)
(9, 'CTR-HN01-200826-1009', 33, 'HN01-F1-S04', '2026-08-20', '2026-11-20', 'MONTHLY', 1800000.00, 500000.00, 0.00, 'CONFIRMED', '2026-08-19 11:00:00', NULL),

-- HĐ 10: HN-01 (ACTIVE - Sắp hết hạn T-3: 21/09/2026 -> 21/10/2026)
(10, 'CTR-HN01-210926-1010', 34, 'HN01-F2-M03', '2026-09-21', '2026-10-21', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-20 15:00:00', NULL),

-- HĐ 11: HN-02 (ACTIVE - Kho XL 10/09/2026 -> 10/12/2026)
(11, 'CTR-HN02-100926-1011', 35, 'HN02-G-XL01', '2026-09-10', '2026-12-10', 'MONTHLY', 12000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-08 10:00:00', NULL),

-- HĐ 12: HN-02 (ACTIVE - Kho M 12/09/2026 -> 12/11/2026)
(12, 'CTR-HN02-120926-1012', 36, 'HN02-F1-M02', '2026-09-12', '2026-11-12', 'MONTHLY', 2400000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-10 15:00:00', NULL),

-- HĐ 13: HCM-01 (ACTIVE - Kho Mát XL 05/09/2026 -> 05/12/2026)
(13, 'CTR-HCM01-050926-1013', 31, 'HCM01-G-XL01', '2026-09-05', '2026-12-05', 'MONTHLY', 8640000.00, 2000000.00, 0.00, 'CONFIRMED', '2026-09-03 09:30:00', NULL),

-- HĐ 14: HCM-01 (ACTIVE - Kho Mát M 18/09/2026 -> 18/11/2026)
(14, 'CTR-HCM01-180926-1014', 32, 'HCM01-F1-M01', '2026-09-18', '2026-11-18', 'MONTHLY', 2880000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-17 14:00:00', NULL),

-- HĐ 15: HCM-02 (ACTIVE - Kho XL 02/09/2026 -> 02/11/2026)
(15, 'CTR-HCM02-020926-1015', 33, 'HCM02-G-XL01', '2026-09-02', '2026-11-02', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-08-31 16:00:00', NULL),

-- HĐ 16: HCM-03 (ACTIVE - Kho XL 05/09/2026 -> 05/11/2026)
(16, 'CTR-HCM03-050926-1016', 34, 'HCM03-G-XL02', '2026-09-05', '2026-11-05', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-04 10:30:00', NULL),

-- HĐ 17: DN-01 (ACTIVE - Kho S 15/09/2026 -> 15/11/2026)
(17, 'CTR-DN01-150926-1017', 35, 'DN01-F1-S02', '2026-09-15', '2026-11-15', 'MONTHLY', 1200000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-14 09:00:00', NULL),

-- HĐ 18: CT-01 (ACTIVE - Kho XL 10/09/2026 -> 10/11/2026)
(18, 'CTR-CT01-100926-1018', 36, 'CT01-G-XL02', '2026-09-10', '2026-11-10', 'MONTHLY', 8000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-09 11:20:00', NULL),

-- HĐ 19: HN-01 (PENDING_CHECKIN - Hẹn nhận kho HÔM NAY 18/10/2026, đã cọc 1tr online, chờ thu 1.2tr tại quầy)
(19, 'CTR-HN01-181026-1019', 31, 'HN01-F1-M04', '2026-10-18', '2026-11-18', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-17 14:00:00', NULL),

-- HĐ 20: HN-01 (PENDING_CHECKIN - Hẹn nhận kho HÔM NAY 18/10/2026, đã cọc 3tr online, chờ thu 4.0tr tại quầy)
(20, 'CTR-HN01-181026-1020', 32, 'HN01-G-XL07', '2026-10-18', '2026-11-18', 'MONTHLY', 4000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-10-17 16:30:00', NULL),

-- HĐ 21: HN-01 (PENDING_CHECKIN - Hẹn nhận kho NGÀY MAI 19/10/2026, đã cọc 1tr online, chờ thu 1.2tr tại quầy)
(21, 'CTR-HN01-181026-1021', 33, 'HN01-F2-M04', '2026-10-19', '2026-11-19', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-18 10:15:00', NULL);

-- 15. Hợp đồng thuê kho (Contracts) đa dạng chu trình 7 trạng thái chuẩn BR-21
INSERT INTO Contract (contractId, reservationId, pdfUrl, activatedAt, terminatedAt, status, cancelReason, refundBankName, refundAccountNumber, refundAccountName) VALUES
-- HĐ 1: Đã thanh lý hoàn cọc đúng hạn
(1, 1, '/contracts/CTR-HN01-150726-1001.pdf', '2026-07-15 09:00:00', '2026-09-15 10:30:00', 'TERMINATED', NULL, 'MBBank', '0912345678', 'NGUYEN THANH LONG'),

-- HĐ 2: Trả kho trước hạn (Early Termination)
(2, 2, '/contracts/CTR-HCM01-200726-1002.pdf', '2026-07-20 10:00:00', '2026-09-25 11:00:00', 'TERMINATED', 'Khách hàng tất toán hợp đồng trước hạn theo biên bản nghiệm thu', 'Vietcombank', '079201098765', 'TRAN THU HA'),

-- HĐ 3: Quá hạn check-in (No-Show) tự động hủy & tịch thu 100% cọc
(3, 3, '/contracts/CTR-HN01-051026-1003.pdf', NULL, NULL, 'CANCELED', 'Quá hạn check-in (No-Show). Tịch thu 100% tiền cọc theo quy định BR-20.', NULL, NULL, NULL),

-- HĐ 4: Khách chủ động hủy trước ngày bắt đầu >= 4 ngày, hoàn 100% cọc
(4, 4, '/contracts/CTR-HN02-250926-1004.pdf', NULL, NULL, 'CANCELED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Techcombank', '079202087654', 'LE HUU DAT'),

-- HĐ 5: Quá hạn trên 30 ngày bị tịch thu tài sản (FORFEITED)
(5, 5, '/contracts/CTR-HCM02-010726-1005.pdf', '2026-07-01 08:30:00', NULL, 'FORFEITED', 'Quá hạn thanh lý trên 30 ngày. Tịch thu quyền sử dụng tài sản theo quy định BR-21.', NULL, NULL, NULL),

-- HĐ 6: Quá hạn nợ phạt 17 ngày (OVERDUE)
(6, 6, '/contracts/CTR-HN01-010926-1006.pdf', '2026-09-01 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),

-- HĐ 7 -> 18: Các hợp đồng đang hoạt động hợp lệ (ACTIVE)
(7, 7, '/contracts/CTR-HN01-010926-1007.pdf', '2026-09-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(8, 8, '/contracts/CTR-HN01-150926-1008.pdf', '2026-09-15 10:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(9, 9, '/contracts/CTR-HN01-200826-1009.pdf', '2026-08-20 11:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(10, 10, '/contracts/CTR-HN01-210926-1010.pdf', '2026-09-21 15:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(11, 11, '/contracts/CTR-HN02-100926-1011.pdf', '2026-09-10 10:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(12, 12, '/contracts/CTR-HN02-120926-1012.pdf', '2026-09-12 15:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(13, 13, '/contracts/CTR-HCM01-050926-1013.pdf', '2026-09-05 09:30:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(14, 14, '/contracts/CTR-HCM01-180926-1014.pdf', '2026-09-18 14:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(15, 15, '/contracts/CTR-HCM02-020926-1015.pdf', '2026-09-02 16:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(16, 16, '/contracts/CTR-HCM03-050926-1016.pdf', '2026-09-05 10:30:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(17, 17, '/contracts/CTR-DN01-150926-1017.pdf', '2026-09-15 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(18, 18, '/contracts/CTR-CT01-100926-1018.pdf', '2026-09-10 11:20:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),

-- HĐ 19 -> 21: Đang chờ check-in tại quầy (PENDING_CHECKIN)
(19, 19, '/contracts/CTR-HN01-181026-1019.pdf', NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(20, 20, '/contracts/CTR-HN01-181026-1020.pdf', NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),
(21, 21, '/contracts/CTR-HN01-181026-1021.pdf', NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL);

-- 16. Hóa đơn và Thanh toán (Payments) chuẩn mã định danh BR-37
INSERT INTO Payment (paymentId, contractId, invoiceNumber, invoiceType, amount, paidAmount, remainingAmount, pdfUrl, issuedAt, dueAt, status, paymentMethod, transactionCode, paymentStatus, gatewayTransactionId, paidAt) VALUES
-- HĐ 1 (HN-01, Đã kết thúc): DEP hoàn tất, REF hoàn cọc 1tr
(1, 1, 'DEP-CTR-HN01-150726-1001', 'DEP', 3400000.00, 3400000.00, 0.00, '/invoices/INV-001.pdf', '2026-07-14 09:10:00', '2026-07-15 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_150726_1001', 'SUCCESS', 'VNP1507261001', '2026-07-15 09:05:00'),
(2, 1, 'REF-HN01-20260915-1001', 'REF', 1000000.00, 1000000.00, 0.00, '/invoices/INV-002.pdf', '2026-09-15 10:15:00', '2026-09-17 23:59:59', 'PAID', 'BANK_TRANSFER', 'MB_150926_1001', 'SUCCESS', 'MB2609151001', '2026-09-15 10:35:00'),

-- HĐ 2 (HCM-01, Trả trước hạn): DEP hoàn tất, REF hoàn cọc thừa sau trừ 150k phí vệ sinh
(3, 2, 'DEP-CTR-HCM01-200726-1002', 'DEP', 5320000.00, 5320000.00, 0.00, '/invoices/INV-003.pdf', '2026-07-19 14:10:00', '2026-07-20 23:59:59', 'PAID', 'MOMO', 'MM_200726_1002', 'SUCCESS', 'MM2007261002', '2026-07-20 10:05:00'),
(4, 2, 'REF-HCM01-20260925-1002', 'REF', 850000.00, 850000.00, 0.00, '/invoices/INV-004.pdf', '2026-09-25 10:45:00', '2026-09-27 23:59:59', 'PAID', 'BANK_TRANSFER', 'VCB_250926_1002', 'SUCCESS', 'VCB2609251002', '2026-09-25 11:15:00'),

-- HĐ 3 (HN-01, No-Show tự hủy): DEP cọc 1tr bị hủy, không hoàn
(5, 3, 'DEP-CTR-HN01-051026-1003', 'DEP', 2200000.00, 1000000.00, 1200000.00, '/invoices/INV-005.pdf', '2026-10-03 14:05:00', '2026-10-05 23:59:59', 'CANCELLED', 'VIETQR', 'TXN_VQR_031026_1003', 'SUCCESS', 'QR0310261003', '2026-10-03 14:15:00'),

-- HĐ 4 (HN-02, Khách tự hủy >= 4 ngày): DEP hủy, REF hoàn 100% cọc
(6, 4, 'DEP-CTR-HN02-250926-1004', 'DEP', 2200000.00, 1000000.00, 1200000.00, '/invoices/INV-006.pdf', '2026-09-25 10:05:00', '2026-10-02 23:59:59', 'CANCELLED', 'VNPAY', 'TXN_VNP_250926_1004', 'SUCCESS', 'VNP2509261004', '2026-09-25 10:15:00'),
(7, 4, 'REF-HN02-20260927-1004', 'REF', 1000000.00, 1000000.00, 0.00, '/invoices/INV-007.pdf', '2026-09-27 15:30:00', '2026-09-29 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_270926_1004', 'SUCCESS', 'TCB2609271004', '2026-09-27 16:00:00'),

-- HĐ 5 (HCM-02, Forfeited): DEP hoàn tất, PEN phạt gộp 30 ngày (1.5tr) nợ quá hạn
(8, 5, 'DEP-CTR-HCM02-010726-1005', 'DEP', 7000000.00, 7000000.00, 0.00, '/invoices/INV-008.pdf', '2026-06-29 08:10:00', '2026-07-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_010726_1005', 'SUCCESS', 'TCB0107261005', '2026-07-01 08:35:00'),
(9, 5, 'PEN-HCM02-20260902-1005', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, '/invoices/INV-009.pdf', '2026-09-02 00:00:00', '2026-09-02 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),

-- HĐ 6 (HN-01, Overdue 17 ngày): DEP hoàn tất, PEN phạt gộp 17 ngày (850k) nợ quá hạn
(10, 6, 'DEP-CTR-HN01-010926-1006', 'DEP', 4400000.00, 4400000.00, 0.00, '/invoices/INV-010.pdf', '2026-08-30 08:35:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_010926_1006', 'SUCCESS', 'VNP0109261006', '2026-09-01 09:10:00'),
(11, 6, 'PEN-HN01-20261018-1006', 'OVERDUE_FEE', 850000.00, 0.00, 850000.00, '/invoices/INV-011.pdf', '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),

-- HĐ 7 -> 18 (ACTIVE các cơ sở)
(12, 7, 'DEP-CTR-HN01-010926-1007', 'DEP', 15000000.00, 15000000.00, 0.00, '/invoices/INV-012.pdf', '2026-08-30 09:15:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_998811', 'SUCCESS', 'VNP14882711', '2026-09-01 09:05:00'),
(13, 8, 'DEP-CTR-HN01-150926-1008', 'DEP', 2300000.00, 2300000.00, 0.00, '/invoices/INV-013.pdf', '2026-09-14 10:10:00', '2026-09-15 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_992102', 'SUCCESS', 'QR992102', '2026-09-15 10:05:00'),
(14, 9, 'DEP-CTR-HN01-200826-1009', 'DEP', 1100000.00, 1100000.00, 0.00, '/invoices/INV-014.pdf', '2026-08-19 11:10:00', '2026-08-20 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_200826_1009', 'SUCCESS', 'VNP2008261009', '2026-08-20 11:05:00'),
(15, 9, 'EXT-CTR-HN01-200826-1009-8819', 'MONTHLY_RENEWAL', 1200000.00, 1200000.00, 0.00, '/invoices/INV-015.pdf', '2026-09-18 10:00:00', '2026-09-20 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_EXT_8819', 'SUCCESS', 'QREXT8819', '2026-09-18 10:05:00'),
(16, 10, 'DEP-CTR-HN01-210926-1010', 'DEP', 2200000.00, 2200000.00, 0.00, '/invoices/INV-016.pdf', '2026-09-20 15:10:00', '2026-09-21 23:59:59', 'PAID', 'MOMO', 'TXN_MM_881902', 'SUCCESS', 'MM881902', '2026-09-21 15:05:00'),
(17, 11, 'DEP-CTR-HN02-100926-1011', 'DEP', 15000000.00, 15000000.00, 0.00, '/invoices/INV-017.pdf', '2026-09-08 10:15:00', '2026-09-10 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_882199', 'SUCCESS', 'VNP882199', '2026-09-10 10:05:00'),
(18, 12, 'DEP-CTR-HN02-120926-1012', 'DEP', 3400000.00, 3400000.00, 0.00, '/invoices/INV-018.pdf', '2026-09-10 15:10:00', '2026-09-12 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_339102', 'SUCCESS', 'QR339102', '2026-09-12 15:05:00'),
(19, 13, 'DEP-CTR-HCM01-050926-1013', 'DEP', 10640000.00, 10640000.00, 0.00, '/invoices/INV-019.pdf', '2026-09-03 09:40:00', '2026-09-05 23:59:59', 'PAID', 'BANK_TRANSFER', 'VCB_772910', 'SUCCESS', 'VCB772910', '2026-09-05 09:35:00'),
(20, 14, 'DEP-CTR-HCM01-180926-1014', 'DEP', 3880000.00, 3880000.00, 0.00, '/invoices/INV-020.pdf', '2026-09-17 14:10:00', '2026-09-18 23:59:59', 'PAID', 'MOMO', 'TXN_MM_339102', 'SUCCESS', 'MM339102', '2026-09-18 14:05:00'),
(21, 15, 'DEP-CTR-HCM02-020926-1015', 'DEP', 11000000.00, 11000000.00, 0.00, '/invoices/INV-021.pdf', '2026-08-31 16:10:00', '2026-09-02 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_552199', 'SUCCESS', 'VNP552199', '2026-09-02 16:05:00'),
(22, 16, 'DEP-CTR-HCM03-050926-1016', 'DEP', 11000000.00, 11000000.00, 0.00, '/invoices/INV-022.pdf', '2026-09-04 10:40:00', '2026-09-05 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_992102', 'SUCCESS', 'TCB992102', '2026-09-05 10:35:00'),
(23, 17, 'DEP-CTR-DN01-150926-1017', 'DEP', 1700000.00, 1700000.00, 0.00, '/invoices/INV-023.pdf', '2026-09-14 09:10:00', '2026-09-15 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_771920', 'SUCCESS', 'QR771920', '2026-09-15 09:05:00'),
(24, 18, 'DEP-CTR-CT01-100926-1018', 'DEP', 11000000.00, 11000000.00, 0.00, '/invoices/INV-024.pdf', '2026-09-09 11:30:00', '2026-09-10 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_119201', 'SUCCESS', 'VNP119201', '2026-09-10 11:25:00'),

-- HĐ 19 -> 21: PENDING_CHECKIN (Chỉ cọc 100% online -> PARTIALLY_PAID, tiền thuê chờ thu tại quầy)
(25, 19, 'DEP-CTR-HN01-181026-1019', 'DEP', 2200000.00, 1000000.00, 1200000.00, '/invoices/INV-025.pdf', '2026-10-17 14:00:00', '2026-10-18 23:59:59', 'PARTIALLY_PAID', 'VNPAY', 'TXN_VNP_181026_1019', 'SUCCESS', 'VNP1810261019', '2026-10-17 14:05:00'),
(26, 20, 'DEP-CTR-HN01-181026-1020', 'DEP', 7000000.00, 3000000.00, 4000000.00, '/invoices/INV-026.pdf', '2026-10-17 16:30:00', '2026-10-18 23:59:59', 'PARTIALLY_PAID', 'VIETQR', 'TXN_VQR_181026_1020', 'SUCCESS', 'QR1810261020', '2026-10-17 16:35:00'),
(27, 21, 'DEP-CTR-HN01-181026-1021', 'DEP', 2200000.00, 1000000.00, 1200000.00, '/invoices/INV-027.pdf', '2026-10-18 10:15:00', '2026-10-19 23:59:59', 'PARTIALLY_PAID', 'VNPAY', 'TXN_VNP_181026_1021', 'SUCCESS', 'VNP1810261021', '2026-10-18 10:20:00');

-- 17. Mã PIN động mở cổng IoT 24/7 (GatePins)
INSERT INTO GatePin (gatePinId, contractId, pinCode, status, generatedAt, expiresAt) VALUES
(1, 7, '839201', 'ACTIVE', '2026-10-18 08:00:00', '2026-10-18 23:59:59'),
(2, 8, '194726', 'ACTIVE', '2026-10-18 08:00:00', '2026-10-18 23:59:59'),
(3, 9, '551920', 'ACTIVE', '2026-10-18 08:00:00', '2026-10-18 23:59:59'),
(4, 10, '339102', 'ACTIVE', '2026-10-18 08:00:00', '2026-10-18 23:59:59'),
(5, 13, '771920', 'ACTIVE', '2026-10-18 08:00:00', '2026-10-18 23:59:59');

-- 18. Nhật ký quẹt cổng cơ sở (AuditLogs)
INSERT INTO AuditLog (auditLogId, accountId, facilityId, customerId, action, openedAt, reason, createdAt) VALUES
(1, 31, 1, 1, 'GATE_ACCESS_GRANTED - HN-01 Cổng Chính', '2026-10-15 08:30:15', 'Mã PIN động hợp lệ', '2026-10-15 08:30:15'),
(2, 32, 1, 2, 'GATE_ACCESS_GRANTED - HN-01 Thang máy hàng', '2026-10-16 10:15:40', 'Mã PIN động hợp lệ', '2026-10-16 10:15:40'),
(3, 31, 3, 1, 'GATE_ACCESS_GRANTED - HCM-01 Cổng VIP', '2026-10-17 14:20:10', 'Mã PIN động hợp lệ', '2026-10-17 14:20:10'),
(4, 33, 4, 3, 'GATE_ACCESS_GRANTED - HCM-02 Cổng Xe Tải', '2026-10-18 09:45:00', 'Mã PIN động hợp lệ', '2026-10-18 09:45:00');

-- 19. Yêu cầu hỗ trợ & Sự cố vận hành SLA (SupportTickets)
INSERT INTO SupportTicket (id, ticketCode, type, status, customerId, facilityId, unitCode, contractId, title, description, desiredDate, assignedStaffId, slaDeadline, isSlaBreached, identityVerified, resolutionNote, createdAt, resolvedAt) VALUES
(1, 'TCK-202609-001', 'EARLY_TERMINATION', 'RESOLVED', 2, 3, 'HCM01-F1-M02', 2, 'Yêu cầu trả kho sớm', 'Khách hàng có kế hoạch dọn sang cơ sở khác nên xin thanh lý trước hạn vào ngày 25/09/2026', '2026-09-25', 14, NULL, FALSE, TRUE, 'Đã hoàn tất nghiệm thu và tất toán tiền cọc theo biên bản', '2026-09-20 09:00:00', '2026-09-25 11:00:00'),
(2, 'TCK-202610-001', 'INCIDENT', 'RESOLVED', 1, 1, 'HN01-G-XL02', 7, 'Báo sự cố kỹ thuật', 'Khách hàng quẹt cổng chính mất 5-10s để IoT nhận tín hiệu', NULL, 8, '2026-10-10 18:00:00', FALSE, TRUE, 'Đã cấu hình reset module controller cổng chính và tối ưu cache PIN', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(3, 'TCK-202610-002', 'INCIDENT', 'IN_PROGRESS', 2, 1, 'HN01-F1-S02', 8, 'Hỗ trợ thiết bị kho', 'Khách hàng nhập thêm kiện hàng nặng cần xe đẩy trợ lực', NULL, 9, '2026-10-18 13:00:00', FALSE, TRUE, NULL, '2026-10-18 09:00:00', NULL),
(4, 'TCK-202610-003', 'INCIDENT', 'RESOLVED', 1, 3, 'HCM01-G-XL01', 13, 'Kiểm tra kỹ thuật kho', 'Yêu cầu nhân viên kiểm tra nhiệt độ buồng kho rượu vang', NULL, 14, '2026-10-12 17:00:00', FALSE, TRUE, 'Nhiệt độ thực tế 23°C, độ ẩm 55%, đạt chuẩn bảo quản rượu vang', '2026-10-12 10:00:00', '2026-10-12 11:30:00'),
(5, 'TCK-202610-004', 'INCIDENT', 'IN_PROGRESS', 6, 2, 'HN02-F1-M02', 12, 'Bảo trì cơ sở vật chất', 'Đèn LED cảm biến phía trước cửa kho nhấp nháy vào ban đêm', NULL, 11, '2026-10-18 20:00:00', FALSE, TRUE, NULL, '2026-10-17 16:30:00', NULL);

-- 20. Biên bản nghiệm thu kiểm tra trả kho (Inspections & InspectionItems)
INSERT INTO Inspection (inspectionId, paymentId, employeeId, inspectionDate, conditionStatus) VALUES
(1, 4, 14, '2026-09-25 10:30:00', 'DAMAGED_DIRTY');

INSERT INTO InspectionItem (inspectionItemId, inspectionId, feeItemId, quantity, amount) VALUES
(1, 1, 1, 1, 150000.00);

-- ============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU SMART STORAGE SYSTEM
-- ============================================================================
