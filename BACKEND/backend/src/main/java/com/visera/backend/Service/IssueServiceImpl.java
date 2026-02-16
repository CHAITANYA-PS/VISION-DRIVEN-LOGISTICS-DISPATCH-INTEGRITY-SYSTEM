package com.visera.backend.Service;

import com.visera.backend.Entity.Issue;
import com.visera.backend.Entity.User;
import com.visera.backend.Repository.IssueRepository;
import com.visera.backend.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final NotificationEventService notificationEventService;

    public IssueServiceImpl(
            IssueRepository issueRepository,
            UserRepository userRepository,
            NotificationEventService notificationEventService) {
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.notificationEventService = notificationEventService;
    }

    @Override
    @Transactional
    public Issue createIssue(Issue issue) {
        // Ensure status is OPEN for new issues
        if (issue.getStatus() == null) {
            issue.setStatus("OPEN");
        }
        Issue savedIssue = issueRepository.save(issue);
        
        // Send real-time notification to supervisors
        notificationEventService.notifyNewIssue(savedIssue);
        
        return savedIssue;
    }

    @Override
    public List<Issue> getAllIssues() {
        return issueRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<Issue> getIssuesByStatus(String status) {
        return issueRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    @Transactional
    public Issue acknowledgeIssue(Long id, Long supervisorId) {
        Optional<Issue> issueOpt = issueRepository.findById(id);
        if (issueOpt.isEmpty()) {
            throw new RuntimeException("Issue not found with id: " + id);
        }

        Issue issue = issueOpt.get();
        
        // Get supervisor user
        Optional<User> supervisorOpt = userRepository.findById(supervisorId);
        if (supervisorOpt.isEmpty()) {
            throw new RuntimeException("Supervisor not found with id: " + supervisorId);
        }

        User supervisor = supervisorOpt.get();
        
        // Update issue
        issue.setStatus("NOTED");
        issue.setAcknowledgedBy(supervisor);
        issue.setAcknowledgedAt(LocalDateTime.now());

        return issueRepository.save(issue);
    }

    @Override
    public Issue getIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));
    }
}

