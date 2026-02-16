package com.visera.backend.Controller;

import com.visera.backend.DTOs.ReportDTO;
import com.visera.backend.Repository.ApprovalRepository;
import com.visera.backend.Repository.ShipmentRepository;
import com.visera.backend.Repository.SkuRepository;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Repository.VerificationLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final SkuRepository skuRepository;
    private final VerificationLogRepository verificationLogRepository;
    private final ApprovalRepository approvalRepository;

    public ReportController(
            ShipmentRepository shipmentRepository,
            UserRepository userRepository,
            SkuRepository skuRepository,
            VerificationLogRepository verificationLogRepository,
            ApprovalRepository approvalRepository) {
        this.shipmentRepository = shipmentRepository;
        this.userRepository = userRepository;
        this.skuRepository = skuRepository;
        this.verificationLogRepository = verificationLogRepository;
        this.approvalRepository = approvalRepository;
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    @GetMapping("/analytics")
    public ResponseEntity<ReportDTO> getAnalytics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;
        boolean hasDateRange = false;

        // Parse date parameters if provided (format: yyyy-MM-dd)
        if (startDate != null && !startDate.isEmpty() && endDate != null && !endDate.isEmpty()) {
            try {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                startDateTime = start.atStartOfDay();
                endDateTime = end.atTime(23, 59, 59);
                hasDateRange = true;
            } catch (Exception e) {
                // If parsing fails, ignore date range and use default behavior
            }
        }

        // Build shipment trends
        List<ReportDTO.MonthlyShipmentData> shipmentTrends = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        if (hasDateRange) {
            // Generate monthly data for the date range
            LocalDateTime current = startDateTime.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            while (!current.isAfter(endDateTime)) {
                LocalDateTime monthStart = current;
                LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
                
                // For the first month, use actual startDateTime if it's later than monthStart
                LocalDateTime queryStart = monthStart.isBefore(startDateTime) ? startDateTime : monthStart;
                
                // For the last month, use actual endDateTime if it's earlier than monthEnd
                LocalDateTime queryEnd = monthEnd.isAfter(endDateTime) ? endDateTime : monthEnd;
                
                // Only process if query range is valid
                if (!queryStart.isAfter(queryEnd)) {
                    String monthName = monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + monthStart.getYear();

                    long inbound = shipmentRepository.countByShipmentTypeAndCreatedAtBetween("INBOUND", queryStart, queryEnd);
                    long outbound = shipmentRepository.countByShipmentTypeAndCreatedAtBetween("OUTBOUND", queryStart, queryEnd);

                    shipmentTrends.add(ReportDTO.MonthlyShipmentData.builder()
                            .month(monthName)
                            .inbound(inbound)
                            .outbound(outbound)
                            .build());
                }
                
                current = monthStart.plusMonths(1);
            }
        } else {
            // Default: last 6 months
            for (int i = 5; i >= 0; i--) {
                LocalDateTime monthStart = now.minusMonths(i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);

                String monthName = monthStart.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

                long inbound = shipmentRepository.countByShipmentTypeAndCreatedAtBetween("INBOUND", monthStart, monthEnd);
                long outbound = shipmentRepository.countByShipmentTypeAndCreatedAtBetween("OUTBOUND", monthStart, monthEnd);

                shipmentTrends.add(ReportDTO.MonthlyShipmentData.builder()
                        .month(monthName)
                        .inbound(inbound)
                        .outbound(outbound)
                        .build());
            }
        }

        // Build role distribution (always all-time)
        List<ReportDTO.RoleDistribution> roleDistribution = new ArrayList<>();
        long adminCount = userRepository.countByRole("ADMIN");
        long supervisorCount = userRepository.countByRole("SUPERVISOR");
        long workerCount = userRepository.countByRole("WORKER");

        roleDistribution.add(ReportDTO.RoleDistribution.builder().name("Workers").value(workerCount).build());
        roleDistribution.add(ReportDTO.RoleDistribution.builder().name("Supervisors").value(supervisorCount).build());
        roleDistribution.add(ReportDTO.RoleDistribution.builder().name("Admins").value(adminCount).build());

        // Get summary statistics
        long totalShipments;
        long totalMismatches;
        long totalUsers = userRepository.count(); // Always all-time
        long totalSkus = skuRepository.count(); // Always all-time

        if (hasDateRange) {
            totalShipments = shipmentRepository.countByCreatedAtBetween(startDateTime, endDateTime);
            // Count mismatches from Approval records (source of truth for mismatches shown on Approvals page)
            totalMismatches = approvalRepository.countVerificationMismatchesByRequestedAtBetween(startDateTime, endDateTime);
        } else {
            totalShipments = shipmentRepository.count();
            // Count mismatches from Approval records (source of truth for mismatches shown on Approvals page)
            totalMismatches = approvalRepository.countVerificationMismatches();
        }

        ReportDTO report = ReportDTO.builder()
                .totalShipments(totalShipments)
                .totalMismatches(totalMismatches)
                .totalUsers(totalUsers)
                .totalSkus(totalSkus)
                .shipmentTrends(shipmentTrends)
                .roleDistribution(roleDistribution)
                .build();

        return ResponseEntity.ok(report);
    }
}
