package com.visera.agentic.service;

import com.visera.agentic.client.GeminiClient;
import com.visera.agentic.util.SQLValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UnifiedAIService {

	private final JdbcTemplate jdbcTemplate;
	private final GeminiClient geminiClient;

	public Object askQuestion(String question) {
		try {
			// Step 1: Generate SQL from natural language using Gemini AI (single call)
			String sql = geminiClient.generateSQL(question);
			log.info("Generated SQL: {}", sql);

			// Step 2: Validate SQL for security
			SQLValidator.validate(sql);
			log.info("SQL validation passed");

			// Step 3: Execute query based on type
			if (sql.toLowerCase().contains("count")) {
				// COUNT query handling
				Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
				return "There are " + count + " records matching your request.";
			}

			// LIST query handling
			List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

			if (rows.isEmpty()) {
				return "No records found.";
			}

			// Step 4: Format response as natural language
			return formatResponse(rows);

		} catch (RuntimeException e) {
			log.error("Error processing question: {}", e.getMessage());
			return "Error: " + e.getMessage();
		} catch (Exception e) {
			log.error("Unexpected error: {}", e.getMessage(), e);
			return "Error processing your question. Please try again.";
		}
	}

	private String formatResponse(List<Map<String, Object>> rows) {
		StringBuilder response = new StringBuilder();

		for (Map<String, Object> row : rows) {
			// Extract common fields that might be present
			Object id = row.get("id");
			Object name = row.get("name");
			Object productName = row.get("productName");
			Object workerName = row.get("workerName");
			Object code = row.get("code") != null ? row.get("code") : 
			             row.get("productCode") != null ? row.get("productCode") :
			             row.get("skuCode") != null ? row.get("skuCode") :
			             row.get("binCode") != null ? row.get("binCode") : null;
			Object status = row.get("status");
			Object type = row.get("type") != null ? row.get("type") : 
			              row.get("shipmentType") != null ? row.get("shipmentType") :
			              row.get("taskType") != null ? row.get("taskType") :
			              row.get("issueType") != null ? row.get("issueType") : null;
			Object category = row.get("category");
			Object quantity = row.get("quantity");
			Object role = row.get("role");
			Object email = row.get("email");

			// Build response based on available fields - prioritize joined data
			if (productName != null && code != null) {
				// Product name with SKU code or other code
				response.append("Product: ").append(productName);
				if (code != null) {
					response.append(", Code: ").append(code);
				}
			} else if (name != null && code != null) {
				// Name with code
				response.append(name).append(" (Code: ").append(code).append(")");
			} else if (productName != null) {
				response.append("Product: ").append(productName);
			} else if (name != null) {
				response.append(name);
			} else if (code != null) {
				response.append("Code: ").append(code);
			} else if (id != null) {
				response.append("Record ID ").append(id);
			} else {
				response.append("Record");
			}

			if (workerName != null) {
				response.append(", Worker: ").append(workerName);
			}

			if (status != null) {
				response.append(", Status: ").append(status);
			}

			if (type != null) {
				response.append(", Type: ").append(type);
			}

			if (category != null) {
				response.append(", Category: ").append(category);
			}

			if (quantity != null) {
				response.append(", Quantity: ").append(quantity);
			}

			if (role != null) {
				response.append(", Role: ").append(role);
			}

			if (email != null) {
				response.append(", Email: ").append(email);
			}

			response.append(".\n");
		}

		return response.toString().trim();
	}
}

