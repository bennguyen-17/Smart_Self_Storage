package com.swp391.backend.service;

import com.swp391.backend.entity.Account;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {
    private static final long TOKEN_LIFETIME_MILLIS = 24 * 60 * 60 * 1000L;

    private final SecretKey signingKey;

    public JwtService(@Value("${jwt.secret}") String base64Secret) {
        byte[] secretBytes = Base64.getDecoder().decode(base64Secret);
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
    }

    public String generateToken(Account account) {
        long now = System.currentTimeMillis();
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", account.getAccountId());
        claims.put("phone", account.getPhone());
        claims.put("role", account.getRoleId() == null ? null : account.getRoleId().toString());

        return Jwts.builder()
                .claims(claims)
                .issuedAt(new Date(now))
                .expiration(new Date(now + TOKEN_LIFETIME_MILLIS))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public Claims validateTokenAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
