# GaDes fit - Classy. Modern. Comfy.

![GaDes fit](https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=400&fit=crop)

A full-stack e-commerce application for a clothing brand featuring handmade accessories and quality clothing in Olive, Butter & Burgundy.

🌐 **Live Demo:** [gades-fit.onrender.com](https://gades-fit.onrender.com)

## ✨ Features

### 🛍️ Customer Features
- Browse products by category (Classy, Modern, Comfy, Accessories)
- Filter and sort products
- Product detail pages with color/size selection
- Shopping cart with local storage persistence
- Checkout with order placement
- Newsletter subscription
- Contact form with database storage
- Fully responsive design for mobile, tablet, and desktop

### 👩‍💼 Admin Features
- Secure admin login
- Dashboard with sales analytics and charts
- Product management (add, edit, delete, bulk actions)
- Order management with status updates
- Contact message management
- Subscriber management with export
- Site settings customization

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express** | Web framework |
| **EJS** | Template engine |
| **MongoDB** | Database (with local storage fallback) |
| **Chart.js** | Analytics charts |
| **Helmet** | Security headers |
| **Express Session** | Authentication |
| **Multer** | File uploads |
| **Nodemailer** | Email notifications |

## 📁 Project Structure
```bash
gades-fit/
├── config/ # Database configuration
├── controllers/ # Route controllers
├── middleware/ # Auth & upload middleware
├── models/ # Database models
├── public/
│ ├── css/ # Stylesheets
│ ├── js/ # Client-side JavaScript
│ └── uploads/ # Product images
├── routes/ # Express routes
├── views/
│ ├── admin/ # Admin panel views
│ ├── partials/ # Reusable components
│ └── shop/ # Customer-facing views
├── .data/ # Local storage fallback
├── app.js # Express app setup
└── server.js # Entry point
```
text

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB Atlas account (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/divineshedrack33220/gades-fit.git
cd gades-fit
Install dependencies

bash
npm install
# or
yarn install
Create .env file

env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-secret-key
MONGO_URI=your-mongodb-uri (optional)
ADMIN_EMAIL=abigail@gadesfit.com
ADMIN_PASSWORD_HASH=$2b$10$...
Start the development server

bash
npm run dev
# or
yarn dev
Access the application

Website: http://localhost:3000

Admin: http://localhost:3000/admin/login

Email: abigail@gadesfit.com

Password: GadesFit2024!

📦 Available Scripts
Command	Description
npm start	Start production server
npm run dev	Start development server with nodemon
🎨 Brand Colors
Color	Hex	Usage
Olive	#2D6A4F	Primary brand color
Burgundy	#6B1A2A	Accent color
Butter	#F5E6B8	Secondary accent
Light Background	#FDFBF7	Page background
🔒 Environment Variables
Variable	Required	Description
NODE_ENV	Yes	development or production
PORT	No	Server port (default: 3000)
SESSION_SECRET	Yes	Secret for session encryption
MONGO_URI	No	MongoDB connection string
ADMIN_EMAIL	Yes	Admin login email
ADMIN_PASSWORD_HASH	Yes	Bcrypt hash of admin password
🚢 Deployment
This project is configured for easy deployment on Render:

Push code to GitHub

Connect repository to Render

Add environment variables

Deploy!

https://render.com/images/deploy-to-render-button.svg

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 Author
Divine Shedrack

GitHub: @divineshedrack33220

🙏 Acknowledgments
Images from Unsplash

Fonts from Google Fonts

Icons from Feather Icons

Made with ❤️ for GaDes fit - Where Classy Meets Comfy.

text

## Now add and push the README:

```bash
# Add the README
git add README.md

# Commit
git commit -m "Add professional README"

# Push to GitHub
git push