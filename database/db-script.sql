-- ============================================================================
-- DATABASE SCRIPT: SMART STORAGE SYSTEM
-- PROJECT: SWP391 - FALL 2026
-- SYSTEM: Smart Self-Storage Management System
-- DIALECT: MySQL 8.0+ / MariaDB 10.4+
-- ENCODING: UTF-8 (utf8mb4_unicode_ci)
-- ============================================================================

DROP DATABASE IF EXISTS smart_storage;
CREATE DATABASE smart_storage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_storage;

-- Disable foreign key checks for clean setup
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. TABLE: Role
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Role;
CREATE TABLE Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABLE: Facility (Cơ sở lưu trữ)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Facility;
CREATE TABLE Facility (
    facilityId INT AUTO_INCREMENT PRIMARY KEY,
    facilityName VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABLE: Account (Tài khoản người dùng - Login bằng SĐT)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Account;
CREATE TABLE Account (
    accountId INT AUTO_INCREMENT PRIMARY KEY,
    roleId INT NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    fullName VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_role FOREIGN KEY (roleId) REFERENCES Role (roleId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABLE: CustomerProfile (Hồ sơ khách hàng)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS CustomerProfile;
CREATE TABLE CustomerProfile (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    identityNumber VARCHAR(20) NOT NULL UNIQUE,
    CONSTRAINT fk_customer_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABLE: EmployeeProfile (Hồ sơ nhân viên gắn với cơ sở)
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
-- 6. TABLE: ActivityLog (Nhật ký thao tác hệ thống)
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
-- 7. TABLE: AuditLog (Nhật ký quẹt mã PIN ra vào cổng cơ sở)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS AuditLog;
CREATE TABLE AuditLog (
    auditLogId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABLE: Floor (Tầng của cơ sở)
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
-- 9. TABLE: UnitType (Loại kho)
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
-- 10. TABLE: StorageUnit (Ngăn kho / Buồng kho)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS StorageUnit;
CREATE TABLE StorageUnit (
    unitId INT AUTO_INCREMENT PRIMARY KEY,
    floorId INT NOT NULL,
    unitTypeId INT NOT NULL,
    status ENUM('AVAILABLE', 'HOLD', 'RENTED', 'MAINTENANCE', 'OVERDUE') NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT fk_unit_floor FOREIGN KEY (floorId) REFERENCES Floor (floorId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_unit_type FOREIGN KEY (unitTypeId) REFERENCES UnitType (unitTypeId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. TABLE: Price (Bảng giá thuê)
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
-- 12. TABLE: Promotion (Chương trình khuyến mãi)
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
-- 13. TABLE: PromotionUnitType (Liên kết Khuyến mãi - Loại kho)
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
-- 14. TABLE: Shift (Ca trực)
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
-- 15. TABLE: StaffShift (Phân công ca trực cho nhân viên tại cơ sở)
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
    accountId INT NOT NULL,
    unitId INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    rentalType ENUM('DAILY', 'MONTHLY') NOT NULL,
    rentalAmount DECIMAL(12, 2) NOT NULL,
    depositAmount DECIMAL(12, 2) NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    holdExpiresAt DATETIME,
    CONSTRAINT fk_reservation_account FOREIGN KEY (accountId) REFERENCES Account (accountId) ON UPDATE CASCADE,
    CONSTRAINT fk_reservation_unit FOREIGN KEY (unitId) REFERENCES StorageUnit (unitId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. TABLE: Contract (Hợp đồng thuê kho)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Contract;
CREATE TABLE Contract (
    contractId INT AUTO_INCREMENT PRIMARY KEY,
    reservationId INT NOT NULL UNIQUE,
    pdfUrl VARCHAR(255),
    activatedAt DATETIME,
    terminatedAt DATETIME,
    status ENUM('ACTIVE', 'EXPIRED', 'TERMINATED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_contract_reservation FOREIGN KEY (reservationId) REFERENCES Reservation (reservationId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. TABLE: Payment (Hóa đơn và Thanh toán)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS Payment;
CREATE TABLE Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
    invoiceType ENUM('INITIAL_RENTAL', 'MONTHLY_RENEWAL', 'OVERDUE_FEE', 'INSPECTION_DAMAGE') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    pdfUrl VARCHAR(255),
    issuedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dueAt DATETIME NOT NULL,
    status ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    paymentMethod ENUM('VNPAY', 'MOMO', 'BANK_TRANSFER', 'CASH'),
    transactionCode VARCHAR(100),
    paymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    gatewayTransactionId VARCHAR(100),
    paidAt DATETIME,
    CONSTRAINT fk_payment_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. TABLE: GatePin (Mã PIN động mở cổng cơ sở 15s - 30s)
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
-- 20. TABLE: FeeItem (Danh mục biểu phí phụ thu / bồi thường hư hỏng)
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
-- 21. TABLE: Inspection (Biên bản kiểm tra kho khi trả kho / có sự cố)
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
-- 22. TABLE: InspectionItem (Chi tiết các khoản phí phạt trong biên bản kiểm tra)
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
-- 23. TABLE: SupportTicket (Yêu cầu hỗ trợ gắn với Hợp đồng của khách)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS SupportTicket;
CREATE TABLE SupportTicket (
    ticketId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    ticketCode VARCHAR(50) NOT NULL UNIQUE,
    category ENUM('TECHNICAL', 'BILLING', 'ACCESS_GATE', 'CLEANLINESS', 'OTHER') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acceptedAt DATETIME,
    resolvedAt DATETIME,
    slaDeadline DATETIME,
    CONSTRAINT fk_ticket_contract FOREIGN KEY (contractId) REFERENCES Contract (contractId) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED DATA (DỮ LIỆU KHỞI TẠO MẪU)
-- ============================================================================

-- 1. Roles
INSERT INTO Role (roleId, roleName) VALUES
(1, 'ADMIN'),
(2, 'BOM'),
(3, 'MANAGER'),
(4, 'STAFF'),
(5, 'CUSTOMER');

-- 2. 7 Facilities (Theo Take note.txt)
INSERT INTO Facility (facilityId, facilityName, address, phone, status) VALUES
(1, 'SmartStorage Cầu Giấy (HN-01)', 'Số 391 Cầu Giấy, Q. Cầu Giấy, Hà Nội', '02439100001', 'ACTIVE'),
(2, 'SmartStorage Thanh Xuân (HN-02)', 'Số 120 Khuất Duy Tiến, Q. Thanh Xuân, Hà Nội', '02439100002', 'ACTIVE'),
(3, 'SmartStorage Quận 1 (HCM-01)', 'Số 123 Nguyễn Huệ, Quận 1, TP.HCM', '02839100001', 'ACTIVE'),
(4, 'SmartStorage Quận 7 (HCM-02)', 'Số 456 Nguyễn Thị Thập, Quận 7, TP.HCM', '02839100002', 'ACTIVE'),
(5, 'SmartStorage Thủ Đức (HCM-03)', 'Số 789 Xa Lộ Hà Nội, TP. Thủ Đức, TP.HCM', '02839100003', 'ACTIVE'),
(6, 'SmartStorage Hải Châu (DN-01)', 'Số 68 Nguyễn Văn Linh, Q. Hải Châu, Đà Nẵng', '02369100001', 'ACTIVE'),
(7, 'SmartStorage Ninh Kiều (CT-01)', 'Số 12 Đại lộ Hòa Bình, Q. Ninh Kiều, Cần Thơ', '02929100001', 'ACTIVE');

-- 3. Accounts
-- Passwords sample: bcrypt hash of '123456' -> $2a$12$e80yq9j6K5j... (hoặc plaintext hash quy chuẩn cho dev)
INSERT INTO Account (accountId, roleId, phone, fullName, password, status) VALUES
(1, 1, '0900000001', 'System Administrator', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(2, 2, '0900000002', 'Board of Management Leader', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(3, 3, '0900000003', 'Trần Văn Quản Lý (HN-01)', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(4, 3, '0900000004', 'Lê Thị Quản Lý (HCM-01)', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(5, 4, '0900000005', 'Nguyễn Văn Nhân Viên 1', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(6, 4, '0900000006', 'Phạm Thị Nhân Viên 2', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(7, 5, '0912345678', 'Nguyễn Khách Hàng A', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE'),
(8, 5, '0987654321', 'Công Ty Cổ Phần SmartRetail', '$2a$12$W9x2V7KkR1KkJq7Zq5jOeOY5.e4K3Z9j9l3G9p1B.5f6A8y0H1234', 'ACTIVE');

-- 4. CustomerProfiles (12 số CCCD)
INSERT INTO CustomerProfile (customerId, accountId, identityNumber) VALUES
(1, 7, '001201012345'),
(2, 8, '079201098765');

-- 5. EmployeeProfiles
INSERT INTO EmployeeProfile (employeeId, accountId, facilityId) VALUES
(1, 3, 1), -- Quản lý HN-01
(2, 4, 3), -- Quản lý HCM-01
(3, 5, 1), -- Nhân viên HN-01
(4, 6, 3); -- Nhân viên HCM-01

-- 6. Floors cho 7 Cơ sở
INSERT INTO Floor (floorId, facilityId, floorName, maxLoadPerM2, status) VALUES
-- HN-01 (Mẫu A - 3 tầng)
(1, 1, 'Tầng Trệt (Sảnh & Kho XL)', 1500.00, 'ACTIVE'),
(2, 1, 'Tầng 1 (Kho S, M, L)', 500.00, 'ACTIVE'),
(3, 1, 'Tầng 2 (Kho S, M, L)', 500.00, 'ACTIVE'),
-- HN-02 (Mẫu B - 3 tầng)
(4, 2, 'Tầng Trệt (Logistics Mặt tiền)', 2000.00, 'ACTIVE'),
(5, 2, 'Tầng 1', 1000.00, 'ACTIVE'),
(6, 2, 'Tầng 2', 800.00, 'ACTIVE'),
-- HCM-01 (Mẫu A - 3 tầng Kho mát Climate-Controlled)
(7, 3, 'Tầng Trệt (Sảnh VIP & Kho Mát)', 1200.00, 'ACTIVE'),
(8, 3, 'Tầng 1 (Kho Mát VIP)', 600.00, 'ACTIVE'),
(9, 3, 'Tầng 2 (Kho Mát VIP)', 600.00, 'ACTIVE'),
-- HCM-02 (Mẫu B - 2 tầng)
(10, 4, 'Tầng Trệt (Kho Pallet Cảng)', 2500.00, 'ACTIVE'),
(11, 4, 'Tầng 1 (Kho Hàng E-Commerce)', 1000.00, 'ACTIVE'),
-- HCM-03 (Mẫu B - 3 tầng Khu Công Nghệ Cao)
(12, 5, 'Tầng Trệt (Grid Matrix Hub)', 2000.00, 'ACTIVE'),
(13, 5, 'Tầng 1', 1000.00, 'ACTIVE'),
(14, 5, 'Tầng 2', 800.00, 'ACTIVE'),
-- DN-01 (Mẫu A - 2 tầng)
(15, 6, 'Tầng Trệt (Đồ Homestay/Nội Thất)', 1000.00, 'ACTIVE'),
(16, 6, 'Tầng 1 (Tủ Du Lịch Vali S)', 400.00, 'ACTIVE'),
-- CT-01 (Mẫu B - 2 tầng)
(17, 7, 'Tầng Trệt (Kho Hàng Nông Sản Mẫu)', 1500.00, 'ACTIVE'),
(18, 7, 'Tầng 1 (Tủ Cá Nhân Sinh Viên/Hồ Sơ)', 400.00, 'ACTIVE');

-- 7. UnitTypes
INSERT INTO UnitType (unitTypeId, typeName, size, storageCondition, status) VALUES
(1, 'Size S (Locker mini)', '1m x 1m x 1.2m', 'NORMAL', 'ACTIVE'),
(2, 'Size M (Phòng vừa)', '2m x 2m x 2.5m', 'NORMAL', 'ACTIVE'),
(3, 'Size L (Phòng lớn)', '3m x 3m x 3.0m', 'NORMAL', 'ACTIVE'),
(4, 'Size XL (Kho doanh nghiệp)', '5m x 4m x 3.5m', 'NORMAL', 'ACTIVE'),
(5, 'Size M - Climate (Kho mát VIP)', '2m x 2m x 2.5m', 'CLIMATE_CONTROLLED', 'ACTIVE'),
(6, 'Size L - Climate (Kho mát VIP)', '3m x 3m x 3.0m', 'CLIMATE_CONTROLLED', 'ACTIVE');

-- 8. Prices
INSERT INTO Price (priceId, unitTypeId, dailyPrice, monthlyPrice, depositAmount, climateSurchargePercent, effectiveFrom, effectiveTo, status) VALUES
(1, 1, 50000.00, 800000.00, 800000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(2, 2, 120000.00, 2000000.00, 2000000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(3, 3, 220000.00, 3800000.00, 3800000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(4, 4, 450000.00, 7500000.00, 7500000.00, 0.00, '2026-01-01', NULL, 'ACTIVE'),
(5, 5, 150000.00, 2400000.00, 2400000.00, 20.00, '2026-01-01', NULL, 'ACTIVE'),
(6, 6, 270000.00, 4500000.00, 4500000.00, 20.00, '2026-01-01', NULL, 'ACTIVE');

-- 9. StorageUnits mẫu
INSERT INTO StorageUnit (unitId, floorId, unitTypeId, status) VALUES
-- Tầng Trệt HN-01 (Kho XL)
(1, 1, 4, 'AVAILABLE'),
(2, 1, 4, 'RENTED'),
-- Tầng 1 HN-01 (S, M, L)
(3, 2, 1, 'AVAILABLE'),
(4, 2, 1, 'HOLD'),
(5, 2, 2, 'RENTED'),
(6, 2, 3, 'AVAILABLE'),
-- Tầng 2 HN-01
(7, 3, 2, 'AVAILABLE'),
(8, 3, 3, 'MAINTENANCE'),
-- HCM-01 Tầng 1 (Kho mát VIP M & L)
(9, 8, 5, 'RENTED'),
(10, 8, 6, 'AVAILABLE');

-- 10. Shifts
INSERT INTO Shift (shiftId, shiftName, startTime, endTime, status) VALUES
(1, 'Ca Sáng', '06:00:00', '14:00:00', 'ACTIVE'),
(2, 'Ca Chiều', '14:00:00', '22:00:00', 'ACTIVE'),
(3, 'Ca Đêm', '22:00:00', '06:00:00', 'ACTIVE');

-- 11. StaffShifts
INSERT INTO StaffShift (staffShiftId, employeeId, facilityId, shiftId, workDate, status) VALUES
(1, 3, 1, 1, '2026-09-25', 'ATTENDED'),
(2, 4, 3, 2, '2026-09-25', 'SCHEDULED');

-- 12. Promotions
INSERT INTO Promotion (promotionId, promotionName, promotionType, discountValue, startDate, endDate, status) VALUES
(1, 'Khuyến mãi Khai trương mùa Thu', 'PERCENTAGE', 20.00, '2026-09-01', '2026-10-31', 'ACTIVE'),
(2, 'Ưu đãi Doanh nghiệp thuê dài hạn', 'FIXED_AMOUNT', 500000.00, '2026-09-01', '2026-12-31', 'ACTIVE');

-- 13. PromotionUnitType
INSERT INTO PromotionUnitType (promotionId, unitTypeId) VALUES
(1, 1),
(1, 2),
(1, 3),
(2, 4);

-- 14. FeeItems (Danh mục bồi thường hư hỏng / vệ sinh khi bàn giao)
INSERT INTO FeeItem (feeItemId, feeName, unitPrice, description, status) VALUES
(1, 'Phí vệ sinh rác thông thường', 150000.00, 'Dọn dẹp rác cơ bản để lại trong kho', 'ACTIVE'),
(2, 'Phí vệ sinh chuyên sâu / hóa chất dơ', 400000.00, 'Tẩy rửa vết ố, dầu mỡ, chất lỏng bám sàn', 'ACTIVE'),
(3, 'Phí sửa chữa chốt khóa / tay nắm cửa', 250000.00, 'Thay thế chốt khóa cửa kho bị bẻ hỏng', 'ACTIVE'),
(4, 'Phí sơn vá lại vách ngăn kho', 350000.00, 'Xử lý trầy xước, đục khoét trên panel vách kho', 'ACTIVE'),
(5, 'Phí đền bù hư hỏng cửa cuốn', 1200000.00, 'Hư hỏng nan cửa cuốn, kẹt ray do ngoại lực', 'ACTIVE');

-- 15. Reservations mẫu
INSERT INTO Reservation (reservationId, accountId, unitId, startDate, endDate, rentalType, rentalAmount, depositAmount, status, createdAt, holdExpiresAt) VALUES
(1, 7, 2, '2026-09-01', '2026-10-01', 'MONTHLY', 7500000.00, 7500000.00, 'CONFIRMED', '2026-08-30 09:00:00', NULL),
(2, 8, 5, '2026-09-15', '2026-12-15', 'MONTHLY', 6000000.00, 2000000.00, 'CONFIRMED', '2026-09-14 14:30:00', NULL),
(3, 7, 4, '2026-09-25', '2026-09-30', 'DAILY', 250000.00, 800000.00, 'PENDING', '2026-09-25 10:00:00', '2026-09-25 10:30:00');

-- 16. Contracts mẫu
INSERT INTO Contract (contractId, reservationId, pdfUrl, activatedAt, terminatedAt, status) VALUES
(1, 1, '/contracts/HD-20260901-001.pdf', '2026-09-01 00:00:00', NULL, 'ACTIVE'),
(2, 2, '/contracts/HD-20260915-002.pdf', '2026-09-15 00:00:00', NULL, 'ACTIVE');

-- 17. Payments mẫu
INSERT INTO Payment (paymentId, contractId, invoiceNumber, invoiceType, amount, pdfUrl, issuedAt, dueAt, status, paymentMethod, transactionCode, paymentStatus, gatewayTransactionId, paidAt) VALUES
(1, 1, 'INV-202609-001', 'INITIAL_RENTAL', 15000000.00, '/invoices/INV-202609-001.pdf', '2026-08-30 09:15:00', '2026-09-01 23:59:59', 'PAID', 'VNPAY', 'TXN_VNP_998811', 'SUCCESS', 'VNP14882711', '2026-08-30 09:20:00'),
(2, 2, 'INV-202609-002', 'INITIAL_RENTAL', 8000000.00, '/invoices/INV-202609-002.pdf', '2026-09-14 14:40:00', '2026-09-15 23:59:59', 'PAID', 'BANK_TRANSFER', 'MB_BANK_882910', 'SUCCESS', 'FT2625718991', '2026-09-14 14:45:00');

-- 18. GatePins (Mã PIN động mẫu)
INSERT INTO GatePin (gatePinId, contractId, pinCode, status, generatedAt, expiresAt) VALUES
(1, 1, '839201', 'ACTIVE', '2026-09-25 18:00:00', '2026-09-25 18:00:30'),
(2, 2, '194726', 'EXPIRED', '2026-09-25 17:59:00', '2026-09-25 17:59:30');

-- 19. AuditLogs (Quẹt cổng cơ sở)
INSERT INTO AuditLog (auditLogId, accountId, action, createdAt) VALUES
(1, 7, 'GATE_ACCESS_GRANTED - HN-01 Gate 1', '2026-09-25 08:30:15'),
(2, 8, 'GATE_ACCESS_GRANTED - HCM-01 VIP Gate', '2026-09-25 10:15:40');

-- 20. SupportTickets
INSERT INTO SupportTicket (ticketId, contractId, ticketCode, category, description, status, submittedAt, acceptedAt, resolvedAt, slaDeadline) VALUES
(1, 1, 'TK-202609-001', 'ACCESS_GATE', 'Mã PIN động đôi lúc chậm hiển thị trên mobile app', 'RESOLVED', '2026-09-20 14:00:00', '2026-09-20 14:15:00', '2026-09-20 15:30:00', '2026-09-20 18:00:00'),
(2, 2, 'TK-202609-002', 'CLEANLINESS', 'Yêu cầu hỗ trợ thêm xe nâng pallet tại tầng trệt', 'IN_PROGRESS', '2026-09-25 09:00:00', '2026-09-25 09:10:00', NULL, '2026-09-25 13:00:00');
