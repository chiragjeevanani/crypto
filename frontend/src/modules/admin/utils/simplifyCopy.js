const PHRASE_REPLACEMENTS = [
    [/Strategic Control Center/gi, 'Control Center'],
    [/High-fidelity telemetry for the SocialEarn reward ecosystem\./gi, 'Live platform stats for the SocialEarn rewards app.'],
    [/Security Intelligence/gi, 'Security Monitor'],
    [/Anomaly Detection Stream/gi, 'Risk Alerts'],
    [/Asset Moderation Protocol/gi, 'NFT Review'],
    [/Public Transparency/gi, 'Transparency'],
    [/System Operations Audit/gi, 'System Audit'],
    [/Broadcast Center/gi, 'Notifications'],
    [/Financial Overview/gi, 'Money Overview'],
    [/Governance & Voting/gi, 'Voting'],
    [/Brand Mandates/gi, 'Campaigns'],
    [/Gift Archives \(Trash\)/gi, 'Deleted Gifts'],
    [/Archived Assets/gi, 'Deleted Items'],
    [/Modify Settlement/gi, 'Edit Settlement'],
    [/Edit Mandate/gi, 'Edit Campaign'],
    [/DAU Proxy/gi, 'Daily Active Users'],
]

const WORD_REPLACEMENTS = [
    [/\bprotocols?\b/gi, 'rules'],
    [/\btelemetry\b/gi, 'stats'],
    [/\btopology\b/gi, 'network setup'],
    [/\bliquidation\b/gi, 'payout'],
    [/\bregistry\b/gi, 'list'],
    [/\bassets\b/gi, 'items'],
    [/\bmandates?\b/gi, 'campaigns'],
    [/\bescrowed\b/gi, 'held funds'],
    [/\blatency\b/gi, 'processing time'],
    [/\bflux\b/gi, 'activity'],
    [/\bDAU\b/gi, 'daily users'],
]

export function simplifyAdminCopy(text) {
    if (typeof text !== 'string' || !text.trim()) return text

    let simplified = text
    PHRASE_REPLACEMENTS.forEach(([pattern, replacement]) => {
        simplified = simplified.replace(pattern, replacement)
    })
    WORD_REPLACEMENTS.forEach(([pattern, replacement]) => {
        simplified = simplified.replace(pattern, replacement)
    })

    return simplified.replace(/\s{2,}/g, ' ').trim()
}
