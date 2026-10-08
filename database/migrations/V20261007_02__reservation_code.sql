-- Persist reservation codes so Staff lookup remains stable across requests.
ALTER TABLE Reservation
    ADD COLUMN reservationCode VARCHAR(50) NULL;

-- Existing reservation codes were previously returned only in the create response,
-- so assign deterministic unique legacy codes based on the immutable reservation ID.
UPDATE Reservation
SET reservationCode = CONCAT('RES-LEGACY-', LPAD(reservationId, 10, '0'))
WHERE reservationCode IS NULL OR reservationCode = '';

ALTER TABLE Reservation
    MODIFY COLUMN reservationCode VARCHAR(50) NOT NULL,
    ADD CONSTRAINT uq_reservation_reservation_code UNIQUE (reservationCode);
