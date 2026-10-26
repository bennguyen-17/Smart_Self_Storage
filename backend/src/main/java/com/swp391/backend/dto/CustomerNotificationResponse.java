package com.swp391.backend.dto;

import java.time.LocalDateTime;

public class CustomerNotificationResponse {
    private String id;
    private String title;
    private String message;
    private String type; // WARNING, SUCCESS, INFO, REMINDER
    private LocalDateTime timestamp;
    private boolean isRead;
    private String link;

    public CustomerNotificationResponse() {}

    public CustomerNotificationResponse(String id, String title, String message, String type, LocalDateTime timestamp, boolean isRead, String link) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.timestamp = timestamp;
        this.isRead = isRead;
        this.link = link;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
}
