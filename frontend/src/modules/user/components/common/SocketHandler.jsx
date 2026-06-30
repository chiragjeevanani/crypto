import { useEffect } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { useFeedStore } from '../../store/useFeedStore'
import { useCallStore } from '../../store/useCallStore'
import { useWalletStore } from '../../store/useWalletStore'
import { getSocket } from '../../../../socket'

export default function SocketHandler() {
    const { profile, isAuthenticated, authChecked, logout, updateReferralCount } = useUserStore()
    const { addLiveNotification } = useFeedStore()

    useEffect(() => {
        if (!authChecked || !isAuthenticated || !profile?.id) return

        const socket = getSocket()
        if (!socket.connected) socket.connect()

        // Register user for private socket events
        socket.emit('register_user', profile.id)

        const onReconnect = () => {
             socket.emit('register_user', profile.id)
        }

        // Handle force logout (when account is deleted)
        const onForceLogout = (data) => {
            console.log('[Socket] Force logout triggered:', data?.reason)
            logout()
            window.location.href = '/signin'
        }

        // Handle private notifications (only for this user)
        const onNotification = (payload) => {
            if (payload && payload.id) {
                addLiveNotification(payload)
            }
        }

        // Handle global broadcast notifications (Golden Heart, premium gifts ≥ ₹5)
        const onBroadcast = (payload) => {
            if (payload && payload.id) {
                addLiveNotification(payload)
            }
        }

        // --- Call Signaling ---
        const onIncomingCall = (data) => {
            // data: { callerData, channelName, callType }
            useCallStore.getState().setIncomingCall(data)
        }

        const onCallAccepted = (data) => {
            // data: { channelName }
            const store = useCallStore.getState()
            if (store.outgoingCall && store.outgoingCall.channelName === data.channelName) {
                store.setActiveCall({
                    channelName: data.channelName,
                    callType: store.outgoingCall.callType,
                    otherUserId: store.outgoingCall.receiverData.id
                })
            }
        }

        const onCallRejected = () => {
            useCallStore.getState().clearCall()
        }

        const onCallEnded = () => {
            useCallStore.getState().clearCall()
        }

        const onNewNftOffer = (payload) => {
            if (payload && payload.collectibleId) {
                addLiveNotification({
                    id: Date.now(),
                    type: 'system',
                    title: 'New NFT Offer!',
                    subtitle: `You received a new offer on your NFT.`,
                    createdAt: new Date().toISOString()
                })
                window.dispatchEvent(new CustomEvent('nft-offer-received', { detail: payload }))
            }
        }

        const onReferralCountUpdate = (payload) => {
            if (payload && typeof payload.referralCount === 'number') {
                updateReferralCount(payload.referralCount)
            }
        }

        const onWithdrawalUpdate = (payload) => {
            console.log('[Socket] Withdrawal status updated in real-time:', payload)
            // Auto reload wallet balances and transaction activity
            useWalletStore.getState().loadWallet()
            useWalletStore.getState().loadTransactions()
        }

        socket.on('connect', onReconnect)
        socket.on('reconnect', onReconnect)
        socket.on('notification', onNotification)
        socket.on('notification_broadcast', onBroadcast)
        socket.on('new_nft_offer', onNewNftOffer)
        socket.on('force_logout', onForceLogout)
        socket.on('referral_count_update', onReferralCountUpdate)
        socket.on('withdrawal_update', onWithdrawalUpdate)
        
        socket.on('incoming_call', onIncomingCall)
        socket.on('call_accepted', onCallAccepted)
        socket.on('call_rejected', onCallRejected)
        socket.on('call_ended', onCallEnded)

        return () => {
            socket.off('connect', onReconnect)
            socket.off('reconnect', onReconnect)
            socket.off('notification', onNotification)
            socket.off('notification_broadcast', onBroadcast)
            socket.off('new_nft_offer', onNewNftOffer)
            socket.off('force_logout', onForceLogout)
            socket.off('referral_count_update', onReferralCountUpdate)
            socket.off('withdrawal_update', onWithdrawalUpdate)
            
            socket.off('incoming_call', onIncomingCall)
            socket.off('call_accepted', onCallAccepted)
            socket.off('call_rejected', onCallRejected)
            socket.off('call_ended', onCallEnded)
        }
    }, [profile?.id, isAuthenticated, authChecked, addLiveNotification, logout, updateReferralCount])

    return null
}
