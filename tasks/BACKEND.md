# TMS Backend MVP — Node.js
### GoodWill Company | Transport Management System
**Stack:** Node.js · Express · PostgreSQL · Prisma ORM · JWT Auth · Google Gemini API · Multer (file uploads) · Nodemailer

---

## 1. Project Setup

```bash
mkdir tms-backend && cd tms-backend
npm init -y

# Core
npm install express cors dotenv helmet morgan
npm install prisma @prisma/client
npm install jsonwebtoken bcryptjs
npm install multer          # File uploads (POD photos)
npm install nodemailer      # Email notifications
npm install @google/generative-ai   # Gemini API

# Dev
npm install -D nodemon
npx prisma init
```

### package.json scripts
```json
{
  "scripts": {
    "dev":   "nodemon src/index.js",
    "start": "node src/index.js",
    "db:migrate": "prisma migrate dev",
    "db:studio":  "prisma studio"
  }
}
```

---

## 2. Folder Structure

```
tms-backend/
├── prisma/
│   └── schema.prisma           # Database schema (single source of truth)
│
├── src/
│   ├── index.js                # Express app entry point
│   ├── config/
│   │   ├── db.js               # Prisma client instance
│   │   ├── gemini.js           # Gemini SDK init
│   │   └── mailer.js           # Nodemailer transporter
│   │
│   ├── middleware/
│   │   ├── auth.js             # JWT verify + attach user to req
│   │   ├── requireRole.js      # Role guard (customer / staff / driver / owner)
│   │   ├── upload.js           # Multer config for POD uploads
│   │   └── errorHandler.js     # Global error handler
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── order.routes.js
│   │   ├── driver.routes.js
│   │   ├── vehicle.routes.js
│   │   ├── payment.routes.js
│   │   ├── dashboard.routes.js
│   │   └── ai.routes.js        # Gemini-powered endpoints
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── order.controller.js
│   │   ├── driver.controller.js
│   │   ├── vehicle.controller.js
│   │   ├── payment.controller.js
│   │   ├── dashboard.controller.js
│   │   └── ai.controller.js
│   │
│   ├── services/
│   │   ├── notification.service.js   # Email triggers on order events
│   │   ├── pricing.service.js        # Auto price estimate logic
│   │   └── gemini.service.js         # Gemini API wrappers
│   │
│   └── utils/
│       ├── apiResponse.js            # Standardized response format
│       └── constants.js              # ORDER_STATUS, ROLES, etc.
│
├── uploads/                    # POD photos saved here (or move to cloud storage later)
└── .env
```

---

## 3. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum Role {
  CUSTOMER
  STAFF
  DRIVER
  OWNER
}

enum OrderStatus {
  PENDING
  ASSIGNED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  CANCELLED
}

enum PaymentMode {
  ONLINE
  COD
}

enum PaymentStatus {
  PENDING
  PAID
  COD_PENDING
  COD_PAID
  FAILED
}

enum VehicleStatus {
  AVAILABLE
  IN_USE
  UNDER_MAINTENANCE
}

// ─── Models ──────────────────────────────────────────────

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  phone        String?
  passwordHash String
  role         Role
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  orders       Order[]   @relation("CustomerOrders")
  driverProfile Driver?
}

model Driver {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])
  licenseNumber   String    @unique
  licenseExpiry   DateTime
  isAvailable     Boolean   @default(true)
  createdAt       DateTime  @default(now())

  // Relations
  assignedOrders  Order[]
}

model Vehicle {
  id               String        @id @default(uuid())
  registrationNo   String        @unique
  type             String        // truck / mini-truck / van
  capacityTons     Float
  ownerName        String?
  status           VehicleStatus @default(AVAILABLE)
  createdAt        DateTime      @default(now())

  // Relations
  orders           Order[]
}

model Order {
  id               String      @id @default(uuid())
  customerId       String
  customer         User        @relation("CustomerOrders", fields: [customerId], references: [id])
  pickupAddress    String
  dropoffAddress   String
  goodsType        String
  weightKg         Float
  preferredDate    DateTime
  preferredTime    String?
  specialNotes     String?
  status           OrderStatus @default(PENDING)
  estimatedPrice   Float?      // System-calculated
  finalPrice       Float?      // Staff-confirmed
  priceNote        String?     // Reason if price was manually adjusted
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  // Relations
  driverId         String?
  driver           Driver?     @relation(fields: [driverId], references: [id])
  vehicleId        String?
  vehicle          Vehicle?    @relation(fields: [vehicleId], references: [id])
  payment          Payment?
  pod              ProofOfDelivery?
  statusLogs       OrderStatusLog[]
}

