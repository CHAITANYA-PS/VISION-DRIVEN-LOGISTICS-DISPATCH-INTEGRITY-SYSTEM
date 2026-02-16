package com.visera.backend.Service;

import org.springframework.web.multipart.MultipartFile;

import com.visera.backend.DTOs.VerificationResponse;

public interface InboundVerificationService {
    VerificationResponse verifyAndProcessInbound(
        Long shipmentItemId,
        MultipartFile image,
        Long workerId
    );
}






