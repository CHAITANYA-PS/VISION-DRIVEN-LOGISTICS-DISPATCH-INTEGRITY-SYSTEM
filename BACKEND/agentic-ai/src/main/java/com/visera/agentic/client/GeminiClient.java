package com.visera.agentic.client;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@Value("${gemini.api.url}")
	private String geminiApiUrl;

	@Value("${gemini.api.key}")
	private String geminiApiKey;

	// Unified method - generates SQL for any entity in one call
	public String generateSQL(String question) {
		try {
			// Build the prompt with ALL entity schemas
			String prompt = buildUnifiedPrompt(question);

			// Prepare request headers
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);

			// Build request body
			Map<String, Object> requestBody = buildRequestBody(prompt);

			// Make API call - API key is passed as query parameter
			HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
			String url = geminiApiUrl + "?key=" + geminiApiKey;

			log.info("Calling Gemini API: {}", url);
			log.debug("Prompt: {}", prompt);

			ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

			if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
				String sql = extractSQLFromResponse(response.getBody());
				log.info("Generated SQL from Gemini: {}", sql);
				return sql;
			} else {
				log.error("Gemini API returned status: {}", response.getStatusCode());
				throw new RuntimeException("Failed to generate SQL from Gemini API");
			}

		} catch (Exception e) {
			log.error("Error calling Gemini API: {}", e.getMessage(), e);
			throw new RuntimeException("Error generating SQL: " + e.getMessage(), e);
		}
	}

	private String buildUnifiedPrompt(String question) {
		return """
			You are a SQL expert. Analyze the following natural language question and generate a SQL SELECT query.
			
			You have access to multiple database tables. Based on the question, determine which table(s) to query and generate the appropriate SQL.
			
			IMPORTANT: When a question asks for fields from multiple related tables (e.g., "product name with sku code"), you MUST use JOINs to combine data from related tables.
			
			Table Relationships (Use JOINs when querying related data):
			- skus.product_id → products.id (One product has many SKUs)
			- shipment_items.shipment_id → shipments.id
			- shipment_items.sku_id → skus.id
			- shipment_workers.shipment_id → shipments.id
			- shipment_workers.worker_id → users.id
			- tasks.user_id → users.id
			- tasks.shipment_item_id → shipment_items.id
			- tasks.suggested_bin_id → bins.id
			- tasks.suggested_zone_id → zones.id
			- inventory_stock.sku_id → skus.id
			- inventory_stock.bin_id → bins.id
			- bins.rack_id → racks.id
			- racks.zone_id → zones.id
			- notifications.user_id → users.id
			- approvals.shipment_item_id → shipment_items.id
			- approvals.requested_by → users.id
			- approvals.reviewed_by → users.id
			- verification_logs.shipment_item_id → shipment_items.id
			- verification_logs.verified_by → users.id
			- issues.shipment_id → shipments.id
			- issues.reported_by → users.id
			- issues.acknowledged_by → users.id
			- shipments.created_by → users.id
			- shipments.assigned_to → users.id
			
			Available Tables and Schemas:
			
			1. products
			   - id (BIGINT, PRIMARY KEY)
			   - name (VARCHAR)
			   - description (VARCHAR)
			   - product_code (VARCHAR, UNIQUE)
			   - category (VARCHAR)
			   - status (VARCHAR) - values: 'Active', 'Inactive', 'LOW_STOCK'
			   - image_url (VARCHAR)
			   - created_at (DATETIME)
			
			2. skus
			   - id (BIGINT, PRIMARY KEY)
			   - product_id (BIGINT, FOREIGN KEY to products.id)
			   - sku_code (VARCHAR, UNIQUE)
			   - weight (VARCHAR, nullable)
			   - dimensions (VARCHAR)
			   - color (VARCHAR)
			   - image_url (VARCHAR, nullable)
			   - created_at (DATETIME)
			
			3. shipments
			   - id (BIGINT, PRIMARY KEY)
			   - shipment_type (VARCHAR) - values: 'INBOUND', 'OUTBOUND'
			   - status (VARCHAR) - values: 'CREATED', 'ARRIVED', 'PUTAWAY', etc.
			   - created_by (BIGINT, FOREIGN KEY to users.id)
			   - assigned_to (BIGINT, FOREIGN KEY to users.id, nullable)
			   - deadline (DATE)
			   - created_at (DATETIME)
			
			4. shipment_items
			   - id (BIGINT, PRIMARY KEY)
			   - shipment_id (BIGINT, FOREIGN KEY to shipments.id)
			   - sku_id (BIGINT, FOREIGN KEY to skus.id)
			   - quantity (INTEGER)
			   - status (VARCHAR) - values: 'RECEIVED', 'STORED', 'PICKED', 'PACKED'
			
			5. shipment_workers
			   - id (BIGINT, PRIMARY KEY)
			   - shipment_id (BIGINT, FOREIGN KEY to shipments.id)
			   - worker_id (BIGINT, FOREIGN KEY to users.id)
			   - assigned_at (DATETIME)
			
			6. tasks
			   - id (BIGINT, PRIMARY KEY)
			   - user_id (BIGINT, FOREIGN KEY to users.id)
			   - shipment_item_id (BIGINT, FOREIGN KEY to shipment_items.id)
			   - task_type (VARCHAR) - values: 'PUTAWAY', 'PICKING'
			   - status (VARCHAR) - values: 'PENDING', 'IN_PROGRESS', 'COMPLETED'
			   - suggested_bin_id (BIGINT, FOREIGN KEY to bins.id, nullable)
			   - suggested_location (VARCHAR)
			   - suggested_zone_id (BIGINT, FOREIGN KEY to zones.id, nullable)
			   - in_progress (BOOLEAN)
			   - allocation_plan (TEXT)
			   - created_at (DATETIME)
			   - completed_at (DATETIME, nullable)
			
			7. inventory_stock
			   - id (BIGINT, PRIMARY KEY)
			   - sku_id (BIGINT, FOREIGN KEY to skus.id)
			   - bin_id (BIGINT, FOREIGN KEY to bins.id)
			   - quantity (INTEGER)
			   - updated_at (DATETIME)
			
			8. bins
			   - id (BIGINT, PRIMARY KEY)
			   - rack_id (BIGINT, FOREIGN KEY to racks.id, nullable)
			   - name (VARCHAR)
			   - code (VARCHAR, UNIQUE)
			   - capacity (INTEGER, nullable)
			
			9. racks
			   - id (BIGINT, PRIMARY KEY)
			   - zone_id (BIGINT, FOREIGN KEY to zones.id)
			   - name (VARCHAR)
			   - description (VARCHAR, nullable)
			
			10. zones
			    - id (BIGINT, PRIMARY KEY)
			    - name (VARCHAR)
			    - description (VARCHAR, nullable)
			
			11. notifications
			    - id (BIGINT, PRIMARY KEY)
			    - user_id (BIGINT, FOREIGN KEY to users.id, nullable)
			    - title (VARCHAR, nullable)
			    - message (VARCHAR, nullable)
			    - type (VARCHAR) - values: 'ALERT', 'INFO', 'WARNING', 'ERROR'
			    - is_read (BOOLEAN)
			    - created_at (DATETIME)
			
			12. approvals
			    - id (BIGINT, PRIMARY KEY)
			    - shipment_item_id (BIGINT, FOREIGN KEY to shipment_items.id)
			    - requested_by (BIGINT, FOREIGN KEY to users.id)
			    - type (VARCHAR) - values: 'VERIFICATION_MISMATCH', 'MANUAL_OVERRIDE'
			    - status (VARCHAR) - values: 'PENDING', 'APPROVED', 'REJECTED'
			    - reason (TEXT, nullable)
			    - extracted_data (TEXT, nullable)
			    - expected_data (TEXT, nullable)
			    - reviewed_by (BIGINT, FOREIGN KEY to users.id, nullable)
			    - requested_at (DATETIME)
			    - reviewed_at (DATETIME, nullable)
			
			13. verification_logs
			    - id (BIGINT, PRIMARY KEY)
			    - shipment_item_id (BIGINT, FOREIGN KEY to shipment_items.id, nullable)
			    - uploaded_image_url (VARCHAR, nullable)
			    - extracted_sku (VARCHAR, nullable)
			    - expected_sku (VARCHAR, nullable)
			    - extracted_product_code (VARCHAR, nullable)
			    - expected_product_code (VARCHAR, nullable)
			    - extracted_weight (VARCHAR, nullable)
			    - expected_weight (VARCHAR, nullable)
			    - extracted_color (VARCHAR, nullable)
			    - expected_color (VARCHAR, nullable)
			    - extracted_dimensions (VARCHAR, nullable)
			    - expected_dimensions (VARCHAR, nullable)
			    - ai_confidence (DOUBLE, nullable)
			    - result (VARCHAR, nullable) - values: 'MATCH', 'MISMATCH', 'LOW_CONFIDENCE'
			    - verified_by (BIGINT, FOREIGN KEY to users.id)
			    - verified_at (DATETIME)
			
			14. issues
			    - id (BIGINT, PRIMARY KEY)
			    - shipment_id (BIGINT, FOREIGN KEY to shipments.id, nullable)
			    - reported_by (BIGINT, FOREIGN KEY to users.id)
			    - issue_type (VARCHAR) - values: 'MISMATCH', 'DAMAGED', 'LOCATION', 'OTHER'
			    - description (TEXT, nullable)
			    - status (VARCHAR) - values: 'OPEN', 'NOTED'
			    - acknowledged_by (BIGINT, FOREIGN KEY to users.id, nullable)
			    - expected_sku (VARCHAR, nullable)
			    - detected_sku (VARCHAR, nullable)
			    - confidence (DOUBLE, nullable)
			    - created_at (DATETIME)
			    - acknowledged_at (DATETIME, nullable)
			
			15. users
			    - id (BIGINT, PRIMARY KEY)
			    - name (VARCHAR)
			    - email (VARCHAR, UNIQUE)
			    - password (VARCHAR) - DO NOT SELECT THIS FIELD IN QUERIES
			    - role (VARCHAR) - values: 'ADMIN', 'SUPERVISOR', 'WORKER'
			    - created_at (DATETIME)
			
			SQL Methods Available:
			
			SELECT - Choose columns to retrieve
			WHERE - Filter rows based on conditions
			DISTINCT - Remove duplicate rows
			LIMIT - Limit number of rows returned
			OFFSET - Skip rows before returning results
			
			Operators & Conditions:
			- AND - Combine multiple conditions (all must be true)
			- OR - Combine multiple conditions (at least one must be true)
			- NOT - Negate a condition
			- IN - Match any value in a list
			- BETWEEN - Match values within a range
			- LIKE - Pattern matching (use %% for wildcards)
			- IS NULL - Check for NULL values
			- IS NOT NULL - Check for non-NULL values
			
			JOIN Methods (Use when querying related tables):
			- INNER JOIN - Returns rows with matching values in both tables
			- LEFT JOIN - Returns all rows from left table, matched rows from right (NULL if no match)
			- RIGHT JOIN - Returns all rows from right table, matched rows from left (NULL if no match)
			- FULL JOIN - Returns all rows when there is a match in either table (MySQL doesn't support, use UNION of LEFT and RIGHT)
			- CROSS JOIN - Cartesian product of all rows
			- SELF JOIN - Join a table with itself
			
			Grouping & Aggregation:
			- GROUP BY - Group rows by column values
			- HAVING - Filter groups (use after GROUP BY)
			
			Sorting:
			- ORDER BY - Sort results (ASC or DESC)
			
			Subquery & Existence:
			- SUBQUERY - Nested SELECT query
			- EXISTS - Check if subquery returns any rows
			
			Set Operations:
			- UNION - Combine results from multiple SELECTs (removes duplicates)
			- UNION ALL - Combine results from multiple SELECTs (keeps duplicates)
			- INTERSECT - Return common rows (MySQL doesn't support, use INNER JOIN)
			- EXCEPT - Return rows in first query but not in second (MySQL doesn't support, use LEFT JOIN WHERE NULL)
			
			Functions:
			- COUNT() - Count rows
			- SUM() - Sum numeric values
			- AVG() - Average numeric values
			- MIN() - Minimum value
			- MAX() - Maximum value
			- COALESCE() - Return first non-NULL value
			
			Query Examples:
			
			Example 1: "product name with sku code"
			SELECT p.name AS productName, s.sku_code AS skuCode
			FROM products p
			INNER JOIN skus s ON p.id = s.product_id
			
			Example 2: "show shipments with assigned worker names"
			SELECT sh.id AS id, sh.shipment_type AS shipmentType, u.name AS workerName
			FROM shipments sh
			LEFT JOIN shipment_workers sw ON sh.id = sw.shipment_id
			LEFT JOIN users u ON sw.worker_id = u.id
			
			Example 3: "inventory stock with product and bin information"
			SELECT p.name AS productName, s.sku_code AS skuCode, b.code AS binCode, inv.quantity AS quantity
			FROM inventory_stock inv
			INNER JOIN skus s ON inv.sku_id = s.id
			INNER JOIN products p ON s.product_id = p.id
			INNER JOIN bins b ON inv.bin_id = b.id
			
			Rules:
			1. Generate ONLY a SELECT query
			2. Use camelCase aliases for snake_case columns (e.g., product_code AS productCode, created_at AS createdAt, shipment_type AS shipmentType, is_read AS isRead)
			3. When question mentions fields from multiple tables, ALWAYS use JOINs to combine the data
			4. Use INNER JOIN when you need matching records from both tables
			5. Use LEFT JOIN when you want all records from the main table even if related table has no match
			6. Always use table aliases (e.g., products p, skus s) for clarity
			7. Return ONLY the SQL query, nothing else
			8. Do not include any explanations or markdown formatting
			9. Use proper SQL syntax for MySQL
			10. For COUNT queries, use COUNT(*) and return a single number
			11. For status/enum values, use exact case as shown above
			12. NEVER select the password field from users table
			13. Handle nullable fields appropriately in WHERE clauses
			14. Use DISTINCT if question asks for unique values
			15. Use LIMIT and OFFSET for pagination if requested
			16. Use ORDER BY for sorting when appropriate
			17. Use GROUP BY and aggregation functions when question asks for summaries or counts by category
			
			Question: %s
			
			SQL Query:
			""".formatted(question);
	}

	// Keep old method for reference (not used, but kept for clarity)
	private String buildPrompt(String question) {
		return """
			You are a SQL expert. Convert the following natural language question into a SQL SELECT query for the products table.
			
			Table Schema: products
			- id (BIGINT, PRIMARY KEY)
			- name (VARCHAR)
			- description (VARCHAR)
			- product_code (VARCHAR, UNIQUE)
			- category (VARCHAR)
			- status (VARCHAR) - possible values: 'Active', 'Inactive', 'LOW_STOCK'
			- image_url (VARCHAR)
			- created_at (DATETIME)
			
			Rules:
			1. Generate ONLY a SELECT query
			2. Use column aliases: product_code AS productCode, image_url AS imageUrl, created_at AS createdAt
			3. For status values, use exact case: 'Active', 'Inactive', 'LOW_STOCK'
			4. Return ONLY the SQL query, nothing else
			5. Do not include any explanations or markdown formatting
			6. Use proper SQL syntax for MySQL
			
			Question: %s
			
			SQL Query:
			""".formatted(question);
	}

	private Map<String, Object> buildRequestBody(String prompt) {
		Map<String, Object> part = new HashMap<>();
		part.put("text", prompt);

		Map<String, Object> content = new HashMap<>();
		content.put("parts", List.of(part));

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("contents", List.of(content));

		return requestBody;
	}

	private String extractSQLFromResponse(String responseBody) {
		try {
			JsonNode rootNode = objectMapper.readTree(responseBody);
			
			// Navigate through Gemini API response structure
			JsonNode candidates = rootNode.path("candidates");
			if (candidates != null && candidates.isArray() && candidates.size() > 0) {
				JsonNode candidate = candidates.get(0);
				JsonNode content = candidate.path("content");
				JsonNode parts = content.path("parts");
				
				if (parts != null && parts.isArray() && parts.size() > 0) {
					JsonNode part = parts.get(0);
					String text = part.path("text").asText();
					
					// Clean up the SQL - remove markdown code blocks if present
					String sql = text.trim();
					if (sql.startsWith("```sql")) {
						sql = sql.substring(6);
					}
					if (sql.startsWith("```")) {
						sql = sql.substring(3);
					}
					if (sql.endsWith("```")) {
						sql = sql.substring(0, sql.length() - 3);
					}
					
					return sql.trim();
				}
			}
			
			// Fallback: try to extract from text directly
			if (responseBody.contains("SELECT") || responseBody.contains("select")) {
				// Try to find SQL in the response
				int start = responseBody.toLowerCase().indexOf("select");
				if (start != -1) {
					String sql = responseBody.substring(start);
					// Try to find the end of SQL statement
					int end = sql.indexOf(";");
					if (end != -1) {
						sql = sql.substring(0, end);
					}
					return sql.trim();
				}
			}
			
			throw new RuntimeException("Could not extract SQL from Gemini response");
			
		} catch (Exception e) {
			log.error("Error parsing Gemini response: {}", e.getMessage());
			throw new RuntimeException("Failed to parse SQL from Gemini response: " + e.getMessage(), e);
		}
	}
}