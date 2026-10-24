-- =====================================================================
-- CHỈ DÙNG KHI TEST TRÊN MÁY MÌNH. KHÔNG chạy khi demo, nộp bài, deploy.
--
-- Mục đích: test trang /staff ngoài giờ ca thật (08:00–20:00).
-- BE chỉ cho Staff làm việc khi đang trong giờ ca được xếp, nên thêm
-- 1 ca phủ cả ngày để test lúc nào cũng được.
--
-- Cách dùng:
--   1. Chạy PHẦN A (sau khi đã chạy db-script.sql).
--   2. Manager → Phân công → hôm nay → xếp Staff vào "Ca Test (cả ngày)".
--   3. Staff đăng nhập → bấm "Bắt đầu ca" → test.
--   4. Test xong chạy PHẦN B để dọn (hoặc chạy lại db-script.sql).
-- =====================================================================

USE smart_storage;
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- PHẦN A: thêm ca test (chạy nhiều lần cũng chỉ thêm 1 ca)
-- ---------------------------------------------------------------------
INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Test (cả ngày)', '00:00:00', '23:59:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Test (cả ngày)');

-- ---------------------------------------------------------------------
-- PHẦN B: dọn sau khi test. Bỏ dấu "-- " đầu các dòng dưới rồi chạy.
-- Xóa việc và phân ca trước vì StaffTask, StaffShift tham chiếu Shift.
-- ---------------------------------------------------------------------
-- SET @sid = (SELECT shiftId FROM Shift WHERE shiftName = 'Ca Test (cả ngày)');
-- DELETE FROM StaffTask  WHERE shiftId = @sid;
-- DELETE FROM StaffShift WHERE shiftId = @sid;
-- DELETE FROM Shift      WHERE shiftId = @sid;
--
-- Nếu lúc test đã bấm "Đã xong" việc bảo trì một ô, ô đó đã đổi sang
-- AVAILABLE. Muốn trả về như seed thì chạy lại db-script.sql.