model OrderStatusLog {
  id        String      @id @default(uuid())
  orderId   String
  order     Order       @relation(fields: [orderId], references: [id])
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())
  // Immutable — never update, only insert
}

model Payment {
  id            String        @id @default(uuid())
  orderId       String        @unique
  order         Order         @relation(fields: [orderId], references: [id])
  mode          PaymentMode
  status        PaymentStatus @default(PENDING)
  amount        Float
  transactionId String?       // Set on online payment success
  paidAt        DateTime?
  markedBy      String?       // Staff userId for COD marking
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model ProofOfDelivery {
  id          String   @id @default(uuid())
  orderId     String   @unique
  order       Order    @relation(fields: [orderId], references: [id])
  photoUrl    String
  uploadedAt  DateTime @default(now())
}
```

---

## 4. Entry Point (index.js)

```js
// src/index.js
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const authRoutes      = require('./routes/auth.routes');
const orderRoutes     = require('./routes/order.routes');
const driverRoutes    = require('./routes/driver.routes');
const vehicleRoutes   = require('./routes/vehicle.routes');
const paymentRoutes   = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes        = require('./routes/ai.routes');
const errorHandler    = require('./middleware/errorHandler');

const app = express();

// ─── Core Middleware ─────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded POD photos as static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/drivers',   driverRoutes);
app.use('/api/vehicles',  vehicleRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',        aiRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TMS API running on port ${PORT}`));
```

---

## 5. Middleware

### 5.1 JWT Auth Middleware
```js
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

module.exports = function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 401, 'No token provided');
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name }
    next();
  } catch {
    return sendError(res, 401, 'Invalid or expired token');
  }
};
```

### 5.2 Role Guard
```js
// src/middleware/requireRole.js
const { sendError } = require('../utils/apiResponse');

// Usage: router.get('/path', authenticate, requireRole('staff'), handler)
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Access denied');
    }
    next();
  };
};
```

### 5.3 Standard API Response
```js
// src/utils/apiResponse.js
exports.sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

exports.sendError = (res, statusCode, message) => {
  res.status(statusCode).json({ success: false, error: message });
};
```

### 5.4 Global Error Handler
```js
// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error('[ERROR]', err.message);
  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, error: 'Record already exists' });
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
};
```

---

## 6. All API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new customer |
| POST | `/login` | Public | Login all roles |
| GET | `/me` | All (auth) | Get current user info |
| PUT | `/change-password` | All (auth) | Change own password |

### Orders — `/api/orders`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/` | Customer | Place new order |
| GET | `/my` | Customer | Get my orders |
| GET | `/estimate` | Customer | Price estimate (query params) |
| GET | `/` | Staff | Get all orders (filterable) |
| GET | `/:id` | Staff/Customer/Driver | Get order by ID |
| PUT | `/:id/assign` | Staff | Assign driver + vehicle |
| PUT | `/:id/price` | Staff | Set/adjust final price |
| PUT | `/:id/status` | Driver | Update trip status |
| POST | `/:id/pod` | Driver | Upload proof of delivery |
| GET | `/driver/trips` | Driver | Get my assigned trips |

### Drivers — `/api/drivers`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | Staff | List all drivers |
| GET | `/available` | Staff | List available drivers only |
| POST | `/` | Staff | Add new driver |
| PUT | `/:id` | Staff | Update driver info |
| PUT | `/:id/deactivate` | Staff | Deactivate driver |

### Vehicles — `/api/vehicles`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/` | Staff | List all vehicles |
| GET | `/available` | Staff | List available vehicles only |
| POST | `/` | Staff | Add vehicle |
| PUT | `/:id` | Staff | Update vehicle |
| PUT | `/:id/status` | Staff | Change status (available/maintenance) |

