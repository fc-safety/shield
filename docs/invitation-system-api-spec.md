# Invitation System - Backend API Specification

## Overview

This document specifies the backend API changes needed to support the invitation system, which allows Client Admins to invite users to their organization via shareable invite links.

The frontend implementation is complete and expects these endpoints to be available.

---

## New Endpoints Required

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/invitations` | Client Admin+ | Create invitation |
| `GET` | `/invitations` | Client Admin+ | List invitations for client |
| `GET` | `/invitations/:id` | Client Admin+ | Get invitation details |
| `DELETE` | `/invitations/:id` | Client Admin+ | Revoke invitation |
| `GET` | `/invitations/validate/:code` | **Public** | Validate invite code (pre-auth) |
| `POST` | `/invitations/:code/accept` | Authenticated | Accept invitation |

---

## Data Model

### Invitation Entity

```typescript
interface Invitation {
  id: string;
  code: string;                    // Unique URL-safe invite code (e.g., nanoid)
  clientId: string;                // Target organization
  createdById: string;             // Person who created invite
  email?: string;                  // Optional: restrict to specific email
  roleId?: string;                 // Optional: pre-assign role on accept
  siteId?: string;                 // Optional: pre-assign site on accept
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresOn: string;               // ISO datetime
  acceptedById?: string;           // Person who accepted (set on accept)
  acceptedOn?: string;             // When accepted (set on accept)
  createdOn: string;
  modifiedOn: string;

  // Relations (include in responses)
  client?: { id: string; name: string; externalId: string };
  createdBy?: { id: string; firstName: string; lastName: string };
  role?: { id: string; name: string };
  site?: { id: string; name: string };

