package com.visera.backend.Service;

import com.visera.backend.Entity.Issue;

import java.util.List;

public interface IssueService {
    Issue createIssue(Issue issue);
    List<Issue> getAllIssues();
    List<Issue> getIssuesByStatus(String status);
    Issue acknowledgeIssue(Long id, Long supervisorId);
    Issue getIssueById(Long id);
}