### Payments — `/api/payments`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/initiate/:orderId` | Customer | Start online payment |
| POST | `/callback` | System | Payment gateway webhook |
| POST | `/cod/:orderId` | Customer | Select COD |
| PUT | `/cod/:orderId/mark-paid` | Staff | Mark COD as collected |
| GET | `/` | Staff/Owner | Transaction log (filterable) |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/summary` | Owner/Staff | All metrics in one call |
| GET | `/orders-trend` | Owner | Orders per day (last 7 days) |
| GET | `/revenue` | Owner | Revenue breakdown |
| GET | `/fleet-status` | Owner/Staff | Vehicle status counts |
| GET | `/driver-activity` | Owner/Staff | Per-driver trip counts |

### AI (Gemini) — `/api/ai`

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/route-suggestion` | Staff | Smart route recommendation |
| GET | `/price-estimate` | Customer/Staff | AI-assisted price estimate |

---

## 7. Core Controller Examples

### 7.1 Auth Controller
```js
// src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const prisma  = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

exports.register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, 409, 'Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: 'CUSTOMER' }
    });

    sendSuccess(res, { message: 'Account created. Please log in.' }, 201);
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return sendError(res, 401, 'Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, 401, 'Invalid credentials');

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    sendSuccess(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) { next(err); }
};
```

### 7.2 Order Controller (Key Methods)
```js
// src/controllers/order.controller.js
const prisma   = require('../config/db');
const pricing  = require('../services/pricing.service');
const notify   = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// POST /api/orders — Customer places order
exports.placeOrder = async (req, res, next) => {
  try {
    const { pickupAddress, dropoffAddress, goodsType, weightKg, preferredDate, specialNotes } = req.body;

    // Basic price estimate (distance-based, see pricing service)
    const estimatedPrice = await pricing.estimate({ pickupAddress, dropoffAddress, weightKg });

    const order = await prisma.order.create({
      data: {
        customerId: req.user.id,
        pickupAddress, dropoffAddress, goodsType,
        weightKg: parseFloat(weightKg),
        preferredDate: new Date(preferredDate),
        specialNotes,
        estimatedPrice,
        status: 'PENDING',
      }
    });

    // Log status
    await prisma.orderStatusLog.create({
      data: { orderId: order.id, status: 'PENDING' }
    });

    // Notify all staff of new pending order
    await notify.newOrderToStaff(order);

    sendSuccess(res, { orderId: order.id, estimatedPrice }, 201);
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/assign — Staff assigns driver + vehicle
exports.assignOrder = async (req, res, next) => {
  try {
    const { driverId, vehicleId, finalPrice, priceNote } = req.body;
    const { id } = req.params;

    // Prevent double-booking driver
    const activeTrip = await prisma.order.findFirst({
      where: { driverId, status: { in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } }
    });
    if (activeTrip) return sendError(res, 409, 'Driver already has an active trip');

    const order = await prisma.order.update({
      where: { id },
      data: {
        driverId, vehicleId,
        finalPrice: finalPrice ? parseFloat(finalPrice) : undefined,
        priceNote,
        status: 'ASSIGNED'
      },
      include: { customer: true, driver: { include: { user: true } } }
    });

    // Mark vehicle as in-use
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'IN_USE' }
    });

    // Log status change
    await prisma.orderStatusLog.create({
      data: { orderId: id, status: 'ASSIGNED' }
    });

    // Notify driver + customer
    await notify.orderAssigned(order);

    sendSuccess(res, { message: 'Order assigned successfully' });
  } catch (err) { next(err); }
};

// PUT /api/orders/:id/status — Driver updates status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const { id } = req.params;

    // Validate status progression (no skipping steps)
    const order = await prisma.order.findUnique({ where: { id } });
    const validNext = {
      ASSIGNED:  'PICKED_UP',
      PICKED_UP: 'IN_TRANSIT',
    };
    // DELIVERED is handled by uploadPOD endpoint, not here
    if (validNext[order.status] !== status) {
      return sendError(res, 400, `Cannot move from ${order.status} to ${status}`);
    }

    await prisma.order.update({ where: { id }, data: { status } });
    await prisma.orderStatusLog.create({ data: { orderId: id, status, note } });

    // Notify customer
    await notify.statusUpdate(order, status);

    sendSuccess(res, { message: `Order status updated to ${status}` });
  } catch (err) { next(err); }
};

// POST /api/orders/:id/pod — Driver uploads Proof of Delivery
exports.uploadPOD = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.file) return sendError(res, 400, 'POD photo is required');

    const photoUrl = `/uploads/${req.file.filename}`;

    await prisma.proofOfDelivery.create({ data: { orderId: id, photoUrl } });
    await prisma.order.update({ where: { id }, data: { status: 'DELIVERED' } });

    // Release vehicle back to available
    const order = await prisma.order.findUnique({ where: { id } });
    if (order.vehicleId) {
      await prisma.vehicle.update({
        where: { id: order.vehicleId }, data: { status: 'AVAILABLE' }
      });
    }

    await prisma.orderStatusLog.create({ data: { orderId: id, status: 'DELIVERED' } });
    await notify.orderDelivered(order);

    sendSuccess(res, { message: 'Delivery confirmed', photoUrl });
  } catch (err) { next(err); }
};
```

