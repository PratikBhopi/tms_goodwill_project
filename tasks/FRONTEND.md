# TMS Frontend MVP — React
### GoodWill Company | Transport Management System
**Stack:** React 18 · React Router v6 · TailwindCSS · Axios · Google Gemini API (via backend proxy)
**Design Philosophy:** Minimalist · Professional · Data-first · Subtle gradients · No flashy UI

---

## 1. Project Setup

```bash
npx create-react-app tms-frontend --template cra-template
cd tms-frontend
npm install react-router-dom axios react-query @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Tailwind Config (tailwind.config.js)
```js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          500: "#4361ee",   // Primary blue — used for buttons, active states
          600: "#3a0ca3",   // Hover / deep accent
          900: "#1a1a2e",   // Sidebar background
        },
        neutral: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          700: "#404040",
          900: "#171717",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
      }
    }
  }
}
```

### Global CSS (index.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Subtle gradient background for page body */
body {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  min-height: 100vh;
}

/* Reusable component classes */
@layer components {
  .btn-primary {
    @apply bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium
           hover:bg-brand-600 transition-colors duration-150 shadow-sm;
  }
  .btn-secondary {
    @apply bg-white text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium
           border border-neutral-200 hover:bg-neutral-50 transition-colors duration-150;
  }
  .card {
    @apply bg-white rounded-xl border border-neutral-200 shadow-card p-5;
  }
  .input-field {
    @apply w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm
           focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
           placeholder:text-neutral-400 transition;
  }
  .badge-pending   { @apply bg-amber-50   text-amber-700   text-xs px-2 py-0.5 rounded-full font-medium; }
  .badge-assigned  { @apply bg-blue-50    text-blue-700    text-xs px-2 py-0.5 rounded-full font-medium; }
  .badge-transit   { @apply bg-purple-50  text-purple-700  text-xs px-2 py-0.5 rounded-full font-medium; }
  .badge-delivered { @apply bg-green-50   text-green-700   text-xs px-2 py-0.5 rounded-full font-medium; }
}
```

---

## 2. Folder Structure

```
src/
├── api/                        # All Axios API calls
│   ├── auth.js
│   ├── orders.js
│   ├── drivers.js
│   ├── vehicles.js
│   ├── payments.js
│   └── dashboard.js
│
├── components/                 # Reusable UI components
│   ├── layout/
│   │   ├── AppShell.jsx        # Sidebar + header wrapper
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   └── TopBar.jsx          # Top header with user info
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Badge.jsx           # Status badges (Pending, Delivered, etc.)
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── StatCard.jsx        # Dashboard metric cards
│   │   └── EmptyState.jsx
│   └── shared/
│       ├── OrderStatusBadge.jsx
│       ├── DriverAvatar.jsx
│       └── PageHeader.jsx
│
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── customer/
│   │   ├── CustomerDashboard.jsx
│   │   ├── PlaceOrder.jsx
│   │   └── MyOrders.jsx
│   ├── staff/
│   │   ├── StaffDashboard.jsx
│   │   ├── OrdersList.jsx
│   │   ├── OrderDetail.jsx     # Assign driver + vehicle from here
│   │   ├── DriversPage.jsx
│   │   └── VehiclesPage.jsx
│   ├── driver/
│   │   ├── DriverDashboard.jsx
│   │   ├── TripDetail.jsx
│   │   └── UploadPOD.jsx
│   ├── payment/
│   │   ├── PaymentPage.jsx
│   │   └── TransactionLog.jsx
│   └── dashboard/
│       └── BusinessDashboard.jsx
│
├── context/
│   └── AuthContext.jsx         # Role-based auth state (Customer/Staff/Driver/Owner)
│
├── hooks/
│   ├── useAuth.js
│   ├── useOrders.js
│   └── useDebounce.js
│
├── utils/
│   ├── formatDate.js
│   ├── statusHelpers.js        # Map status → badge color / label
│   └── constants.js            # ORDER_STATUS, ROLES, etc.
│
└── App.jsx                     # Router setup + role-based routing
```

---

## 3. App.jsx — Role-Based Routing

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Role pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import PlaceOrder from './pages/customer/PlaceOrder';
import MyOrders from './pages/customer/MyOrders';
import StaffDashboard from './pages/staff/StaffDashboard';
import OrdersList from './pages/staff/OrdersList';
import OrderDetail from './pages/staff/OrderDetail';
import DriversPage from './pages/staff/DriversPage';
import VehiclesPage from './pages/staff/VehiclesPage';
import DriverDashboard from './pages/driver/DriverDashboard';
import TripDetail from './pages/driver/TripDetail';
import BusinessDashboard from './pages/dashboard/BusinessDashboard';
import PaymentPage from './pages/payment/PaymentPage';
import TransactionLog from './pages/payment/TransactionLog';

