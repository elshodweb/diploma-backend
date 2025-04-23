# API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer your-jwt-token
```

## Endpoints

### Authentication

#### Login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "jwt-token-here"
}
```

### Users

#### Create User (Admin only)

```http
POST /users
```

Request body:

```json
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "password": "password123",
  "role": "USER" // or "ADMIN"
}
```

Response:

```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "name": "John Doe",
  "role": "USER",
  "createdAt": "2024-04-23T10:00:00Z",
  "updatedAt": "2024-04-23T10:00:00Z"
}
```

#### Get All Users (Admin only)

```http
GET /users
```

Response:

```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "documents": [
      {
        "id": "uuid",
        "title": "Document Title",
        "status": "DRAFT"
      }
    ]
  }
]
```

#### Get User by ID

```http
GET /users/:id
```

Response:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "USER",
  "documents": [
    {
      "id": "uuid",
      "title": "Document Title",
      "status": "DRAFT"
    }
  ]
}
```

### Documents

#### Upload Document

```http
POST /documents
Content-Type: multipart/form-data
```

Request body:

- `file`: File (binary)
- `title`: string
- `description`: string (optional)

Response:

```json
{
  "id": "uuid",
  "title": "Document Title",
  "description": "Document Description",
  "status": "DRAFT",
  "createdAt": "2024-04-23T10:00:00Z",
  "updatedAt": "2024-04-23T10:00:00Z",
  "userId": "uuid",
  "blockchainLogs": [
    {
      "id": "uuid",
      "txHash": "transaction-hash",
      "network": "Local",
      "createdAt": "2024-04-23T10:00:00Z"
    }
  ]
}
```

#### Get All Documents

```http
GET /documents
```

Response:

```json
[
  {
    "id": "uuid",
    "title": "Document Title",
    "description": "Document Description",
    "status": "DRAFT",
    "createdAt": "2024-04-23T10:00:00Z",
    "updatedAt": "2024-04-23T10:00:00Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "user@example.com"
    },
    "blockchainLogs": [
      {
        "id": "uuid",
        "txHash": "transaction-hash",
        "network": "Local",
        "createdAt": "2024-04-23T10:00:00Z"
      }
    ]
  }
]
```

#### Get Document by ID

```http
GET /documents/:id
```

Response:

```json
{
  "id": "uuid",
  "title": "Document Title",
  "description": "Document Description",
  "status": "DRAFT",
  "createdAt": "2024-04-23T10:00:00Z",
  "updatedAt": "2024-04-23T10:00:00Z",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com"
  },
  "blockchainLogs": [
    {
      "id": "uuid",
      "txHash": "transaction-hash",
      "network": "Local",
      "createdAt": "2024-04-23T10:00:00Z"
    }
  ]
}
```

#### Download Document File

```http
GET /documents/:id/file
```

Response: Binary file data

#### Update Document Status (Admin only)

```http
PUT /documents/:id/status
```

Request body:

```json
{
  "status": "APPROVED" // or "REJECTED" or "DRAFT"
}
```

Response:

```json
{
  "id": "uuid",
  "title": "Document Title",
  "description": "Document Description",
  "status": "APPROVED",
  "updatedAt": "2024-04-23T10:00:00Z"
}
```

#### Delete Document (Admin only)

```http
DELETE /documents/:id
```

Response:

```json
{
  "id": "uuid",
  "title": "Document Title",
  "description": "Document Description",
  "status": "DRAFT",
  "deletedAt": "2024-04-23T10:00:00Z"
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "must be an email"
    }
  ]
}
```

## Document Status Flow

1. `DRAFT` - Initial status when document is uploaded
2. `APPROVED` - Document is approved by admin
3. `REJECTED` - Document is rejected by admin

## Role-Based Access

- `USER` - Can:
  - Upload documents
  - View own documents
  - Download own documents
  - View own profile
- `ADMIN` - Can:
  - Everything a USER can do
  - View all users
  - Create new users
  - View all documents
  - Approve/Reject documents
  - Delete documents
  - Delete users
