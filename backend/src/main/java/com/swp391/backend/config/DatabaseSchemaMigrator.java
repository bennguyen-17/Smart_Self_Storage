package com.swp391.backend.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSchemaMigrator {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public DatabaseSchemaMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrateSchemaAndData() {
        try {
            ensureColumnExists("Contract", "dailyOverdueFee", "DECIMAL(12, 2) DEFAULT 50000.00");
            ensureColumnExists("Contract", "overdueLiquidationDays", "INT DEFAULT 30");

            jdbcTemplate.update("UPDATE Contract SET dailyOverdueFee = 50000.00 WHERE dailyOverdueFee IS NULL");
            jdbcTemplate.update("UPDATE Contract SET overdueLiquidationDays = 30 WHERE overdueLiquidationDays IS NULL");

            // Chuẩn hóa các bản ghi ActivityLog của khách hàng bị gán nhầm sang CustomerProfile.customerId (1..6) thay vì Account.accountId (31..36)
            jdbcTemplate.update("""
                    UPDATE ActivityLog al
                    JOIN CustomerProfile cp ON al.accountId = cp.customerId
                    SET al.accountId = cp.accountId
                    WHERE al.action IN ('EARLY_TERMINATION_NO_SHOW', 'CUSTOMER_TICKET_CREATED', 'CLICKWRAP_E_CONTRACT_SIGNED', 'CUSTOMER_DEPOSIT_PAID', 'EXTEND_CONTRACT', 'EXTEND_CONTRACT_VNPAY')
                      AND al.accountId <= 6
                    """);

            // Bổ sung facilityId cho các bản ghi CONFIRM_REFUND_EXECUTED cũ nếu bị thiếu
            jdbcTemplate.update("""
                    UPDATE ActivityLog al
                    JOIN EmployeeProfile ep ON al.accountId = ep.accountId
                    SET al.facilityId = ep.facilityId
                    WHERE al.action = 'CONFIRM_REFUND_EXECUTED' AND al.facilityId IS NULL
                    """);
        } catch (Exception e) {
            log.warn("Không thể chạy tự động đồng bộ schema/data khi khởi động: {}", e.getMessage());
        }
    }

    private void ensureColumnExists(String tableName, String columnName, String columnDefinition) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    """
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND LOWER(TABLE_NAME) = LOWER(?)
                      AND LOWER(COLUMN_NAME) = LOWER(?)
                    """,
                    Integer.class,
                    tableName,
                    columnName
            );
            if (count == null || count == 0) {
                jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN " + columnName + " " + columnDefinition);
                log.info("Đã tự động bổ sung cột {}.{}", tableName, columnName);
            }
        } catch (Exception e) {
            log.warn("Không thể kiểm tra/thêm cột {}.{}: {}", tableName, columnName, e.getMessage());
        }
    }
}
