# ADMIN PANEL - COMPLETE TASK DESIGN & IMPLEMENTATION PLAN

## Project Overview
**SocialEarn Admin Dashboard** - Comprehensive panel for managing campaigns, users, finances, content, and platform settings.

---

## 📊 ADMIN PANEL STRUCTURE

### 1. **STRATEGIC INSIGHTS**
---

#### 1.1 Control Center (Dashboard)
**Path:** `/admin`  
**Status:** ✅ Exists (`AdminDashboard.jsx`)

**Current Features:**
- Stats cards (overview metrics)
- Timeline of recent events
- User activity chart
- Participation trends

**Design Process:**
```
1. Header: Title + Subtitle + Refresh button
2. KPI Stats Row: 4 key metrics with icons
3. Main Grid (2 sections):
   - Left: Event timeline or activity feed
   - Right: Charts/graphs
```

**Next Steps:**
- [ ] Add real-time data sync
- [ ] Add drill-down on metrics (click to filter)
- [ ] Add export reports functionality

---

## 💬 SOCIAL & MODERATION
---

#### 2.1 Identity Intelligence (User Management)
**Path:** `/admin/users`  
**Status:** ✅ Exists (`UserManagement.jsx`)

**UI Process:**
```
1. PageHeader: Title + Search + Filter
2. Stats Section: Total Users | Verified | Suspicious | Banned
3. Data Table:
   - Columns: Avatar | Name | Email | KYC | Status | Actions
   - Row actions: View Detail | Ban | Verify | Edit
4. Side Panel: 
   - When row clicked → show user detail card
   - Fields: Profile | Wallet | History | Flags
   - Buttons: Ban User | Verify KYC | Mark Suspicious
```

**Features to implement:**
- [x] User detail page (`EditUser.jsx` exists and enhanced with edit/create functionality)
- [x] Ability to open edit form from table or detail panel
- [x] Dedicated create‑user page (`/admin/users/new`)
- [ ] Bulk KYC verification
- [ ] User ban/unban with reason
- [ ] Activity timeline per user
- [ ] Wallet/transaction history link

**Form Fields Needed:**
```
- Search by: name, email, user_id, wallet_address
- Filters: KYC status, ban status, created_date, last_active
- Actions: View detail, Edit profile, approve KYC, flag suspicious, ban
```

---

#### 2.2 Content Control
**Path:** `/admin/content`  
**Status:** ✅ Exists (`ContentControl.jsx`)

**UI Process:**
```
1. PageHeader: Title + "Pending Approval" count badge
2. Approval Queue Section:
   - List pending posts/content items
   - Each card shows: content preview | author | timestamp | actions
   - Quick actions: [TickIcon] Approve | [XIcon] Reject | [EyeIcon] Preview
3. Moderation Detail Modal (when approved/rejected):
   - Content preview
   - Metadata (author, date, category)
   - Audit log (who approved, when)
4. Filters: Status (Pending|Approved|Rejected) | Category | Date
```

**Features to implement:**
- [ ] Content preview modal
- [ ] Rejection reason tracking
- [ ] Bulk approve/reject
- [ ] Auto-flag for policy violations (AI integration)
- [ ] Content archive/history

---

#### 2.3 NFT Moderation
**Path:** `/admin/nfts`  
**Status:** ✅ Exists (`NFTModeration.jsx`)

**UI Process:**
```
1. PageHeader: Title + Search + Filter
2. NFT Registry Table:
   - Columns: NFT Image | Name | Creator | Blockchain Status | Actions
   - Row click → detail panel
3. Detail Panel:
   - NFT image preview
   - Metadata: contract address | chain | owner | mint_date
   - Verification status toggle
   - Actions: Verify | Suspend | View on Chain
```

**Features to implement:**
- [ ] On-chain verification (blockchain check)
- [ ] Metadata validator
- [ ] Rarity checker
- [ ] Suspicious pattern detection
- [ ] Suspension reason tracking

---

