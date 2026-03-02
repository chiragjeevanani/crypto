const PHRASE_REPLACEMENTS = [
    [/Strategic Control Center/gi, 'Control Center'],
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
]

const WORD_REPLACEMENTS = [
    [/\bprotocols?\b/gi, 'rules'],
    [/\btelemetry\b/gi, 'stats'],
    [/\btopology\b/gi, 'network setup'],
    [/\bliquidation\b/gi, 'payout'],
    [/\bregistry\b/gi, 'list'],
    [/\bassets\b/gi, 'items'],
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
