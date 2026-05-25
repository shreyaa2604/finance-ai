# Database Plan

## Purpose
To define the data storage strategy, schema designs, and database technologies employed to persistently store and manage financial data for the AI Finance Agent application.

## Responsibilities
- Ensure data integrity, consistency, and reliability.
- Provide efficient data retrieval and storage for transactional and analytical needs.
- Support various data types (structured, semi-structured) required by the application.
- Securely store sensitive user and financial information.

## Components & Schemas

### PostgreSQL (Relational Database)
*   **Purpose:** Primary store for structured data requiring strong consistency and transactional integrity (e.g., User, Transaction, Budget, Financial Goal data).

*   **`Users` Table:**
    *   `id` (PK, UUID)
    *   `name` (VARCHAR)
    *   `email` (VARCHAR, UNIQUE)
    *   `password_hash` (VARCHAR)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`Transactions` Table:**
    *   `id` (PK, UUID)
    *   `user_id` (FK to Users.id, UUID)
    *   `amount` (DECIMAL)
    *   `category` (VARCHAR)
    *   `merchant` (VARCHAR)
    *   `transaction_date` (DATE)
    *   `description` (TEXT, optional)
    *   `currency` (VARCHAR, default 'USD')
    *   `created_at` (TIMESTAMP)

*   **`Budgets` Table:**
    *   `id` (PK, UUID)
    *   `user_id` (FK to Users.id, UUID)
    *   `category` (VARCHAR)
    *   `limit_amount` (DECIMAL)
    *   `current_spent` (DECIMAL, default 0)
    *   `start_date` (DATE)
    *   `end_date` (DATE)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

*   **`FinancialGoals` Table:**
    *   `id` (PK, UUID)
    *   `user_id` (FK to Users.id, UUID)
    *   `name` (VARCHAR)
    *   `target_amount` (DECIMAL)
    *   `deadline` (DATE)
    *   `current_amount` (DECIMAL, default 0)
    *   `created_at` (TIMESTAMP)
    *   `updated_at` (TIMESTAMP)

### MongoDB (Document Database)
*   **Purpose:** Flexible storage for semi-structured data, such as parsed financial documents, audit logs, or potentially user preferences and AI chat history.

*   **`documents` Collection:**
    *   `_id` (ObjectId)
    *   `user_id` (UUID)
    *   `document_type` (VARCHAR, e.g., 'bank_statement', 'invoice')
    *   `content` (JSON/TEXT, extracted text or parsed data)
    *   `upload_date` (TIMESTAMP)
    *   `metadata` (JSON, OCR details, file name)

### Redis (In-memory Data Store)
*   **Purpose:** Caching frequently accessed data, session management, and rate limiting for API calls to improve performance and responsiveness.

## Workflow
1.  **Data Ingestion:** Backend services receive data (e.g., new transactions, user updates).
2.  **Validation:** Data is validated against business rules and schema constraints.
3.  **Storage:** Data is written to the appropriate database (PostgreSQL for structured, MongoDB for documents, Redis for cache/sessions).
4.  **Retrieval:** Backend services query databases to fetch necessary data for frontend display or AI processing.

## Future Scalability Notes
- **Sharding/Replication:** Implement database sharding for PostgreSQL to handle large data volumes and replication for high availability.
- **Optimized Indexing:** Continuously optimize database indexes based on query patterns.
- **Data Warehousing:** Consider a separate data warehouse for complex analytical queries that might impact operational database performance.
- **Polyglot Persistence:** Evaluate other specialized databases if specific needs arise (e.g., graph databases for relationship analysis).