#### 2.4 Protocol Voting
**Path:** `/admin/voting`  
**Status:** ✅ Exists (`VotingManagement.jsx`)

**UI Process:**
```
1. PageHeader: Title + Active Polls badge
2. Voting Sessions Table:
   - Columns: Question | Total Votes | Yes% | No% | Status | Ends In
3. Session Detail:
   - Poll question & options
   - Real-time vote distribution (progress bars)
   - Voter list (anonymized or detailed)
   - Override/close voting button
4. Create Poll Modal:
   - Question input
   - Add options (text inputs)
   - Duration selector
   - Submit button
```

**Features to implement:**
- [ ] Create new poll
- [ ] Real-time vote updates
- [ ] Close poll early
- [ ] View voter details
- [ ] Poll results export
- [ ] Weighted voting (by role/tier)

---

## 🎯 BRAND & CAMPAIGNS
---

#### 3.1 Campaign Management
**Path:** `/admin/campaigns`  
**Status:** ✅ Exists (`CampaignManagement.jsx`)

**UI Process:**

**A. Campaign List Page:**
```
1. Header: Title + "Deploy Protocol" button
2. KPI Stats Row:
   - Live Mandates | Liquidity Pool | Node Traffic | Success Ratio
3. Main Grid (80/20 split):
   LEFT (80%):
   - Data Table: Campaign | Allocation | Progress Bar | Status | Actions
   - Columns clickable → detail panel
   - Inline actions: Edit | More options
   
   RIGHT (20%):
   - Selected Campaign Detail Card
   - Shows: Title | Brand | Budget | Participants
   - Buttons: Edit | Suspend | Resume | Details
   - Real-time telemetry chart
   - Integrity metrics (fraud detection)
```

**B. Campaign Creation/Edit (Separate Pages):**
```
New campaign creation lives at `/admin/campaigns/new` (wizard page).
Editing an existing campaign uses `/admin/campaigns/edit/:id`.

Form Sections (wizard steps):
├─ Basic Info
│  ├─ Campaign Title (text)
│  ├─ Brand Authority (text/dropdown)
│  ├─ Allocated Budget (number)
│  └─ Termination Date (date picker)
├─ Campaign Tasks
│  ├─ Task 1: Task Name | Description | Reward | Instructions
│  ├─ Task 2: (add more)
│  └─ + Add New Task Button
├─ Ad Creatives
│  ├─ Upload images/videos
│  ├─ Preview gallery
│  └─ Set primary creative
├─ Targeting & Rules
│  ├─ Target audience filters
│  ├─ Participation limits
│  └─ Blacklist users
├─ Completion Progress tracker
├─ Status selector (Draft|Active|Paused|Completed)
└─ Submit/Save/Cancel buttons
```

**Features to implement:**
- [ ] Task builder (add multiple tasks)
- [ ] Creative asset upload & preview
- [ ] Audience targeting rules
- [ ] Budget allocation across tasks
- [ ] Campaign duplication
- [ ] Batch edit campaigns
- [ ] Campaign schedule (start/end dates)

---

#### 3.2 Advertiser Portal (Phase 2)
**Path:** `/admin/advertisers`  
**Status:** 🟡 Placeholder (needs build)

**UI Process:**
```
Future Design:
1. Advertiser Onboarding
   - Registration form for brands
   - Account verification
   - API key generation

2. Advertiser Dashboard
   - My Campaigns list
   - Quick stats
   - Recent activity

3. Campaign Builder (Self-Service)
   - Step-by-step wizard
   - Preview

4. Analytics Dashboard
   - Campaign performance
   - ROI calculator
   - Participant feedback

5. Payout Management
   - Invoice tracking
   - Payment history
   - Tax documents
```

---

## 💰 REWARDS & FINANCE
---

#### 4.1 Vault Overview
**Path:** `/admin/wallet`  
**Status:** ✅ Exists (`WalletOverview.jsx`)

