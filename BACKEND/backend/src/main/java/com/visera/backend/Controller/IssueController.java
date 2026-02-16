package com.visera.backend.Controller;

import com.visera.backend.DTOs.IssueDTO;
import com.visera.backend.Entity.Issue;
import com.visera.backend.Entity.Shipment;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.ShipmentRepository;
import com.visera.backend.Repository.UserRepository;
import com.visera.backend.Service.IssueService;
import com.visera.backend.mapper.EntityMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/issues")
@CrossOrigin(origins = "*")
public class IssueController {

    @Autowired
    EntityMapper mapper;

    private final IssueService issueService;
    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;

    public IssueController(
            IssueService issueService,
            UserRepository userRepository,
            ShipmentRepository shipmentRepository
    ) {
        this.issueService = issueService;
        this.userRepository = userRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @PreAuthorize("hasRole('WORKER')")
    @PostMapping("/create")
    public ResponseEntity<IssueDTO> createIssue(@RequestBody Issue issue) {
        try {
            // Get current user from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User worker = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Worker not found with email: " + userEmail));
            
            // Set reportedBy
            issue.setReportedBy(worker);
            
            // Set shipment if provided
            // Frontend sends shipment: { id: ... }, so we need to extract the ID
            if (issue.getShipment() != null && issue.getShipment().getId() != null) {
                Long shipmentId = issue.getShipment().getId();
                Shipment shipment = shipmentRepository.findById(shipmentId)
                        .orElse(null);
                issue.setShipment(shipment);
            } else {
                issue.setShipment(null);
            }
            
            // Ensure status is OPEN
            issue.setStatus("OPEN");
            
            Issue createdIssue = issueService.createIssue(issue);
            IssueDTO dto = mapper.toIssueDTO(createdIssue);
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create issue: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @GetMapping
    public ResponseEntity<List<IssueDTO>> getAllIssues(
            @RequestParam(required = false) String status
    ) {
        List<Issue> issues;
        
        if (status != null && !status.isEmpty()) {
            issues = issueService.getIssuesByStatus(status);
        } else {
            issues = issueService.getAllIssues();
        }
        
        List<IssueDTO> dtos = issues.stream()
                .map(mapper::toIssueDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    @PreAuthorize("hasAnyRole('SUPERVISOR', 'WORKER')")
    @GetMapping("/{id}")
    public ResponseEntity<IssueDTO> getIssueById(@PathVariable Long id) {
        Issue issue = issueService.getIssueById(id);
        IssueDTO dto = mapper.toIssueDTO(issue);
        return ResponseEntity.ok(dto);
    }

    @PreAuthorize("hasRole('SUPERVISOR')")
    @PatchMapping("/{id}/acknowledge")
    public ResponseEntity<IssueDTO> acknowledgeIssue(@PathVariable Long id) {
        try {
            // Get current supervisor from authentication
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = authentication.getName();
            
            User supervisor = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Supervisor not found with email: " + userEmail));
            
            Issue acknowledgedIssue = issueService.acknowledgeIssue(id, supervisor.getId());
            IssueDTO dto = mapper.toIssueDTO(acknowledgedIssue);
            
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            throw new RuntimeException("Failed to acknowledge issue: " + e.getMessage());
        }
    }
}