---

## 8. Gemini AI Service

```js
// src/services/gemini.service.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Route suggestion for staff — given pickup + drop-off, suggest best route
exports.getRouteSuggestion = async (from, to) => {
  const prompt = `
    You are a logistics assistant for a transport company in India.
    A delivery needs to go from: "${from}" to: "${to}".
    Suggest the best road route in 1 short sentence.
    Include approximate distance in km and time.
    Reply in plain text only, no markdown.
  `;
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

// Price estimate helper — returns a suggested price range
exports.getPriceEstimate = async ({ from, to, weightKg, goodsType }) => {
  const prompt = `
    You are a pricing assistant for a small transport business in India (FMCG distribution).
    Estimate a fair transport price for:
    - Pickup: ${from}
    - Drop-off: ${to}
    - Goods: ${goodsType}
    - Weight: ${weightKg} kg
    Reply with ONLY a JSON object like: { "min": 1800, "max": 2400, "currency": "INR" }
    No explanation, no markdown.
  `;
  const result  = await model.generateContent(prompt);
  const text    = result.response.text().trim();
  try {
    return JSON.parse(text);
  } catch {
    return { min: null, max: null, note: text };
  }
};
```

```js
// src/routes/ai.routes.js
const express    = require('express');
const router     = express.Router();
const authenticate = require('../middleware/auth');
const gemini     = require('../services/gemini.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// GET /api/ai/route-suggestion?from=...&to=...
router.get('/route-suggestion', authenticate, async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) return sendError(res, 400, 'from and to are required');
  const suggestion = await gemini.getRouteSuggestion(from, to);
  sendSuccess(res, { suggestion });
});

// GET /api/ai/price-estimate?from=...&to=...&weightKg=...&goodsType=...
router.get('/price-estimate', authenticate, async (req, res) => {
  const { from, to, weightKg, goodsType } = req.query;
  const estimate = await gemini.getPriceEstimate({ from, to, weightKg, goodsType });
  sendSuccess(res, { estimate });
});

module.exports = router;
```

---

## 9. Notification Service

```js
// src/services/notification.service.js
const transporter = require('../config/mailer');
const prisma      = require('../config/db');

// Helper to record notification in DB (optional — for audit)
async function logNotification(userId, message) {
  // Insert to a Notification table if needed in Phase 2
  console.log(`[NOTIFY] → ${userId}: ${message}`);
}

// New order created → notify all staff via email
exports.newOrderToStaff = async (order) => {
  const staffList = await prisma.user.findMany({
    where: { role: 'STAFF', isActive: true }
  });
  for (const staff of staffList) {
    await transporter.sendMail({
      to: staff.email,
      subject: `New Order #${order.id.slice(0,8)} — Pending Assignment`,
      text: `A new transport order has been placed and needs assignment.\n\nPickup: ${order.pickupAddress}\nDrop-off: ${order.dropoffAddress}\nGoods: ${order.goodsType} (${order.weightKg} kg)\n\nLog in to the admin panel to assign.`
    });
  }
};

// Order assigned → notify customer and driver
exports.orderAssigned = async (order) => {
  const driverName = order.driver?.user?.name || 'our driver';

  await transporter.sendMail({
    to: order.customer.email,
    subject: `Your Order #${order.id.slice(0,8)} has been assigned`,
    text: `Your transport order has been assigned to ${driverName}.\n\nPickup: ${order.pickupAddress}\nDrop-off: ${order.dropoffAddress}\n\nYou can track the status in My Orders.`
  });
};

// Status update → notify customer
exports.statusUpdate = async (order, newStatus) => {
  const messages = {
    PICKED_UP:  'Your goods have been picked up and are on their way.',
    IN_TRANSIT: 'Your delivery is in transit.',
  };

  const customer = await prisma.user.findUnique({ where: { id: order.customerId } });
  await transporter.sendMail({
    to: customer.email,
    subject: `Order #${order.id.slice(0,8)} Update`,
    text: messages[newStatus] || `Your order status has been updated to ${newStatus}.`
  });
};

