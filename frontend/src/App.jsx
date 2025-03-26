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

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/bills/new" element={<BillGenerator />} />
            <Route path="/bills/:id" element={<BillView />} />
            <Route path="/bills/:id/convert" element={<BillConversion />} />
            <Route path="/bills/:id/edit" element={<BillEdit />} />
          </Routes>
        </main>
        
        <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm mt-auto border-t border-gray-200">
          <p>Made with ❤️ by Uminda <a href="https://github.com/Spyboss" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">@uhadev</a></p>
        </footer>
        
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

export default App 