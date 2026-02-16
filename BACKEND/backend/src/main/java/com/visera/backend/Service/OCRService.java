package com.visera.backend.Service;

import org.springframework.web.multipart.MultipartFile;

import com.visera.backend.DTOs.OCRVerificationResult;

public interface OCRService {
    OCRVerificationResult verifyPackageLabel(
        MultipartFile image,
        String expectedProductCode,
        String expectedSku,
        String expectedWeight,
        String expectedColor,
        String expectedDimensions
    );
}