// Delivery confirmed → notify customer with POD link
exports.orderDelivered = async (order) => {
  const customer = await prisma.user.findUnique({ where: { id: order.customerId } });
  await transporter.sendMail({
    to: customer.email,
    subject: `Order #${order.id.slice(0,8)} — Delivered`,
    text: `Your order has been delivered successfully. You can view the Proof of Delivery in My Orders on the portal.`
  });
};
```

---

## 10. Dashboard Controller

```js
// src/controllers/dashboard.controller.js
const prisma = require('../config/db');
const { sendSuccess } = require('../utils/apiResponse');

// GET /api/dashboard/summary
exports.getSummary = async (req, res, next) => {
  try {
    const today     = new Date();
    const startOfDay = new Date(today.setHours(0,0,0,0));

    const [
      totalOrdersToday,
      ordersInTransit,
      vehicleStats,
      revenueToday,
    ] = await Promise.all([
      // Orders created today
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),

      // Currently in transit
      prisma.order.count({ where: { status: 'IN_TRANSIT' } }),

      // Fleet status breakdown
      prisma.vehicle.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),

      // Revenue from paid orders today
      prisma.payment.aggregate({
        where: { status: { in: ['PAID', 'COD_PAID'] }, paidAt: { gte: startOfDay } },
        _sum: { amount: true }
      }),
    ]);

    // Format vehicle stats into a clean object
    const fleet = { AVAILABLE: 0, IN_USE: 0, UNDER_MAINTENANCE: 0 };
    vehicleStats.forEach(v => { fleet[v.status] = v._count._all; });

    sendSuccess(res, {
      totalOrdersToday,
      ordersInTransit,
      fleet,
      revenueToday: revenueToday._sum.amount || 0,
    });
  } catch (err) { next(err); }
};
```

---

## 11. Environment Variables (.env)

```bash
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/tms_db"

# Auth
JWT_SECRET=your-very-long-random-secret-here

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Email (use Gmail SMTP for dev, Sendgrid/Mailgun for prod)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="GoodWill TMS <your@gmail.com>"
```

---

## 12. File Upload Config (POD Photos)

```js
// src/middleware/upload.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `pod_${req.params.id}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only JPG and PNG files are allowed'));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});
```

---

## 13. Database Setup Commands

```bash
# 1. Create database
createdb tms_db   # or use pgAdmin / Supabase

# 2. Run migrations
npx prisma migrate dev --name init

# 3. Seed initial data (optional — create src/seed.js)
node src/seed.js
```

### Seed File (Staff + Owner accounts for testing)
```js
// src/seed.js
const prisma  = require('./src/config/db');
const bcrypt  = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);

  await prisma.user.createMany({
    data: [
      { name: 'Sanjay Deshmukh', email: 'staff@goodwill.com',  phone: '9876543210', passwordHash: hash, role: 'STAFF'  },
      { name: 'Business Owner',  email: 'owner@goodwill.com',  phone: '9876543211', passwordHash: hash, role: 'OWNER'  },
    ]
  });
  console.log('Seed complete');
}
main().finally(() => prisma.$disconnect());
```

---

## 14. MVP Endpoint Build Order (Priority)

| # | Endpoint Group | Why first |
|---|---|---|
| 1 | `POST /auth/register` + `POST /auth/login` | Nothing works without auth |
| 2 | `POST /orders` + `GET /orders/my` | Core customer flow |
| 3 | `GET /orders` + `PUT /orders/:id/assign` | Core staff flow |
| 4 | `GET /orders/driver/trips` + `PUT /orders/:id/status` | Core driver flow |
| 5 | `POST /orders/:id/pod` | Completes delivery lifecycle |
| 6 | `POST/PUT /drivers` + `POST/PUT /vehicles` | Staff management |
| 7 | `POST /payments/initiate` + `/callback` | Payment integration |
| 8 | `GET /dashboard/summary` | Owner view |
| 9 | `GET /ai/route-suggestion` + `/price-estimate` | Gemini features |

---

*Backend MVP Document · TMS · GoodWill Company · v1.0*
*Team: Pratik, Mohit, Suryank, Abhinav, Sachin, Karan*