# Agentic AI Service

This is a Spring Boot application that uses **real Gemini AI** to convert natural language questions into SQL queries and return human-readable answers. Supports queries across multiple database entities including products, shipments, inventory, users, and more.

## Features

- **Real AI Integration**: Uses Google Gemini 2.5 Flash API (not pattern matching)
- **Natural Language Queries**: Ask questions in plain English about any entity
- **Multi-Entity Support**: Supports queries across 15+ database tables with JOINs
- **SQL Security**: Validates all generated SQL to prevent injection attacks
- **Read-Only Access**: Only SELECT queries allowed, no data modifications
- **Unified Approach**: Single endpoint handles all entity queries

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL database (visera_db) running on localhost:3306
- Gemini API key (configured in application.properties)

## Setup

1. **Database**: Ensure MySQL is running and `visera_db` database exists with required tables (products, skus, shipments, users, etc.)

2. **Configuration**: Update `src/main/resources/application.properties` if needed:
   - Database credentials (default: root/root1234)
   - Server port (default: 8082)
   - Gemini API key is already configured

3. **Build and Run**:
   ```bash
   cd BACKEND/agentic-ai
   mvn clean install
   mvn spring-boot:run
   ```

4. **Verify**: Check logs for "Agentic AI Application Started on port 8082"

## API Endpoints

### POST `/api/ai/chat` (Primary Endpoint)

Ask natural language questions about any entity (products, shipments, inventory, users, etc.).

**Request:**
```json
{
  "question": "show me all products"
}
```

**Response:**
```
Product: Laptop, Code: PROD001, Status: Active, Category: Electronics.
Product: Mouse, Code: PROD002, Status: Active, Category: Electronics.
```

### POST `/api/ai/products/chat` (Backward Compatibility)

Same as `/api/ai/chat` - maintained for backward compatibility with existing clients.

## Testing with Postman

1. **Import Collection**: Import `POSTMAN_COLLECTION.json` into Postman

2. **Test Cases Available**:
   - Count Active Products
   - List All Products
   - Count by Category
   - List Inactive Products
   - Search by Product Code
   - Count by Multiple Criteria
   - Natural Language Variations
   - Error Handling Tests

3. **Base URL**: `http://localhost:8082`

## Example Questions

**Product Queries:**
- "how many active products are there?"
- "show me all products"
- "show me product names with their sku codes"
- "list all inactive products"
- "how many products are in the Electronics category?"

**Multi-Entity Queries:**
- "show me shipments with assigned worker names"
- "inventory stock with product and bin information"
- "show me all users with their roles"
- "tasks assigned to workers"

## Architecture

```
Client Request → UnifiedAIController → UnifiedAIService → GeminiClient → Gemini API
                                                              ↓
                                                         SQLValidator
                                                              ↓
                                                         JdbcTemplate → MySQL Database
```

## Security Features

- ✅ Only SELECT queries allowed
- ✅ Blocks dangerous SQL keywords (INSERT, UPDATE, DELETE, DROP, etc.)
- ✅ Restricts queries to allowed tables only (products, skus, shipments, users, etc.)
- ✅ Blocks password field selection from users table
- ✅ Read-only database access

## Project Structure

```
BACKEND/agentic-ai/
├── pom.xml
├── POSTMAN_COLLECTION.json
├── README.md
└── src/
    ├── main/
    │   ├── java/com/visera/agentic/
    │   │   ├── AgenticAIApplication.java
    │   │   ├── controller/
    │   │   │   └── UnifiedAIController.java
    │   │   ├── service/
    │   │   │   └── UnifiedAIService.java
    │   │   ├── client/
    │   │   │   └── GeminiClient.java
    │   │   ├── util/
    │   │   │   └── SQLValidator.java
    │   │   └── config/
    │   │       ├── RestTemplateConfig.java
    │   │       └── DatabaseConfig.java
    │   └── resources/
    │       └── application.properties
    └── test/
        └── java/com/visera/agentic/
            └── AgenticAIApplicationTests.java
```

## Troubleshooting

1. **Application won't start**: Check MySQL is running and database exists
2. **API errors**: Verify Gemini API key is valid in application.properties
3. **SQL errors**: Check database connection and table schema
4. **No response**: Check application logs for detailed error messages

## Supported Entities

The unified service supports queries across all these database tables:
- Products, SKUs
- Shipments, Shipment Items, Shipment Workers
- Tasks
- Inventory Stock, Bins, Racks, Zones
- Users
- Notifications, Approvals, Verification Logs, Issues

All queries support JOINs to combine data from related tables.






