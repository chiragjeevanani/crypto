import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './modules/user/layouts/AppShell'
import HomePage from './modules/user/pages/HomePage'
import TasksPage from './modules/user/pages/TasksPage'
import CreatePage from './modules/user/pages/CreatePage'
import WalletPage from './modules/user/pages/WalletPage'
import ProfilePage from './modules/user/pages/ProfilePage'
import UserProfilePage from './modules/user/pages/UserProfilePage'
import { useUserStore } from './modules/user/store/useUserStore'
import { useEffect } from 'react'

export default function App() {
  const { darkMode } = useUserStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
