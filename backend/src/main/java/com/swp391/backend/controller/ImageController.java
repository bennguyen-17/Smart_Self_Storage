package com.swp391.backend.controller;

import com.swp391.backend.service.ImageStorageService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageStorageService imageStorageService;

    public ImageController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @GetMapping("/{imageId}")
    public ResponseEntity<byte[]> getImage(
            @PathVariable Integer imageId,
            @AuthenticationPrincipal Integer accountId,
            Authentication authentication) {
        Collection<String> authorities = authentication == null
                ? java.util.List.of()
                : authentication.getAuthorities().stream()
                        .map(authority -> authority.getAuthority())
                        .toList();
        ImageStorageService.ImageFile image = imageStorageService.loadImage(imageId, accountId, authorities);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .cacheControl(CacheControl.noCache())
                .body(image.content());
    }
}
