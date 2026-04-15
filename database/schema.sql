-- ============================================================
-- Laundry24 - Full Database Schema
-- Engine: MariaDB / MySQL
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,  -- OWNER, ADMIN, STAFF, DRIVER, CUSTOMER
  permissions JSON         NOT NULL DEFAULT ('[]'),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OUTLETS (Branches)
-- ============================================================
CREATE TABLE outlets (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  phone       VARCHAR(20),
  city        VARCHAR(100),
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at  DATETIME     NULL,
  INDEX idx_outlets_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USERS (All system users: owners, admins, staff, drivers)
-- ============================================================
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id     INT UNSIGNED NULL,
  role_id       INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  phone         VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500) NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    DATETIME     NULL,
  CONSTRAINT fk_users_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  CONSTRAINT fk_users_role   FOREIGN KEY (role_id)   REFERENCES roles(id),
  INDEX idx_users_email    (email),
  INDEX idx_users_outlet   (outlet_id),
  INDEX idx_users_role     (role_id),
  INDEX idx_users_active   (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id       INT UNSIGNED NULL,           -- NULL = global customer
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(100) NULL UNIQUE,
  phone           VARCHAR(20)  NOT NULL UNIQUE,
  address         TEXT         NULL,
  wallet_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  loyalty_points  INT UNSIGNED  NOT NULL DEFAULT 0,
  notes           TEXT          NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME      NULL,
  CONSTRAINT fk_customers_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_customers_phone   (phone),
  INDEX idx_customers_email   (email),
  INDEX idx_customers_outlet  (outlet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CUSTOMER AUTH (Mobile App Login)
-- ============================================================
CREATE TABLE customer_auth (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT UNSIGNED NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  refresh_token   VARCHAR(500) NULL,
  fcm_token       VARCHAR(500) NULL,  -- Firebase push token
  last_login_at   DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cauth_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SERVICE TYPES (Kiloan, Satuan, Express, etc.)
-- ============================================================
CREATE TABLE service_types (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id     INT UNSIGNED NULL,        -- NULL = global, override per outlet
  name          VARCHAR(100) NOT NULL,    -- Kiloan, Satuan, Express
  code          VARCHAR(20)  NOT NULL,    -- KILOAN, SATUAN, EXPRESS
  base_price    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  unit          VARCHAR(20)  NOT NULL DEFAULT 'kg',  -- kg, pcs, set
  sla_hours     INT UNSIGNED NOT NULL DEFAULT 24,    -- estimated completion hours
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_service_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_service_outlet (outlet_id),
  INDEX idx_service_code   (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number        VARCHAR(30)  NOT NULL UNIQUE,  -- e.g. L24-20240115-0001
  outlet_id           INT UNSIGNED NOT NULL,
  customer_id         INT UNSIGNED NOT NULL,
  staff_id            INT UNSIGNED NULL,           -- received by
  driver_id           INT UNSIGNED NULL,           -- assigned driver
  status              ENUM(
    'RECEIVED','WASHING','IRONING','DONE','DELIVERED','CANCELLED'
  ) NOT NULL DEFAULT 'RECEIVED',
  service_type_id     INT UNSIGNED NOT NULL,
  total_weight        DECIMAL(8,2) NULL,           -- kg for kiloan
  total_items         INT UNSIGNED NULL,           -- pcs for satuan
  subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  paid_amount         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status      ENUM('UNPAID','PARTIAL','PAID') NOT NULL DEFAULT 'UNPAID',
  notes               TEXT         NULL,
  pickup_address      TEXT         NULL,
  delivery_address    TEXT         NULL,
  estimated_done_at   DATETIME     NULL,
  picked_up_at        DATETIME     NULL,
  washed_at           DATETIME     NULL,
  ironed_at           DATETIME     NULL,
  ready_at            DATETIME     NULL,
  delivered_at        DATETIME     NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME     NULL,
  CONSTRAINT fk_orders_outlet      FOREIGN KEY (outlet_id)        REFERENCES outlets(id),
  CONSTRAINT fk_orders_customer    FOREIGN KEY (customer_id)      REFERENCES customers(id),
  CONSTRAINT fk_orders_staff       FOREIGN KEY (staff_id)         REFERENCES users(id),
  CONSTRAINT fk_orders_driver      FOREIGN KEY (driver_id)        REFERENCES users(id),
  CONSTRAINT fk_orders_service     FOREIGN KEY (service_type_id)  REFERENCES service_types(id),
  INDEX idx_orders_outlet    (outlet_id),
  INDEX idx_orders_customer  (customer_id),
  INDEX idx_orders_status    (status),
  INDEX idx_orders_number    (order_number),
  INDEX idx_orders_created   (created_at),
  INDEX idx_orders_payment   (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORDER ITEMS (for Satuan service — individual garments)
-- ============================================================
CREATE TABLE order_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id      INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,    -- Kemeja, Celana, dll
  quantity      INT UNSIGNED NOT NULL DEFAULT 1,
  unit_price    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_price   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  notes         TEXT         NULL,
  photo_url     VARCHAR(500) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_items_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ORDER STATUS HISTORY (audit trail)
-- ============================================================
CREATE TABLE order_status_history (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NULL,
  status      ENUM('RECEIVED','WASHING','IRONING','DONE','DELIVERED','CANCELLED') NOT NULL,
  notes       TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_osh_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  INDEX idx_osh_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED NOT NULL,
  cashier_id      INT UNSIGNED NULL,
  method          ENUM('CASH','TRANSFER','QRIS','WALLET','LOYALTY') NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  reference_no    VARCHAR(100)  NULL,   -- bank ref / QR txn id
  status          ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  paid_at         DATETIME      NULL,
  notes           TEXT          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
  CONSTRAINT fk_payments_cashier FOREIGN KEY (cashier_id) REFERENCES users(id),
  INDEX idx_payments_order  (order_id),
  INDEX idx_payments_method (method),
  INDEX idx_payments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WALLET TRANSACTIONS (customer deposit/withdraw)
-- ============================================================
CREATE TABLE wallet_transactions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT UNSIGNED NOT NULL,
  order_id      INT UNSIGNED NULL,
  type          ENUM('TOPUP','DEDUCT','REFUND') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  reference     VARCHAR(100)  NULL,
  notes         TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_wallet_order    FOREIGN KEY (order_id)    REFERENCES orders(id),
  INDEX idx_wallet_customer (customer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROMOTIONS / DISCOUNTS
-- ============================================================
CREATE TABLE promotions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id       INT UNSIGNED NULL,
  code            VARCHAR(30)  NOT NULL UNIQUE,
  name            VARCHAR(100) NOT NULL,
  type            ENUM('PERCENT','FIXED','CASHBACK') NOT NULL DEFAULT 'PERCENT',
  value           DECIMAL(12,2) NOT NULL,
  min_order       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  max_discount    DECIMAL(12,2) NULL,
  usage_limit     INT UNSIGNED  NULL,
  usage_count     INT UNSIGNED  NOT NULL DEFAULT 0,
  valid_from      DATE          NOT NULL,
  valid_until     DATE          NOT NULL,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_promo_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_promo_code   (code),
  INDEX idx_promo_outlet (outlet_id),
  INDEX idx_promo_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- EMPLOYEES (links users to HR info)
-- ============================================================
CREATE TABLE employees (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL UNIQUE,
  outlet_id       INT UNSIGNED NOT NULL,
  employee_code   VARCHAR(20)  NOT NULL UNIQUE,
  position        VARCHAR(100) NULL,
  hire_date       DATE         NOT NULL,
  base_salary     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  bank_name       VARCHAR(100) NULL,
  bank_account    VARCHAR(50)  NULL,
  emergency_name  VARCHAR(100) NULL,
  emergency_phone VARCHAR(20)  NULL,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_emp_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_emp_outlet (outlet_id),
  INDEX idx_emp_code   (employee_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE shifts (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id     INT UNSIGNED NOT NULL,
  name          VARCHAR(50)  NOT NULL,   -- Pagi, Siang, Malam
  start_time    TIME         NOT NULL,
  end_time      TIME         NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shifts_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_shifts_outlet (outlet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SHIFT ASSIGNMENTS (schedule)
-- ============================================================
CREATE TABLE shift_assignments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT UNSIGNED NOT NULL,
  shift_id      INT UNSIGNED NOT NULL,
  work_date     DATE         NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shift_assign (employee_id, work_date),
  CONSTRAINT fk_sa_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_sa_shift    FOREIGN KEY (shift_id)    REFERENCES shifts(id),
  INDEX idx_sa_date     (work_date),
  INDEX idx_sa_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT UNSIGNED NOT NULL,
  shift_id      INT UNSIGNED NULL,
  check_in_at   DATETIME     NOT NULL,
  check_out_at  DATETIME     NULL,
  check_in_lat  DECIMAL(10,7) NULL,
  check_in_lng  DECIMAL(10,7) NULL,
  check_out_lat DECIMAL(10,7) NULL,
  check_out_lng DECIMAL(10,7) NULL,
  status        ENUM('PRESENT','LATE','ABSENT','LEAVE','HOLIDAY') NOT NULL DEFAULT 'PRESENT',
  notes         TEXT         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_att_shift    FOREIGN KEY (shift_id)    REFERENCES shifts(id),
  INDEX idx_att_employee (employee_id),
  INDEX idx_att_date     (check_in_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE payroll (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT UNSIGNED NOT NULL,
  period_start    DATE         NOT NULL,
  period_end      DATE         NOT NULL,
  working_days    INT UNSIGNED NOT NULL DEFAULT 0,
  present_days    INT UNSIGNED NOT NULL DEFAULT 0,
  base_salary     DECIMAL(12,2) NOT NULL,
  overtime_pay    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  allowances      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deductions      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  net_salary      DECIMAL(12,2) NOT NULL,
  status          ENUM('DRAFT','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',
  paid_at         DATETIME      NULL,
  notes           TEXT          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  INDEX idx_payroll_employee (employee_id),
  INDEX idx_payroll_period   (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVENTORY ITEMS
-- ============================================================
CREATE TABLE inventory_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id     INT UNSIGNED NOT NULL,
  name          VARCHAR(100) NOT NULL,
  category      ENUM('DETERGENT','SOFTENER','PERFUME','PLASTIC','HANGER','OTHER') NOT NULL,
  unit          VARCHAR(20)  NOT NULL DEFAULT 'pcs',
  stock         DECIMAL(12,3) NOT NULL DEFAULT 0.000,
  min_stock     DECIMAL(12,3) NOT NULL DEFAULT 0.000,  -- low stock threshold
  cost_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_inv_outlet   (outlet_id),
  INDEX idx_inv_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INVENTORY LOGS (usage / restocking)
-- ============================================================
CREATE TABLE inventory_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NULL,
  order_id      INT UNSIGNED NULL,
  type          ENUM('IN','OUT','ADJUSTMENT') NOT NULL,
  quantity      DECIMAL(12,3) NOT NULL,
  stock_before  DECIMAL(12,3) NOT NULL,
  stock_after   DECIMAL(12,3) NOT NULL,
  notes         TEXT          NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ilog_item  FOREIGN KEY (item_id)  REFERENCES inventory_items(id),
  CONSTRAINT fk_ilog_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_ilog_order FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_ilog_item    (item_id),
  INDEX idx_ilog_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DELIVERY TASKS
-- ============================================================
CREATE TABLE delivery_tasks (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id        INT UNSIGNED NOT NULL UNIQUE,
  driver_id       INT UNSIGNED NULL,
  type            ENUM('PICKUP','DELIVERY') NOT NULL,
  scheduled_at    DATETIME     NULL,
  started_at      DATETIME     NULL,
  completed_at    DATETIME     NULL,
  address         TEXT         NOT NULL,
  latitude        DECIMAL(10,7) NULL,
  longitude       DECIMAL(10,7) NULL,
  status          ENUM('PENDING','ASSIGNED','ON_WAY','DONE','FAILED') NOT NULL DEFAULT 'PENDING',
  notes           TEXT          NULL,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_order  FOREIGN KEY (order_id)  REFERENCES orders(id),
  CONSTRAINT fk_delivery_driver FOREIGN KEY (driver_id) REFERENCES users(id),
  INDEX idx_delivery_driver (driver_id),
  INDEX idx_delivery_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- WASHING MACHINES (IoT simulation)
-- ============================================================
CREATE TABLE machines (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  outlet_id     INT UNSIGNED NOT NULL,
  name          VARCHAR(50)  NOT NULL,
  type          ENUM('WASHER','DRYER','IRON') NOT NULL,
  status        ENUM('IDLE','RUNNING','MAINTENANCE','OFFLINE') NOT NULL DEFAULT 'IDLE',
  capacity_kg   DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  nfc_uid       VARCHAR(50)  NULL,   -- NFC card UID for simulation
  last_ping_at  DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_machine_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  INDEX idx_machine_outlet (outlet_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MACHINE USAGE LOGS
-- ============================================================
CREATE TABLE machine_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  machine_id    INT UNSIGNED NOT NULL,
  order_id      INT UNSIGNED NULL,
  user_id       INT UNSIGNED NULL,
  event         ENUM('START','STOP','FAULT','MAINTENANCE') NOT NULL,
  details       JSON         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mlog_machine FOREIGN KEY (machine_id) REFERENCES machines(id),
  CONSTRAINT fk_mlog_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
  CONSTRAINT fk_mlog_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  INDEX idx_mlog_machine (machine_id),
  INDEX idx_mlog_order   (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NULL,      -- NULL = broadcast
  customer_id   INT UNSIGNED NULL,
  outlet_id     INT UNSIGNED NULL,
  type          ENUM('ORDER_STATUS','PROMO','REMINDER','SYSTEM') NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          TEXT         NOT NULL,
  data          JSON         NULL,
  channel       ENUM('PUSH','WHATSAPP','EMAIL','IN_APP') NOT NULL DEFAULT 'IN_APP',
  is_read       BOOLEAN      NOT NULL DEFAULT FALSE,
  sent_at       DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user     FOREIGN KEY (user_id)     REFERENCES users(id),
  CONSTRAINT fk_notif_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_notif_outlet   FOREIGN KEY (outlet_id)   REFERENCES outlets(id),
  INDEX idx_notif_user     (user_id),
  INDEX idx_notif_customer (customer_id),
  INDEX idx_notif_read     (is_read),
  INDEX idx_notif_created  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  customer_id INT UNSIGNED NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_rt_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_rt_token (token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SEED: Default Roles
-- ============================================================
INSERT INTO roles (name, permissions) VALUES
  ('OWNER',    '["*"]'),
  ('ADMIN',    '["orders.*","customers.*","reports.*","inventory.*","employees.read"]'),
  ('STAFF',    '["orders.*","customers.read","inventory.read"]'),
  ('DRIVER',   '["delivery.*","orders.read"]'),
  ('CUSTOMER', '["orders.own","profile.own"]');
