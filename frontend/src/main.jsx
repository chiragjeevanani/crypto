import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// Web3 / Privy Imports
import { PrivyProvider } from '@privy-io/react-auth'
import { polygon } from 'viem/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID || 'cmpl0yuqc000s0dl7e5f1jfjk'}
        config={{
          loginMethods: ['google', 'email'],
          appearance: {
            theme: 'dark',
            accentColor: '#EAB308', // Gold/Yellow (matches KnQ Reels theme)
            showWalletLoginFirst: false,
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          defaultChain: polygon,
          supportedChains: [polygon],
        }}
      >
        <BrowserRouter>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </BrowserRouter>
      </PrivyProvider>
    </QueryClientProvider>
  </StrictMode>,
)
