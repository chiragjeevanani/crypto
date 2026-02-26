import { Outlet } from 'react-router-dom'
import BottomNavbar from '../components/shared/BottomNavbar'
import CoinRain from '../components/shared/CoinRain'
import RoseShower from '../components/shared/RoseShower'

export default function AppShell() {
    return (
        <div
            className="relative flex flex-col h-screen w-full max-w-[430px] mx-auto overflow-hidden"
            style={{ background: 'var(--color-bg)' }}
        >
            {/* Page content scrolls inside here */}
            <main className="flex-1 overflow-y-auto hide-scrollbar pb-safe">
                <Outlet />
            </main>

            {/* Sticky bottom nav */}
            <BottomNavbar />

            {/* GSAP celebration overlays */}
            <CoinRain />
            <RoseShower />
        </div>
    )
}
