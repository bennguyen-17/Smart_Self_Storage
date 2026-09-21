CREATE DATABASE storage_management_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE storage_management_db;

CREATE TABLE Role (
    roleId INT AUTO_INCREMENT PRIMARY KEY,
    roleName VARCHAR(100) NOT NULL
);

CREATE TABLE Account (
    accountId INT AUTO_INCREMENT PRIMARY KEY,
    roleId INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    fullName VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    status VARCHAR(30),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_account_role
        FOREIGN KEY (roleId)
        REFERENCES Role(roleId)
);

CREATE TABLE CustomerProfile (
    customerId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    identityNumber VARCHAR(50),

    CONSTRAINT fk_customer_account
        FOREIGN KEY (accountId)
        REFERENCES Account(accountId)
);

CREATE TABLE Branch (
    branchId INT AUTO_INCREMENT PRIMARY KEY,
    branchName VARCHAR(150) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    status VARCHAR(30)
);

CREATE TABLE EmployeeProfile (
    employeeId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL UNIQUE,
    branchId INT,

    CONSTRAINT fk_employee_account
        FOREIGN KEY (accountId)
        REFERENCES Account(accountId),

    CONSTRAINT fk_employee_branch
        FOREIGN KEY (branchId)
        REFERENCES Branch(branchId)
);

CREATE TABLE ActivityLog (
    activityLogId INT AUTO_INCREMENT PRIMARY KEY,
    accountId INT NOT NULL,
    action VARCHAR(100),
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),

    CONSTRAINT fk_activity_account
        FOREIGN KEY (accountId)
        REFERENCES Account(accountId)
);

CREATE TABLE AuditLog (
    auditLogId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    action VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_account
        FOREIGN KEY (userId)
        REFERENCES Account(accountId)
);

CREATE TABLE Shift (
    shiftId INT AUTO_INCREMENT PRIMARY KEY,
    shiftName VARCHAR(100) NOT NULL,
    startTime TIME,
    endTime TIME,
    status VARCHAR(30)
);

CREATE TABLE StaffShift (
    staffShiftId INT AUTO_INCREMENT PRIMARY KEY,
    employeeId INT NOT NULL,
    branchId INT NOT NULL,
    shiftId INT NOT NULL,
    workDate DATE NOT NULL,
    status VARCHAR(30),

    CONSTRAINT fk_staffshift_employee
        FOREIGN KEY (employeeId)
        REFERENCES EmployeeProfile(employeeId),

    CONSTRAINT fk_staffshift_branch
        FOREIGN KEY (branchId)
        REFERENCES Branch(branchId),

    CONSTRAINT fk_staffshift_shift
        FOREIGN KEY (shiftId)
        REFERENCES Shift(shiftId)
);

CREATE TABLE Floor (
    floorId INT AUTO_INCREMENT PRIMARY KEY,
    branchId INT NOT NULL,
    floorName VARCHAR(100) NOT NULL,
    maxLoadPerM2 DECIMAL(10,2),
    status VARCHAR(30),

    CONSTRAINT fk_floor_branch
        FOREIGN KEY (branchId)
        REFERENCES Branch(branchId)
);

CREATE TABLE UnitType (
    unitTypeId INT AUTO_INCREMENT PRIMARY KEY,
    typeName VARCHAR(100) NOT NULL,
    size DECIMAL(10,2),
    storageCondition VARCHAR(255),
    status VARCHAR(30)
);

CREATE TABLE StorageUnit (
    unitId INT AUTO_INCREMENT PRIMARY KEY,
    floorId INT NOT NULL,
    unitTypeId INT NOT NULL,
    status VARCHAR(30),

    CONSTRAINT fk_storageunit_floor
        FOREIGN KEY (floorId)
        REFERENCES Floor(floorId),

    CONSTRAINT fk_storageunit_unittype
        FOREIGN KEY (unitTypeId)
        REFERENCES UnitType(unitTypeId)
);

CREATE TABLE Price (
    priceId INT AUTO_INCREMENT PRIMARY KEY,
    unitTypeId INT NOT NULL,
    dailyPrice DECIMAL(12,2),
    monthlyPrice DECIMAL(12,2),
    depositAmount DECIMAL(12,2),
    climateSurchargePercent DECIMAL(5,2),
    effectiveFrom DATE,
    effectiveTo DATE,
    status VARCHAR(30),

    CONSTRAINT fk_price_unittype
        FOREIGN KEY (unitTypeId)
        REFERENCES UnitType(unitTypeId)
);

