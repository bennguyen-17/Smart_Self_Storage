-- Add facility scope to activity logs for Manager reporting.
-- Existing records remain NULL because their historical facility cannot be
-- determined reliably from the log row alone.
ALTER TABLE ActivityLog
    ADD COLUMN facilityId INT NULL AFTER accountId,
    ADD INDEX idx_activity_facility_created (facilityId, createdAt),
    ADD CONSTRAINT fk_activity_facility
        FOREIGN KEY (facilityId) REFERENCES Facility (facilityId)
        ON DELETE SET NULL ON UPDATE CASCADE;
