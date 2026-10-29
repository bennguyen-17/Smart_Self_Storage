-- =====================================================================
-- CHỈ DÙNG KHI TEST TRÊN MÁY MÌNH. KHÔNG chạy khi demo, nộp bài, deploy.
--
-- Mục đích: test trang /staff ngoài giờ ca thật (08:00–20:00).
-- BE chỉ cho Staff làm việc khi đang trong giờ ca được xếp, nên thêm
-- 1 ca phủ cả ngày và tự gán cho Staff hôm nay để test lúc nào cũng được.
--
-- Cách dùng:
--   1. Chạy file này trong MySQL / DBeaver / DataGrip.
--   2. Staff đăng nhập → sẽ thấy nút "Bắt Đầu Ca Ngay" → bấm vào là vào ca.
--   3. Test xong chạy PHẦN B ở cuối file để dọn dẹp.
-- =====================================================================

USE smart_storage;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- PHẦN A: Thêm ca test và tự động phân ca hôm nay cho Staff
-- ---------------------------------------------------------------------
-- 1. Thêm Ca Test (00:00:00 - 23:59:00)
INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Test', '00:00:00', '23:59:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Test');

-- 2. Tự động phân ca Test hôm nay cho tất cả Staff
-- Lưu ý: Docker MySQL thường chạy múi giờ UTC, trong khi máy tính và Backend chạy giờ Việt Nam (GMT+7).
-- Do đó script này gán cho cả CURDATE() (giờ UTC) và ngày theo GMT+7 với trạng thái 'ATTENDED' để vào làm việc ngay.
SET @test_shift_id = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);
SET @today_vn = IFNULL(DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00')), CURDATE());

-- Xóa ca test cũ của hôm nay để làm mới sạch sẽ
DELETE FROM StaffShift 
WHERE shiftId = @test_shift_id 
  AND workDate IN (CURDATE(), @today_vn, DATE_ADD(CURDATE(), INTERVAL 1 DAY));

-- Gán ca theo ngày giờ Việt Nam (trạng thái ATTENDED - đã nhận ca)
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
SELECT ep.employeeId, ep.facilityId, @test_shift_id, @today_vn, 'ATTENDED'
FROM EmployeeProfile ep
JOIN Account a ON ep.accountId = a.accountId
WHERE a.roleId = 4;

-- Gán thêm ngày theo CURDATE() (UTC) nếu khác ngày GMT+7
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
SELECT ep.employeeId, ep.facilityId, @test_shift_id, CURDATE(), 'ATTENDED'
FROM EmployeeProfile ep
JOIN Account a ON ep.accountId = a.accountId
WHERE a.roleId = 4 AND @today_vn <> CURDATE();

-- ---------------------------------------------------------------------
-- PHẦN B: Dọn dẹp sau khi test xong. Bỏ dấu "-- " đầu các dòng dưới rồi chạy.
-- ---------------------------------------------------------------------
-- SET @sid = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);
-- DELETE FROM StaffTask  WHERE shiftId = @sid;
-- DELETE FROM StaffShift WHERE shiftId = @sid;
-- DELETE FROM Shift      WHERE shiftId = @sid;
