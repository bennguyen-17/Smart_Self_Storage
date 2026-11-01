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
-- 11.1. TABLE: FeeItem (Danh mục biểu phí phạt, ưu đãi & bồi thường hư hỏng)
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
    status ENUM('SCHEDULED', 'ATTENDED', 'COMPLETED', 'ABSENT', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
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
    activatedAt DATETIME,
    terminatedAt DATETIME,
    status ENUM('INITIATED', 'PENDING_CHECKIN', 'ACTIVE', 'OVERDUE', 'TERMINATED', 'COMPLETED', 'FORFEITED', 'CANCELLED') NOT NULL DEFAULT 'INITIATED',
    forfeitProcessed BOOLEAN NOT NULL DEFAULT FALSE,
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
    receiptUrl VARCHAR(500), -- Đường dẫn ảnh biên lai chuyển khoản hoàn tiền cọc
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
-- 19. TABLE: StaffTask (Việc được giao theo ca cho Staff)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS StaffTask;
CREATE TABLE StaffTask (
    taskId INT AUTO_INCREMENT PRIMARY KEY,
    facilityId INT NOT NULL,
    assignedEmployeeId INT NOT NULL,
    assignedByAccountId INT NOT NULL,
    taskType ENUM('MAINTENANCE', 'CHECKOUT_INSPECTION', 'CHECKIN_HANDOVER', 'INCIDENT') NOT NULL,
    unitCode VARCHAR(50),
    contractId INT,
    note TEXT,
    status ENUM('ASSIGNED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    workDate DATE NOT NULL,
    shiftId INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    doneAt DATETIME,
    INDEX idx_stafftask_facility_date_shift (facilityId, workDate, shiftId, status),
    INDEX idx_stafftask_employee_date_shift (assignedEmployeeId, workDate, shiftId, status),
    CONSTRAINT fk_stafftask_facility FOREIGN KEY (facilityId) REFERENCES Facility (facilityId) ON UPDATE CASCADE,
    CONSTRAINT fk_stafftask_employee FOREIGN KEY (assignedEmployeeId) REFERENCES EmployeeProfile (employeeId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_stafftask_assigned_by FOREIGN KEY (assignedByAccountId) REFERENCES Account (accountId) ON UPDATE CASCADE,
    CONSTRAINT fk_stafftask_shift FOREIGN KEY (shiftId) REFERENCES Shift (shiftId) ON UPDATE CASCADE,
    CONSTRAINT fk_stafftask_unit FOREIGN KEY (unitCode) REFERENCES StorageUnit (unitCode) ON UPDATE CASCADE,
    CONSTRAINT fk_stafftask_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. TABLE: GatePin (Mã PIN động mở cổng IoT cơ sở 15s - 30s)
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
(31, 5, '0912345678', 'Nguyễn Thành Long', 'customer.long@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(32, 5, '0987654321', 'Trần Thu Hà', 'customer.ha@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(33, 5, '0933445566', 'Trần Thị Bích Ngọc', 'bichngoc.tran@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(34, 5, '0977889900', 'Lê Hữu Đạt', 'dat.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(35, 5, '0966778899', 'Lê Hoàng Long', 'hoanglong.le@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE'),
(36, 5, '0944556677', 'Vũ Mai Phương', 'maiphuong.vu@gmail.com', '$2a$10$V48pz49Bx4OKVMB9lwDKY.yOSJQhRrrCJbMt3DY7x9ZSRm3aFmxPW', 'ACTIVE');

-- 4. Hồ sơ khách hàng (CustomerProfiles gắn CCCD 12 số chuẩn)
INSERT INTO CustomerProfile (customerId, accountId, identityNumber, bankName, bankAccountNumber, bankAccountName) VALUES
(1, 31, '001201012345', 'MBBank', '0912345678', 'NGUYEN THANH LONG'),
(2, 32, '079201098765', 'Vietcombank', '079201098765', 'TRAN THU HA'),
(3, 33, '001202023456', 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(4, 34, '079202087654', 'Techcombank', '079202087654', 'LE HUU DAT'),
(5, 35, '048201034567', 'VietinBank', '108876543210', 'LE HOANG LONG'),
(6, 36, '092201045678', 'ACB', '246813579', 'VU MAI PHUONG');

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
(1, 1, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(2, 1, 'Tầng 1', 500.00, 'ACTIVE'),
(3, 1, 'Tầng 2', 500.00, 'ACTIVE'),

-- HN-02 (Cơ sở 2 - Mẫu Layout B 3 tầng)
(4, 2, 'Tầng Trệt', 1200.00, 'ACTIVE'),
(5, 2, 'Tầng 1', 600.00, 'ACTIVE'),
(6, 2, 'Tầng 2', 600.00, 'ACTIVE'),

-- HCM-01 (Cơ sở 3 - Mẫu Layout A 3 tầng VIP 100% Kho mát)
(7, 3, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(8, 3, 'Tầng 1', 500.00, 'ACTIVE'),
(9, 3, 'Tầng 2', 500.00, 'ACTIVE'),

-- HCM-02 (Cơ sở 4 - Mẫu Layout B 3 tầng)
(10, 4, 'Tầng Trệt', 1200.00, 'ACTIVE'),
(11, 4, 'Tầng 1', 600.00, 'ACTIVE'),
(12, 4, 'Tầng 2', 600.00, 'ACTIVE'),

-- HCM-03 (Cơ sở 5 - Mẫu Layout B 3 tầng)
(13, 5, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(14, 5, 'Tầng 1', 500.00, 'ACTIVE'),
(15, 5, 'Tầng 2', 500.00, 'ACTIVE'),

-- DN-01 (Cơ sở 6 - Mẫu Layout A 3 tầng)
(16, 6, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(17, 6, 'Tầng 1', 500.00, 'ACTIVE'),
(18, 6, 'Tầng 2', 500.00, 'ACTIVE'),

-- CT-01 (Cơ sở 7 - Mẫu Layout B 3 tầng)
(19, 7, 'Tầng Trệt', 1000.00, 'ACTIVE'),
(20, 7, 'Tầng 1', 600.00, 'ACTIVE'),
(21, 7, 'Tầng 2', 600.00, 'ACTIVE');

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
(4, 'OVERDUE_DAILY_RATE', 'Mức Phạt Theo Ngày Quá Hạn', 'PENALTY', 'FIXED', 50000.00, 'PER_DAY', 'Phạt 50.000 VNĐ mỗi ngày quá hạn thanh toán', FALSE, 'ACTIVE'),
(5, 'PIN_UNBLOCK', 'Phí Mở Phong Tỏa PIN Động', 'PENALTY', 'FIXED', 100000.00, 'PER_REQUEST', 'Phí mở khóa sau khi hệ thống tự động ngắt mã PIN do nợ quá hạn', FALSE, 'ACTIVE'),
(6, 'ASSET_SEAL', 'Phí Kiểm Kê Niêm Phong Tài Sản', 'PENALTY', 'FIXED', 500000.00, 'PER_REQUEST', 'Chi phí niêm phong, lập biên bản tài sản khi nợ quá 15 ngày', FALSE, 'ACTIVE'),
(7, 'DISCOUNT_6M', 'Ưu Đãi Thuê Khách Hàng 6 Tháng', 'DISCOUNT', 'PERCENT', 10.00, 'CONTRACT_TOTAL', 'Chiết khấu 10% tổng tiền thuê cho hợp đồng từ 6 tháng', FALSE, 'ACTIVE'),
(8, 'DISCOUNT_12M', 'Ưu Đãi Thuê Khách Hàng 12 Tháng', 'DISCOUNT', 'PERCENT', 15.00, 'CONTRACT_TOTAL', 'Chiết khấu 15% tổng tiền thuê cho hợp đồng dài hạn từ 12 tháng', FALSE, 'ACTIVE'),
(10, 'DMG_CLEANING', 'Phí vệ sinh kho', 'DAMAGE', 'FIXED', 150000.00, 'PER_REQUEST', 'Dọn dẹp rác cơ bản hoặc vệ sinh kho sau khi trả kho', FALSE, 'ACTIVE'),
(11, 'DMG_LOST_KEY', 'Mất chìa khóa cơ mở tủ', 'DAMAGE', 'FIXED', 200000.00, 'PER_REQUEST', 'Đền bù làm lại chìa khóa cơ / thay ổ khóa tủ cá nhân', FALSE, 'ACTIVE'),
(12, 'DMG_WALL_SCRATCH', 'Phí sơn lại / vá điểm trầy xước', 'DAMAGE', 'FIXED', 300000.00, 'PER_REQUEST', 'Xử lý trầy xước, dặm vá sơn bề mặt vách ngăn', FALSE, 'ACTIVE'),
(13, 'DMG_ELECTRIC_BROKEN', 'Hư hỏng bóng đèn / ổ cắm', 'DAMAGE', 'FIXED', 300000.00, 'PER_REQUEST', 'Thay thế bóng đèn LED hoặc ổ cắm điện bị cháy hỏng', FALSE, 'ACTIVE'),
(14, 'DMG_WALL_DENT', 'Vách ngăn ô kho bị móp / thủng', 'DAMAGE', 'FIXED', 500000.00, 'PER_REQUEST', 'Gia cố hoặc thay tấm vách panel ngăn ô kho bị va đập móp méo', FALSE, 'ACTIVE'),
(15, 'DMG_DOOR_BROKEN', 'Hư hỏng cửa kho / khóa cửa chính', 'DAMAGE', 'FIXED', 1000000.00, 'PER_REQUEST', 'Sửa chữa cửa cuốn, thay thế khóa cửa chính ô kho', FALSE, 'ACTIVE'),
(16, 'DISCOUNT_3M', 'Ưu Đãi Thuê Khách Hàng 3 Tháng', 'DISCOUNT', 'PERCENT', 5.00, 'CONTRACT_TOTAL', 'Chiết khấu 5% tổng tiền thuê cho hợp đồng từ 3 tháng', FALSE, 'ACTIVE'),
(17, 'OVERDUE_LIQUIDATION_DAYS', 'Mốc Ngày Quá Hạn Chuyển Thanh Lý', 'PENALTY', 'FIXED', 30.00, 'DAYS', 'Thời hạn tối đa quá hạn trước khi tiến hành thanh lý ô kho (30 ngày)', FALSE, 'ACTIVE'),
(18, 'DEPOSIT_RATE', 'Tỷ lệ tiền cọc giữ chỗ', 'SURCHARGE', 'PERCENT', 30.00, 'RENTAL_TOTAL', 'Tỷ lệ tiền đặt cọc giữ chỗ mặc định (30% giá thuê)', FALSE, 'ACTIVE');

-- 9. Danh mục Ngăn kho thực tế (StorageUnits) phân bổ trên cả 7 cơ sở
INSERT INTO StorageUnit (unitCode, floorId, unitTypeId, status) VALUES
-- === CƠ SỞ 1: HN-01 (Cầu Giấy, Hà Nội) ===
-- Floor 1 (Trệt): 10 Ô Kho XL
('HN01-G-XL01', 1, 4, 'AVAILABLE'),
('HN01-G-XL02', 1, 4, 'RENTED'),
('HN01-G-XL03', 1, 4, 'AVAILABLE'),
('HN01-G-XL04', 1, 4, 'AVAILABLE'),
('HN01-G-XL05', 1, 4, 'MAINTENANCE'),
('HN01-G-XL06', 1, 7, 'AVAILABLE'),
('HN01-G-XL07', 1, 4, 'RESERVED'),
('HN01-G-XL08', 1, 4, 'AVAILABLE'),
('HN01-G-XL09', 1, 4, 'RENTED'),
('HN01-G-XL10', 1, 4, 'AVAILABLE'),
-- Floor 2 (Tầng 1): 8 ô S, 6 ô M, 4 ô L
('HN01-F1-S01', 2, 1, 'AVAILABLE'),
('HN01-F1-S02', 2, 1, 'RENTED'),
('HN01-F1-S03', 2, 1, 'AVAILABLE'),
('HN01-F1-S04', 2, 1, 'RENTED'),
('HN01-F1-S05', 2, 1, 'AVAILABLE'),
('HN01-F1-S06', 2, 1, 'AVAILABLE'),
('HN01-F1-S07', 2, 1, 'MAINTENANCE'),
('HN01-F1-S08', 2, 1, 'AVAILABLE'),
('HN01-F1-M01', 2, 2, 'RENTED'),
('HN01-F1-M02', 2, 2, 'RENTED'),
('HN01-F1-M03', 2, 2, 'RENTED'),
('HN01-F1-M04', 2, 2, 'RESERVED'),
('HN01-F1-M05', 2, 5, 'AVAILABLE'),
('HN01-F1-M06', 2, 5, 'AVAILABLE'),
('HN01-F1-L01', 2, 3, 'AVAILABLE'),
('HN01-F1-L02', 2, 3, 'RENTED'),
('HN01-F1-L03', 2, 6, 'AVAILABLE'),
('HN01-F1-L04', 2, 6, 'AVAILABLE'),
-- Floor 3 (Tầng 2): 6 ô S, 8 ô M, 4 ô L
('HN01-F2-S01', 3, 1, 'AVAILABLE'),
('HN01-F2-S02', 3, 1, 'RENTED'),
('HN01-F2-S03', 3, 1, 'AVAILABLE'),
('HN01-F2-S04', 3, 1, 'AVAILABLE'),
('HN01-F2-S05', 3, 1, 'AVAILABLE'),
('HN01-F2-S06', 3, 1, 'AVAILABLE'),
('HN01-F2-M01', 3, 2, 'AVAILABLE'),
('HN01-F2-M02', 3, 2, 'RENTED'),
('HN01-F2-M03', 3, 2, 'RENTED'),
('HN01-F2-M04', 3, 2, 'RESERVED'),
('HN01-F2-M05', 3, 2, 'RENTED'),
('HN01-F2-M06', 3, 2, 'RENTED'),
('HN01-F2-M07', 3, 2, 'AVAILABLE'),
('HN01-F2-M08', 3, 2, 'AVAILABLE'),
('HN01-F2-L01', 3, 3, 'MAINTENANCE'),
('HN01-F2-L02', 3, 3, 'AVAILABLE'),
('HN01-F2-L03', 3, 3, 'RENTED'),
('HN01-F2-L04', 3, 3, 'AVAILABLE'),

-- === CƠ SỞ 2: HN-02 (Thanh Xuân, Hà Nội - Mẫu B: 15 Ô Kho) ===
('HN02-G-XL01', 4, 4, 'RENTED'),
('HN02-G-XL02', 4, 4, 'AVAILABLE'),
('HN02-G-XL03', 4, 7, 'AVAILABLE'),
('HN02-G-XL04', 4, 4, 'RENTED'),
('HN02-G-XL05', 4, 4, 'AVAILABLE'),
('HN02-F1-M01', 5, 2, 'RESERVED'),
('HN02-F1-M02', 5, 2, 'RENTED'),
('HN02-F1-M03', 5, 5, 'AVAILABLE'),
('HN02-F1-L01', 5, 3, 'RENTED'),
('HN02-F1-L02', 5, 6, 'AVAILABLE'),
('HN02-F2-M01', 6, 2, 'AVAILABLE'),
('HN02-F2-M02', 6, 2, 'AVAILABLE'),
('HN02-F2-M03', 6, 2, 'AVAILABLE'),
('HN02-F2-L01', 6, 3, 'AVAILABLE'),
('HN02-F2-L02', 6, 3, 'RENTED'),

-- === CƠ SỞ 3: HCM-01 (Quận 1, TP.HCM - Mẫu A VIP: 46 Ô Kho Mát) ===
('HCM01-G-XL01', 7, 7, 'RENTED'),
('HCM01-G-XL02', 7, 7, 'AVAILABLE'),
('HCM01-G-XL03', 7, 7, 'AVAILABLE'),
('HCM01-G-XL04', 7, 7, 'RENTED'),
('HCM01-G-XL05', 7, 7, 'AVAILABLE'),
('HCM01-G-XL06', 7, 7, 'AVAILABLE'),
('HCM01-G-XL07', 7, 7, 'AVAILABLE'),
('HCM01-G-XL08', 7, 7, 'AVAILABLE'),
('HCM01-G-XL09', 7, 7, 'AVAILABLE'),
('HCM01-G-XL10', 7, 7, 'AVAILABLE'),
('HCM01-F1-S01', 8, 1, 'AVAILABLE'),
('HCM01-F1-S02', 8, 1, 'AVAILABLE'),
('HCM01-F1-S03', 8, 1, 'AVAILABLE'),
('HCM01-F1-S04', 8, 1, 'AVAILABLE'),
('HCM01-F1-S05', 8, 1, 'AVAILABLE'),
('HCM01-F1-S06', 8, 1, 'AVAILABLE'),
('HCM01-F1-S07', 8, 1, 'AVAILABLE'),
('HCM01-F1-S08', 8, 1, 'AVAILABLE'),
('HCM01-F1-M01', 8, 5, 'RENTED'),
('HCM01-F1-M02', 8, 5, 'AVAILABLE'),
('HCM01-F1-M03', 8, 5, 'AVAILABLE'),
('HCM01-F1-M04', 8, 5, 'AVAILABLE'),
('HCM01-F1-M05', 8, 5, 'RESERVED'),
('HCM01-F1-M06', 8, 5, 'AVAILABLE'),
('HCM01-F1-L01', 8, 6, 'AVAILABLE'),
('HCM01-F1-L02', 8, 6, 'RENTED'),
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
('HCM01-F2-M02', 9, 5, 'RENTED'),
('HCM01-F2-M03', 9, 5, 'AVAILABLE'),
('HCM01-F2-M04', 9, 5, 'AVAILABLE'),
('HCM01-F2-M05', 9, 5, 'AVAILABLE'),
('HCM01-F2-M06', 9, 5, 'AVAILABLE'),
('HCM01-F2-L01', 9, 6, 'AVAILABLE'),
('HCM01-F2-L02', 9, 6, 'AVAILABLE'),
('HCM01-F2-L03', 9, 6, 'AVAILABLE'),
('HCM01-F2-L04', 9, 6, 'AVAILABLE'),

-- === CƠ SỞ 4: HCM-02 (Quận 7, TP.HCM - Mẫu B: 15 Ô Kho) ===
('HCM02-G-XL01', 10, 4, 'RENTED'),
('HCM02-G-XL02', 10, 4, 'AVAILABLE'),
('HCM02-G-XL03', 10, 7, 'AVAILABLE'),
('HCM02-G-XL04', 10, 4, 'AVAILABLE'),
('HCM02-G-XL05', 10, 4, 'AVAILABLE'),
('HCM02-F1-M01', 11, 2, 'AVAILABLE'),
('HCM02-F1-M02', 11, 2, 'RENTED'),
('HCM02-F1-M03', 11, 5, 'AVAILABLE'),
('HCM02-F1-L01', 11, 3, 'AVAILABLE'),
('HCM02-F1-L02', 11, 6, 'AVAILABLE'),
('HCM02-F2-M01', 12, 2, 'AVAILABLE'),
('HCM02-F2-M02', 12, 2, 'AVAILABLE'),
('HCM02-F2-M03', 12, 2, 'AVAILABLE'),
('HCM02-F2-L01', 12, 3, 'AVAILABLE'),
('HCM02-F2-L02', 12, 6, 'AVAILABLE'),

-- === CƠ SỞ 5: HCM-03 (Thủ Đức, TP.HCM - Mẫu B: 15 Ô Kho) ===
('HCM03-G-XL01', 13, 4, 'AVAILABLE'),
('HCM03-G-XL02', 13, 4, 'RENTED'),
('HCM03-G-XL03', 13, 7, 'AVAILABLE'),
('HCM03-G-XL04', 13, 4, 'AVAILABLE'),
('HCM03-G-XL05', 13, 4, 'AVAILABLE'),
('HCM03-F1-M01', 14, 2, 'AVAILABLE'),
('HCM03-F1-M02', 14, 2, 'RENTED'),
('HCM03-F1-M03', 14, 5, 'AVAILABLE'),
('HCM03-F1-L01', 14, 3, 'AVAILABLE'),
('HCM03-F1-L02', 14, 6, 'AVAILABLE'),
('HCM03-F2-M01', 15, 2, 'AVAILABLE'),
('HCM03-F2-M02', 15, 2, 'AVAILABLE'),
('HCM03-F2-M03', 15, 2, 'AVAILABLE'),
('HCM03-F2-L01', 15, 3, 'AVAILABLE'),
('HCM03-F2-L02', 15, 6, 'AVAILABLE'),

-- === CƠ SỞ 6: DN-01 (Hải Châu, Đà Nẵng - Mẫu A: 46 Ô Kho) ===
('DN01-G-XL01', 16, 4, 'AVAILABLE'),
('DN01-G-XL02', 16, 4, 'AVAILABLE'),
('DN01-G-XL03', 16, 7, 'AVAILABLE'),
('DN01-G-XL04', 16, 4, 'AVAILABLE'),
('DN01-G-XL05', 16, 4, 'AVAILABLE'),
('DN01-G-XL06', 16, 4, 'AVAILABLE'),
('DN01-G-XL07', 16, 4, 'AVAILABLE'),
('DN01-G-XL08', 16, 4, 'AVAILABLE'),
('DN01-G-XL09', 16, 4, 'AVAILABLE'),
('DN01-G-XL10', 16, 4, 'AVAILABLE'),
('DN01-F1-S01', 17, 1, 'AVAILABLE'),
('DN01-F1-S02', 17, 1, 'RENTED'),
('DN01-F1-S03', 17, 1, 'AVAILABLE'),
('DN01-F1-S04', 17, 1, 'RESERVED'),
('DN01-F1-S05', 17, 1, 'AVAILABLE'),
('DN01-F1-S06', 17, 1, 'AVAILABLE'),
('DN01-F1-S07', 17, 1, 'AVAILABLE'),
('DN01-F1-S08', 17, 1, 'AVAILABLE'),
('DN01-F1-M01', 17, 2, 'AVAILABLE'),
('DN01-F1-M02', 17, 5, 'AVAILABLE'),
('DN01-F1-M03', 17, 2, 'AVAILABLE'),
('DN01-F1-M04', 17, 2, 'AVAILABLE'),
('DN01-F1-M05', 17, 2, 'AVAILABLE'),
('DN01-F1-M06', 17, 2, 'AVAILABLE'),
('DN01-F1-L01', 17, 3, 'AVAILABLE'),
('DN01-F1-L02', 17, 6, 'AVAILABLE'),
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
('CT01-G-XL02', 19, 4, 'RENTED'),
('CT01-G-XL03', 19, 7, 'AVAILABLE'),
('CT01-G-XL04', 19, 4, 'AVAILABLE'),
('CT01-G-XL05', 19, 4, 'AVAILABLE'),
('CT01-F1-M01', 20, 2, 'AVAILABLE'),
('CT01-F1-M02', 20, 2, 'AVAILABLE'),
('CT01-F1-M03', 20, 5, 'AVAILABLE'),
('CT01-F1-L01', 20, 3, 'AVAILABLE'),
('CT01-F1-L02', 20, 6, 'AVAILABLE'),
('CT01-F2-M01', 21, 2, 'AVAILABLE'),
('CT01-F2-M02', 21, 2, 'AVAILABLE'),
('CT01-F2-M03', 21, 2, 'AVAILABLE'),
('CT01-F2-L01', 21, 3, 'AVAILABLE'),
('CT01-F2-L02', 21, 6, 'AVAILABLE');

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

-- 13. (Danh mục bồi thường hư hỏng / vệ sinh đã được gộp chung vào bảng FeeItem ở mục 8.1)


-- 14. Đơn đặt chỗ mẫu (Reservations) trải dài 07/2026 - 10/2026 (Chuẩn mã: CTR-[Mã Cơ Sở]-[DDMMYY]-[4 số])
INSERT INTO Reservation (reservationId, reservationCode, accountId, unitCode, startDate, endDate, rentalType, rentalAmount, depositAmount, penaltyAmount, status, createdAt, holdExpiresAt) VALUES
-- === KHÁCH HÀNG 1: Nguyễn Thành Long (AccountId 31, MBBank) ===
(1, 'CTR-HN01-010926-1001', 31, 'HN01-G-XL02', '2026-09-01', '2026-12-01', 'MONTHLY', 12000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-08-30 09:00:00', NULL),
(2, 'CTR-HN01-010926-1002', 31, 'HN01-F1-L02', '2026-09-01', '2026-10-01', 'MONTHLY', 2400000.00, 2000000.00, 850000.00, 'CONFIRMED', '2026-08-30 08:30:00', NULL),
(3, 'CTR-HN02-250926-1003', 31, 'HN02-F1-M03', '2026-10-02', '2026-11-02', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-25 10:00:00', NULL),
(4, 'CTR-HN01-011126-1004', 31, 'HN01-F1-M04', '2026-11-01', '2026-12-01', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-24 14:00:00', NULL),

-- === KHÁCH HÀNG 2: Trần Thu Hà (AccountId 32, Vietcombank) ===
(5, 'CTR-HN01-150926-1005', 32, 'HN01-F1-S02', '2026-09-15', '2026-12-15', 'MONTHLY', 1800000.00, 500000.00, 0.00, 'CONFIRMED', '2026-09-14 10:00:00', NULL),
(6, 'CTR-HN01-150826-1006', 32, 'HN01-F2-L03', '2026-08-15', '2026-09-15', 'MONTHLY', 2400000.00, 2000000.00, 1200000.00, 'CONFIRMED', '2026-08-14 09:30:00', NULL),
(7, 'CTR-HN01-260926-1007', 32, 'HN01-F2-M01', '2026-10-03', '2026-11-03', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-26 11:00:00', NULL),
(8, 'CTR-HN01-021126-1008', 32, 'HN01-G-XL07', '2026-11-01', '2026-12-01', 'MONTHLY', 4000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-10-24 16:30:00', NULL),

-- === KHÁCH HÀNG 3: Trần Thị Bích Ngọc (AccountId 33, Techcombank) ===
(9, 'CTR-HN01-200826-1009', 33, 'HN01-F1-S04', '2026-08-20', '2026-11-20', 'MONTHLY', 1800000.00, 500000.00, 0.00, 'CONFIRMED', '2026-08-19 11:00:00', NULL),
(10, 'CTR-HCM01-010826-1010', 33, 'HCM01-G-XL04', '2026-08-01', '2026-09-01', 'MONTHLY', 4000000.00, 3000000.00, 1500000.00, 'CONFIRMED', '2026-07-30 14:00:00', NULL),
(11, 'CTR-HCM01-270926-1011', 33, 'HCM01-F1-M03', '2026-10-04', '2026-11-04', 'MONTHLY', 1440000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-27 15:00:00', NULL),
(12, 'CTR-HN01-031126-1012', 33, 'HN01-F2-M04', '2026-11-01', '2026-12-01', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-24 10:15:00', NULL),

-- === KHÁCH HÀNG 4: Lê Hữu Đạt (AccountId 34, Techcombank) ===
(13, 'CTR-HN01-210926-1013', 34, 'HN01-F2-M03', '2026-09-21', '2026-11-21', 'MONTHLY', 2400000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-20 15:00:00', NULL),
(14, 'CTR-HCM02-100826-1014', 34, 'HCM02-G-XL01', '2026-08-10', '2026-09-10', 'MONTHLY', 4000000.00, 3000000.00, 1500000.00, 'CONFIRMED', '2026-08-08 10:00:00', NULL),
(15, 'CTR-HCM02-280926-1015', 34, 'HCM02-F1-M01', '2026-10-05', '2026-11-05', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-28 09:30:00', NULL),
(16, 'CTR-HN02-041126-1016', 34, 'HN02-F1-M01', '2026-11-01', '2026-12-01', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-24 11:20:00', NULL),

-- === KHÁCH HÀNG 5: Lê Hoàng Long (AccountId 35, VietinBank) ===
(17, 'CTR-HN02-100926-1017', 35, 'HN02-G-XL01', '2026-09-10', '2026-12-10', 'MONTHLY', 12000000.00, 3000000.00, 0.00, 'CONFIRMED', '2026-09-08 10:00:00', NULL),
(18, 'CTR-HCM03-050826-1018', 35, 'HCM03-G-XL02', '2026-08-05', '2026-09-05', 'MONTHLY', 4000000.00, 3000000.00, 1500000.00, 'CONFIRMED', '2026-08-03 14:30:00', NULL),
(19, 'CTR-DN01-290926-1019', 35, 'DN01-F1-M01', '2026-10-06', '2026-11-06', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-29 16:00:00', NULL),
(20, 'CTR-HCM01-051126-1020', 35, 'HCM01-F1-M05', '2026-11-01', '2026-12-01', 'MONTHLY', 1440000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-10-24 15:45:00', NULL),

-- === KHÁCH HÀNG 6: Vũ Mai Phương (AccountId 36, ACB) ===
(21, 'CTR-HN02-120926-1021', 36, 'HN02-F1-M02', '2026-09-12', '2026-11-12', 'MONTHLY', 2400000.00, 1000000.00, 0.00, 'CONFIRMED', '2026-09-10 15:00:00', NULL),
(22, 'CTR-CT01-120826-1022', 36, 'CT01-G-XL02', '2026-08-12', '2026-09-12', 'MONTHLY', 4000000.00, 3000000.00, 1500000.00, 'CONFIRMED', '2026-08-10 16:00:00', NULL),
(23, 'CTR-CT01-300926-1023', 36, 'CT01-F1-M01', '2026-10-07', '2026-11-07', 'MONTHLY', 1200000.00, 1000000.00, 0.00, 'CANCELLED', '2026-09-30 10:00:00', NULL),
(24, 'CTR-DN01-061126-1024', 36, 'DN01-F1-S04', '2026-11-01', '2026-12-01', 'MONTHLY', 600000.00, 500000.00, 0.00, 'CONFIRMED', '2026-10-24 14:10:00', NULL),

-- Hợp đồng quá hạn 15 ngày cho mỗi tài khoản khách hàng (startDate 17/09/2026 -> endDate 17/10/2026, tính đến 01/11/2026 đúng 15 ngày)
(25, 'CTR-HN01-170926-1025', 31, 'HN01-F1-M01', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 09:00:00', NULL),
(26, 'CTR-HN01-170926-1026', 32, 'HN01-F1-M02', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 09:30:00', NULL),
(27, 'CTR-HN01-170926-1027', 33, 'HN01-F1-M03', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 10:00:00', NULL),
(28, 'CTR-HN01-170926-1028', 34, 'HN01-F2-M02', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 11:00:00', NULL),
(29, 'CTR-HN01-170926-1029', 35, 'HN01-F2-M05', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 14:00:00', NULL),
(30, 'CTR-HN01-170926-1030', 36, 'HN01-F2-M06', '2026-09-17', '2026-10-17', 'MONTHLY', 1200000.00, 1000000.00, 750000.00, 'CONFIRMED', '2026-09-16 15:00:00', NULL);

-- 15. Hợp đồng thuê kho (Contracts) đa dạng chu trình 7 trạng thái chuẩn BR-21
INSERT INTO Contract (contractId, reservationId, activatedAt, terminatedAt, status, cancelReason, refundBankName, refundAccountNumber, refundAccountName) VALUES
-- Khách 1 (Nguyễn Thành Long): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(1, 1, '2026-09-01 09:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(2, 2, '2026-09-01 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(3, 3, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'MBBank', '0912345678', 'NGUYEN THANH LONG'),
(4, 4, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Khách 2 (Trần Thu Hà): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(5, 5, '2026-09-15 10:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(6, 6, '2026-08-15 09:30:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(7, 7, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Vietcombank', '079201098765', 'TRAN THU HA'),
(8, 8, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Khách 3 (Trần Thị Bích Ngọc): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(9, 9, '2026-08-20 11:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(10, 10, '2026-08-01 14:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(11, 11, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Techcombank', '1903678901234', 'TRAN THI BICH NGOC'),
(12, 12, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Khách 4 (Lê Hữu Đạt): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(13, 13, '2026-09-21 15:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(14, 14, '2026-08-10 10:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(15, 15, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'Techcombank', '079202087654', 'LE HUU DAT'),
(16, 16, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Khách 5 (Lê Hoàng Long): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(17, 17, '2026-09-10 10:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(18, 18, '2026-08-05 14:30:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(19, 19, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'VietinBank', '108876543210', 'LE HOANG LONG'),
(20, 20, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Khách 6 (Vũ Mai Phương): ACTIVE, OVERDUE, CANCELLED, PENDING_CHECKIN
(21, 21, '2026-09-12 15:00:00', NULL, 'ACTIVE', NULL, NULL, NULL, NULL),
(22, 22, '2026-08-12 16:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(23, 23, NULL, NULL, 'CANCELLED', 'Khách hàng chủ động hủy trước ngày bắt đầu >= 4 ngày. Hoàn lại 100% cọc theo BR-17.', 'ACB', '246813579', 'VU MAI PHUONG'),
(24, 24, NULL, NULL, 'PENDING_CHECKIN', NULL, NULL, NULL, NULL),

-- Các hợp đồng quá hạn 15 ngày cho mỗi tài khoản khách hàng (HĐ 25 -> 30)
(25, 25, '2026-09-17 09:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(26, 26, '2026-09-17 09:30:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(27, 27, '2026-09-17 10:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(28, 28, '2026-09-17 11:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(29, 29, '2026-09-17 14:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL),
(30, 30, '2026-09-17 15:00:00', NULL, 'OVERDUE', NULL, NULL, NULL, NULL);

-- 16. Hóa đơn và Thanh toán (Payments) chuẩn mã định danh BR-37
INSERT INTO Payment (paymentId, contractId, invoiceNumber, invoiceType, amount, paidAmount, remainingAmount, receiptUrl, issuedAt, dueAt, status, paymentMethod, transactionCode, paymentStatus, gatewayTransactionId, paidAt) VALUES
-- === Khách 1 (Nguyễn Thành Long): HĐ 1 (ACTIVE), HĐ 2 (OVERDUE), HĐ 3 (CANCELLED), HĐ 4 (PENDING_CHECKIN) ===
(1, 1, 'DEP-CTR-HN01-010926-1001', 'DEP', 15000000.00, 15000000.00, 0.00, NULL, '2026-08-30 09:15:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1001', 'SUCCESS', 'VNP1001', '2026-09-01 09:05:00'),
(2, 2, 'DEP-CTR-HN01-010926-1002', 'DEP', 4400000.00, 4400000.00, 0.00, NULL, '2026-08-30 08:35:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1002', 'SUCCESS', 'VNP1002', '2026-09-01 09:10:00'),
(3, 2, 'PEN-HN01-20261018-1002', 'OVERDUE_FEE', 850000.00, 0.00, 850000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(4, 3, 'DEP-CTR-HN02-250926-1003', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-09-25 10:05:00', '2026-10-02 23:59:59', 'CANCELLED', 'VNPAY', 'TXN_VNP_1003', 'SUCCESS', 'VNP1003', '2026-09-25 10:15:00'),
(5, 3, 'REF-HN02-20260927-1003', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-09-27 15:30:00', '2026-09-29 23:59:59', 'PAID', 'BANK_TRANSFER', 'MB_270926_1003', 'SUCCESS', 'MB2609271003', '2026-09-27 16:00:00'),
(6, 4, 'DEP-CTR-HN01-011126-1004', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-10-24 14:00:00', '2026-11-01 23:59:59', 'PARTIALLY_PAID', 'VNPAY', 'TXN_VNP_1004', 'SUCCESS', 'VNP1004', '2026-10-24 14:05:00'),

-- === Khách 2 (Trần Thu Hà): HĐ 5 (ACTIVE), HĐ 6 (OVERDUE), HĐ 7 (CANCELLED), HĐ 8 (PENDING_CHECKIN) ===
(7, 5, 'DEP-CTR-HN01-150926-1005', 'DEP', 2300000.00, 2300000.00, 0.00, NULL, '2026-09-14 10:10:00', '2026-09-15 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_1005', 'SUCCESS', 'QR1005', '2026-09-15 10:05:00'),
(8, 6, 'DEP-CTR-HN01-150826-1006', 'DEP', 4400000.00, 4400000.00, 0.00, NULL, '2026-08-14 09:35:00', '2026-08-15 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_1006', 'SUCCESS', 'QR1006', '2026-08-15 09:40:00'),
(9, 6, 'PEN-HN01-20261018-1006', 'OVERDUE_FEE', 1200000.00, 0.00, 1200000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(10, 7, 'DEP-CTR-HN01-260926-1007', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-09-26 11:05:00', '2026-10-03 23:59:59', 'CANCELLED', 'VIETQR', 'TXN_VQR_1007', 'SUCCESS', 'QR1007', '2026-09-26 11:10:00'),
(11, 7, 'REF-HN01-20260928-1007', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-09-28 14:00:00', '2026-09-30 23:59:59', 'PAID', 'BANK_TRANSFER', 'VCB_280926_1007', 'SUCCESS', 'VCB2809261007', '2026-09-28 15:00:00'),
(12, 8, 'DEP-CTR-HN01-021126-1008', 'DEP', 7000000.00, 3000000.00, 4000000.00, NULL, '2026-10-24 16:30:00', '2026-11-02 23:59:59', 'PARTIALLY_PAID', 'VIETQR', 'TXN_VQR_1008', 'SUCCESS', 'QR1008', '2026-10-24 16:35:00'),

-- === Khách 3 (Trần Thị Bích Ngọc): HĐ 9 (ACTIVE), HĐ 10 (OVERDUE), HĐ 11 (CANCELLED), HĐ 12 (PENDING_CHECKIN) ===
(13, 9, 'DEP-CTR-HN01-200826-1009', 'DEP', 2300000.00, 2300000.00, 0.00, NULL, '2026-08-19 11:10:00', '2026-08-20 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1009', 'SUCCESS', 'VNP1009', '2026-08-20 11:05:00'),
(14, 10, 'DEP-CTR-HCM01-010826-1010', 'DEP', 7000000.00, 7000000.00, 0.00, NULL, '2026-07-30 14:10:00', '2026-08-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_1010', 'SUCCESS', 'TCB1010', '2026-08-01 14:05:00'),
(15, 10, 'PEN-HCM01-20261018-1010', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(16, 11, 'DEP-CTR-HCM01-270926-1011', 'DEP', 2440000.00, 1000000.00, 1440000.00, NULL, '2026-09-27 15:05:00', '2026-10-04 23:59:59', 'CANCELLED', 'VNPAY', 'TXN_VNP_1011', 'SUCCESS', 'VNP1011', '2026-09-27 15:10:00'),
(17, 11, 'REF-HCM01-20260929-1011', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-09-29 10:00:00', '2026-10-01 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_290926_1011', 'SUCCESS', 'TCB2909261011', '2026-09-29 11:00:00'),
(18, 12, 'DEP-CTR-HN01-031126-1012', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-10-24 10:15:00', '2026-11-03 23:59:59', 'PARTIALLY_PAID', 'VNPAY', 'TXN_VNP_1012', 'SUCCESS', 'VNP1012', '2026-10-24 10:20:00'),

-- === Khách 4 (Lê Hữu Đạt): HĐ 13 (ACTIVE), HĐ 14 (OVERDUE), HĐ 15 (CANCELLED), HĐ 16 (PENDING_CHECKIN) ===
(19, 13, 'DEP-CTR-HN01-210926-1013', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-09-20 15:10:00', '2026-09-21 23:59:59', 'PAID', 'MOMO', 'TXN_MM_1013', 'SUCCESS', 'MM1013', '2026-09-21 15:05:00'),
(20, 14, 'DEP-CTR-HCM02-100826-1014', 'DEP', 7000000.00, 7000000.00, 0.00, NULL, '2026-08-08 10:10:00', '2026-08-10 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_1014', 'SUCCESS', 'TCB1014', '2026-08-10 10:05:00'),
(21, 14, 'PEN-HCM02-20261018-1014', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(22, 15, 'DEP-CTR-HCM02-280926-1015', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-09-28 09:35:00', '2026-10-05 23:59:59', 'CANCELLED', 'MOMO', 'TXN_MM_1015', 'SUCCESS', 'MM1015', '2026-09-28 09:40:00'),
(23, 15, 'REF-HCM02-20260930-1015', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-09-30 11:00:00', '2026-10-02 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_300926_1015', 'SUCCESS', 'TCB3009261015', '2026-09-30 11:30:00'),
(24, 16, 'DEP-CTR-HN02-041126-1016', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-10-24 11:20:00', '2026-11-04 23:59:59', 'PARTIALLY_PAID', 'VIETQR', 'TXN_VQR_1016', 'SUCCESS', 'QR1016', '2026-10-24 11:25:00'),

-- === Khách 5 (Lê Hoàng Long): HĐ 17 (ACTIVE), HĐ 18 (OVERDUE), HĐ 19 (CANCELLED), HĐ 20 (PENDING_CHECKIN) ===
(25, 17, 'DEP-CTR-HN02-100926-1017', 'DEP', 15000000.00, 15000000.00, 0.00, NULL, '2026-09-08 10:15:00', '2026-09-10 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1017', 'SUCCESS', 'VNP1017', '2026-09-10 10:05:00'),
(26, 18, 'DEP-CTR-HCM03-050826-1018', 'DEP', 7000000.00, 7000000.00, 0.00, NULL, '2026-08-03 14:35:00', '2026-08-05 23:59:59', 'PAID', 'BANK_TRANSFER', 'TCB_1018', 'SUCCESS', 'TCB1018', '2026-08-05 14:40:00'),
(27, 18, 'PEN-HCM03-20261018-1018', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(28, 19, 'DEP-CTR-DN01-290926-1019', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-09-29 16:05:00', '2026-10-06 23:59:59', 'CANCELLED', 'VIETQR', 'TXN_VQR_1019', 'SUCCESS', 'QR1019', '2026-09-29 16:10:00'),
(29, 19, 'REF-DN01-20261001-1019', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-01 10:00:00', '2026-10-03 23:59:59', 'PAID', 'BANK_TRANSFER', 'CTG_011026_1019', 'SUCCESS', 'CTG0110261019', '2026-10-01 11:00:00'),
(30, 20, 'DEP-CTR-HCM01-051126-1020', 'DEP', 2440000.00, 1000000.00, 1440000.00, NULL, '2026-10-24 15:45:00', '2026-11-05 23:59:59', 'PARTIALLY_PAID', 'MOMO', 'TXN_MM_1020', 'SUCCESS', 'MM1020', '2026-10-24 15:50:00'),

-- === Khách 6 (Vũ Mai Phương): HĐ 21 (ACTIVE), HĐ 22 (OVERDUE), HĐ 23 (CANCELLED), HĐ 24 (PENDING_CHECKIN) ===
(31, 21, 'DEP-CTR-HN02-120926-1021', 'DEP', 3400000.00, 3400000.00, 0.00, NULL, '2026-09-10 15:10:00', '2026-09-12 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_1021', 'SUCCESS', 'QR1021', '2026-09-12 15:05:00'),
(32, 22, 'DEP-CTR-CT01-120826-1022', 'DEP', 7000000.00, 7000000.00, 0.00, NULL, '2026-08-10 16:10:00', '2026-08-12 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1022', 'SUCCESS', 'VNP1022', '2026-08-12 16:05:00'),
(33, 22, 'PEN-CT01-20261018-1022', 'OVERDUE_FEE', 1500000.00, 0.00, 1500000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(34, 23, 'DEP-CTR-CT01-300926-1023', 'DEP', 2200000.00, 1000000.00, 1200000.00, NULL, '2026-09-30 10:05:00', '2026-10-07 23:59:59', 'CANCELLED', 'VNPAY', 'TXN_VNP_1023', 'SUCCESS', 'VNP1023', '2026-09-30 10:10:00'),
(35, 23, 'REF-CT01-20261002-1023', 'REF', 1000000.00, 1000000.00, 0.00, NULL, '2026-10-02 14:00:00', '2026-10-04 23:59:59', 'PAID', 'BANK_TRANSFER', 'ACB_021026_1023', 'SUCCESS', 'ACB0210261023', '2026-10-02 15:00:00'),
(36, 24, 'DEP-CTR-DN01-061126-1024', 'DEP', 1100000.00, 500000.00, 600000.00, NULL, '2026-10-24 14:10:00', '2026-11-06 23:59:59', 'PARTIALLY_PAID', 'VIETQR', 'TXN_VQR_1024', 'SUCCESS', 'QR1024', '2026-10-24 14:15:00'),

-- Hóa đơn tiền cọc & tiền thuê ban đầu (DEP) và tiền phạt quá hạn 15 ngày (OVERDUE_FEE - 750.000đ) cho HĐ 25 -> 30
(37, 25, 'DEP-CTR-HN01-170926-1025', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 09:15:00', '2026-09-17 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1025', 'SUCCESS', 'VNP1025', '2026-09-17 09:05:00'),
(38, 25, 'PEN-HN01-170926-1025', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(39, 26, 'DEP-CTR-HN01-170926-1026', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 09:35:00', '2026-09-17 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_1026', 'SUCCESS', 'QR1026', '2026-09-17 09:10:00'),
(40, 26, 'PEN-HN01-170926-1026', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(41, 27, 'DEP-CTR-HN01-170926-1027', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 10:05:00', '2026-09-17 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1027', 'SUCCESS', 'VNP1027', '2026-09-17 09:15:00'),
(42, 27, 'PEN-HN01-170926-1027', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(43, 28, 'DEP-CTR-HN01-170926-1028', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 11:05:00', '2026-09-17 23:59:59', 'PAID', 'MOMO', 'TXN_MM_1028', 'SUCCESS', 'MM1028', '2026-09-17 09:20:00'),
(44, 28, 'PEN-HN01-170926-1028', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(45, 29, 'DEP-CTR-HN01-170926-1029', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 14:05:00', '2026-09-17 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_1029', 'SUCCESS', 'VNP1029', '2026-09-17 09:25:00'),
(46, 29, 'PEN-HN01-170926-1029', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL),
(47, 30, 'DEP-CTR-HN01-170926-1030', 'DEP', 2200000.00, 2200000.00, 0.00, NULL, '2026-09-16 15:05:00', '2026-09-17 23:59:59', 'PAID', 'VIETQR', 'TXN_VQR_1030', 'SUCCESS', 'QR1030', '2026-09-17 09:30:00'),
(48, 30, 'PEN-HN01-170926-1030', 'OVERDUE_FEE', 750000.00, 0.00, 750000.00, NULL, '2026-10-18 00:00:00', '2026-10-18 23:59:59', 'OVERDUE', NULL, NULL, 'PENDING', NULL, NULL);

-- 17. Mã PIN động mở cổng IoT 24/7 (GatePins)
INSERT INTO GatePin (gatePinId, contractId, pinCode, status, generatedAt, expiresAt) VALUES
-- Cấp mã PIN cho 6 hợp đồng đang ACTIVE (HĐ 1, 5, 9, 13, 17, 21)
(1, 1, '839201', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59'),
(2, 5, '194726', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59'),
(3, 9, '551920', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59'),
(4, 13, '339102', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59'),
(5, 17, '771920', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59'),
(6, 21, '662910', 'ACTIVE', '2026-10-24 08:00:00', '2026-11-24 23:59:59');

-- 18. Nhật ký quẹt cổng cơ sở (AuditLogs)
INSERT INTO AuditLog (auditLogId, accountId, facilityId, customerId, action, openedAt, reason, createdAt) VALUES
(1, 31, 1, 1, 'GATE_ACCESS_GRANTED - HN-01 Cổng Chính', '2026-10-15 08:30:15', 'Mã PIN động hợp lệ', '2026-10-15 08:30:15'),
(2, 32, 1, 2, 'GATE_ACCESS_GRANTED - HN-01 Thang máy hàng', '2026-10-16 10:15:40', 'Mã PIN động hợp lệ', '2026-10-16 10:15:40'),
(3, 31, 3, 1, 'GATE_ACCESS_GRANTED - HCM-01 Cổng VIP', '2026-10-17 14:20:10', 'Mã PIN động hợp lệ', '2026-10-17 14:20:10'),
(4, 33, 4, 3, 'GATE_ACCESS_GRANTED - HCM-02 Cổng Xe Tải', '2026-10-18 09:45:00', 'Mã PIN động hợp lệ', '2026-10-18 09:45:00');

-- 19. Yêu cầu hỗ trợ & Sự cố vận hành SLA (SupportTickets)
INSERT INTO SupportTicket (id, ticketCode, type, status, customerId, facilityId, unitCode, contractId, title, description, desiredDate, assignedStaffId, slaDeadline, isSlaBreached, identityVerified, resolutionNote, createdAt, resolvedAt) VALUES
-- === KHÁCH HÀNG 1: Nguyễn Thành Long (CustomerId 1, Cơ sở HN-01, Ô HN01-G-XL02) ===
(1, 'TCK-202610-001', 'INCIDENT', 'RESOLVED', 1, 1, 'HN01-G-XL02', 1, 'Báo sự cố an ninh & kỹ thuật', 'Khóa thông minh buồng kho không tự bung chốt sau khi nhập mã PIN, đèn tín hiệu nháy đỏ liên tục.', NULL, 10, '2026-10-10 18:00:00', FALSE, TRUE, 'Đã kiểm tra cơ cấu chấp hành, tra dầu mỡ trục khóa và reset cảm biến hành trình.', '2026-10-10 14:00:00', '2026-10-10 15:30:00'),
(2, 'TCK-202610-002', 'MAINTENANCE', 'RESOLVED', 1, 1, 'HN01-G-XL02', 1, 'Bảo trì / Sửa chữa', 'Yêu cầu nhân viên đo kiểm tra thực tế độ ẩm buồng kho mát định kỳ để bảo quản tài sản đồ da và tranh vẽ.', NULL, 10, '2026-10-25 18:00:00', FALSE, TRUE, 'Đã tiến hành đo kiểm thực tế: độ ẩm đạt 50%RH, nhiệt độ 22°C đạt chuẩn bảo quản đồ da.', '2026-10-24 10:00:00', '2026-10-24 11:30:00'),

-- === KHÁCH HÀNG 2: Trần Thu Hà (CustomerId 2, Cơ sở HN-01, Ô HN01-F1-S02) ===
(3, 'TCK-202609-001', 'EARLY_TERMINATION', 'RESOLVED', 2, 1, 'HN01-F1-S02', 5, 'Yêu cầu trả kho sớm', 'Khách hàng dọn đồ sang địa điểm mới nên xin làm thủ tục bàn giao kho trước thời hạn.', '2026-09-25', 10, NULL, FALSE, TRUE, 'Đã hoàn tất nghiệm thu buồng kho sạch sẽ và hướng dẫn khách nhận lại tiền cọc.', '2026-09-20 09:00:00', '2026-09-22 10:00:00'),
(4, 'TCK-202610-003', 'INCIDENT', 'RESOLVED', 2, 1, 'HN01-F1-S02', 5, 'Báo sự cố an ninh & kỹ thuật', 'Bảng khóa số điện tử phát âm thanh bíp ngắt quãng và nháy đèn báo pin yếu (Low Battery 15%), cần thay pin.', NULL, 11, '2026-10-18 13:00:00', FALSE, TRUE, 'Đã thay 4 pin AA Alkaline mới, bảng khóa hoạt động ổn định và đo pin đạt 100%.', '2026-10-18 09:00:00', '2026-10-18 10:15:00'),

-- === KHÁCH HÀNG 3: Trần Thị Bích Ngọc (CustomerId 3, Cơ sở HN-01, Ô HN01-F1-S04) ===
(5, 'TCK-202610-004', 'MAINTENANCE', 'RESOLVED', 3, 1, 'HN01-F1-S04', 9, 'Bảo trì / Sửa chữa', 'Đèn LED chiếu sáng cảm biến tại lối đi phía trước cửa buồng kho nhấp nháy vào ban đêm.', NULL, 10, '2026-10-15 20:00:00', FALSE, TRUE, 'Đã thay bộ nguồn LED driver và bóng đèn mới tại vị trí hành lang tầng 1.', '2026-10-15 16:30:00', '2026-10-15 17:45:00'),
(6, 'TCK-202610-005', 'MAINTENANCE', 'RESOLVED', 3, 1, 'HN01-F1-S04', 9, 'Bảo trì / Sửa chữa', 'Mép gioăng cao su viền cửa hơi bị lệch, nhờ nhân viên kiểm tra cân chỉnh lại để chống bụi mịn.', NULL, 11, '2026-10-25 21:00:00', FALSE, TRUE, 'Đã căn chỉnh lại gioăng cao su viền cánh cửa khít hoàn toàn, đạt tiêu chuẩn chống bụi.', '2026-10-24 14:00:00', '2026-10-24 15:30:00'),

-- === KHÁCH HÀNG 4: Lê Hữu Đạt (CustomerId 4, Cơ sở HN-01, Ô HN01-F2-M03) ===
(7, 'TCK-202610-006', 'UNLOCK', 'RESOLVED', 4, 1, 'HN01-F2-M03', 13, 'Mở khóa khẩn cấp', 'Khách hàng để quên mã PIN trong điện thoại bị sập nguồn, nhờ nhân viên hỗ trợ mở khóa khẩn cấp.', NULL, 10, '2026-10-16 11:00:00', FALSE, TRUE, 'Đã đối chiếu CCCD chính chủ trùng khớp hồ sơ và hỗ trợ mở khóa trực tiếp tại quầy.', '2026-10-16 10:15:00', '2026-10-16 10:45:00'),
(8, 'TCK-202610-007', 'MAINTENANCE', 'RESOLVED', 4, 1, 'HN01-F2-M03', 13, 'Bảo trì / Sửa chữa', 'Bản lề cánh cửa buồng kho bị rít và phát tiếng cọt kẹt khi mở, nhờ nhân viên hỗ trợ tra dầu bôi trơn.', NULL, 11, '2026-10-25 17:00:00', FALSE, TRUE, 'Đã tra mỡ bôi trơn chuyên dụng vào toàn bộ cụm bản lề, cửa đóng mở êm ái.', '2026-10-24 11:00:00', '2026-10-24 11:45:00'),

-- === KHÁCH HÀNG 5: Lê Hoàng Long (CustomerId 5, Cơ sở HN-02, Ô HN02-G-XL01) ===
(9, 'TCK-202610-008', 'INCIDENT', 'RESOLVED', 5, 2, 'HN02-G-XL01', 17, 'Báo sự cố an ninh & kỹ thuật', 'Màn hình cảm ứng bảng khóa thông minh bị mờ số hiển thị vào ban ngày, đề nghị kiểm tra màn led.', NULL, 11, '2026-10-14 18:00:00', FALSE, TRUE, 'Đã vệ sinh bề mặt cảm ứng và điều chỉnh lại độ sáng đèn nền LED của bảng điều khiển.', '2026-10-14 14:00:00', '2026-10-14 15:20:00'),
(10, 'TCK-202610-009', 'MAINTENANCE', 'RESOLVED', 5, 2, 'HN02-G-XL01', 17, 'Bảo trì / Sửa chữa', 'Khách hàng chuyển nhiều kiện hàng nặng vào kho, nhờ cơ sở hỗ trợ mượn xe đẩy nâng thủy lực.', NULL, 12, '2026-10-17 12:00:00', FALSE, TRUE, 'Nhân viên trực ca đã bàn giao xe đẩy hàng tải trọng 300kg và hỗ trợ đưa hàng vào buồng kho.', '2026-10-17 09:30:00', '2026-10-17 11:00:00'),

-- === KHÁCH HÀNG 6: Vũ Mai Phương (CustomerId 6, Cơ sở HN-02, Ô HN02-F1-M02) ===
(11, 'TCK-202610-010', 'MAINTENANCE', 'RESOLVED', 6, 2, 'HN02-F1-M02', 21, 'Bảo trì / Sửa chữa', 'Cần kiểm tra định kỳ cảm biến nhiệt độ buồng kho mát để đảm bảo tiêu chuẩn bảo quản tài liệu điện tử.', NULL, 11, '2026-10-25 20:00:00', FALSE, TRUE, 'Hệ thống điều hòa và cảm biến nhiệt độ buồng kho hoạt động chuẩn xác, duy trì 22°C liên tục.', '2026-10-24 13:00:00', '2026-10-24 14:15:00'),
(12, 'TCK-202610-011', 'EARLY_TERMINATION', 'RESOLVED', 6, 2, 'HN02-F1-M02', 21, 'Yêu cầu trả kho sớm', 'Khách hàng hoàn tất kế hoạch lưu trữ trước thời hạn, xin làm thủ tục bàn giao kho và tất toán hợp đồng.', '2026-10-22', 12, NULL, FALSE, TRUE, 'Đã hoàn tất nghiệm thu ô kho sạch sẽ, không hư hại và tạo lệnh hoàn tiền cọc.', '2026-10-18 10:00:00', '2026-10-22 10:30:00');

-- 20. Biên bản nghiệm thu kiểm tra trả kho (Inspections & InspectionItems)
-- (Không có biên bản vi phạm phát sinh)



-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU SMART STORAGE SYSTEM
-- ============================================================================
