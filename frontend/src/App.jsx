import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from './modules/user/layouts/AppShell'
import HomePage from './modules/user/pages/HomePage'
import { useUserStore } from './modules/user/store/useUserStore'
import { useWalletStore } from './modules/user/store/useWalletStore'
import { useFeedStore } from './modules/user/store/useFeedStore'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import ErrorBoundary from './modules/user/components/shared/ErrorBoundary'
import { usePushNotifications } from './hooks/usePushNotifications'

// Rarely-visited user pages — code-split out of the initial bundle
const TasksPage = lazy(() => import('./modules/user/pages/TasksPage'))
const CreatePage = lazy(() => import('./modules/user/pages/CreatePage'))
const WalletPage = lazy(() => import('./modules/user/pages/WalletPage'))
const ProfilePage = lazy(() => import('./modules/user/pages/ProfilePage'))
const UserProfilePage = lazy(() => import('./modules/user/pages/UserProfilePage'))
const TermsConditionsPage = lazy(() => import('./modules/user/pages/TermsConditionsPage'))
const PrivacyPolicyPage = lazy(() => import('./modules/user/pages/PrivacyPolicyPage'))
const ChildSafetyPolicyPage = lazy(() => import('./modules/user/pages/ChildSafetyPolicyPage'))
const SupportPage = lazy(() => import('./modules/user/pages/SupportPage'))
const CommunityGuidelinesPage = lazy(() => import('./modules/user/pages/CommunityGuidelinesPage'))
const CampaignsPage = lazy(() => import('./modules/user/pages/CampaignsPage'))
const CampaignDetailPage = lazy(() => import('./modules/user/pages/CampaignDetailPage'))
const SearchPage = lazy(() => import('./modules/user/pages/SearchPage'))
const MessagingPage = lazy(() => import('./modules/user/pages/messaging/MessagingPage'))
const NotificationsPage = lazy(() => import('./modules/user/pages/NotificationsPage'))

// Admin Modules — a regular user never visits these, so keep them out of the main bundle entirely
const AdminLayout = lazy(() => import('./modules/admin/layouts/AdminLayout'))
const AdminDashboard = lazy(() => import('./modules/admin/pages/AdminDashboard'))
const CampaignManagement = lazy(() => import('./modules/admin/pages/CampaignManagement'))
const ContentControl = lazy(() => import('./modules/admin/pages/ContentControl'))
const ContentDetailPage = lazy(() => import('./modules/admin/pages/ContentDetailPage'))
const CategoryManagementPage = lazy(() => import('./modules/admin/pages/CategoryManagementPage'))
const FinancialManagement = lazy(() => import('./modules/admin/pages/FinancialManagement'))
const GiftListPage = lazy(() => import('./modules/admin/pages/GiftListPage'))
const UserManagement = lazy(() => import('./modules/admin/pages/UserManagement'))
const AuditLogs = lazy(() => import('./modules/admin/pages/AuditLogs'))
const NFTModeration = lazy(() => import('./modules/admin/pages/NFTModeration'))
const VotingManagement = lazy(() => import('./modules/admin/pages/VotingManagement'))

const PlatformSettings = lazy(() => import('./modules/admin/pages/PlatformSettings'))
const FinancialRules = lazy(() => import('./modules/admin/pages/FinancialRules'))
const NetworkConfig = lazy(() => import('./modules/admin/pages/NetworkConfig'))
const LegalSupportSettings = lazy(() => import('./modules/admin/pages/LegalSupportSettings'))
const WalletOverview = lazy(() => import('./modules/admin/pages/WalletOverview'))
const EditUser = lazy(() => import('./modules/admin/pages/EditUser'))
const UserDetailPage = lazy(() => import('./modules/admin/pages/UserDetailPage'))
const EditSettlement = lazy(() => import('./modules/admin/pages/EditSettlement'))
const EditCampaign = lazy(() => import('./modules/admin/pages/EditCampaign'))
const GiftTrash = lazy(() => import('./modules/admin/pages/GiftTrash'))
const CreateGift = lazy(() => import('./modules/admin/pages/CreateGift'))
const CampaignCreatePage = lazy(() => import('./modules/admin/pages/CampaignCreatePage'))
const AdvertiserPanel = lazy(() => import('./modules/admin/pages/AdvertiserPanel'))
const AdminProfilePage = lazy(() => import('./modules/admin/pages/AdminProfilePage'))
const MusicManagement = lazy(() => import('./modules/admin/pages/MusicManagement'))
const GiftHistory = lazy(() => import('./modules/admin/pages/GiftHistory'))
const WalletTransactions = lazy(() => import('./modules/admin/pages/WalletTransactions'))
const PromotionSettingsPage = lazy(() => import('./modules/admin/pages/PromotionSettingsPage'))
const ReportsManagement = lazy(() => import('./modules/admin/pages/ReportsManagement'))
const KycManagement = lazy(() => import('./modules/admin/pages/KycManagement'))
const TrendingDealsManagement = lazy(() => import('./modules/admin/pages/TrendingDealsManagement'))
const AdminAuctionManagement = lazy(() => import('./modules/admin/pages/AdminAuctionManagement'))
const LocationManagement = lazy(() => import('./modules/admin/pages/LocationManagement'))
const UserCreatePage = lazy(() => import('./modules/admin/pages/UserCreatePage'))

