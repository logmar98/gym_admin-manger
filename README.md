# 🏋️ Gym Owner Dashboard

A comprehensive React-based gym management system with Firebase backend, featuring member management, attendance tracking, payment monitoring, and QR code functionality.

## ✨ Features

### 🔐 Authentication

- Email/password authentication with Firebase
- Protected routes for admin-only access
- Secure session management

### 📊 Dashboard

- Real-time statistics and metrics
- Visual charts and graphs
- Overview of gym performance
- Quick access to key information

### 👥 Member Management

- Add, edit, and delete members
- Member status management (Active, Stopped, Banned)
- Member profiles with detailed information
- QR code generation for each member
- CSV export functionality

### 📅 Attendance Tracking

- QR code-based attendance system
- Attendance calendar with heatmap visualization
- Daily, weekly, and monthly attendance reports
- Attendance history and analytics

### 💰 Payment Management

- Payment status tracking with color-coded indicators
- Payment delay alerts (Green: OK, Yellow: 5+ days, Orange: 10+ days, Red: 15+ days)
- Today's payments overview
- Payment history and records
- CSV export for payment data

### 📱 QR Code System

- Unique QR codes for each member
- QR code scanning for attendance logging
- Member identification through QR codes

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd gym-owner-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication with Email/Password
   - Create a Firestore database
   - Get your Firebase configuration

4. **Configure Firebase**

   - Open `src/firebase.js`
   - Replace the placeholder configuration with your Firebase project details:

   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
   };
   ```

5. **Start the development server**

   ```bash
   npm start
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Create an admin account through Firebase Authentication

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.js       # Navigation component
│   ├── ProtectedRoute.js # Authentication wrapper
│   ├── MemberTable.js  # Member listing table
│   └── CalendarHeatmap.js # Attendance calendar
├── pages/              # Page components
│   ├── Login.js        # Authentication page
│   ├── Dashboard.js    # Main dashboard
│   ├── Members.js      # Member management
│   ├── MemberProfile.js # Individual member view
│   ├── Payments.js     # Payment management
│   └── Attendance.js   # Attendance logs
├── firebase.js         # Firebase configuration
└── App.js             # Main application component
```

## 🔧 Firebase Collections

### Members Collection

```javascript
{
  name: "string",
  email: "string",
  phone: "string",
  joinDate: "date",
  status: "active|stopped|banned",
  lastPaymentDate: "date",
  createdAt: "timestamp",
  updatedAt: "timestamp"
}
```

### Logs Collection

```javascript
{
  memberId: "string",
  date: "YYYY-MM-DD",
  timestamp: "timestamp"
}
```

### Payments Collection (Optional)

```javascript
{
  memberId: "string",
  amount: "number",
  date: "date",
  month: "YYYY-MM",
  timestamp: "timestamp"
}
```

## 🎨 Features in Detail

### Payment Status System

- **Green**: Payment within 5 days
- **Yellow**: Payment 6-10 days ago
- **Orange**: Payment 11-15 days ago
- **Red**: Payment over 15 days ago or no payment

### QR Code System

- Each member gets a unique QR code containing their member ID
- QR codes can be scanned by a separate mobile app for attendance
- Attendance logs are stored in Firestore with timestamps

### Export Functionality

- CSV export for member data
- CSV export for payment records
- CSV export for attendance logs
- All exports include relevant date filters

## 📱 Mobile App Integration

The QR code system is designed to work with a separate mobile app:

1. Members scan their QR code
2. Mobile app sends attendance data to Firestore
3. Dashboard displays real-time attendance information

## 🔒 Security Features

- Firebase Authentication for secure access
- Protected routes prevent unauthorized access
- Firestore security rules (configure as needed)
- Admin-only access to sensitive operations

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 🛠️ Customization

### Styling

- All styles use CSS only (no Tailwind)
- Responsive design for mobile devices
- Custom color scheme can be modified in CSS files

### Features

- Add new pages by creating components in the `pages/` directory
- Extend functionality by adding new Firebase collections
- Modify authentication logic in `ProtectedRoute.js`

## 📞 Support

For issues and questions:

1. Check the Firebase console for authentication and database setup
2. Ensure all dependencies are properly installed
3. Verify Firebase configuration in `src/firebase.js`

## 📄 License

This project is licensed under the MIT License.

---

**Note**: Remember to configure Firebase security rules appropriately for your production environment and add proper error handling for production use.