**UI Process:**
```
1. Header: Title + Balance display
2. Stats Section:
   - Total Balance | Locked | Available | 24h Change
3. Transaction History Table:
   - Columns: Date | Type | Amount | From/To | Hash | Status
4. Fund Management Buttons:
   - Deposit | Withdraw | Transfer
5. Charts:
   - Balance over time
   - Transaction volume
```

**Features to implement:**
- [ ] Multi-wallet support
- [ ] Balance reconciliation
- [ ] Transaction filtering/search
- [ ] Blockchain explorer link
- [ ] Emergency fund freeze button

---

#### 4.2 Withdrawal Approvals
**Path:** `/admin/withdrawals`  
**Status:** ✅ Exists (`FinancialManagement.jsx`)

**UI Process:**
```
1. Header: Badge showing pending withdrawals count
2. Withdrawal Queue:
   - Table: User | Amount | Wallet Addr | Status | Requested Date | Actions
   - Filters: Status (Pending|Approved|Rejected)
3. Row Click → Detail Panel:
   - User info card
   - Withdrawal details
   - Compliance checks (KYC, fraud flags)
   - Action buttons: Approve | Reject (with reason)
4. Edit Settlement (`EditSettlement.jsx`):
   - Review amounts
   - Adjust if needed
   - Add notes/comments
   - Final approval
```

**Features to implement:**
- [ ] Auto-compliance checks
- [ ] Bulk approve/reject
- [ ] Transaction broadcast to blockchain
- [ ] Withdrawal history per user
- [ ] Refund tracking
- [ ] Fee calculation display

---

#### 4.3 Gift Controls
**Path:** `/admin/gifts`  
**Status:** ✅ Exists (`FinancialManagement.jsx`, `CreateGift.jsx`, `GiftTrash.jsx`)

**UI Process:**

**A. Gift List (Manage Assets):**
```
1. Header: "Deploy New Asset" button
2. Active Gifts Table:
   - Columns: Gift Icon | Name | Value | Total Given | Status | Actions
   - Inline actions: Edit | Toggle Active | Trash
3. Filters/Search by: Name, Value, Status
4. Import existing gifts from API
```

**B. Create Gift Form:**
```
├─ Gift Details
│  ├─ Gift Name (text)
│  ├─ Description (textarea)
│  ├─ Gift Value/$USD Amount (number)
│  ├─ Category (dropdown: coins|badges|nfts|vouchers)
│  └─ Upload Gift Icon/Image
├─ Distribution Rules
│  ├─ Max gifts per user
│  ├─ Daily limit
│  └─ Eligibility criteria
├─ Redemption Settings
│  ├─ Expiry date
│  ├─ Redemption methods
│  └─ Partner wallet address (for NFTs)
└─ Submit button
```

**C. Gift Trash/Archive:**
```
- List deleted gifts
- Permanent delete button (with confirmation)
- Restore gift button
```

**Features to implement:**
- [ ] Gift preview before creating
- [ ] Bulk gift creation
- [ ] Gift cloning (duplicate existing)
- [ ] Usage statistics per gift
- [ ] Gift redemption tracking

---

#### 4.4 Financial Rules (Platform Settings)
**Path:** `/admin/financials` or `/admin/settings/financial`  
**Status:** ✅ Exists (`FinancialRules.jsx`)

**UI Process:**
```
1. Header: Title + Reset/Commit buttons
2. Form Sections:
   ├─ Commission Settings
   │  └─ App Commission % input
   ├─ Withdrawal Limits
   │  └─ Min Withdrawal (USD) input
   ├─ Voting Limits
   │  └─ Max Votes per User per Day input
   ├─ Gift Limits
   │  └─ Max Gifts per Minute input
   └─ Buttons: Reset | Commit Changes
3. Warning: "Changes affect all nodes"
```

**No additional features needed** - form is complete.

---

## 🛡️ TRUST & SAFETY
---

#### 5.1 Fraud Monitoring
**Path:** `/admin/fraud`  
**Status:** ✅ Exists (`FraudMonitoring.jsx`)

