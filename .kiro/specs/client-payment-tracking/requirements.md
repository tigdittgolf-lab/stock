# Requirements Document: Client Payment Tracking System

## Introduction

This document specifies the requirements for a payment tracking system that manages partial payments for delivery notes (bons de livraison) and invoices (factures) in a multi-tenant stock management system. The system enables tracking of installment payments when clients cannot pay the full amount immediately, providing visibility into payment history, outstanding balances, and payment status.

## Glossary

- **Payment_System**: The client payment tracking system being specified
- **Document**: Either a delivery note (bon de livraison) or invoice (facture)
- **Payment**: A monetary transaction recorded against a Document
- **Partial_Payment**: A Payment that is less than the total amount due on a Document
- **Balance**: The remaining amount owed on a Document after all Payments are applied
- **Payment_Status**: The state of a Document's payment completion (paid, partially paid, unpaid)
- **Tenant**: An isolated customer organization in the multi-tenant system
- **Payment_Method**: The mechanism used to make a Payment (cash, check, bank transfer, etc.)

## Requirements

### Requirement 1: Payment Recording

**User Story:** As a user, I want to record partial payments for delivery notes and invoices, so that I can track installment payments from clients.

#### Acceptance Criteria

1. WHEN a user creates a new Payment, THE Payment_System SHALL store the payment date, amount, payment method, and optional notes
2. WHEN a user creates a Payment, THE Payment_System SHALL associate it with exactly one Document (delivery note or invoice)
3. WHEN a user creates a Payment, THE Payment_System SHALL validate that the payment amount is greater than zero
4. WHEN a user creates a Payment, THE Payment_System SHALL validate that the payment date is not in the future
5. WHEN a user creates a Payment for a Document, THE Payment_System SHALL ensure the tenant_id matches the Document's tenant_id
6. WHEN a user creates a Payment, THE Payment_System SHALL record the creation timestamp and user who created it

### Requirement 2: Payment Balance Calculation

**User Story:** As a user, I want to see the remaining balance for each document, so that I know how much the client still owes.

#### Acceptance Criteria

1. WHEN calculating a Document's Balance, THE Payment_System SHALL sum all associated Payment amounts
2. WHEN calculating a Document's Balance, THE Payment_System SHALL subtract the total payments from the Document's total amount
3. WHEN a Document has no Payments, THE Payment_System SHALL return the Document's total amount as the Balance
4. WHEN the sum of Payments equals the Document's total amount, THE Payment_System SHALL return zero as the Balance
5. WHEN the sum of Payments exceeds the Document's total amount, THE Payment_System SHALL return a negative Balance (overpayment)

### Requirement 3: Payment Status Determination

**User Story:** As a user, I want to see the payment status of each document, so that I can quickly identify which documents need follow-up.

#### Acceptance Criteria

1. WHEN a Document has a Balance equal to its total amount, THE Payment_System SHALL classify it as "unpaid"
2. WHEN a Document has a Balance of zero, THE Payment_System SHALL classify it as "paid"
3. WHEN a Document has a Balance greater than zero and less than its total amount, THE Payment_System SHALL classify it as "partially paid"
4. WHEN a Document has a negative Balance, THE Payment_System SHALL classify it as "overpaid"

### Requirement 4: Payment History Retrieval

**User Story:** As a user, I want to view all payments made for a specific document, so that I can see the complete payment history.

#### Acceptance Criteria

1. WHEN a user requests payment history for a Document, THE Payment_System SHALL return all Payments associated with that Document
2. WHEN displaying payment history, THE Payment_System SHALL show payment date, amount, payment method, and notes for each Payment
3. WHEN displaying payment history, THE Payment_System SHALL order Payments by payment date in descending order (most recent first)
4. WHEN a Document has no Payments, THE Payment_System SHALL return an empty payment history
5. WHEN retrieving payment history, THE Payment_System SHALL enforce tenant_id isolation

### Requirement 5: Payment Modification

**User Story:** As a user, I want to update or delete payment records, so that I can correct mistakes or handle payment reversals.

#### Acceptance Criteria

1. WHEN a user updates a Payment, THE Payment_System SHALL allow modification of payment date, amount, payment method, and notes
2. WHEN a user updates a Payment, THE Payment_System SHALL validate the new amount is greater than zero
3. WHEN a user updates a Payment, THE Payment_System SHALL validate the new payment date is not in the future
4. WHEN a user deletes a Payment, THE Payment_System SHALL remove it from the database
5. WHEN a user updates or deletes a Payment, THE Payment_System SHALL enforce tenant_id isolation
6. WHEN a user updates a Payment, THE Payment_System SHALL record the modification timestamp and user who modified it