// Protect routes by role
function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* App shell wraps all protected routes */}
        <Route path="/" element={<AppShell />}>
          {/* Customer */}
          <Route path="customer/dashboard" element={
            <PrivateRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </PrivateRoute>
          } />
          <Route path="customer/new-order"  element={<PrivateRoute allowedRoles={['customer']}><PlaceOrder /></PrivateRoute>} />
          <Route path="customer/orders"     element={<PrivateRoute allowedRoles={['customer']}><MyOrders /></PrivateRoute>} />
          <Route path="customer/payment/:orderId" element={<PrivateRoute allowedRoles={['customer']}><PaymentPage /></PrivateRoute>} />

          {/* Staff */}
          <Route path="staff/dashboard"    element={<PrivateRoute allowedRoles={['staff']}><StaffDashboard /></PrivateRoute>} />
          <Route path="staff/orders"       element={<PrivateRoute allowedRoles={['staff']}><OrdersList /></PrivateRoute>} />
          <Route path="staff/orders/:id"   element={<PrivateRoute allowedRoles={['staff']}><OrderDetail /></PrivateRoute>} />
          <Route path="staff/drivers"      element={<PrivateRoute allowedRoles={['staff']}><DriversPage /></PrivateRoute>} />
          <Route path="staff/vehicles"     element={<PrivateRoute allowedRoles={['staff']}><VehiclesPage /></PrivateRoute>} />
          <Route path="staff/transactions" element={<PrivateRoute allowedRoles={['staff']}><TransactionLog /></PrivateRoute>} />

          {/* Driver */}
          <Route path="driver/dashboard"     element={<PrivateRoute allowedRoles={['driver']}><DriverDashboard /></PrivateRoute>} />
          <Route path="driver/trip/:orderId" element={<PrivateRoute allowedRoles={['driver']}><TripDetail /></PrivateRoute>} />

          {/* Business Owner */}
          <Route path="owner/dashboard" element={<PrivateRoute allowedRoles={['owner']}><BusinessDashboard /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 4. Key Page Designs

### 4.1 Layout — Sidebar + AppShell

```jsx
// src/components/layout/Sidebar.jsx
// Role-aware navigation — each role sees only its own links

const navMap = {
  customer: [
    { label: "Dashboard", href: "/customer/dashboard", icon: HomeIcon },
    { label: "New Order",  href: "/customer/new-order", icon: PlusIcon },
    { label: "My Orders",  href: "/customer/orders",    icon: TruckIcon },
  ],
  staff: [
    { label: "Dashboard", href: "/staff/dashboard",    icon: HomeIcon },
    { label: "Orders",    href: "/staff/orders",       icon: ClipboardIcon },
    { label: "Drivers",   href: "/staff/drivers",      icon: UserIcon },
    { label: "Vehicles",  href: "/staff/vehicles",     icon: TruckIcon },
    { label: "Payments",  href: "/staff/transactions", icon: CreditCardIcon },
  ],
  driver: [
    { label: "My Trips", href: "/driver/dashboard", icon: MapIcon },
  ],
  owner: [
    { label: "Dashboard", href: "/owner/dashboard", icon: ChartIcon },
  ],
};

// Sidebar renders:
// - GoodWill logo top-left (wordmark only, no icon)
// - Nav links (active = brand-500 bg-brand-50 left-border brand-500)
// - User name + role tag at bottom
// - Logout button
```

**Visual style for sidebar:**
- Background: `#1a1a2e` (dark navy — not black, not pure dark)
- Text: `#94a3b8` inactive, `#ffffff` active
- Active item: subtle `bg-white/10` + `2px left border brand-500`
- Width: 240px fixed on desktop, slide-over on mobile

---

### 4.2 Staff — Order Detail Page (Core page)

This is the most important page in the MVP. Staff uses this to assign driver + vehicle and confirm price.

```jsx
// src/pages/staff/OrderDetail.jsx
// Layout: 2-column on desktop — left = order info, right = assignment panel

/*
  LEFT COLUMN:
  - Order ID + status badge
  - Customer name, contact
  - Pickup address (with copy button)
  - Drop-off address (with copy button)
  - Goods type, weight
  - Preferred pickup date/time
  - Special instructions (if any)
  - Gemini AI suggestion chip: "Suggested route via NH-65 · ~42 km" (from backend)

  RIGHT COLUMN (Card):
  - "Assign Driver & Vehicle" heading
  - Driver dropdown (only available drivers shown)
  - Vehicle dropdown (only available vehicles shown)
  - Price field (pre-filled with system estimate, editable)
  - Price override reason (appears only if price was changed)
  - [Confirm Assignment] button
  
  BOTTOM:
  - Status timeline (Pending → Assigned → Picked Up → In Transit → Delivered)
    Each step shows timestamp when completed
*/
```

**Status Timeline Component:**
```jsx
// Visual: horizontal steps on desktop, vertical on mobile
// Completed step: filled circle + brand-500 color
// Current step: ring around circle + pulsing dot
// Future step: empty circle, gray
const steps = ['Pending', 'Assigned', 'Picked Up', 'In Transit', 'Delivered'];
```

---

### 4.3 Customer — Place Order Form

```jsx
// src/pages/customer/PlaceOrder.jsx
// Single-page form, no multi-step wizard (keeps it simple for MVP)

/*
  FORM FIELDS:
  1. Pickup Address     — text input + "Use current location" button (Geolocation API)
  2. Drop-off Address   — text input
  3. Goods Type         — select (Furniture / Electronics / Parcels / FMCG / Other)
  4. Estimated Weight   — number input (kg)
  5. Preferred Date     — date picker
  6. Preferred Time     — time picker
  7. Special Instructions — textarea (optional)

  PRICE ESTIMATE:
  - Shows below form once pickup + dropoff + weight filled
  - Calls GET /api/orders/estimate?from=...&to=...&weight=...
  - Displays: "Estimated price: ₹ 2,400" in a highlighted box
  - Note: "Final price confirmed by staff after review"

  SUBMIT:
  - [Place Order] → POST /api/orders
  - Redirects to /customer/orders on success
  - Toast: "Order placed! We'll assign a driver soon."
*/
```

---

### 4.4 Driver — Trip Detail + Status Update

```jsx
// src/pages/driver/TripDetail.jsx
// Mobile-first layout — this is used on phone

/*
  TOP SECTION:
  - Order ID + customer name
  - Large status pill (current status)
  
  MAP SECTION:
  - Google Maps iframe embed with drop-off address pre-filled
  - "Open in Google Maps" button (deep link)
  
  ADDRESSES:
  - Pickup address (large, readable, with copy button)
  - Drop-off address (large, readable, with copy button)
  
  GOODS INFO:
  - Type, weight, special instructions
  
  STATUS UPDATE BUTTONS:
  - [Mark as Picked Up]   — visible when status = Assigned
  - [Mark as In Transit]  — visible when status = Picked Up
  - [Mark as Delivered]   — visible when status = In Transit (triggers POD upload)
  - [Report Issue]        — always visible (opens modal with issue text field)
  
  COD REMINDER:
  - If payment mode = COD, shows: "Collect ₹ 2,400 cash on delivery"
*/
```

---

### 4.5 Business Dashboard (Owner View)

```jsx
// src/pages/dashboard/BusinessDashboard.jsx

/*
  ROW 1 — STAT CARDS (4 cards):
  - Total Orders Today
  - Orders In Transit
  - Revenue Today (₹)
  - Vehicles Available

  ROW 2 — CHARTS:
  - Left: Bar chart — Orders this week (Mon–Sun)
  - Right: Donut — Payment split (Online vs COD)
  
  ROW 3 — TABLES:
  - Left: Recent Orders (last 10, with status)
  - Right: Driver Activity (name, trips today, status)
  
  All data fetched from GET /api/dashboard/summary
*/
```

**StatCard component:**
```jsx
// src/components/ui/StatCard.jsx
// Design: white card, top border gradient (brand-500 → brand-300), 
//         large number, small label below, optional % change chip

function StatCard({ label, value, change, icon: Icon }) {
  return (
    <div className="card border-t-2 border-brand-500">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1">{value}</p>
          {change && <p className="text-xs text-green-600 mt-1">{change}</p>}
        </div>
        <div className="bg-brand-50 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-brand-500" />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. AuthContext — Role-Based Auth

```jsx
// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, name, role, token }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app load, check if token exists in localStorage
    const stored = localStorage.getItem('tms_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    // data = { user: { id, name, role }, token }
    localStorage.setItem('tms_user', JSON.stringify(data));
    setUser(data);
    return data.user.role; // used by Login page to redirect correctly
  };

  const logout = () => {
    localStorage.removeItem('tms_user');
    setUser(null);
  };

  // Attach token to all requests
  axios.defaults.headers.common['Authorization'] = user ? `Bearer ${user.token}` : '';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

---

## 6. API Layer (Axios calls)

```js
// src/api/orders.js
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ordersAPI = {
  // Customer
  placeOrder:      (data)       => axios.post(`${BASE}/orders`, data),
  getMyOrders:     ()           => axios.get(`${BASE}/orders/my`),
  getOrderById:    (id)         => axios.get(`${BASE}/orders/${id}`),
  getEstimate:     (params)     => axios.get(`${BASE}/orders/estimate`, { params }),

  // Staff
  getAllOrders:     (filters)   => axios.get(`${BASE}/orders`, { params: filters }),
  assignOrder:     (id, data)   => axios.put(`${BASE}/orders/${id}/assign`, data),
  updatePrice:     (id, data)   => axios.put(`${BASE}/orders/${id}/price`, data),

  // Driver
  getMyTrips:      ()           => axios.get(`${BASE}/orders/driver/trips`),
  updateStatus:    (id, status) => axios.put(`${BASE}/orders/${id}/status`, { status }),
  uploadPOD:       (id, form)   => axios.post(`${BASE}/orders/${id}/pod`, form, {
                                     headers: { 'Content-Type': 'multipart/form-data' }
                                   }),
};
```

---

## 7. Gemini AI Integration (Frontend Side)

> **Note:** Gemini API is called via the Node.js backend — never expose API keys in the frontend.

The frontend uses two Gemini-powered features:

### Feature 1 — Smart Route Suggestion (Staff Order Detail)
```jsx
// On OrderDetail page, after order is loaded:
// GET /api/ai/route-suggestion?from=...&to=...
// Backend calls Gemini and returns a plain-text suggestion

const { data } = await axios.get('/api/ai/route-suggestion', {
  params: { from: order.pickupAddress, to: order.dropoffAddress }
});
// Render as a subtle chip:
// "💡 Gemini Suggestion: Via NH-65 · Est. 42 km · ~55 min"
```

### Feature 2 — Price Estimate Helper (Place Order)
```jsx
// GET /api/ai/price-estimate?from=...&to=...&weight=...&goods=...
// Gemini returns a suggested price range

// Render below the form:
// "AI Estimate: ₹ 2,100 – ₹ 2,500 (based on distance and goods type)"
// Note: Staff can override final price. This is advisory only.
```

---

## 8. MVP Pages Checklist

| Page | Route | Priority | Status |
|---|---|---|---|
| Login | /login | P0 | Build first |
| Register (Customer) | /register | P0 | Build first |
| Customer: Place Order | /customer/new-order | P0 | Core flow |
| Customer: My Orders | /customer/orders | P0 | Core flow |
| Staff: Orders List | /staff/orders | P0 | Core flow |
| Staff: Order Detail + Assign | /staff/orders/:id | P0 | Core flow |
| Driver: My Trips | /driver/dashboard | P0 | Core flow |
| Driver: Trip Detail + Status Update | /driver/trip/:id | P0 | Core flow |
| Driver: Upload POD | Inside TripDetail | P0 | Core flow |
| Payment: Pay Online | /customer/payment/:id | P1 | After core |
| Staff: Manage Drivers | /staff/drivers | P1 | After core |
| Staff: Manage Vehicles | /staff/vehicles | P1 | After core |
| Owner: Business Dashboard | /owner/dashboard | P1 | After core |
| Staff: Transaction Log | /staff/transactions | P2 | Later |

---

## 9. Design Rules (Non-Negotiable)

- **No shadows on text** — ever
- **No gradient buttons** — only solid fill (`brand-500`) or outlined
- **Sidebar is dark** (`#1a1a2e`), everything else is light neutral
- **Font sizes:** Page title 18px, section heading 14px medium, body 13px, metadata 12px
- **Table rows:** alternating `bg-white` and `bg-neutral-50/50`, hover `bg-brand-50`
- **Forms:** single column on mobile, 2-column on desktop where logical
- **Status badges:** pill-shaped, soft background (no dark fills)
- **Loading states:** skeleton loaders (not spinners) for tables and cards
- **Error states:** subtle red banner at top of card — not full-screen errors
- **Empty states:** centered icon + message + action button (see `EmptyState.jsx`)
- **Spacing unit:** always multiples of 4px (Tailwind default)
- **Icons:** Lucide React only — consistent stroke width

---

## 10. Environment Variables

```bash
# .env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key_here
```

---

## 11. Build & Run

```bash
# Development
npm start

# Production build
npm run build

# Serve built files (for demo)
npx serve -s build
```

---

*Frontend MVP Document · TMS · GoodWill Company · v1.0*
*Team: Pratik, Mohit, Suryank, Abhinav, Sachin, Karan*