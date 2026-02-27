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

// Admin Modules
import AdminLayout from './modules/admin/layouts/AdminLayout'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
import CampaignManagement from './modules/admin/pages/CampaignManagement'
import ContentControl from './modules/admin/pages/ContentControl'
import FinancialManagement from './modules/admin/pages/FinancialManagement'
import UserManagement from './modules/admin/pages/UserManagement'
import AuditLogs from './modules/admin/pages/AuditLogs'
import NFTModeration from './modules/admin/pages/NFTModeration'
import VotingManagement from './modules/admin/pages/VotingManagement'
import FraudMonitoring from './modules/admin/pages/FraudMonitoring'
import PlatformSettings from './modules/admin/pages/PlatformSettings'
import WalletOverview from './modules/admin/pages/WalletOverview'
import NotificationManagement from './modules/admin/pages/NotificationManagement'
import EditUser from './modules/admin/pages/EditUser'
import EditSettlement from './modules/admin/pages/EditSettlement'
import EditCampaign from './modules/admin/pages/EditCampaign'
import GiftTrash from './modules/admin/pages/GiftTrash'
import CreateGift from './modules/admin/pages/CreateGift'

// Auth Modules
import LoginPage from './modules/auth/pages/LoginPage'
import LogoutPage from './modules/auth/pages/LogoutPage'
import ProtectedRoute from './modules/auth/components/ProtectedRoute'

export default function App() {
  const { darkMode } = useUserStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/edit/:userId" element={<EditUser />} />
            <Route path="content" element={<ContentControl />} />
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="campaigns/edit/:campaignId" element={<EditCampaign />} />
            <Route path="voting" element={<VotingManagement />} />
            <Route path="nfts" element={<NFTModeration />} />

            <Route path="wallet" element={<WalletOverview />} />
            <Route path="withdrawals" element={<FinancialManagement />} />
            <Route path="withdrawals/edit/:settlementId" element={<EditSettlement />} />
            <Route path="financials" element={<WalletOverview />} />
            <Route path="gifts" element={<FinancialManagement />} />
            <Route path="gifts/create" element={<CreateGift />} />
            <Route path="gifts/trash" element={<GiftTrash />} />
            <Route path="commissions" element={<PlatformSettings />} />

            <Route path="fraud" element={<FraudMonitoring />} />
            <Route path="suspicious" element={<FraudMonitoring />} />
            <Route path="audit" element={<AuditLogs />} />

            <Route path="settings" element={<PlatformSettings />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="transparency" element={<AuditLogs />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