// Public transparency pages
const TransparencyPortal = lazy(() => import('./modules/public/pages/TransparencyPortal'))
const WinnerAnnouncements = lazy(() => import('./modules/public/pages/WinnerAnnouncements'))
const VotingStats = lazy(() => import('./modules/public/pages/VotingStats'))
const PublicAuditLogs = lazy(() => import('./modules/public/pages/PublicAuditLogs'))

// Auth Modules
import LoginPage from './modules/auth/pages/LoginPage' // admin login
import LogoutPage from './modules/auth/pages/LogoutPage'
import ForgotPasswordPage from './modules/user/pages/ForgotPasswordPage'
import ProtectedRoute from './modules/auth/components/ProtectedRoute'
import RootRoute from './modules/auth/components/RootRoute'

// user module auth
import SignInPage from './modules/user/pages/SignInPage'
import SignUpPage from './modules/user/pages/SignUpPage'
import GlobalModal from './modules/user/components/common/GlobalModal'
import SocketHandler from './modules/user/components/common/SocketHandler'
// CallScreen pulls in the heavy agora-rtc-sdk-ng — keep it in its own async chunk
const CallScreen = lazy(() => import('./modules/user/components/messaging/CallScreen'))
const AuctionListingPage = lazy(() => import('./modules/auction/pages/AuctionListingPage'))
const AuctionDetailPage = lazy(() => import('./modules/auction/pages/AuctionDetailPage'))
const CreateAuctionPage = lazy(() => import('./modules/auction/pages/CreateAuctionPage'))

// Web3 NFT Pages
const NFTMarketplacePage = lazy(() => import('./modules/nft/pages/NFTMarketplacePage'))
const NFTDetailPage = lazy(() => import('./modules/nft/pages/NFTDetailPage'))
const MyNFTsPage = lazy(() => import('./modules/nft/pages/MyNFTsPage'))
const ClaimNFTPage = lazy(() => import('./modules/nft/pages/ClaimNFTPage'))

function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 animate-spin" style={{ borderTopColor: 'var(--color-primary, #f59e0b)' }} />
    </div>
  )
}

