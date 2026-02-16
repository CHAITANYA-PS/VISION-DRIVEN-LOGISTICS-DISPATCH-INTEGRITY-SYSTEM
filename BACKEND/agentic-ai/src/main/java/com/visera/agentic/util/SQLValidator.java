package com.visera.agentic.util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class SQLValidator {

	// Allowed tables for read-only queries
	private static final String[] ALLOWED_TABLES = {
		"products", "skus", "shipments", "shipment_items", "shipment_workers",
		"tasks", "inventory_stock", "bins", "racks", "zones",
		"notifications", "approvals", "verification_logs", "issues", "users"
	};

	public static void validate(String sql) {
		// Normalize: lowercase, collapse whitespace
		String q = sql
				.toLowerCase()
				.replaceAll("\\s+", " ")
				.trim();

		// ✅ Rule 1: Only allow SELECT queries
		if (!q.startsWith("select")) {
			throw new RuntimeException("Only SELECT queries are allowed");
		}

		// ❌ Rule 2: Block dangerous keywords
		if (q.contains(" insert ") ||
				q.contains(" update ") ||
				q.contains(" delete ") ||
				q.contains(" drop ") ||
				q.contains(" alter ") ||
				q.contains(" truncate ") ||
				q.contains(" create ") ||
				q.contains(" grant ") ||
				q.contains(" revoke ") ||
				q.contains(" exec ") ||
				q.contains(" execute ")) {

			throw new RuntimeException("Unsafe SQL detected and blocked");
		}

		// ✅ Rule 3: Must read ONLY from allowed tables
		boolean isValidTable = false;
		for (String allowedTable : ALLOWED_TABLES) {
			if (q.contains(" from " + allowedTable) || 
				q.contains(" from " + allowedTable + " ") ||
				q.contains(" from " + allowedTable + "\n") ||
				q.contains(" from " + allowedTable + ";")) {
				isValidTable = true;
				break;
			}
		}

		if (!isValidTable) {
			throw new RuntimeException("Query must read only from allowed tables: " + String.join(", ", ALLOWED_TABLES));
		}

		// ✅ Rule 4: Block password field selection
		if (q.contains("password") || q.contains("Password")) {
			throw new RuntimeException("Password field cannot be selected");
		}
	}
}