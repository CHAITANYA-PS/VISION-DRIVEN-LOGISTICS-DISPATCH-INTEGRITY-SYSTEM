// package com.visera.backend.DTOs;

// import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
// import com.fasterxml.jackson.annotation.JsonProperty;

// import lombok.AllArgsConstructor;
// import lombok.Builder;
// import lombok.Data;
// import lombok.NoArgsConstructor;

// @Data
// @Builder
// @NoArgsConstructor
// @AllArgsConstructor
// @JsonIgnoreProperties(ignoreUnknown = true)
// public class OCRVerificationResult {
//     private String status;
    
//     @JsonProperty("verification_result")
//     private String verificationResult;
    
//     private String[] issues;
//     private ExtractedData data;
    
//     @Data
//     @Builder
//     @NoArgsConstructor
//     @AllArgsConstructor
//     @JsonIgnoreProperties(ignoreUnknown = true)
//     public static class ExtractedData {
//         private String sku;
        
//         @JsonProperty("product_code")
//         private String productCode;
        
//         private String location;
//         private String weight;
//         private String dimensions;
//         private String color;
//         private String brand;
        
//         @JsonProperty("confidence_score")
//         private double confidenceScore;
        
//         @JsonProperty("raw_lines")
//         private String[] rawLines;
//     }
// }


package com.visera.backend.DTOs;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class OCRVerificationResult {

    private String status;

    @JsonProperty("verification_result")
    private String verificationResult;

    private String[] issues;
    private ExtractedData data;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ExtractedData {

        private String sku;

        // ✅ FASTAPI RETURNS "pid"
        @JsonProperty("pid")
        private String productCode;

        private String location;
        private String weight;
        private String dimensions;
        private String color;
        private String brand;

        @JsonProperty("confidence_score")
        private double confidenceScore;

        @JsonProperty("raw_lines")
        private String[] rawLines;
    }
}