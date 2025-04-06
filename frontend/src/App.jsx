import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import BillForm from './pages/BillForm'
import BillList from './pages/BillList'
import BillView from './pages/BillView'
import Dashboard from './pages/Dashboard'
import BillGenerator from './components/BillGenerator'
import BillConversion from './components/BillConversion'
import BillEdit from './pages/BillEdit'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Wrap each route component that requires authentication with ProtectedRoute
const ProtectedBillList = () => (
  <ProtectedRoute>
    <BillList />
  </ProtectedRoute>
);

const ProtectedBillForm = () => (
  <ProtectedRoute>
    <BillForm />
  </ProtectedRoute>
);

const ProtectedBillView = () => (
  <ProtectedRoute>
    <BillView />
  </ProtectedRoute>
);

const ProtectedBillGenerator = () => (
  <ProtectedRoute>
    <BillGenerator />
  </ProtectedRoute>
);

const ProtectedBillConversion = () => (
  <ProtectedRoute>
    <BillConversion />
  </ProtectedRoute>
);

const ProtectedBillEdit = () => (
  <ProtectedRoute>
    <BillEdit />
  </ProtectedRoute>
);

const ProtectedDashboard = () => (
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
);

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="container mx-auto px-4 py-8 flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedDashboard />} />
              <Route path="/bills" element={<ProtectedBillList />} />
              <Route path="/bills/new" element={<ProtectedBillGenerator />} />
              <Route path="/bills/:id" element={<ProtectedBillView />} />
              <Route path="/bills/:id/convert" element={<ProtectedBillConversion />} />
              <Route path="/bills/:id/edit" element={<ProtectedBillEdit />} />
            </Routes>
          </main>
          
          <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm mt-auto border-t border-gray-200">
            <p>Made with ❤️ by Uminda <a href="https://github.com/Spyboss" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">@uhadev</a></p>
          </footer>
          
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App 