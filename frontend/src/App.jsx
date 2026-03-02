import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './modules/user/layouts/AppShell'
import HomePage from './modules/user/pages/HomePage'
import TasksPage from './modules/user/pages/TasksPage'
import CreatePage from './modules/user/pages/CreatePage'
import WalletPage from './modules/user/pages/WalletPage'
import ProfilePage from './modules/user/pages/ProfilePage'
import UserProfilePage from './modules/user/pages/UserProfilePage'
import TermsConditionsPage from './modules/user/pages/TermsConditionsPage'
import PrivacyPolicyPage from './modules/user/pages/PrivacyPolicyPage'
import CommunityGuidelinesPage from './modules/user/pages/CommunityGuidelinesPage'
import { useUserStore } from './modules/user/store/useUserStore'
import { useEffect } from 'react'

// Admin Modules
import AdminLayout from './modules/admin/layouts/AdminLayout'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
import CampaignManagement from './modules/admin/pages/CampaignManagement'
import ContentControl from './modules/admin/pages/ContentControl'
import ContentDetailPage from './modules/admin/pages/ContentDetailPage'
import CategoryManagementPage from './modules/admin/pages/CategoryManagementPage'
import FinancialManagement from './modules/admin/pages/FinancialManagement'
import GiftListPage from './modules/admin/pages/GiftListPage'
import UserManagement from './modules/admin/pages/UserManagement'
import AuditLogs from './modules/admin/pages/AuditLogs'
import NFTModeration from './modules/admin/pages/NFTModeration'
import VotingManagement from './modules/admin/pages/VotingManagement'
import FraudMonitoring from './modules/admin/pages/FraudMonitoring'
import PlatformSettings from './modules/admin/pages/PlatformSettings'
import FinancialRules from './modules/admin/pages/FinancialRules'
import SecurityAccess from './modules/admin/pages/SecurityAccess'
import NetworkConfig from './modules/admin/pages/NetworkConfig'
import WalletOverview from './modules/admin/pages/WalletOverview'
import EditUser from './modules/admin/pages/EditUser'
import EditSettlement from './modules/admin/pages/EditSettlement'
import EditCampaign from './modules/admin/pages/EditCampaign'
import GiftTrash from './modules/admin/pages/GiftTrash'
import CreateGift from './modules/admin/pages/CreateGift'
import CampaignCreatePage from './modules/admin/pages/CampaignCreatePage'
import AdvertiserPanel from './modules/admin/pages/AdvertiserPanel'
// Public transparency pages
import TransparencyPortal from './modules/public/pages/TransparencyPortal'
import WinnerAnnouncements from './modules/public/pages/WinnerAnnouncements'
import VotingStats from './modules/public/pages/VotingStats'
import PublicAuditLogs from './modules/public/pages/PublicAuditLogs'

// Auth Modules
import LoginPage from './modules/auth/pages/LoginPage' // admin login
import LogoutPage from './modules/auth/pages/LogoutPage'
import ProtectedRoute from './modules/auth/components/ProtectedRoute'
import UserCreatePage from './modules/admin/pages/UserCreatePage'

// user module auth
import SignInPage from './modules/user/pages/SignInPage'
import SignUpPage from './modules/user/pages/SignUpPage'

export default function App() {
  const { darkMode } = useUserStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />
        {/* user auth */}
        <Route path="/" element={<SignInPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        {/* redirect legacy login to admin login */}
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />

        <Route path="/*" element={<AppShell />}>
          {/* removed auto-redirect so landing stays visible until user navigates or logs in */}
          <Route path="home" element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="user/:userId" element={<UserProfilePage />} />
          <Route path="terms" element={<TermsConditionsPage />} />
          <Route path="privacy" element={<PrivacyPolicyPage />} />
          <Route path="guidelines" element={<CommunityGuidelinesPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/edit/:userId" element={<EditUser />} />
            <Route path="users/new" element={<UserCreatePage />} />
            <Route path="content" element={<ContentControl />} />
            <Route path="content/:postId" element={<ContentDetailPage />} />
            <Route path="categories" element={<CategoryManagementPage />} />
            <Route path="campaigns" element={<CampaignManagement />} />
            <Route path="campaigns/new" element={<CampaignCreatePage />} />
            <Route path="campaigns/edit/:campaignId" element={<EditCampaign />} />
            <Route path="voting" element={<VotingManagement />} />
            <Route path="nfts" element={<NFTModeration />} />

            <Route path="wallet" element={<WalletOverview />} />
            <Route path="withdrawals" element={<FinancialManagement />} />
            <Route path="withdrawals/edit/:settlementId" element={<EditSettlement />} />
            <Route path="financials" element={<WalletOverview />} />
            <Route path="gifts" element={<GiftListPage />} />
            <Route path="gifts/create" element={<CreateGift />} />
            <Route path="gifts/trash" element={<GiftTrash />} />
            <Route path="commissions" element={<FinancialRules />} />
            <Route path="advertisers" element={<AdvertiserPanel />} />

            <Route path="fraud" element={<FraudMonitoring />} />
            <Route path="suspicious" element={<FraudMonitoring />} />
            <Route path="audit" element={<AuditLogs />} />

            {/* platform settings now split into discrete sub‑pages */}
            <Route path="settings" element={<PlatformSettings />} />
            <Route path="settings/financial" element={<FinancialRules />} />
            <Route path="settings/security" element={<SecurityAccess />} />
            <Route path="settings/network" element={<NetworkConfig />} />
            <Route path="transparency" element={<AuditLogs />} />
          </Route>
        </Route>

        {/* Public transparency (open) */}
        <Route path="/transparency" element={<TransparencyPortal />}>
          <Route index element={<Navigate to="winners" replace />} />
          <Route path="winners" element={<WinnerAnnouncements />} />
          <Route path="voting" element={<VotingStats />} />
          <Route path="logs" element={<PublicAuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
