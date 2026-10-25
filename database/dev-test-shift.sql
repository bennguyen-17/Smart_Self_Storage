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

-- 2. Tự động phân ca Test hôm nay (CURDATE()) cho tất cả Staff
SET @test_shift_id = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);

INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
SELECT ep.employeeId, ep.facilityId, @test_shift_id, CURDATE(), 'SCHEDULED'
FROM EmployeeProfile ep
JOIN Account a ON ep.accountId = a.accountId
WHERE a.roleId = 4
  AND NOT EXISTS (
    SELECT 1 FROM StaffShift ss
    WHERE ss.employeeId = ep.employeeId AND ss.workDate = CURDATE()
  );

-- ---------------------------------------------------------------------
-- PHẦN B: Dọn dẹp sau khi test xong. Bỏ dấu "-- " đầu các dòng dưới rồi chạy.
-- ---------------------------------------------------------------------
-- SET @sid = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test' LIMIT 1);
-- DELETE FROM StaffTask  WHERE shiftId = @sid;
-- DELETE FROM StaffShift WHERE shiftId = @sid;
-- DELETE FROM Shift      WHERE shiftId = @sid;
