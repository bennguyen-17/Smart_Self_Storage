-- Seed lịch trực nền cho 4 tuần (từ thứ Hai tuần hiện tại theo giờ VN).
-- Mỗi cơ sở xếp 1 Staff/ca (theo thứ tự employeeId: 1 = Sáng, 2 = Chiều, 3 = Tối).
-- Chạy sau db-script.sql; chỉ ghi đè các ca SCHEDULED, giữ nguyên lịch sử ca đã trực.

USE smart_storage;

INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Sáng', '07:00:00', '12:00:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Sáng');
INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Chiều', '12:00:00', '16:00:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Chiều');
INSERT INTO Shift (shiftName, startTime, endTime, status)
SELECT 'Ca Tối', '16:00:00', '20:00:00', 'ACTIVE' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Shift WHERE shiftName = 'Ca Tối');

SET @today_vn = IFNULL(DATE(CONVERT_TZ(NOW(), @@session.time_zone, '+07:00')), CURDATE());
SET @week_start = DATE_SUB(@today_vn, INTERVAL WEEKDAY(@today_vn) DAY);
SET @week_end = DATE_ADD(@week_start, INTERVAL 27 DAY);

-- Chỉ xóa ca chưa diễn ra để giữ lại lịch sử ATTENDED/COMPLETED/ABSENT
DELETE FROM StaffShift
WHERE staffShiftId > 0
  AND workDate BETWEEN @week_start AND @week_end
  AND shiftId IN (
      SELECT shiftId FROM Shift WHERE shiftName IN ('Ca Sáng', 'Ca Chiều', 'Ca Tối')
  )
  AND status = 'SCHEDULED';

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
SELECT r.employeeId, r.facilityId, s.shiftId, d.workDate, 'SCHEDULED'
FROM ranked r
JOIN Shift s ON s.shiftName = CASE r.pos
    WHEN 1 THEN 'Ca Sáng'
    WHEN 2 THEN 'Ca Chiều'
    WHEN 3 THEN 'Ca Tối'
END
JOIN days d
WHERE r.pos BETWEEN 1 AND 3
  -- Tránh chèn trùng nếu ca ngày đó đã có người vào ca
  AND NOT EXISTS (
      SELECT 1 FROM StaffShift s
      WHERE s.facilityId = r.facilityId AND s.shiftId = r.pos AND s.workDate = d.workDate
  );

SELECT f.facilityCode,
       COUNT(DISTINCT s.workDate) AS so_ngay,
       COUNT(*) AS so_ca_xep,
       MIN(s.workDate) AS tu_ngay,
       MAX(s.workDate) AS den_ngay
FROM StaffShift s
JOIN Facility f ON f.facilityId = s.facilityId
WHERE s.workDate BETWEEN @week_start AND @week_end
  AND s.shiftId IN (
      SELECT shiftId FROM Shift WHERE shiftName IN ('Ca Sáng', 'Ca Chiều', 'Ca Tối')
  )
GROUP BY f.facilityCode
ORDER BY f.facilityCode;
