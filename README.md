# ShopKart

MERN shopping application for Engineering Labs 01–06. Customers can register and sign in, browse a product catalogue, manage a wishlist and cart, check out with shipping details, pay through **Razorpay Test Mode**, and review order history.

This repository already contains a React/Vite frontend and a Node.js/Express/MongoDB backend. Follow the steps below against this codebase; do not create a second project.

## Implemented features

- Customer registration and login with bcrypt password hashing and HTTP-only JWT cookies
- Session check (`GET /customers/me`) and logout
- Product catalogue: create, list, detail, name search, category filter
- Category dropdown driven by categories present in the database (`GET /products/categories`)
- Authenticated wishlist: add (duplicate rejected), list with populated products, remove
- Authenticated cart: add, update quantity, remove, stock checks, navbar quantity badge
- Checkout with shipping validation on both frontend and backend
- Razorpay Test Mode: server-side order total, Razorpay order creation, HMAC signature verification, cart cleared only after verified payment
- Order list and order detail with ownership checks
- Order confirmation page shows success only when `paymentStatus` is `paid` and order status is a placed-or-later status

## Technologies

| Layer | Stack |
| --- | --- |
| Frontend | React 19, React Router, Vite 8 |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB |
| Auth | bcrypt, jsonwebtoken, cookie-parser |
| Payments | Razorpay Node SDK (Test Mode) |

## Prerequisites

- Node.js 18+ (LTS recommended) and npm
- A running MongoDB instance (local or Atlas)
- A Razorpay Test Mode Key ID (`rzp_test_…`) and Key Secret for checkout

## Environment setup

### Backend

1. Copy the example file (do **not** commit your real `.env`):

```bash
cd backend
cp .env.example .env
```

On Windows PowerShell:

```powershell
cd backend
Copy-Item .env.example .env
```

2. Edit `backend/.env` with your values:

| Variable | Purpose | Example placeholder |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/shopkart` |
| `JWT_SECRET` | Secret used to sign auth cookies | long random string |
| `RAZORPAY_KEY_ID` | Razorpay Test Mode key id | `rzp_test_…` |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Mode key secret | from Razorpay dashboard |
| `PORT` | Backend listen port | `5001` |
| `FRONTEND_ORIGIN` | Allowed CORS origin (frontend URL) | `http://localhost:5173` |

Only `RAZORPAY_KEY_ID` is ever sent to the browser for Checkout. The key secret stays on the server.

### Frontend

Optional. Defaults to `http://localhost:5001` if unset.

```bash
cd frontend
cp .env.example .env
```

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend API base URL (no trailing slash) | `http://localhost:5001` |

Restart `npm run dev` after changing Vite env vars.

## MongoDB

1. Start MongoDB locally, or use an Atlas connection string.
2. Set `MONGODB_URI` in `backend/.env` to that database.
3. Start the backend; a successful connection logs `MongoDB connected`.
4. There is no automatic product seed. Create products via `POST /products` (see below).

## Backend installation and startup

```bash
cd backend
npm install
npm start
```

For auto-restart during development:

```bash
npm run dev
```

Default URL: `http://localhost:5001` (or whatever `PORT` you set).

Quick health check: `GET http://localhost:5001/` returns a JSON welcome message.

## Frontend installation and startup

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Ensure `FRONTEND_ORIGIN` on the backend matches that origin so credentialed cookie requests succeed.

Other frontend scripts:

- `npm run lint` — ESLint
- `npm run build` — production build to `frontend/dist`
- `npm run preview` — preview the production build

## API endpoints

All authenticated routes expect the `authToken` HTTP-only cookie set by login. Use a browser session, or an API client that stores cookies (`credentials: "include"` / Postman cookie jar).

### Customers

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/customers/register` | No | Register. Body: `{ fullName, email, password, phone }`. Password min length 6. |
| `POST` | `/customers/login` | No | Login. Body: `{ email, password }`. Sets `authToken` cookie. |
| `GET` | `/customers/me` | Yes | Current customer (no password). |
| `POST` | `/customers/logout` | Yes | Clears `authToken` cookie. |

### Products

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/products` | No | Create a product (lab seed / admin-style endpoint). |
| `GET` | `/products` | No | List products. Query: `search`, `category`. |
| `GET` | `/products/categories` | No | Distinct category names currently in the catalogue. |
| `GET` | `/products/:id` | No | Product detail. |

#### Create product (`POST /products`)

Send JSON with **numeric** `price` and `stock` (not quoted strings):

```json
{
  "name": "Wireless Headphones",
  "description": "Noise-cancelling over-ear headphones",
  "price": 2999,
  "category": "Electronics",
  "image": "https://example.com/headphones.jpg",
  "stock": 25
}
```

Required fields: `name`, `description`, `price` (> 0), `category`, `image`, `stock` (≥ 0).

Example with curl:

