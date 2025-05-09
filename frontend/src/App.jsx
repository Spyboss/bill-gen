import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import BillForm from './pages/BillForm'
import BillList from './pages/BillList'
import BillView from './pages/BillView'
import Dashboard from './pages/Dashboard'
import BillGenerator from './components/BillGenerator'
import BillGeneratorWithInventory from './components/BillGeneratorWithInventory'
import BillConversion from './components/BillConversion'
import BillEdit from './pages/BillEdit'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext' // Import ThemeProvider
import ProtectedRoute from './components/ProtectedRoute'

// Inventory pages
import InventoryList from './pages/Inventory/InventoryList'
import AddInventoryItem from './pages/Inventory/AddInventoryItem'
import BatchAddInventory from './pages/Inventory/BatchAddInventory'
import EditInventoryItem from './pages/Inventory/EditInventoryItem'
import InventoryReport from './pages/Inventory/InventoryReport'

// Admin pages for Bike Models
import BikeModelList from './pages/Admin/BikeModelList'
import BikeModelForm from './pages/Admin/BikeModelForm'

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

// Inventory protected routes
const ProtectedInventoryList = () => (
  <ProtectedRoute>
    <InventoryList />
  </ProtectedRoute>
);

const ProtectedAddInventoryItem = () => (
  <ProtectedRoute>
    <AddInventoryItem />
  </ProtectedRoute>
);

const ProtectedBatchAddInventory = () => (
  <ProtectedRoute>
    <BatchAddInventory />
  </ProtectedRoute>
);

const ProtectedEditInventoryItem = () => (
  <ProtectedRoute>
    <EditInventoryItem />
  </ProtectedRoute>
);

const ProtectedInventoryReport = () => (
  <ProtectedRoute>
    <InventoryReport />
  </ProtectedRoute>
);

const ProtectedBillGeneratorWithInventory = () => (
  <ProtectedRoute>
    <BillGeneratorWithInventory />
  </ProtectedRoute>
);

// Admin protected routes for Bike Models
const ProtectedBikeModelList = () => (
  <ProtectedRoute>
    <BikeModelList />
  </ProtectedRoute>
);

const ProtectedBikeModelForm = () => (
  <ProtectedRoute>
    <BikeModelForm />
  </ProtectedRoute>
);

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider> {/* Wrap with ThemeProvider */}
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"> {/* Added dark mode background */}
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route path="/" element={<ProtectedDashboard />} />

              {/* Bill routes */}
              <Route path="/bills" element={<ProtectedBillList />} />
              <Route path="/bills/new" element={<ProtectedBillGenerator />} />
              <Route path="/bills/new-with-inventory" element={<ProtectedBillGeneratorWithInventory />} />
              <Route path="/bills/:id" element={<ProtectedBillView />} />
              <Route path="/bills/:id/convert" element={<ProtectedBillConversion />} />
              <Route path="/bills/:id/edit" element={<ProtectedBillEdit />} />

              {/* Inventory routes */}
              <Route path="/inventory" element={<ProtectedInventoryList />} />
              <Route path="/inventory/add" element={<ProtectedAddInventoryItem />} />
              <Route path="/inventory/batch" element={<ProtectedBatchAddInventory />} />
              <Route path="/inventory/edit/:id" element={<ProtectedEditInventoryItem />} />
              <Route path="/inventory/report" element={<ProtectedInventoryReport />} />

              {/* Admin Bike Model Routes */}
              <Route path="/admin/bike-models" element={<ProtectedBikeModelList />} />
              <Route path="/admin/bike-models/new" element={<ProtectedBikeModelForm />} />
              <Route path="/admin/bike-models/edit/:id" element={<ProtectedBikeModelForm />} />
            </Routes>
          </main>

          <footer className="bg-gray-100 dark:bg-gray-800 py-4 text-center text-gray-600 dark:text-gray-400 text-sm mt-auto border-t border-gray-200 dark:border-gray-700">
            <p>Made with ❤️ by Uminda <a href="https://github.com/Spyboss" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">@uhadev</a></p>
          </footer>

          <Toaster position="top-right" />
          </div>
        </ThemeProvider> {/* Close ThemeProvider */}
      </AuthProvider>
    </Router>
  )
}

export default App