CREATE TABLE Promotion (
    promotionId INT AUTO_INCREMENT PRIMARY KEY,
    promotionName VARCHAR(150) NOT NULL,
    promotionType VARCHAR(50),
    discountValue DECIMAL(12,2),
    startDate DATE,
    endDate DATE,
    status VARCHAR(30)
);

CREATE TABLE PromotionUnitType (
    promotionId INT NOT NULL,
    unitTypeId INT NOT NULL,

    PRIMARY KEY (promotionId, unitTypeId),

    CONSTRAINT fk_promotionunittype_promotion
        FOREIGN KEY (promotionId)
        REFERENCES Promotion(promotionId),

    CONSTRAINT fk_promotionunittype_unittype
        FOREIGN KEY (unitTypeId)
        REFERENCES UnitType(unitTypeId)
);

CREATE TABLE Reservation (
    reservationId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    unitId INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE,
    rentalType VARCHAR(50),
    rentalAmount DECIMAL(12,2),
    depositAmount DECIMAL(12,2),
    status VARCHAR(30),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    holdExpiresAt DATETIME,

    CONSTRAINT fk_reservation_account
        FOREIGN KEY (userId)
        REFERENCES Account(accountId),

    CONSTRAINT fk_reservation_unit
        FOREIGN KEY (unitId)
        REFERENCES StorageUnit(unitId)
);

CREATE TABLE Contract (
    contractId INT AUTO_INCREMENT PRIMARY KEY,
    reservationId INT NOT NULL UNIQUE,
    pdfUrl VARCHAR(500),
    activatedAt DATETIME,
    terminatedAt DATETIME,
    status VARCHAR(30),

    CONSTRAINT fk_contract_reservation
        FOREIGN KEY (reservationId)
        REFERENCES Reservation(reservationId)
);

CREATE TABLE GatePin (
    gatePinId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    pinCode VARCHAR(50) NOT NULL,
    status VARCHAR(30),
    generatedAt DATETIME,
    expiresAt DATETIME,

    CONSTRAINT fk_gatepin_contract
        FOREIGN KEY (contractId)
        REFERENCES Contract(contractId)
);

CREATE TABLE Payment (
    paymentId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    invoiceNumber VARCHAR(100),
    invoiceType VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    pdfUrl VARCHAR(500),
    issuedAt DATETIME,
    dueAt DATETIME,
    status VARCHAR(30),
    paymentMethod VARCHAR(50),
    transactionCode VARCHAR(100),
    paymentStatus VARCHAR(50),
    gatewayTransactionId VARCHAR(150),
    paidAt DATETIME,

    CONSTRAINT fk_payment_contract
        FOREIGN KEY (contractId)
        REFERENCES Contract(contractId)
);

CREATE TABLE SupportTicket (
    ticketId INT AUTO_INCREMENT PRIMARY KEY,
    contractId INT NOT NULL,
    ticketCode VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    status VARCHAR(30),
    submittedAt DATETIME,
    acceptedAt DATETIME,
    resolvedAt DATETIME,
    slaDeadline DATETIME,

    CONSTRAINT fk_ticket_contract
        FOREIGN KEY (contractId)
        REFERENCES Contract(contractId)
);

CREATE TABLE Inspection (
    inspectionId INT AUTO_INCREMENT PRIMARY KEY,
    paymentId INT NOT NULL,
    employeeId INT NOT NULL,
    inspectionDate DATETIME,
    conditionStatus VARCHAR(50),

    CONSTRAINT fk_inspection_payment
        FOREIGN KEY (paymentId)
        REFERENCES Payment(paymentId),

    CONSTRAINT fk_inspection_employee
        FOREIGN KEY (employeeId)
        REFERENCES EmployeeProfile(employeeId)
);

CREATE TABLE Feeltem (
    feeltemId INT AUTO_INCREMENT PRIMARY KEY,
    feeName VARCHAR(150) NOT NULL,
    unitPrice DECIMAL(12,2) NOT NULL,
    description TEXT,
    status VARCHAR(30)
);

CREATE TABLE InspectionItem (
    inspectionItemId INT AUTO_INCREMENT PRIMARY KEY,
    inspectionId INT NOT NULL,
    feeltemId INT NOT NULL,
    quantity INT,
    amount DECIMAL(12,2),

    CONSTRAINT fk_inspectionitem_inspection
        FOREIGN KEY (inspectionId)
        REFERENCES Inspection(inspectionId),

    CONSTRAINT fk_inspectionitem_feeltem
        FOREIGN KEY (feeltemId)
        REFERENCES Feeltem(feeltemId)
);