-- Store when a Staff member accepts a ticket for K3 response-time reporting.
ALTER TABLE SupportTicket
    ADD COLUMN acceptedAt DATETIME NULL AFTER slaDeadline;
