# Jacketee (Jacketee) Testing Guide

This document provides a comprehensive step-by-step guide on how to test all customer-facing and administrator features of the **Jacketee** (Jacketee) codebase.

---

## 🛠️ Setup & Prerequisites

Before testing, ensure your local development server is running and the database is configured.

1. **Environment Configuration**: Check your [.env](file:///d:/luxestore/luxestore-late/.env) file to configure external service credentials.
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.
3. **Database Setup** (Optional): If you want to seed the database with the initial products and categories, run the MongoDB seed script:
   ```bash
   npx ts-node scripts/seed-mongodb.ts
   ```

> [!NOTE]
> **Graceful Degradation / Mock Mode**: 
> - If `MONGODB_URI` is not provided in your env file, the app automatically degrades to a **read-only static mode** using local mock data from [src/data/products.ts](file:///d:/luxestore/luxestore-late/src/data/products.ts) and [src/data/categories.ts](file:///d:/luxestore/luxestore-late/src/data/categories.ts).
> - Checkout payments support a simulated **Demo Mode** if PayPal keys are omitted.
> - Emails fallback to logging to the console if SMTP details are blank.

---

## 👤 1. User Authentication & Profile

### Registration
* **Target Page**: `/register`
* **Test Steps**:
  1. Navigate to `/register` or click **Sign In** in the header, then click **Create an account**.
  2. Attempt to submit the form with empty fields. Verify validation messages appear.
  3. Enter a short password (less than 6 characters) and verify it triggers a validation error.
  4. Submit valid credentials (e.g., Name: `Test User`, Email: `test@jacketee.com`, Password: `password123`).
  5. Verify that you are successfully registered and redirected to the login page with a success toast.

### Login & Session
* **Target Page**: `/login`
* **Test Steps**:
  1. Enter the newly created credentials or use the demo admin credentials (`admin@jacketee.com` / `admin123`).
  2. Verify that logging in with incorrect credentials shows an error toast.
  3. Log in with correct credentials. Confirm you are redirected to the homepage (or dashboard if admin).
  4. Verify that the navigation header updates: the **Sign In** button is replaced by a user profile dropdown menu displaying your name and email.

### Profile Dashboard
* **Target Page**: `/profile`
* **Test Steps**:
  1. Click on the profile dropdown in the header and select **My Profile** (or go to `/profile`).
  2. **Personal Details tab**: Change your name, click **Save Changes**, and verify the updated name persists upon refreshing the page.
  3. **Change Password tab**: Try changing the password. Validate matching logic and length bounds.
  4. **Orders tab**: View order history (initially empty for new users, populated after checking out).
  5. **Wishlist tab**: Shows list of items you've bookmarked (explained in Section 3).

---

## 🛒 2. Product Catalog, Search & Shopping Cart

### Product Browsing & Filtering
* **Target Page**: `/` (Homepage)
* **Test Steps**:
  1. **Search**: Enter text in the search input (e.g., "running", "jacket"). Verify the product listing filters in real-time.
  2. **Category badges**: Click on a category badge (e.g., **Activewear**, **Footwear**). Confirm that only products belonging to that category are shown. Click **All** to reset.
  3. **Sorting**: Open the sort dropdown and select:
     - **Price: Low to High**: Verify items are ordered in ascending price.
     - **Price: High to Low**: Verify items are ordered in descending price.
     - **Name: A-Z / Z-A**: Verify sorting behavior.
     - **Featured**: Confirm featured items display first.

### Product Detail Page (PDP)
* **Target Page**: `/product/[id]`
* **Test Steps**:
  1. Click any product from the grid.
  2. **Image Gallery**: Click on thumbnails. Verify that the main product image updates accordingly.
  3. **Variants**: Choose from available variations (e.g., Size: *M, L*, Color: *Black, White*). Verify selection states.
  4. **Quantity Selector**: Press `+` to increase or `-` to decrease count. Confirm the count stays within `[1, stockCount]`.
  5. **Add to Cart**: Click the **Add to Cart** button. Confirm that the button text animates to "Added!" and the Cart Drawer slides open.

### Cart Drawer
* **Target Component**: Slide-out panel triggered by the Header cart button.
* **Test Steps**:
  1. Verify items added from the PDP show up with correct variants, pricing, and quantities.
  2. Click `+` or `-` within the drawer to update the count. Check that the item subtotal and cart total recalculate dynamically.
  3. Click the **Bin icon** to remove an item. Verify the item is removed and the total resets.
  4. Close the page, reload, and verify cart items persist (using local Zustand storage).

---

## 💖 3. Wishlist & Reviews

### Wishlist Flow
* **Target Pages**: Homepage `/`, PDP `/product/[id]`, Profile `/profile`
* **Test Steps**:
  1. On a product card, click the **Heart icon** in the top right. Confirm it turns solid red.
  2. Navigate to your `/profile` page and click the **Wishlist** tab. Confirm the product appears.
  3. Click **Add to Cart** from the profile wishlist tab. Verify the item is moved to your cart.
  4. Toggle the heart icon off from either the PDP or homepage. Confirm it disappears from the profile wishlist tab.

### Product Reviews
* **Target Page**: `/product/[id]` (Bottom section)
* **Test Steps**:
  1. Verify the list of existing reviews is shown.
  2. If logged in, fill out the review form: select a rating (1-5 stars) and type comments in the text box. Click **Submit Review**.
  3. Check that:
     - The review immediately appears in the review list.
     - The aggregate average rating score and total review count at the top of the PDP update.
  4. Log out and confirm that the review submission form is hidden, showing a prompt to login instead.

---

## 💳 4. Checkout & Payment Flow

### Checkout Page
* **Target Page**: `/checkout`
* **Test Steps**:
  1. Add items to your cart, open the Cart Drawer, and click **Proceed to Checkout**.
  2. Fill out the shipping form (Name, Address, City, Zip, Country, Phone). Verify validation on missing fields.
  3. Check the order summary sidebar for correct items, pricing breakdown, tax, shipping, and total.

### Payment Processing
* **Test Steps (PayPal & Demo Fallbacks)**:
  - **Scenario A: Demo Sandbox Payment** (Recommended)
    1. If `PAYPAL_CLIENT_ID` is not set or set to `your_paypal_client_id`, the page will load in **Demo Payment Mode**.
    2. Click the **Simulate Checkout (Demo Mode)** button.
    3. The application will simulate API queries to `/api/payments/create-order` and `/api/payments/capture`.
  - **Scenario B: Real PayPal Sandbox**
    1. Configure valid sandbox credentials in `.env` and restart the server.
    2. The standard PayPal button will render.
    3. Click the PayPal button, complete authorization in the sandbox popup, and approve.
  4. Verify that once payment is completed, you are redirected to the `/order-confirmation` page.

### Order Confirmation
* **Target Page**: `/order-confirmation`
* **Test Steps**:
  1. Verify the page displays a success icon, order number (e.g., `ORD-...`), shipping estimation, and summary.
  2. Check your mailbox (or terminal logs if SMTP is mock-configured) to verify an HTML **Order Confirmation Email** was dispatched.
  3. Go to `/profile` -> **Orders** tab. Expand the accordion matching your order number and verify the correct details and status (`Processing`).

---

## 📧 5. Contact & Informational Pages

### Contact Us Form
* **Target Page**: `/contact`
* **Test Steps**:
  1. Fill out the name, email, subject, and message fields.
  2. Click **Send Message**. Confirm a loader spinner is displayed, followed by a success Toast.
  3. If SMTP is configured in [.env](file:///d:/luxestore/luxestore-late/.env), check:
     - The destination mailbox (store owner) for the incoming inquiry details.
     - The sender mailbox for an HTML auto-reply receipt.
     - If not configured, check the terminal stdout where the email contents are printed.

### Informational Pages
* **Target Pages**: `/shipping` (Shipping Information) & `/returns` (Returns & Exchanges)
* **Test Steps**:
  1. Navigate via links in the footer.
  2. Verify pages render correctly with clear heading structures and responsive styling.

---

## 🔑 6. Admin Panel

> [!IMPORTANT]
> To access admin pages, you must log in with an administrator account (such as `admin@jacketee.com` / `admin123`). Unauthorized requests to `/admin/*` will be intercepted and redirected to `/login`.

### Admin Dashboard
* **Target Page**: `/admin/dashboard`
* **Test Steps**:
  1. Log in as admin and click the **Admin** button in the header.
  2. Verify that dashboard statistics render (Total Sales, Orders Count, Average Order Value, Product counts).
  3. Inspect the charts and recent orders section to verify correct bindings.

### Categories Listing
* **Target Page**: `/admin/categories`
* **Test Steps**:
  1. Navigate to Categories from the admin sidebar.
  2. Verify the list displays categories along with active product counts.

### Order Management
* **Target Page**: `/admin/orders`
* **Test Steps**:
  1. Click **Orders** in the admin sidebar.
  2. Identify an order in the listing. Select a new status from the dropdown (e.g., `Shipped` or `Delivered`).
  3. Click **Update Status**.
  4. Log in as the customer, visit `/profile`, and verify the order status has changed accordingly.

### Product Creation & Editing
* **Target Pages**: `/admin/products/new` & `/admin/products/[id]`
* **Test Steps**:
  1. Go to `/admin/products`.
  2. **Search**: Query existing products by typing in the search bar.
  3. **Edit Product**: Click **Edit** on a product card.
     - Change details (e.g., Price, Stock status).
     - Submit modifications. Verify changes apply.
  4. **Create Product**: Click **Add Product** (`/admin/products/new`).
     - Fill in required fields (Name, Slug, Price, Category).
     - **Image Upload (Cloudinary)**: Drag and drop a product image into the dropzone (or select a file). Ensure the upload progress indicator appears, followed by a thumbnail preview. Alternatively, paste a direct Image URL in the fallback input.
     - **Variants**: Add sizes or colors.
     - Click **Save Product**.
  5. Go back to the customer homepage (`/`) and verify the new/edited product is visible and reflects your changes.

---

## 📡 7. API Endpoint Reference

For automated testing (using Postman or curl), verify these core endpoints:

| Endpoint | Method | Description | Payload/Params |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | Get filtered/sorted products list | `?search=xx&category=xx&sort=price&order=desc` |
| `/api/products` | `POST` | Create a new product (Admin only) | `{ name, slug, price, categoryId, ... }` |
| `/api/products/[id]` | `GET` | Fetch single product details | URL param: `id` (product UUID or ObjectID) |
| `/api/categories` | `GET` | Fetch all active categories | None |
| `/api/reviews` | `POST` | Post a customer review | `{ productId, rating, comment }` |
| `/api/wishlist` | `GET` | Fetch user's wishlist | Auth Session |
| `/api/wishlist` | `POST` | Add item to wishlist | `{ productId }` |
| `/api/wishlist` | `DELETE` | Remove item from wishlist | `{ productId }` |
| `/api/orders` | `POST` | Create new database order record | `{ items, shippingAddress, paymentId, ... }` |
| `/api/upload` | `POST` | Upload image to Cloudinary CDN | `FormData` with `file` key (Admin only) |

---

### Mail & SMTP Capture Tips
To test Nodemailer without spamming real accounts, configure a mock SMTP server in [.env](file:///d:/luxestore/luxestore-late/.env):
1. Create a free sandbox account on [Ethereal.email](https://ethereal.email) or [Mailtrap](https://mailtrap.io).
2. Grab the SMTP credentials and update:
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_USER=your_ethereal_user
   SMTP_PASS=your_ethereal_password
   ```
3. Send a test email (checkout or contact submission) and inspect the sent emails in your sandbox dashboard.
