package com.farmsense.service;

import com.eatthepath.otp.TimeBasedOneTimePasswordGenerator;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.security.Key;
import java.time.Instant;
import java.util.Base64;

@Service
public class TotpService {

    private final TimeBasedOneTimePasswordGenerator totpGenerator;

    public TotpService() {
        try {
            this.totpGenerator = new TimeBasedOneTimePasswordGenerator();
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize TOTP generator", e);
        }
    }

    public String generateSecretKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(totpGenerator.getAlgorithm());
            keyGenerator.init(160); // standard for SHA-1
            Key key = keyGenerator.generateKey();
            return Base64.getEncoder().encodeToString(key.getEncoded());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate secret key", e);
        }
    }

    public String getQrCodeImageUri(String email, String secret) {
        try {
            String otpAuthUri = String.format("otpauth://totp/FarmSense:%s?secret=%s&issuer=FarmSense", 
                                            email, Base32.encode(Base64.getDecoder().decode(secret)));
            
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthUri, BarcodeFormat.QR_CODE, 200, 200);

            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    public boolean verifyCode(String secret, String code) {
        try {
            Key key = new SecretKeySpec(Base64.getDecoder().decode(secret), totpGenerator.getAlgorithm());
            int generatedCode = totpGenerator.generateOneTimePassword(key, Instant.now());
            // Account for clock drift by checking +/- 1 interval (optional, but good practice)
            // For simplicity, we just check current
            String expectedCode = String.format("%06d", generatedCode);
            if (expectedCode.equals(code)) return true;
            
            // Allow 30 seconds drift back
            int prevCode = totpGenerator.generateOneTimePassword(key, Instant.now().minusSeconds(30));
            if (String.format("%06d", prevCode).equals(code)) return true;
            
            // Allow 30 seconds drift forward
            int nextCode = totpGenerator.generateOneTimePassword(key, Instant.now().plusSeconds(30));
            return String.format("%06d", nextCode).equals(code);

        } catch (Exception e) {
            return false;
        }
    }

    // Helper class to encode to Base32 required by authenticator apps
    private static class Base32 {
        private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        
        static String encode(byte[] bytes) {
            int i = 0, index = 0, digit = 0;
            int currByte, nextByte;
            StringBuilder base32 = new StringBuilder((bytes.length + 7) * 8 / 5);

            while (i < bytes.length) {
                currByte = (bytes[i] >= 0) ? bytes[i] : (bytes[i] + 256);
                
                if (index > 3) {
                    if ((i + 1) < bytes.length) {
                        nextByte = (bytes[i + 1] >= 0) ? bytes[i + 1] : (bytes[i + 1] + 256);
                    } else {
                        nextByte = 0;
                    }
                    
                    digit = currByte & (0xFF >> index);
                    index = (index + 5) % 8;
                    digit <<= index;
                    digit |= nextByte >> (8 - index);
                    i++;
                } else {
                    digit = (currByte >> (8 - (index + 5))) & 0x1F;
                    index = (index + 5) % 8;
                    if (index == 0) i++;
                }
                base32.append(ALPHABET.charAt(digit));
            }
            return base32.toString();
        }
    }
}
