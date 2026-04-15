# Laundry24 — REST API Documentation

Base URL: `http://localhost:3000/api/v1`

All protected endpoints require `Authorization: Bearer <access_token>`.

---

## Authentication

### POST /auth/login
Login for staff / admin / owner.

**Request:**
```json
{
  "email": "owner@laundry24.com",
  "password": "owner123"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1...",
    "refreshToken": "b4a3f8..."
  }
}
```

### POST /auth/customer/login
Login for mobile app customers.

**Request:**
```json
{ "phone": "08512345678", "password": "customer123" }
```

### POST /auth/refresh
**Request:**
```json
{ "refreshToken": "b4a3f8..." }
```

### POST /auth/logout
**Request:**
```json
{ "refreshToken": "b4a3f8..." }
```

---

## Orders

### GET /orders
List orders with optional filters.

**Query params:** `status`, `search`, `dateFrom`, `dateTo`, `page`, `limit`, `outletId`

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "orderNumber": "L24-20240115-0001",
        "status": "WASHING",
        "customer": { "id": 1, "name": "Budi", "phone": "085..." },
        "serviceType": { "name": "Kiloan Reguler" },
        "totalAmount": "35000",
        "paymentStatus": "PAID",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "meta": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 }
  }
}
```

### POST /orders
Create a new order.

**Request:**
```json
{
  "customerId": 1,
  "serviceTypeId": 1,
  "totalWeight": 3.5,
  "promoCode": "WELCOME10",
  "notes": "No softener please"
}
```

### GET /orders/:id
Full order detail with items, payments, status history.

### PATCH /orders/:id/status
Update order status.

**Request:**
```json
{ "status": "WASHING", "notes": "Loaded into machine #1" }
```

**Valid status values:** `RECEIVED → WASHING → IRONING → DONE → DELIVERED | CANCELLED`

---

## Customers

### GET /customers
List customers. Query: `search`, `page`, `limit`

### POST /customers
Create / register customer.

**Request:**
```json
{
  "name": "Budi Santoso",
  "phone": "08512345678",
  "email": "budi@email.com",
  "password": "secret123"
}
```

### GET /customers/:id
Customer profile with recent orders.

### POST /customers/:id/wallet/topup
Top-up customer wallet.

**Request:**
```json
{ "amount": 100000, "reference": "TRF-001" }
```

---

## Payments

### POST /payments
Process payment.

**Request:**
```json
{
  "orderId": 1,
  "method": "CASH",
  "amount": 35000
}
```

**Methods:** `CASH`, `TRANSFER`, `QRIS`, `WALLET`, `LOYALTY`

### GET /payments/order/:orderId
Get all payments for an order.

---

## Employees

### GET /employees
List employees (OWNER/ADMIN only).

### POST /employees
Create employee + user account.

### POST /employees/:id/check-in
Employee attendance check-in.

```json
{ "shiftId": 1, "lat": -6.2088, "lng": 106.8456 }
```

### POST /employees/:id/check-out
```json
{ "lat": -6.2088, "lng": 106.8456 }
```

### POST /employees/payroll/generate
Generate monthly payroll.

```json
{
  "periodStart": "2024-01-01",
  "periodEnd": "2024-01-31",
  "outletId": 1
}
```

---

## Inventory

### GET /inventory
Get inventory items for outlet.

### POST /inventory
Add new item.

### POST /inventory/:id/adjust
Adjust stock.

```json
{ "type": "IN", "quantity": 10, "notes": "Restock" }
```

**Types:** `IN` (add stock), `OUT` (use stock), `ADJUSTMENT` (correction)

### GET /inventory/low-stock
Items below minimum threshold.

---

## Reports

### GET /reports/dashboard
KPI summary (today orders, monthly revenue, etc.)

### GET /reports/revenue
Chart data (daily revenue). Query: `dateFrom`, `dateTo`

### GET /reports/orders/stats
Order count by status.

### GET /reports/export/excel
Download Excel report. Streams file as attachment.

### GET /reports/export/pdf
Download PDF summary. Streams file.

---

## Delivery

### POST /delivery
Create delivery task.

```json
{
  "orderId": 1,
  "type": "DELIVERY",
  "address": "Jl. Sudirman No. 10",
  "scheduledAt": "2024-01-15T14:00:00Z"
}
```

### PATCH /delivery/:id/assign
Assign driver.

```json
{ "driverId": 5 }
```

### PATCH /delivery/:id/status
Update delivery status.

```json
{ "status": "ON_WAY" }
```

**Status flow:** `PENDING → ASSIGNED → ON_WAY → DONE | FAILED`

---

## IoT / Machines

### GET /iot/machines
List machines for outlet.

### POST /iot/machines/:id/ping
Machine status update (IoT ping).

```json
{ "status": "RUNNING", "orderId": 1 }
```

### POST /iot/nfc/scan
NFC card simulation.

```json
{ "nfcUid": "NFC-001", "orderId": 1 }
```

---

## Notifications

### GET /notifications/unread
Get unread notifications for current user.

### POST /notifications/mark-read
Mark all notifications as read.

---

## Outlets

### GET /outlets
List all outlets (OWNER/ADMIN).

### POST /outlets
Create outlet (OWNER only).

---

## WebSocket Events (Socket.IO)

**Namespace:** `/realtime`  
**Auth:** `{ auth: { token: "<access_token>" } }`

### Client → Server
| Event | Description |
|-------|-------------|
| `ping` | Heartbeat |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{ id, title, body, type, data }` | Push notification |
| `machine:update` | `{ machineId, name, status, timestamp }` | IoT machine status |
| `pong` | `{ timestamp }` | Ping response |

**Rooms:** Clients automatically join `user:<id>`, `outlet:<id>`, or `customer:<id>` rooms.
