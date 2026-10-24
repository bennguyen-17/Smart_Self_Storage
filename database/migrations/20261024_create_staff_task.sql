-- Apply once to an existing database before deploying the StaffTask APIs.
CREATE TABLE IF NOT EXISTS StaffTask (
    taskId INT AUTO_INCREMENT PRIMARY KEY,
    facilityId INT NOT NULL,
    assignedEmployeeId INT NOT NULL,
    assignedByAccountId INT NOT NULL,
    taskType ENUM('MAINTENANCE', 'CHECKOUT_INSPECTION') NOT NULL,
    unitCode VARCHAR(50),
    contractId INT,
    note TEXT,
    status ENUM('ASSIGNED', 'DONE', 'CANCELED') NOT NULL DEFAULT 'ASSIGNED',
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