### Requirement 6: Outstanding Balance Dashboard

**User Story:** As a user, I want to see a summary of all documents with outstanding balances, so that I can prioritize collection efforts.

#### Acceptance Criteria

1. WHEN a user views the outstanding balance dashboard, THE Payment_System SHALL display all Documents with a Balance greater than zero
2. WHEN displaying the dashboard, THE Payment_System SHALL show Document number, client name, total amount, amount paid, and remaining Balance
3. WHEN displaying the dashboard, THE Payment_System SHALL show the Payment_Status for each Document
4. WHEN displaying the dashboard, THE Payment_System SHALL allow filtering by Document type (delivery note or invoice)
5. WHEN displaying the dashboard, THE Payment_System SHALL allow filtering by client
6. WHEN displaying the dashboard, THE Payment_System SHALL allow sorting by Balance amount, Document date, or client name
7. WHEN displaying the dashboard, THE Payment_System SHALL enforce tenant_id isolation

### Requirement 7: Payment Summary Display

**User Story:** As a user, I want to see payment summary information on document detail pages, so that I can quickly understand payment status without navigating away.

#### Acceptance Criteria

1. WHEN viewing a Document detail page, THE Payment_System SHALL display the total amount due
2. WHEN viewing a Document detail page, THE Payment_System SHALL display the total amount paid
3. WHEN viewing a Document detail page, THE Payment_System SHALL display the remaining Balance
4. WHEN viewing a Document detail page, THE Payment_System SHALL display the Payment_Status
5. WHEN viewing a Document detail page, THE Payment_System SHALL display the count of Payments made
6. WHEN viewing a Document detail page, THE Payment_System SHALL provide a link or button to view full payment history

### Requirement 8: Multi-Tenant Data Isolation

**User Story:** As a system administrator, I want payment data to be isolated by tenant, so that clients cannot access each other's payment information.

#### Acceptance Criteria

1. WHEN storing a Payment, THE Payment_System SHALL include the tenant_id from the associated Document
2. WHEN retrieving Payments, THE Payment_System SHALL filter by the current user's tenant_id
3. WHEN calculating Balances, THE Payment_System SHALL only include Payments matching the tenant_id
4. WHEN displaying dashboards or lists, THE Payment_System SHALL only show data for the current user's tenant_id
5. WHEN a user attempts to access a Payment from a different tenant, THE Payment_System SHALL deny access and return an error

### Requirement 9: Payment API Endpoints

**User Story:** As a frontend developer, I want RESTful API endpoints for payment operations, so that I can integrate payment functionality into the user interface.

#### Acceptance Criteria

1. THE Payment_System SHALL provide a POST endpoint to create new Payments
2. THE Payment_System SHALL provide a GET endpoint to retrieve Payments for a specific Document
3. THE Payment_System SHALL provide a GET endpoint to retrieve a single Payment by ID
4. THE Payment_System SHALL provide a PUT endpoint to update an existing Payment
5. THE Payment_System SHALL provide a DELETE endpoint to remove a Payment
6. THE Payment_System SHALL provide a GET endpoint to retrieve the outstanding balance dashboard data
7. WHEN API endpoints are called, THE Payment_System SHALL validate authentication and authorization
8. WHEN API endpoints are called, THE Payment_System SHALL return appropriate HTTP status codes and error messages

### Requirement 10: Database Schema

**User Story:** As a backend developer, I want a well-designed database schema for payments, so that data is stored efficiently and maintains referential integrity.

#### Acceptance Criteria

1. THE Payment_System SHALL create a payments table with columns for id, tenant_id, document_type, document_id, payment_date, amount, payment_method, notes, created_at, created_by, updated_at, and updated_by
2. THE Payment_System SHALL enforce a foreign key relationship between payments and the tenant
3. THE Payment_System SHALL create indexes on tenant_id, document_type, and document_id for query performance
4. THE Payment_System SHALL support both MySQL and PostgreSQL database engines
5. THE Payment_System SHALL use appropriate data types (decimal for amounts, date for payment_date, timestamp for created_at/updated_at)
6. THE Payment_System SHALL enforce NOT NULL constraints on required fields (tenant_id, document_type, document_id, payment_date, amount)
