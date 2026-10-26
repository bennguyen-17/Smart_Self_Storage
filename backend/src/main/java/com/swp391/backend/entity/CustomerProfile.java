package com.swp391.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "CustomerProfile")
public class CustomerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customerId")
    private Integer customerId;

    @Column(name = "accountId", nullable = false, unique = true)
    private Integer accountId;

    @Column(name = "identityNumber", nullable = false, unique = true, length = 20)
    private String identityNumber;

    @Column(name = "bankName", length = 100)
    private String bankName;

    @Column(name = "bankAccountNumber", length = 50)
    private String bankAccountNumber;

    @Column(name = "bankAccountName", length = 100)
    private String bankAccountName;

    public CustomerProfile() {}

    public CustomerProfile(Integer accountId, String identityNumber) {
        this.accountId = accountId;
        this.identityNumber = identityNumber;
    }

    public CustomerProfile(Integer accountId, String identityNumber, String bankName, String bankAccountNumber, String bankAccountName) {
        this.accountId = accountId;
        this.identityNumber = identityNumber;
        this.bankName = bankName;
        this.bankAccountNumber = bankAccountNumber;
        this.bankAccountName = bankAccountName;
    }

    public Integer getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Integer customerId) {
        this.customerId = customerId;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public String getIdentityNumber() {
        return identityNumber;
    }

    public void setIdentityNumber(String identityNumber) {
        this.identityNumber = identityNumber;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankAccountName() {
        return bankAccountName;
    }

    public void setBankAccountName(String bankAccountName) {
        this.bankAccountName = bankAccountName;
    }
}