export default function App() {
  const { darkMode, initializeAuth, isAuthenticated, authChecked } = useUserStore(useShallow(state => ({
    darkMode: state.darkMode,
    initializeAuth: state.initializeAuth,
    isAuthenticated: state.isAuthenticated,
    authChecked: state.authChecked
  })))
  const { loadWallet, loadGifts } = useWalletStore(useShallow(state => ({
    loadWallet: state.loadWallet,
    loadGifts: state.loadGifts
  })))
  const fetchSavedPostIds = useFeedStore(state => state.fetchSavedPostIds)
  const { pathname } = useLocation()
  const isAdminPath = pathname.startsWith('/admin')
  const pathToken = useMemo(() => isAdminPath ? 'admin' : 'user', [isAdminPath])

  useEffect(() => {
    document.documentElement.classList.toggle('light', !darkMode)
  }, [darkMode])

  // Re-run initialization whenever the module context (admin/user) changes
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth, pathToken])

  const [pushToast, setPushToast] = useState(null)

  // Call push notification hook
  const token = useUserStore(state => state.token)
  const handlePushMessage = useCallback((message) => {
    console.log("Push Notification: ", message);
    setPushToast(message);
    setTimeout(() => setPushToast(null), 5000);
  }, []);
  usePushNotifications(token, handlePushMessage);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      fetchSavedPostIds()
      loadWallet()
      loadGifts()
    }
  }, [authChecked, isAuthenticated, fetchSavedPostIds, loadWallet, loadGifts])

    return (
      <>
        <AnimatePresence>
            {pushToast && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-8 right-8 z-[9999] max-w-sm w-full"
                >
                    <div className="p-4 rounded-xl border shadow-2xl backdrop-blur-xl bg-bg/90 border-primary/20 shadow-primary/5">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-primary">
                                    Notification
                                </h4>
                                <p className="text-[11px] font-medium text-text mt-1 leading-relaxed">
                                    {pushToast}
                                </p>
                            </div>
                            <button
                                onClick={() => setPushToast(null)}
                                className="p-1 hover:bg-surface rounded-md transition-colors text-muted"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        <GlobalModal />
        <SocketHandler />
        <Suspense fallback={null}>
          <CallScreen />
        </Suspense>
        <ErrorBoundary>
          <Suspense fallback={<RouteLoader />}>
          <Routes>
          <Route path="/admin/login" element={<LoginPage />} />
          {/* root: show home for logged-in User, admin for admin, else user sign-in (no admin here) */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/terms-conditions" element={<TermsConditionsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/child-safety" element={<ChildSafetyPolicyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          {/* redirect legacy login to admin login */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />

          {/* User app: admins are also allowed here */}
          <Route element={<ProtectedRoute allowedRoles={['User', 'SuperNode', 'Admin', 'super_admin', 'Developer']} />}>
            <Route path="/*" element={<AppShell />}>
              <Route path="home" element={<HomePage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="tasks/:taskId" element={<TasksPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:campaignId" element={<CampaignDetailPage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="messaging" element={<MessagingPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="user/:userId" element={<UserProfilePage />} />
              <Route path="guidelines" element={<CommunityGuidelinesPage />} />
              <Route path="auctions" element={<AuctionListingPage />} />
              <Route path="auctions/:id" element={<AuctionDetailPage />} />
              <Route path="auctions/create" element={<CreateAuctionPage />} />

              {/* Web3 NFT Routes */}
              <Route path="nfts" element={<NFTMarketplacePage />} />
              <Route path="nfts/:tokenId" element={<NFTDetailPage />} />
              <Route path="nfts/claim/:auctionId" element={<ClaimNFTPage />} />
              <Route path="my-collection" element={<MyNFTsPage />} />
            </Route>
          </Route>

          {/* Admin Routes: only admin roles; users with role "User" are redirected to /admin/login */}
          <Route element={<ProtectedRoute allowedRoles={['SuperNode', 'Admin', 'super_admin', 'Developer']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/view/:userId" element={<UserDetailPage />} />
              <Route path="users/edit/:userId" element={<EditUser />} />
              <Route path="users/new" element={<UserCreatePage />} />
              <Route path="kyc" element={<KycManagement />} />
              <Route path="content" element={<ContentControl />} />
              <Route path="content/:postId" element={<ContentDetailPage />} />
              <Route path="moderation" element={<Navigate to="/admin/content" replace />} />
              <Route path="categories" element={<CategoryManagementPage />} />

              <Route path="campaigns" element={<CampaignManagement />} />
              <Route path="campaigns/new" element={<CampaignCreatePage />} />
              <Route path="campaigns/edit/:campaignId" element={<EditCampaign />} />
              <Route path="voting" element={<VotingManagement />} />
              <Route path="nfts" element={<NFTModeration />} />
              <Route path="reports" element={<ReportsManagement />} />
              <Route path="deals" element={<TrendingDealsManagement />} />

              <Route path="wallet" element={<WalletOverview />} />
              <Route path="wallet/deposits" element={<WalletTransactions />} />
              <Route path="withdrawals" element={<FinancialManagement />} />
              <Route path="withdrawals/edit/:settlementId" element={<EditSettlement />} />
              <Route path="gifts" element={<GiftListPage />} />
              <Route path="gifts/history" element={<GiftHistory />} />
              <Route path="gifts/create" element={<CreateGift />} />
              <Route path="gifts/trash" element={<GiftTrash />} />
              <Route path="advertisers" element={<AdvertiserPanel />} />

              <Route path="audit" element={<AuditLogs />} />


              {/* platform settings now split into discrete sub‑pages */}
              <Route path="settings" element={<PlatformSettings />} />
              <Route path="settings/financial" element={<FinancialRules />} />
              <Route path="settings/promotion" element={<PromotionSettingsPage />} />
              <Route path="settings/network" element={<NetworkConfig />} />
              <Route path="settings/legal" element={<LegalSupportSettings />} />
              <Route path="transparency" element={<AuditLogs />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="music" element={<MusicManagement />} />
              <Route path="auctions" element={<AdminAuctionManagement />} />
              <Route path="locations" element={<LocationManagement />} />
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
          </Suspense>
      </ErrorBoundary>
  </>

  )
}
