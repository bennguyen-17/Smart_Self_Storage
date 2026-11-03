-- =====================================================================
-- LỊCH TRỰC NỀN: mỗi cơ sở, mỗi ca 1 người, cả tuần (T2 → CN).
-- Chạy SAU db-script.sql. Chạy lại bao nhiêu lần cũng được (chỉ ghi đè lịch chưa diễn ra).
--
-- Nhóm chốt 03/11:
--   - Mỗi ca đúng 1 người trực: sự cố khách gửi trong ca luôn được phân cho đúng người đó.
--   - Cơ sở mở cả T7, CN (khách hay đến cuối tuần).
--   - Đây là lịch nền; Manager vẫn đổi người từng ca ở trang Phân công
--     hoặc "Áp dụng lịch ngày này cho cả tuần".
--
-- Cách xếp: trong mỗi cơ sở, nhân viên (tài khoản Staff đang hoạt động) sắp theo employeeId;
-- người thứ 1 trực Ca Sáng, người thứ 2 Ca Chiều, người thứ 3 Ca Tối.
-- Khoảng ngày: từ thứ Hai của tuần hiện tại (giờ Việt Nam) đến hết 4 tuần.
--
-- Cách chạy (PowerShell, KHÔNG dùng Get-Content | mysql vì hỏng dấu tiếng Việt):
--   cmd /c '"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p --default-character-set=utf8mb4 smart_storage < D:\SWP391\Smart_Self_Storage\database\seed-weekly-shifts.sql'
-- =====================================================================

USE smart_storage;

SET @today_vn = IFNULL(DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00')), CURDATE());
SET @week_start = DATE_SUB(@today_vn, INTERVAL WEEKDAY(@today_vn) DAY);  -- thứ Hai tuần này
SET @week_end = DATE_ADD(@week_start, INTERVAL 27 DAY);                   -- chủ nhật của tuần thứ 4

-- 1. Ghi đè: xóa lịch CHƯA diễn ra (SCHEDULED) của 3 ca chính trong khoảng ngày.
--    Giữ nguyên ca đã vào / đã xong (ATTENDED, COMPLETED, ABSENT) để không mất lịch sử làm việc.
DELETE FROM StaffShift
WHERE workDate BETWEEN @week_start AND @week_end
  AND shiftId IN (1, 2, 3)
  AND status = 'SCHEDULED';

-- 2. Xếp lịch nền: mỗi cơ sở mỗi ca 1 người, mọi ngày trong khoảng.
INSERT INTO StaffShift (employeeId, facilityId, shiftId, workDate, status)
WITH RECURSIVE days AS (
    SELECT @week_start AS workDate
    UNION ALL
    SELECT DATE_ADD(workDate, INTERVAL 1 DAY) FROM days WHERE workDate < @week_end
),
ranked AS (
    SELECT ep.employeeId,
           ep.facilityId,
           ROW_NUMBER() OVER (PARTITION BY ep.facilityId ORDER BY ep.employeeId) AS pos
    FROM EmployeeProfile ep
    JOIN Account a ON a.accountId = ep.accountId
    WHERE a.roleId = 4 AND a.status = 'ACTIVE' AND ep.facilityId IS NOT NULL
)
SELECT r.employeeId, r.facilityId, r.pos AS shiftId, d.workDate, 'SCHEDULED'
FROM ranked r
JOIN days d
WHERE r.pos BETWEEN 1 AND 3
  -- Ca đó trong ngày đó đã có người vào ca rồi (ATTENDED...) thì không chèn thêm người thứ 2
  AND NOT EXISTS (
      SELECT 1 FROM StaffShift s
      WHERE s.facilityId = r.facilityId AND s.shiftId = r.pos AND s.workDate = d.workDate
  );

-- 3. Kiểm tra nhanh: mỗi cơ sở, mỗi ngày phải có đủ 3 ca.
SELECT f.facilityCode,
       COUNT(DISTINCT s.workDate) AS so_ngay,
       COUNT(*) AS so_ca_xep,
       MIN(s.workDate) AS tu_ngay,
       MAX(s.workDate) AS den_ngay
FROM StaffShift s
JOIN Facility f ON f.facilityId = s.facilityId
WHERE s.workDate BETWEEN @week_start AND @week_end AND s.shiftId IN (1, 2, 3)
GROUP BY f.facilityCode
ORDER BY f.facilityCode;
