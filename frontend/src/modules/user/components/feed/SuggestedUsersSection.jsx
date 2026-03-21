import { useState, useEffect } from 'react'
import { searchService } from '../../services/searchService'
import SuggestedUserCard from './SuggestedUserCard'

export default function SuggestedUsersSection({ title = "Suggested for you" }) {
    const [suggestedUsers, setSuggestedUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        searchService.getSuggestedUsers().then(res => {
            if (mounted) {
                setSuggestedUsers(res.users || [])
                setLoading(false)
            }
        }).catch(() => {
            if (mounted) setLoading(false)
        })
        return () => { mounted = false }
    }, [])

    if (!loading && suggestedUsers.length === 0) return null

    return (
        <div className="mt-4 mb-8">
            <div className="flex items-center justify-between px-4 mb-4">
                <span className="text-sm font-bold" style={{ color: 'var(--color-text-dark, #000)' }}>{title}</span>
                <button className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>See all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto px-4 pb-4 hide-scrollbar">
                {suggestedUsers.map(user => (
                    <SuggestedUserCard 
                        key={user.id} 
                        user={user} 
                        onRemove={(id) => {
                            setSuggestedUsers(prev => prev.filter(u => u.id !== id))
                            searchService.dismissSuggestedUser(id).catch(err => console.error("Dismiss failed", err))
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