```bash
curl -X POST http://localhost:5001/products \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Wireless Headphones\",\"description\":\"Noise-cancelling over-ear headphones\",\"price\":2999,\"category\":\"Electronics\",\"image\":\"https://example.com/headphones.jpg\",\"stock\":25}"
```

### Wishlist (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/wishlist/:productId` | Add product. Duplicate → `409`. |
| `GET` | `/wishlist` | List wishlist with populated product fields. |
| `DELETE` | `/wishlist/:productId` | Remove product. |

### Cart (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/cart/:productId` | Add one unit (or increment). Respects stock. |
| `GET` | `/cart` | List cart with populated products. |
| `PATCH` | `/cart/:productId` | Body: `{ "quantity": <integer ≥ 1> }`. |
| `DELETE` | `/cart/:productId` | Remove line item. |

### Orders (auth required)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/orders/create-payment-order` | Create DB order + Razorpay order from the server-side cart total. |
| `POST` | `/orders/verify-payment` | Verify Razorpay HMAC signature; mark paid; clear cart; decrement stock. |
| `GET` | `/orders` | Current customer’s orders. |
| `GET` | `/orders/:id` | Single order (owner only). |

#### Checkout shipping body

`POST /orders/create-payment-order` expects:

```json
{
  "shippingAddress": {
    "fullName": "Ada Lovelace",
    "phone": "9876543210",
    "addressLine1": "42 Algorithm Lane",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001"
  }
}
```

Backend validation (independent of the UI):

- All six fields required (non-empty strings)
- Phone: 10–15 digits after stripping non-digits
- Pincode: exactly six digits
- Cart must be non-empty; each line’s quantity must be ≤ live product stock
- Order total is computed on the server from product prices in MongoDB (not trusted from the client)

#### Payment verification body

```json
{
  "orderId": "<MongoDB order _id>",
  "razorpayOrderId": "<from Razorpay>",
  "razorpayPaymentId": "<from Razorpay>",
  "razorpaySignature": "<from Razorpay>"
}
```

Verification computes `HMAC-SHA256(razorpayOrderId|razorpayPaymentId)` with `RAZORPAY_KEY_SECRET` using the **stored** Razorpay order id, not an untrusted client-only value. Failed signatures leave the order unpaid.

## Razorpay Test Mode

1. Create a Razorpay account and open **Test Mode**.
2. Copy Key ID and Key Secret into `backend/.env`.
3. Key ID must start with `rzp_test_`; otherwise checkout returns `503`.
4. Place items in the cart, open Checkout, submit shipping, and complete payment in the Razorpay Standard Checkout modal (use Razorpay’s published test cards/UPI methods).
5. On success, the frontend calls `/orders/verify-payment`. Only after a valid signature does the backend set `paymentStatus: "paid"`, `orderStatus: "placed"`, store payment ids, clear the cart, and decrement stock.
6. The order confirmation route shows a success UI only when the fetched order is paid and has an appropriate placed-or-later status. Pending or failed payments are not shown as successful.

There is **no** fake “payment success” endpoint and no bypass of signature verification.

## How to test the API quickly

1. Start MongoDB, backend, and frontend.
2. Register and log in through the UI (or Postman with cookie jar).
3. Create a few products with `POST /products`.
4. Confirm `GET /products` and `GET /products/categories`.
5. Add wishlist/cart items while logged in.
6. Check out with valid Test Mode keys and complete a test payment.
7. Confirm the order appears under Orders and that confirmation requires `paid`.

## Deployment notes (not performed in this repo)

If you deploy later:

- Set `MONGODB_URI`, `JWT_SECRET`, Razorpay keys, `PORT`, and `FRONTEND_ORIGIN` on the backend host.
- Set `VITE_API_URL` to the public backend URL **before** building the frontend (`npm run build`).
- Use HTTPS in production so `secure` cookies (`NODE_ENV=production`) work.
- Do not commit real `.env` files or secrets.

This project has **not** been deployed as part of these instructions.

## Limitations / not implemented

- No admin UI; product creation is via API only
- No automated product seed script (avoids writing sample data into shared/production databases)
- No unit/integration test suite is shipped with the lab app
- Abandoned / failed Razorpay checkouts can leave `paymentStatus: "pending"` orders in the database (they are never marked paid without a valid signature)
- Stock is checked at payment-order creation and decremented atomically per product after verification; under heavy concurrent checkouts for the last units, a verified payment may still surface a stock-conflict message asking the customer to contact support (payment is not rolled back after Razorpay has succeeded)
- No email notifications, refunds, or order-cancellation workflow beyond stored statuses
- Product create endpoint is intentionally open (no admin auth) for lab convenience

## Git safety

`.gitignore` excludes `.env`, `.env.*` (with `!.env.example` allowed), `node_modules`, build output (`dist`), coverage, and logs. Keep real secrets out of git.
