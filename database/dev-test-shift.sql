-- Script dev local để test cổng /staff ngoài khung giờ ca thật (07:00-20:00).
-- Tạo 1 ca phủ cả ngày (00:00-23:59) và gán cho toàn bộ Staff trong ngày hôm nay.

USE smart_storage;
SET NAMES utf8mb4;

INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Test', '00:00:00', '23:59:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Test');

-- Gán cả theo giờ VN (+07:00) và CURDATE() phòng trường hợp MySQL chạy múi giờ UTC
SET @test_shift_id = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);
SET @today_vn = IFNULL(DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00')), CURDATE());

DELETE FROM StaffShift 
WHERE shiftId = @test_shift_id 
  AND workDate IN (CURDATE(), @today_vn, DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
SELECT ep.employeeId, ep.facilityId, @test_shift_id, @today_vn, 'SCHEDULED'
FROM EmployeeProfile ep
JOIN Account a ON ep.accountId = a.accountId
WHERE a.roleId = 4;

INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
SELECT ep.employeeId, ep.facilityId, @test_shift_id, CURDATE(), 'SCHEDULED'
FROM EmployeeProfile ep
JOIN Account a ON ep.accountId = a.accountId
WHERE a.roleId = 4 AND @today_vn <> CURDATE();

-- Bỏ comment các dòng dưới nếu muốn dọn ca test sau khi dùng xong:
-- SET @sid = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);
-- DELETE FROM StaffTask  WHERE shiftId = @sid;
-- DELETE FROM StaffShift WHERE shiftId = @sid;
-- DELETE FROM Shift      WHERE shiftId = @sid;
