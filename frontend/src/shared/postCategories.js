const CATEGORY_KEY = 'socialearn_post_categories_v2'

const DEFAULT_TREE = [
    {
        id: 'cat_music',
        name: 'Music',
        slug: 'music',
        children: [
            { id: 'cat_music_short', name: 'Short Video', slug: 'short-video', children: [] },
        ],
    },
    {
        id: 'cat_image',
        name: 'Image',
        slug: 'image',
        children: [],
    },
]

function makeId(name) {
    return `cat_${String(name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')}_${Date.now()}`
}

function normalizeNode(node) {
    return {
        id: node?.id || makeId(node?.name || 'category'),
        name: String(node?.name || '').trim() || 'Category',
        slug: String(node?.slug || '').trim() || '',
        children: Array.isArray(node?.children) ? node.children.map(normalizeNode) : [],
    }
}

function normalizeTree(tree) {
    if (!Array.isArray(tree) || !tree.length) return DEFAULT_TREE.map(normalizeNode)
    return tree.map(normalizeNode)
}

function applyMissingSlugs(tree) {
    const taken = new Set()
    function assign(nodes) {
        return (nodes || []).map((node) => {
            let slug = String(node.slug || '').trim()
            if (!slug) {
                const base = slugify(node.name)
                slug = base
                let idx = 2
                while (taken.has(slug)) {
                    slug = `${base}-${idx}`
                    idx += 1
                }
            }
            taken.add(slug)
            return {
                ...node,
                slug,
                children: assign(node.children || []),
            }
        })
    }
    return assign(tree)
}

function walk(nodes, callback, path = []) {
    nodes.forEach((node) => {
        callback(node, path)
        walk(node.children || [], callback, [...path, node])
    })
}

function updateNode(nodes, targetId, updater) {
    return nodes.map((node) => {
        if (node.id === targetId) {
            return updater(node)
        }
        return {
            ...node,
            children: updateNode(node.children || [], targetId, updater),
        }
    })
}

function slugify(value) {
    const base = String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    return base || 'category'
}

function collectSlugs(tree) {
    const taken = new Set()
    walk(tree, (node) => {
        if (node.slug) taken.add(node.slug)
    })
    return taken
}

function makeUniqueSlug(tree, name) {
    const taken = collectSlugs(tree)
    const base = slugify(name)
    if (!taken.has(base)) return base
    let idx = 2
    while (taken.has(`${base}-${idx}`)) idx += 1
    return `${base}-${idx}`
}

function readTree() {
    if (typeof window === 'undefined') return normalizeTree(DEFAULT_TREE)
    try {
        const raw = window.localStorage.getItem(CATEGORY_KEY)
        if (!raw) return applyMissingSlugs(normalizeTree(DEFAULT_TREE))
        const parsed = JSON.parse(raw)
        return applyMissingSlugs(normalizeTree(parsed))
    } catch {
        return applyMissingSlugs(normalizeTree(DEFAULT_TREE))
    }
}

function writeTree(tree) {
    if (typeof window === 'undefined') return
    const safe = applyMissingSlugs(normalizeTree(tree))
    window.localStorage.setItem(CATEGORY_KEY, JSON.stringify(safe))
    window.dispatchEvent(new CustomEvent('post-categories-updated'))
}

export function getPostCategoryTree() {
    return readTree()
}

export function addPostCategoryParent(name) {
    const nextName = String(name || '').trim()
    if (!nextName) return readTree()
    const tree = readTree()
    const next = [...tree, { id: makeId(nextName), name: nextName, slug: makeUniqueSlug(tree, nextName), children: [] }]
    writeTree(next)
    return next
}

export function addPostCategoryChild(parentId, name) {
    const nextName = String(name || '').trim()
    if (!parentId || !nextName) return readTree()
    const tree = readTree()
    const uniqueSlug = makeUniqueSlug(tree, nextName)
    const next = updateNode(tree, parentId, (node) => ({
        ...node,
        children: [...(node.children || []), { id: makeId(nextName), name: nextName, slug: uniqueSlug, children: [] }],
    }))
    writeTree(next)
    return next
}

export function renamePostCategory(categoryId, name) {
    const nextName = String(name || '').trim()
    if (!categoryId || !nextName) return readTree()
    const tree = readTree()
    const next = updateNode(tree, categoryId, (node) => ({
        ...node,
        name: nextName,
    }))
    writeTree(next)
    return next
}

export function getCategoryOptions() {
    const tree = readTree()
    const options = []
    walk(tree, (node, path) => {
        const full = [...path.map((p) => p.name), node.name].join(' > ')
        options.push({ id: node.id, name: node.name, fullPath: full })
    })
    return options
}

export function getSelectablePostCategories() {
    const tree = readTree()
    const leaf = []
    walk(tree, (node, path) => {
        const isLeaf = !(node.children && node.children.length)
        if (isLeaf) {
            leaf.push([...path.map((p) => p.name), node.name].join(' / '))
        }
    })
    return leaf.length ? leaf : ['General']
}

// Backward-compatible helpers used by older admin/user screens.
export function getPostCategories() {
    return getSelectablePostCategories()
}

export function addPostCategory(name) {
    return addPostCategoryParent(name)
}

function removeByName(nodes, name) {
    return (nodes || [])
        .filter((node) => node.name !== name)
        .map((node) => ({
            ...node,
            children: removeByName(node.children || [], name),
        }))
}

export function removePostCategory(name) {
    const nextName = String(name || '').trim()
    if (!nextName) return readTree()
    const tree = readTree()
    const next = removeByName(tree, nextName)
    writeTree(next)
    return getSelectablePostCategories()
}

function removeById(nodes, id) {
    return (nodes || [])
        .filter((node) => node.id !== id)
        .map((node) => ({
            ...node,
            children: removeById(node.children || [], id),
        }))
}

export function removePostCategoryById(categoryId) {
    const id = String(categoryId || '').trim()
    if (!id) return readTree()
    const tree = readTree()
    const next = removeById(tree, id)
    writeTree(next)
    return next
}
