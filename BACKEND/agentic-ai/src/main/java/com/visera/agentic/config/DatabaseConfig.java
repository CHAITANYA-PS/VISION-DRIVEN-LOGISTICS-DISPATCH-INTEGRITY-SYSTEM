package com.visera.agentic.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaRepositories(basePackages = "com.visera.agentic")
@EnableTransactionManagement
public class DatabaseConfig {
	// Configuration for read-only database access
	// JPA repositories are enabled but we'll use JdbcTemplate for queries
}













