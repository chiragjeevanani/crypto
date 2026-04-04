import { useEffect } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { useFeedStore } from '../../store/useFeedStore'
import { getSocket } from '../../../../socket'

export default function SocketHandler() {
    const { profile, isAuthenticated, authChecked } = useUserStore()
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

        socket.on('connect', onReconnect)
        socket.on('reconnect', onReconnect)
        socket.on('notification', onNotification)
        socket.on('notification_broadcast', onBroadcast)

        return () => {
            socket.off('connect', onReconnect)
            socket.off('reconnect', onReconnect)
            socket.off('notification', onNotification)
            socket.off('notification_broadcast', onBroadcast)
        }
    }, [profile?.id, isAuthenticated, authChecked, addLiveNotification])

    return null
}
