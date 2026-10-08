-- Add the invoice status used after the online deposit is paid but rent remains due at check-in.
ALTER TABLE Payment
    MODIFY COLUMN status ENUM(
        'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'
    ) NOT NULL DEFAULT 'PENDING';
