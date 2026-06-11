# SafeRoute – Women's Safety Navigator

SafeRoute is a full-stack web application designed to help women and vulnerable individuals find safer travel routes, particularly at night. It factors in street lighting, emergency facilities, and community-reported incidents to evaluate path safety.

## 🌟 SDG Mapping (UN SDG 5: Gender Equality)

This project directly aligns with **United Nations Sustainable Development Goal 5: Achieve gender equality and empower all women and girls**. 

**How SafeRoute Contributes to SDG 5:**
- **Enhances Physical Safety:** By providing data-driven safer travel routes, it reduces the risk of gender-based violence in public spaces.
- **Empowerment Through Information:** Gives women the tools to navigate cities confidently, independently, and securely.
- **Community Support System:** The incident reporting feature empowers communities to highlight unsafe areas, driving potential localized action.
- **Emergency Preparedness:** One-tap SOS and integrated emergency contacts ensure immediate help is accessible.

## 🚀 Features

- **Route Planner & Safety Score:** Calculates the safest paths based on mocked algorithms (lighting, crowd data, proximity to police).
- **Interactive Map:** Powered by Leaflet, displaying routes, hospitals, police stations, and community-reported hazards.
- **Community Dashboard:** Allows users to anonymously report hazards like poor lighting or suspicious activities.
- **One-Tap SOS:** Immediately triggers mock alerts to trusted contacts.
- **Safi AI Assistant:** A built-in chat interface offering immediate safety guidelines and advice.

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, Tailwind CSS (v4), React Router, React Leaflet, Lucide React (Icons).
- **Backend:** Node.js, Express.js.
- **Data:** In-memory Mock Data store (suitable for quick local demonstration).

## 📥 Setup Instructions

Follow these simple steps to run the application locally on your machine.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### Installation & Execution

1. **Clone or Download the Project.**
2. **Navigate to the root directory:**
   ```bash
   cd "SafeRoute" # Or your extracted folder name
   ```
3. **Install Dependencies (Root, Frontend, Backend):**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```
4. **Run the Application:**
   The project uses `concurrently` to run both the Vite frontend and Express backend simultaneously with a single command.
   ```bash
   npm run dev
   ```
5. **Access the App:**
   - Frontend is available at: `http://localhost:5173`
   - Backend API is running on: `http://localhost:5000`

## 📁 Project Structure

```
├── package.json (Root config to run both ends concurrently)
├── frontend/
│   ├── src/
│   │   ├── components/ (Navbar, MapComponent)
│   │   ├── pages/ (Landing, RoutePlanner, Dashboard, Contacts)
│   │   ├── App.jsx (Routing config)
│   │   └── main.jsx
│   └── vite.config.js
└── backend/
    ├── server.js (Express server, mock data, endpoints)
    └── package.json
```
