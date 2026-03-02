import { useEffect, useMemo, useState } from 'react'
import { Plus, FolderTree, FolderPlus, ListTree, Trash2 } from 'lucide-react'
import { useAdminStore } from '../store/useAdminStore'
import {
    addPostCategoryChild,
    addPostCategoryParent,
    getCategoryOptions,
    getPostCategoryTree,
    renamePostCategory,
    removePostCategoryById,
} from '../../../shared/postCategories'

function CategoryTreeList({
    nodes,
    level = 0,
    editingId,
    editValue,
    onStartEdit,
    onEditChange,
    onSaveEdit,
    onCancelEdit,
    onDelete,
}) {
    return (
        <div className={level > 0 ? 'ml-4 border-l border-surface pl-3' : 'space-y-2'}>
            {nodes.map((node) => (
                <div key={node.id} className={level === 0 ? 'rounded-xl border border-surface bg-bg p-3' : ''}>
                    {editingId === node.id ? (
                        <div className="flex items-center gap-2">
                            <input
                                value={editValue}
                                onChange={(e) => onEditChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onSaveEdit()
                                    if (e.key === 'Escape') onCancelEdit()
                                }}
                                autoFocus
                                className="flex-1 rounded-lg border border-surface bg-white px-2 py-1 text-sm text-text outline-none"
                            />
                            <button
                                onClick={onSaveEdit}
                                className="rounded-lg bg-primary px-2 py-1 text-[10px] font-semibold text-black"
                            >
                                Save
                            </button>
                            <button
                                onClick={onCancelEdit}
                                className="rounded-lg border border-surface bg-white px-2 py-1 text-[10px] font-semibold text-text"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={() => onStartEdit(node.id, node.name)}
                                className={`${level === 0 ? 'text-sm font-semibold tracking-wide' : 'text-sm font-medium'} text-text hover:text-primary transition-colors text-left`}
                            >
                                {node.name}
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(node.id, node.name)}
                                className="rounded-md p-1 text-rose-500 hover:bg-rose-50"
                                title="Delete category"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                    {node.children?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                            <CategoryTreeList
                                nodes={node.children}
                                level={level + 1}
                                editingId={editingId}
                                editValue={editValue}
                                onStartEdit={onStartEdit}
                                onEditChange={onEditChange}
                                onSaveEdit={onSaveEdit}
                                onCancelEdit={onCancelEdit}
                                onDelete={onDelete}
                            />
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function CategoryManagementPage() {
    const { notify } = useAdminStore()
    const [tree, setTree] = useState(() => getPostCategoryTree())
    const [parentName, setParentName] = useState('')
    const [categoryName, setCategoryName] = useState('')
    const [selectedParent, setSelectedParent] = useState('')
    const [editingId, setEditingId] = useState('')
    const [editValue, setEditValue] = useState('')

    const parentOptions = useMemo(() => getCategoryOptions(), [tree])

    useEffect(() => {
        const sync = () => setTree(getPostCategoryTree())
        const onStorage = (event) => {
            if (event.key === 'socialearn_post_categories_v2') sync()
        }
        window.addEventListener('post-categories-updated', sync)
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('post-categories-updated', sync)
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    useEffect(() => {
        if (!selectedParent && parentOptions.length) {
            setSelectedParent(parentOptions[0].id)
        }
        if (selectedParent && !parentOptions.some((opt) => opt.id === selectedParent)) {
            setSelectedParent(parentOptions[0]?.id || '')
        }
    }, [parentOptions, selectedParent])

    const createParent = () => {
        const input = parentName.trim()
        if (!input) {
            notify('error', 'Type parent name first.')
            return
        }
        const next = addPostCategoryParent(input)
        setTree(next)
        setParentName('')
        notify('success', `Parent "${input}" created.`)
    }

    const createCategory = () => {
        const input = categoryName.trim()
        if (!input) {
            notify('error', 'Type category name first.')
            return
        }
        if (!selectedParent) {
            notify('error', 'Select parent first.')
            return
        }
        const next = addPostCategoryChild(selectedParent, input)
        setTree(next)
        setCategoryName('')
        notify('success', `Category "${input}" created.`)
    }

    const startEdit = (id, name) => {
        setEditingId(id)
        setEditValue(name)
    }

    const cancelEdit = () => {
        setEditingId('')
        setEditValue('')
    }

    const saveEdit = () => {
        const value = editValue.trim()
        if (!editingId || !value) {
            notify('error', 'Type category name first.')
            return
        }
        const next = renamePostCategory(editingId, value)
        setTree(next)
        notify('success', 'Category updated.')
        cancelEdit()
    }

    const handleDelete = (id, name) => {
        const next = removePostCategoryById(id)
        setTree(next)
        if (editingId === id) cancelEdit()
        notify('success', `Category "${name}" deleted.`)
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="space-y-1">
                <h1 className="text-base font-medium text-text">Category Manager</h1>
                <p className="text-xs text-muted">Create and edit parent and child categories for posts.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="rounded-2xl border border-surface bg-surface p-5 shadow-sm lg:col-span-6">
                    <p className="flex items-center gap-2 text-sm font-medium text-text">
                        <FolderPlus className="h-4 w-4 text-primary" />
                        Create Parent
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Top level group (example: Music, Sports, Image).</p>
                    <div className="mt-3 flex gap-2">
                        <input
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="Parent name"
                            className="flex-1 rounded-xl border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                        />
                        <button
                            onClick={createParent}
                            className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-black"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create
                        </button>
                    </div>

                    <div className="mt-6 border-t border-surface pt-5">
                        <p className="flex items-center gap-2 text-sm font-medium text-text">
                            <FolderTree className="h-4 w-4 text-primary" />
                            Create Category Under Parent
                        </p>
                        <p className="mt-1 text-[11px] text-muted">Choose parent from dropdown, then create child category.</p>
                        <div className="mt-3 space-y-2">
                            <select
                                value={selectedParent}
                                onChange={(e) => setSelectedParent(e.target.value)}
                                className="w-full rounded-xl border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                            >
                                {parentOptions.length ? (
                                    parentOptions.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.fullPath}
                                        </option>
                                    ))
                                ) : (
                                    <option value="">No parent found. Create parent first.</option>
                                )}
                            </select>
                            <div className="flex gap-2">
                                <input
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    placeholder="Category name"
                                    className="flex-1 rounded-xl border border-surface bg-bg px-3 py-2 text-sm text-text outline-none"
                                />
                                <button
                                    onClick={createCategory}
                                    className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-black"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-surface bg-surface p-5 shadow-sm lg:col-span-6">
                    <p className="flex items-center gap-2 text-sm font-medium text-text">
                        <ListTree className="h-4 w-4 text-primary" />
                        Category View
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Parent category with sub-category tree.</p>
                    <div className="mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                        {tree.length ? (
                            <CategoryTreeList
                                nodes={tree}
                                editingId={editingId}
                                editValue={editValue}
                                onStartEdit={startEdit}
                                onEditChange={setEditValue}
                                onSaveEdit={saveEdit}
                                onCancelEdit={cancelEdit}
                                onDelete={handleDelete}
                            />
                        ) : (
                            <div className="rounded-xl border border-dashed border-surface bg-bg px-3 py-4 text-sm text-muted">
                                No category found. Create parent first.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
