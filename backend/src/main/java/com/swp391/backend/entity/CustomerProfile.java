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

    public CustomerProfile() {}

    public CustomerProfile(Integer accountId, String identityNumber) {
        this.accountId = accountId;
        this.identityNumber = identityNumber;
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
}
