-- Migration: 001_initial_schema
-- GoodWill Transport Management System — initial database schema

-- ENUMs
CREATE TYPE user_role AS ENUM ('customer', 'staff', 'driver', 'owner');
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'inactive');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_use', 'under_maintenance');
CREATE TYPE order_status AS ENUM ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE payment_mode AS ENUM ('online', 'cod');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cod_pending', 'cod_paid');
CREATE TYPE transaction_payment_status AS ENUM ('paid', 'cod_paid');

-- users
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash VARCHAR(255)        NOT NULL,
    role          user_role           NOT NULL,
    is_active     BOOLEAN             NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- drivers
CREATE TABLE drivers (
    id              SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL REFERENCES users(id),
    license_number  VARCHAR(50)  UNIQUE NOT NULL,
    license_expiry  DATE         NOT NULL,
    status          driver_status NOT NULL DEFAULT 'available'
);

-- vehicles
CREATE TABLE vehicles (
    id                  SERIAL PRIMARY KEY,
    registration_number VARCHAR(30)    UNIQUE NOT NULL,
    type                VARCHAR(50)    NOT NULL,
    capacity_tons       DECIMAL(6,2)   NOT NULL,
    owner_name          VARCHAR(100),
    status              vehicle_status NOT NULL DEFAULT 'available'
);

-- orders
CREATE TABLE orders (
    id                       SERIAL PRIMARY KEY,
    customer_id              INT             NOT NULL REFERENCES users(id),
    assigned_driver_id       INT             REFERENCES drivers(id),
    assigned_vehicle_id      INT             REFERENCES vehicles(id),
    pickup_address           TEXT            NOT NULL,
    dropoff_address          TEXT            NOT NULL,
    goods_type               VARCHAR(100)    NOT NULL,
    weight_kg                DECIMAL(8,2)    NOT NULL,
    preferred_date           DATE            NOT NULL,
    preferred_time           TIME,
    special_instructions     TEXT,
    estimated_price          DECIMAL(10,2)   NOT NULL,
    final_price              DECIMAL(10,2),
    price_override_reason    TEXT,
    status                   order_status    NOT NULL DEFAULT 'pending',
    payment_mode             payment_mode,
    payment_status           payment_status  NOT NULL DEFAULT 'pending',
    payment_gateway_order_id VARCHAR(100),
    pod_photo_url            VARCHAR(500),
    created_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- order_status_log
CREATE TABLE order_status_log (
    id          SERIAL PRIMARY KEY,
    order_id    INT         NOT NULL REFERENCES orders(id),
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    changed_by  INT         NOT NULL REFERENCES users(id),
    note        TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- transactions
CREATE TABLE transactions (
    id                     SERIAL PRIMARY KEY,
    order_id               INT                        NOT NULL REFERENCES orders(id),
    customer_id            INT                        NOT NULL REFERENCES users(id),
    payment_mode           payment_mode               NOT NULL,
    payment_status         transaction_payment_status NOT NULL,
    amount                 DECIMAL(10,2)              NOT NULL,
    gateway_transaction_id VARCHAR(100),
    created_at             TIMESTAMPTZ                NOT NULL DEFAULT NOW()
);

-- password_reset_tokens
CREATE TABLE password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users(id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT false
);
