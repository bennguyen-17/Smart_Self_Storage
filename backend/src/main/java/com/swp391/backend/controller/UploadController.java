package com.swp391.backend.controller;

import com.swp391.backend.dto.StoredImageResponse;
import com.swp391.backend.service.ImageStorageService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final ImageStorageService imageStorageService;

    public UploadController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StoredImageResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") String category,
            @AuthenticationPrincipal Integer uploaderAccountId,
            Authentication authentication) {
        java.util.List<String> authorities = authentication == null ? java.util.List.of()
                : authentication.getAuthorities().stream().map(a -> a.getAuthority()).toList();
        return ResponseEntity.ok(imageStorageService.uploadImage(file, category, uploaderAccountId, authorities));
    }
}