**UI Process:**
```
1. Header: Title + Refresh button
2. Risk Stats Section:
   - Critical Alerts | High Risk | Medium Risk | Clean Users
3. Alert Queue:
   - Table: User | Alert Type | Risk Score | Detected | Actions
   - Status indicators: Red (critical), Orange (high), Yellow (medium)
4. Alert Detail Modal:
   - Suspicious activity description
   - User profile summary
   - Recommended actions
   - Buttons: Block User | Override Score | Mark OK | Investigate
5. Fraud Patterns Chart:
   - Show types of fraud detected
   - Timeline of incidents
```

**Features to implement:**
- [ ] Machine learning fraud detection
- [ ] User behavior analysis
- [ ] IP/device fingerprinting
- [ ] Blacklist management
- [ ] Appeal process for users
- [ ] Fraud report export
- [ ] Real-time alerting

---

#### 5.2 Audit Logs (Trust & Safety + Public)
**Path:** `/admin/audit` (Admin) + `/transparency/logs` (Public)  
**Status:** ✅ Exists (`AuditLogs.jsx`)

**UI Process:**
```
1. Header: Title + Sync Explorer button
2. Stats Section:
   - Blockchain Health | Unverified Records | Live Events/hr | Total Records
3. Log Table:
   - Columns: Timestamp | Event Detail | Actor | Status | Hash | Links
   - Filters: Event type, Actor, Status, Date range
4. Detail View (click row):
   - Full transaction data
   - JSON view
   - Blockchain verification link
5. Export Options:
   - CSV | JSON | PDF
```

**No additional features needed** - audit logging is complete.

---

## ⚙️ INFRASTRUCTURE
---

#### 6.1 Platform Settings (Modular)
**Path:** `/admin/settings`  
**Status:** ✅ Exists (5 sub-pages)

**A. Financial Rules** (`/admin/settings/financial`)
- App Commission %
- Min Withdrawal USD
- Max Votes per Day
- Max Gifts per Minute

**B. Security & Access** (`/admin/settings/security`)
- Maintenance Mode toggle
- Global KYC Mandate toggle

**C. Network Config** (`/admin/settings/network`)
- Placeholder (coming soon)

**D. Notification Logic** (`/admin/settings/notifications`)
- Placeholder (coming soon)

**E. Automation Hooks** (`/admin/settings/automation`)
- Placeholder (coming soon)

**Design Pattern:**
```
Each page follows:
1. Header with title + Reset/Commit buttons
2. Form sections grouped by function
3. Input fields with descriptions
4. Warning message at bottom
5. Consistent styling
```

**Features to implement for future tabs:**
- [ ] Notification triggers (in D)
- [ ] Webhook configuration (in E)
- [ ] API endpoint management (in C)
- [ ] Rate limiting rules (in C)
- [ ] Email template editor (in D)

---

#### 6.2 System Communications
**Path:** `/admin/notifications`  
**Status:** ✅ Exists (`NotificationManagement.jsx`)

**UI Process:**
```
1. Header: Title + "Send Notification" button
2. Notification Template Library
   - List of pre-made templates
   - Edit | Clone | Delete options
3. Notification Broadcast Modal:
   - Message text editor (rich text)
   - Recipient filter (all users | segment | specific)
   - Scheduling:
     - Send now
     - Schedule for later (date/time picker)
   - Preview
   - Send button
4. Notification History:
   - Sent notifications log
   - Open rates
   - Click rates
```

**Features to implement:**
- [ ] Rich text editor (bold, italic, links, images)
- [ ] Template variables ({{username}}, {{points}}, etc.)
- [ ] A/B testing support
- [ ] Delivery status tracking
- [ ] Notification scheduling queue
- [ ] Multi-language support

---

## 🌐 PUBLIC TRANSPARENCY
---

#### 7.1 Public Audit Portal
**Path:** `/transparency`  
**Status:** ✅ Scaffolded (needs design polish)

**Sub-pages:**

