-- Additive schema update for Reservation penalties, DEP balances, REF type, and unit statuses.
-- Apply once to an existing database; this file is not run automatically by the application.

ALTER TABLE Reservation
    ADD COLUMN penaltyAmount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE Payment
    MODIFY COLUMN invoiceType ENUM(
        'DEP', 'REF', 'INITIAL_RENTAL', 'MONTHLY_RENEWAL', 'OVERDUE_FEE', 'INSPECTION_DAMAGE'
    ) NOT NULL,
    ADD COLUMN paidAmount DECIMAL(12, 2) NULL,
    ADD COLUMN remainingAmount DECIMAL(12, 2) NULL;

-- INITIAL_RENTAL is retained as a legacy value and was used by the existing deposit flow.
-- amount remains the invoice total; these fields provide the prior paid and outstanding values.
UPDATE Payment
SET paidAmount = CASE
        WHEN status = 'PAID' AND paymentStatus = 'SUCCESS' THEN amount
        ELSE 0.00
    END,
    remainingAmount = amount - CASE
        WHEN status = 'PAID' AND paymentStatus = 'SUCCESS' THEN amount
        ELSE 0.00
    END
WHERE invoiceType IN ('DEP', 'INITIAL_RENTAL');

ALTER TABLE StorageUnit
    MODIFY COLUMN status ENUM(
        'AVAILABLE', 'HOLD', 'RESERVED', 'RENTED', 'MAINTENANCE', 'OVERDUE'
    ) NOT NULL DEFAULT 'AVAILABLE';
