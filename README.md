# Jacketee - Premium Fashion E-Commerce

A modern, full-stack e-commerce store built with Next.js 16, NextAuth, and static data (ready for MongoDB).

## 🛍️ Features

### Customer Features
- **Product Catalog**: Browse and search fashion, activewear, and outdoor apparel
- **Category Filtering**: Filter by Tops, Bottoms, Activewear, Outerwear, Footwear, Accessories
- **Product Details**: View images, select variants, and check pricing
- **Shopping Cart**: Add items, manage quantities, and view totals
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Contact & Support**: Contact, Shipping Info, and Returns pages

### Admin Features
- **Authentication**: Secure login with NextAuth
- **Dashboard**: View product statistics and metrics
- **Product Management**: View, edit, and add products
- **Read-Only Demo**: Currently uses static data (MongoDB ready)

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Deployment**: Vercel (Next.js)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔐 Admin Access

**Login Credentials:**
- Email: `admin@jacketee.com`
- Password: `admin123`

Access the admin panel by:
1. Click "Admin" button in the header
2. Go to `/login`
3. Enter credentials
4. Access dashboard at `/admin/dashboard`

## 📁 Project Structure

```
luxe-store/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                 # API routes
│   │   │   ├── auth/           # NextAuth authentication
│   │   │   ├── products/       # Products API (static data)
│   │   │   └── categories/     # Categories API (static data)
│   │   ├── admin/              # Admin panel
│   │   │   ├── dashboard/      # Admin dashboard
│   │   │   └── products/       # Product management
│   │   ├── contact/            # Contact Us page
│   │   ├── returns/            # Returns page
│   │   ├── shipping/           # Shipping Info page
│   │   ├── product/[id]/       # Product detail page
│   │   ├── login/              # Login page
│   │   ├── page.tsx            # Homepage
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   ├── data/                   # Static data files
│   │   ├── products.ts         # Product data
│   │   └── categories.ts       # Category data
│   ├── lib/                    # Utilities
│   ├── models/                 # Mongoose models (for MongoDB)
│   └── store/                  # Zustand stores
│       └── cart.ts             # Cart store
├── public/                     # Static assets
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
└── package.json               # Dependencies
```

## 🗄️ Data Management

### Current Setup (Static Data)
- Products: Stored in `src/data/products.ts`
- Categories: Stored in `src/data/categories.ts`
- No database required for development
- Easy to modify and test

### MongoDB Migration (When Ready)
1. Set up MongoDB Atlas
2. Add `MONGODB_URI` to environment variables
3. Models already created in `src/models/`
4. Seed script available in `scripts/seed-mongodb.ts`
5. Update API routes to use MongoDB (fallback code included)

## 📄 Available Pages

### Customer Pages
- **/** - Homepage with product grid
- **/product/[id]** - Product detail page
- **/contact** - Contact Us page
- **/shipping** - Shipping Information page
- **/returns** - Returns & Exchanges policy page

### Admin Pages
- **/login** - Admin login
- **/admin/dashboard** - Admin dashboard
- **/admin/products** - Product management
- **/admin/products/[id]** - Edit product
- **/admin/products/new** - Add new product

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📝 Environment Variables

For development (optional - static data works without it):
```env
# MongoDB - For future use when migrating to database
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luxe-store?retryWrites=true&w=majority

# NextAuth Secret (generate a random string)
# NEXTAUTH_SECRET=your-secret-here
# NEXTAUTH_URL=http://localhost:3000
```

## 🎨 Categories

1. **Tops** - T-shirts, polos, blouses
2. **Bottoms** - Jeans, pants, shorts
3. **Activewear** - Performance athletic wear
4. **Outerwear** - Jackets, coats, hoodies
5. **Footwear** - Sneakers, boots
6. **Accessories** - Bags, belts, caps

## 🚀 Deployment to Vercel

1. Connect your GitHub repository to Vercel
2. Import the project as a Next.js app
3. Set the environment variables from `.env.example`
4. Deploy!

For admin authentication in production:
1. Add `NEXTAUTH_SECRET` in Vercel environment variables
2. Add `NEXTAUTH_URL` if you want to override the default domain
3. Ensure `AUTH_TRUST_HOST=true` is enabled for Vercel-hosted domains

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For support, email support@jacketee.com or visit our Contact page.

---

**Note**: This project currently uses static data files. MongoDB integration is prepared and can be enabled by adding the MongoDB connection string. All admin features are read-only in static mode - write operations will be available once MongoDB is connected.