-- Dữ liệu mẫu bổ sung cho cơ sở HN02 (Thanh Xuân), chạy sau db-script.sql.
-- Mọi mốc ngày tính theo CURDATE() nên chạy lại nhiều lần vẫn an toàn.
-- Tài khoản mẫu (mật khẩu chung: 123456@Test):
--   Manager : 0900000004 (cơ sở 2)
--   Staff   : 0902000001 (đủ 3 ca hôm nay), 0902000002 (ca ngày mai), 0902000003 (đang bị khóa)
--   Khách   : 0987654321 (accountId 32, customerId 2)
USE smart_storage;
SET @D := CURDATE();

-- Ticket trả kho sớm HĐ #15 hẹn hôm nay (đưa về SUBMITTED nếu cron trước đó đã hủy)
UPDATE SupportTicket
SET status = 'SUBMITTED', desiredDate = @D, slaDeadline = TIMESTAMP(@D, '18:00:00'),
    acceptedAt = NULL, resolvedAt = NULL, isSlaBreached = 0, assignedStaffId = 13
WHERE ticketCode = 'TCK-202611-0005';
UPDATE Contract SET status = 'ACTIVE', cancelReason = 'EARLY_TERMINATION' WHERE contractId = 15;

-- Ticket trả kho sớm HĐ #16 hẹn sau 2 ngày (test chặn nhận sớm trước ngày hẹn)
DELETE FROM SupportTicket WHERE ticketCode = 'TCK-DEMO-F3-01';
INSERT INTO SupportTicket (ticketCode, type, status, customerId, facilityId, unitCode, contractId,
                           title, description, desiredDate, slaDeadline, identityVerified, createdAt)
VALUES ('TCK-DEMO-F3-01', 'EARLY_TERMINATION', 'SUBMITTED', 2, 2, 'HN02-F1-M03', 16,
        'Yêu cầu trả kho trước hạn', 'Khách hẹn trả kho sau 2 ngày',
        @D + INTERVAL 2 DAY, TIMESTAMP(@D + INTERVAL 2 DAY, '18:00:00'), 1, NOW());
UPDATE Contract SET cancelReason = 'EARLY_TERMINATION' WHERE contractId = 16;

-- Phân ca trực cơ sở 2 (3 ngày trước, hôm nay và ngày mai)
DELETE FROM StaffShift WHERE facilityId = 2 AND workDate BETWEEN @D - INTERVAL 3 DAY AND @D + INTERVAL 1 DAY;

INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(11, 2, 1, @D - INTERVAL 3 DAY, 'COMPLETED'), (12, 2, 2, @D - INTERVAL 3 DAY, 'COMPLETED'),
(11, 2, 1, @D - INTERVAL 2 DAY, 'COMPLETED'), (12, 2, 3, @D - INTERVAL 2 DAY, 'COMPLETED'),
(12, 2, 1, @D - INTERVAL 1 DAY, 'COMPLETED'), (11, 2, 2, @D - INTERVAL 1 DAY, 'COMPLETED'),
(12, 2, 3, @D - INTERVAL 1 DAY, 'ABSENT');

-- Hôm nay: employee 11 có cả 3 ca để test được mọi khung giờ 07:00-20:00
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(11, 2, 1, @D, 'SCHEDULED'), (11, 2, 2, @D, 'SCHEDULED'), (11, 2, 3, @D, 'SCHEDULED');

-- Ngày mai: employee 12 có ca sáng (hôm nay không có ca)
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(12, 2, 1, @D + INTERVAL 1 DAY, 'SCHEDULED');

-- Khóa tạm tài khoản employee 13 để test chặn phân ca và mở khóa
UPDATE Account SET status = 'SUSPENDED' WHERE accountId = 15;

SELECT ticketCode, status, contractId, desiredDate FROM SupportTicket WHERE facilityId = 2 AND type = 'EARLY_TERMINATION' AND status = 'SUBMITTED';
SELECT s.workDate, sh.shiftName, s.employeeId, s.status FROM StaffShift s JOIN Shift sh USING (shiftId) WHERE s.facilityId = 2 ORDER BY s.workDate, s.shiftId;
