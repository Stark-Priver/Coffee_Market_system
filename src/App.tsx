import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { FeedbackForm } from './pages/FeedbackForm'
import { FeedbackRecords } from './pages/FeedbackRecords'
import { Profile } from './pages/Profile'
import { SendMessage } from './pages/SendMessage'
import { MessageHistory } from './pages/MessageHistory'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-coffee-50 to-coffee-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <Layout>
                  <FeedbackForm />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute>
                <Layout>
                  <FeedbackRecords />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/send-message" element={
              <ProtectedRoute>
                <Layout>
                  <SendMessage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/message-history" element={
              <ProtectedRoute>
                <Layout>
                  <MessageHistory />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App