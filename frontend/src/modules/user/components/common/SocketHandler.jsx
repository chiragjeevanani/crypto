import { useEffect } from 'react'
import { useUserStore } from '../../store/useUserStore'
import { getSocket } from '../../../../socket'

export default function SocketHandler() {
    const { profile, isAuthenticated, authChecked } = useUserStore()

    useEffect(() => {
        if (!authChecked || !isAuthenticated || !profile?.id) return

        const socket = getSocket()
        if (!socket.connected) socket.connect()

        // Register user for private notifications
        socket.emit('register_user', profile.id)

        const onReconnect = () => {
             socket.emit('register_user', profile.id)
        }

        socket.on('connect', onReconnect)
        socket.on('reconnect', onReconnect)

        return () => {
            socket.off('connect', onReconnect)
            socket.off('reconnect', onReconnect)
        }
    }, [profile?.id, isAuthenticated, authChecked])

    return null
}
