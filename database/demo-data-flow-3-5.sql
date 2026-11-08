-- =====================================================================
-- Bổ sung dữ liệu demo Flow 3 + Flow 5 (phần Vỹ), cơ sở #2 SmartStorage Thanh Xuân
-- Chạy SÁNG NGÀY DEMO, sau khi nạp db-script.sql, TRƯỚC khi bật backend.
-- Mọi ngày tính theo CURDATE() nên chạy hôm nào cũng đúng. Chạy lại nhiều lần vẫn an toàn.
--
-- Tài khoản (mật khẩu chung 123456@Test):
--   Admin   : xem bảng Account (roleId của ADMIN)
--   Manager : 0900000004  Hoàng Minh Đức      (cơ sở 2)
--   Staff A : 0902000001  Đỗ Quang Huy        (employeeId 11) – trực CẢ 3 ca hôm nay
--   Staff B : 0902000002  Ngô Thu Phương      (employeeId 12) – chỉ có ca ngày mai (E5.6)
--   Staff C : 0902000003  Trần Minh Quân      (employeeId 13) – bị khóa (E5.5)
--   Khách   : 0987654321  Trần Thu Hà         (accountId 32, customerId 2)
-- =====================================================================
USE smart_storage;
SET @D := CURDATE();

-- ---------- FLOW 3 ----------
-- [H] Yêu cầu trả kho của HĐ #15 (ô HN02-F1-M02), hẹn đúng hôm nay -> happy case nghiệm thu + hoàn cọc.
--     Đưa về SUBMITTED phòng khi cron 00:00 đã hủy vì ngày hẹn cũ đã qua.
UPDATE SupportTicket
SET status = 'SUBMITTED', desiredDate = @D, slaDeadline = TIMESTAMP(@D, '18:00:00'),
    acceptedAt = NULL, resolvedAt = NULL, isSlaBreached = 0, assignedStaffId = 13
WHERE ticketCode = 'TCK-202611-0005';
UPDATE Contract SET status = 'ACTIVE', cancelReason = 'EARLY_TERMINATION' WHERE contractId = 15;

-- [T] Yêu cầu trả kho của HĐ #16 (ô HN02-F1-M03), hẹn sau 2 ngày -> E3.4 Staff nhận sớm bị chặn.
DELETE FROM SupportTicket WHERE ticketCode = 'TCK-DEMO-F3-01';
INSERT INTO SupportTicket (ticketCode, type, status, customerId, facilityId, unitCode, contractId,
                           title, description, desiredDate, slaDeadline, identityVerified, createdAt)
VALUES ('TCK-DEMO-F3-01', 'EARLY_TERMINATION', 'SUBMITTED', 2, 2, 'HN02-F1-M03', 16,
        'Yêu cầu trả kho trước hạn', 'Khách hẹn trả kho sau 2 ngày',
        @D + INTERVAL 2 DAY, TIMESTAMP(@D + INTERVAL 2 DAY, '18:00:00'), 1, NOW());
UPDATE Contract SET cancelReason = 'EARLY_TERMINATION' WHERE contractId = 16;

-- Có sẵn trong seed, không cần sửa:
--   HĐ #19 ACTIVE (HN02-F1-S01)            -> PIN happy case
--   HĐ #17 OVERDUE 14 ngày, nợ phạt        -> E3.7 trả kho bị chặn vì còn nợ phạt
--   HĐ #18 OVERDUE 35 ngày (> 30)          -> E3.8 không cho trả kho tại quầy
--   HĐ #11, #12 PENDING_CHECKIN            -> E3.3, E3.10 (chưa ACTIVE)
--   HĐ #20 COMPLETED + REF PAID; #13, #14 CANCELLED -> dữ liệu quá khứ

-- ---------- FLOW 5 ----------
DELETE FROM StaffShift WHERE facilityId = 2 AND workDate BETWEEN @D - INTERVAL 3 DAY AND @D + INTERVAL 1 DAY;

-- [Q] Ca đã làm xong 3 ngày trước
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(11, 2, 1, @D - INTERVAL 3 DAY, 'COMPLETED'), (12, 2, 2, @D - INTERVAL 3 DAY, 'COMPLETED'),
(11, 2, 1, @D - INTERVAL 2 DAY, 'COMPLETED'), (12, 2, 3, @D - INTERVAL 2 DAY, 'COMPLETED'),
(12, 2, 1, @D - INTERVAL 1 DAY, 'COMPLETED'), (11, 2, 2, @D - INTERVAL 1 DAY, 'COMPLETED'),
(12, 2, 3, @D - INTERVAL 1 DAY, 'ABSENT');

-- [H] Hôm nay: Staff A có cả 3 ca, nên demo giờ nào (07:00-20:00) cũng bắt đầu ca được
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(11, 2, 1, @D, 'SCHEDULED'), (11, 2, 2, @D, 'SCHEDULED'), (11, 2, 3, @D, 'SCHEDULED');

-- [T] Ngày mai: Staff B có ca sáng -> E5.6 hôm nay bấm "Bắt đầu ca" bị chặn
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status) VALUES
(12, 2, 1, @D + INTERVAL 1 DAY, 'SCHEDULED');
-- Từ ngày D+2 trở đi để trống cho Manager xếp ca trực tiếp lúc demo.

-- [Q] Staff C bị khóa -> E5.5 không phân công được; Admin mở khóa lại được
UPDATE Account SET status = 'SUSPENDED' WHERE accountId = 15;

-- Có sẵn: Manager cơ sở 2 (E5.1); ô AVAILABLE HN02-F1-S02..S04, L03, M01 (bảo trì);
--         ô RENTED HN02-F1-M04 (E5.7).

-- Kiểm nhanh sau khi chạy
SELECT ticketCode, status, contractId, desiredDate FROM SupportTicket WHERE facilityId = 2 AND type = 'EARLY_TERMINATION' AND status = 'SUBMITTED';
SELECT s.workDate, sh.shiftName, s.employeeId, s.status FROM StaffShift s JOIN Shift sh USING (shiftId) WHERE s.facilityId = 2 ORDER BY s.workDate, s.shiftId;