  // Computed field (include in create response)
  inviteUrl?: string;              // Full URL: https://{APP_HOST}/accept-invite/{code}
}
```

### Database Schema (Prisma example)

```prisma
model Invitation {
  id          String   @id @default(uuid())
  code        String   @unique  // URL-safe unique code
  clientId    String
  createdById String
  email       String?
  roleId      String?
  siteId      String?
  status      InvitationStatus @default(PENDING)
  expiresOn   DateTime
  acceptedById String?
  acceptedOn   DateTime?
  createdOn   DateTime @default(now())
  modifiedOn  DateTime @updatedAt

  client      Client   @relation(fields: [clientId], references: [id])
  createdBy   Person   @relation("CreatedInvitations", fields: [createdById], references: [id])
  acceptedBy  Person?  @relation("AcceptedInvitations", fields: [acceptedById], references: [id])
  role        Role?    @relation(fields: [roleId], references: [id])
  site        Site?    @relation(fields: [siteId], references: [id])
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

---

## Endpoint Specifications

### 1. Create Invitation

```http
POST /invitations
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "clientId": "uuid",           // Required for Super Admin, optional for Client Admin (defaults to their client)
  "email": "user@example.com",  // Optional: restrict to this email
  "roleId": "uuid",             // Optional: pre-assign role
  "siteId": "uuid",             // Optional: pre-assign site (must belong to client)
  "expiresInDays": 7            // Optional: 1-30, default 7
}
```

**Response:** `201 Created`
```json
{
  "id": "invitation-uuid",
  "code": "abc123xyz",
  "inviteUrl": "https://shield.example.com/accept-invite/abc123xyz",
  "clientId": "client-uuid",
  "email": "user@example.com",
  "roleId": "role-uuid",
  "siteId": "site-uuid",
  "status": "PENDING",
  "expiresOn": "2024-01-22T00:00:00Z",
  "createdOn": "2024-01-15T10:00:00Z",
  "createdById": "person-uuid",
  "client": { "id": "...", "name": "Acme Corp", "externalId": "acme" },
  "role": { "id": "...", "name": "Inspector" },
  "site": { "id": "...", "name": "Main Office" }
}
```

**Validations:**
- Client must exist and be active
- If `siteId` provided, site must belong to specified client
- If `roleId` provided, role must exist
- If `email` provided, must be valid email format
- `expiresInDays` must be 1-30 (default: 7)

**Authorization:**
- Super Admin: Can create for any client (must provide `clientId`)
- Client Admin: Can only create for their own client (`clientId` optional, defaults to their client)

**Code Generation:**
- Generate a unique, URL-safe code (e.g., using nanoid with 12+ characters)
- Construct `inviteUrl` using the configured APP_HOST environment variable

---

### 2. List Invitations

```http
GET /invitations?status=PENDING&limit=50&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: PENDING, ACCEPTED, EXPIRED, REVOKED |
| `clientId` | string | Filter by client (Super Admin only) |
| `limit` | number | Max results (default 50, max 100) |
| `offset` | number | Pagination offset (default 0) |

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "invitation-uuid",
      "code": "abc123xyz",
      "inviteUrl": "https://shield.example.com/accept-invite/abc123xyz",
      "clientId": "client-uuid",
      "email": "user@example.com",
      "status": "PENDING",
      "expiresOn": "2024-01-22T00:00:00Z",
      "createdOn": "2024-01-15T10:00:00Z",
      "client": { "id": "...", "name": "Acme Corp", "externalId": "acme" },
      "role": { "id": "...", "name": "Inspector" },
      "site": { "id": "...", "name": "Main Office" },
      "createdBy": { "id": "...", "firstName": "John", "lastName": "Doe" }
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

**Authorization & Scoping:**
- Super Admin: Can view all invitations, optionally filter by `clientId`
- Client Admin: Automatically scoped to their client only

---

### 3. Get Invitation Details

```http
GET /invitations/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "invitation-uuid",
  "code": "abc123xyz",
  "inviteUrl": "https://shield.example.com/accept-invite/abc123xyz",
  "clientId": "client-uuid",
  "email": "user@example.com",
  "status": "ACCEPTED",
  "expiresOn": "2024-01-22T00:00:00Z",
  "acceptedById": "person-uuid",
  "acceptedOn": "2024-01-16T14:30:00Z",
  "createdOn": "2024-01-15T10:00:00Z",
  "client": { "id": "...", "name": "Acme Corp", "externalId": "acme" },
  "role": { "id": "...", "name": "Inspector" },
  "site": { "id": "...", "name": "Main Office" },
  "createdBy": { "id": "...", "firstName": "John", "lastName": "Doe" },
  "acceptedBy": { "id": "...", "firstName": "Jane", "lastName": "Smith" }
}
```

**Error Responses:**
- `404` - Invitation not found
- `403` - Not authorized to view this invitation

---

### 4. Validate Invitation (Public)

**IMPORTANT: This endpoint requires NO authentication.** It's used to show invitation details to users before they log in.

```http
GET /invitations/validate/:code
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "client": {
    "id": "client-uuid",
    "name": "Acme Corporation"
  },
  "expiresOn": "2024-01-22T00:00:00Z",
  "restrictedToEmail": true,      // true if email-restricted (DO NOT expose actual email)
  "hasPreassignedRole": true      // true if roleId is set
}
```

**Error Responses:**
- `404 Not Found` - Invitation code doesn't exist
- `410 Gone` - Invitation is expired or revoked

**Security Notes:**
- Do NOT expose the actual email address in the response
- Only return minimal information needed for the UI
- This endpoint is public to allow showing invitation details before login

---

### 5. Accept Invitation

```http
POST /invitations/:code/accept
Authorization: Bearer <token>
```

**Request Body:** None required (uses authenticated user)

**Response:** `200 OK`
```json
{
  "success": true,
  "clientAccess": {
    "id": "access-uuid",
    "clientId": "client-uuid",
    "personId": "person-uuid",
    "roleId": "role-uuid",
    "siteId": "site-uuid",
    "client": { "id": "...", "name": "Acme Corp", "externalId": "acme" },
    "role": { "id": "...", "name": "Inspector" },
    "site": { "id": "...", "name": "Main Office" }
  }
}
```

**Business Logic:**
1. Find invitation by code
2. Verify invitation is PENDING and not expired
3. If email-restricted, verify authenticated user's email matches
4. Check user doesn't already have access to this client
5. Create `PersonClientAccess` record with:
   - `personId`: authenticated user's ID
   - `clientId`: invitation's clientId
   - `roleId`: invitation's roleId (if set)
   - `siteId`: invitation's siteId (if set)
   - `isPrimary`: false (unless it's their first client)
6. Update invitation:
   - `status`: 'ACCEPTED'
   - `acceptedById`: authenticated user's ID
   - `acceptedOn`: current timestamp
7. Return the created client access record

**Error Responses:**
- `400 Bad Request` - User already has access to this client
  ```json
  { "message": "You already have access to this organization" }
  ```
- `403 Forbidden` - Email doesn't match restricted email
  ```json
  { "message": "This invitation is restricted to a different email address" }
  ```
- `404 Not Found` - Invitation code doesn't exist
- `410 Gone` - Invitation is expired or revoked
  ```json
  { "message": "This invitation has expired" }
  ```

---

### 6. Revoke Invitation

```http
DELETE /invitations/:id
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Business Logic:**
- Set invitation status to 'REVOKED'
- Cannot revoke already-accepted invitations (return 400)

**Error Responses:**
- `400 Bad Request` - Cannot revoke an accepted invitation
- `403 Forbidden` - Not authorized to revoke this invitation
- `404 Not Found` - Invitation not found

---

## New Permissions Required

Add these permissions to the system:

```
create:invitations   - Can create invitations
read:invitations     - Can view invitations
delete:invitations   - Can revoke invitations
```

**Default Role Assignments:**
- Super Admin: All invitation permissions
- Client Admin: All invitation permissions (scoped to their client)
- Regular users: No invitation permissions

---

## Authorization Rules Summary

| Action | Super Admin | Client Admin | Regular User |
|--------|-------------|--------------|--------------|
| Create invitation | Any client | Own client only | No |
| List invitations | All (can filter) | Own client only | No |
| View invitation | Any | Own client only | No |
| Revoke invitation | Any | Own client only | No |
| Validate invitation | N/A (public) | N/A (public) | N/A (public) |
| Accept invitation | Yes | Yes | Yes |

---

## Frontend Integration Notes

The frontend expects:

1. **inviteUrl field**: The create endpoint MUST return `inviteUrl` with the full URL path
2. **Relations included**: List and detail responses should include `client`, `role`, `site`, and `createdBy` relations
3. **Standard pagination**: Use the existing `{ results, total, limit, offset }` format
4. **Error format**: Use standard `{ message: string }` format for error responses

---

## Environment Configuration

The API needs access to `APP_HOST` (or similar) environment variable to construct the `inviteUrl`:

```
APP_HOST=https://shield.example.com
```

The invite URL format is: `{APP_HOST}/accept-invite/{code}`