**A. Winner Announcements** (`/transparency/winners`)
```
Design:
1. Header: "Recent Winners"
2. Campaign results cards:
   - Campaign name | date
   - Winner count
   - Prize amount
   - View details link
3. Full results modal:
   - Winner list with amounts
   - Proof of distribution
   - Blockchain hash
```

**B. Voting Statistics** (`/transparency/voting`)
```
Design:
1. Active polls list
2. For each poll:
   - Question
   - Vote distribution pie chart
   - Participation count
   - Time remaining
3. Historical poll results
4. Stats: Total votes cast, Participation rate
```

**C. Public Audit Logs** (`/transparency/logs`)
```
Design:
- Filtered version of admin audit logs
- Show only important events (not sensitive data)
- Transaction hashes for verification
- Blockchain explorer links
```

**Features to implement:**
- [ ] Winner certificate generation (PDF)
- [ ] Voting results visualization
- [ ] Blockchain verification UI
- [ ] Real-time updates via WebSocket
- [ ] CSV export for results
- [ ] Public API endpoint for transparency data

---

## 🎨 DESIGN SYSTEM CHECKLIST

### Used Components:
- ✅ `AdminPageHeader` - Page title, subtitle, action buttons
- ✅ `AdminStatCard` - KPI metric cards
- ✅ `AdminDataTable` - Data grid with sorting/filtering
- ✅ Modals (Framer Motion)
- ✅ Forms (React Hook Form ready)
- ✅ Toast notifications (Zustand store)
- ✅ Loading states (spinners, skeleton)
- ✅ Sidebar with nested menus
- ✅ Status badges (colors: emerald, amber, rose, primary)

### Design Patterns:
```
Layout Grid:
- Page header + actions (top)
- Stats row (KPIs)
- Main content (2-3 columns)
- Side panels (detail/preview)

Form Pattern:
- Label + input fields
- Group related fields
- Action buttons (Submit, Cancel, Reset)
- Validation feedback

Table Pattern:
- Header row with icons
- Sortable columns
- Row click → detail panel
- Inline actions (edit, delete, more)
- Filters above table
```

---

## 📋 IMPLEMENTATION PRIORITY

### PHASE 1: MVP (Done/In Progress)
- [x] Dashboard overview
- [x] User management (basic)
- [x] Campaign management
- [x] Audit logs
- [x] Withdrawal approvals
- [x] Gift management
- [x] Platform settings
- [x] Public transparency stub

### PHASE 2: Enhancement
- [ ] Fraud detection AI
- [ ] Real-time notifications
- [ ] Advertiser self-service portal
- [ ] Advanced analytics & reporting
- [ ] Notification template system
- [ ] API management UI

### PHASE 3: Advanced
- [ ] Multi-language support
- [ ] Role-based access control (RBAC)
- [ ] Batch operations
- [ ] Webhook integrations
- [ ] Advanced compliance tools
- [ ] Machine learning insights

---

## 🔧 DATABASE/API MAPPING

| Page | API Endpoints Needed |
|------|---------------------|
| Dashboard | GET /api/admin/statistics |
| Users | GET/POST/PATCH /api/admin/users |
| Content | GET/POST /api/admin/content (approve/reject) |
| NFTs | GET/PATCH /api/admin/nfts (verify) |
| Voting | GET/POST /api/admin/polls |
| Campaigns | GET/POST/PATCH /api/admin/campaigns |
| Withdrawals | GET/PATCH /api/admin/withdrawals (approve/reject) |
| Gifts | GET/POST/DELETE /api/admin/gifts |
| Settings | GET/PATCH /api/admin/settings |
| Fraud | GET /api/admin/fraud-alerts |
| Audit | GET /api/admin/audit-logs |
| Notifications | GET/POST /api/admin/notifications |

---

## ✨ Ready to Build
Pick any section and I'll create:
- Full form components
- Data integration with Zustand store
- API service layer
- Error handling & validation
- Real-time updates (if needed)
