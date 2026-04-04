import { useEffect, useState } from 'react'
import { Plus, FolderPlus, ListTree, Trash2, Tag, ChevronDown, ChevronUp, Edit3, Power } from 'lucide-react'
import { useAdminStore } from '../store/useAdminStore'

const SubcategoryItem = ({ sub, categoryId, onEdit, onDelete, onToggle }) => (
    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-surface bg-surface shadow-sm hover:border-primary/20 group/sub transition-all">
        <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold truncate ${!sub.isActive ? 'opacity-40 italic' : ''}`} style={{ color: 'var(--color-text)' }}>
                {sub.name}
            </p>
            <span className="text-[9px] opacity-40 font-mono">/{sub.slug}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/sub:opacity-100 transition-all">
            <button onClick={() => onToggle(categoryId, sub._id, !sub.isActive)} className={`p-1.5 rounded-md transition-all ${sub.isActive ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-rose-500 hover:bg-rose-500/10'}`}>
                <Power className="h-3 w-3" />
            </button>
            <button onClick={() => onEdit(sub)} className="p-1.5 hover:bg-primary/10 text-muted hover:text-primary rounded-md transition-all">
                <Edit3 className="h-3 w-3" />
            </button>
            <button onClick={() => onDelete(categoryId, sub._id)} className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-md transition-all">
                <Trash2 className="h-3 w-3" />
            </button>
        </div>
    </div>
);

const CategoryCard = ({ cat, isExpanded, onToggle, onAddSub, onEdit, onDelete, onToggleActive, subName, setSubName, onEditSub, onDeleteSub, onToggleSub }) => (
    <div className="space-y-2">
        <div className={`flex items-center justify-between p-3 rounded-xl border border-surface bg-bg group transition-all hover:border-primary/30 ${isExpanded ? 'border-primary/50 shadow-lg' : ''}`}>
            <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={onToggle}>
                <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-primary transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-black ${!cat.isActive ? 'opacity-40 italic' : ''}`} style={{ color: 'var(--color-text)' }}>{cat.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted font-mono">/{cat.slug}</span>
                        {cat.subcategories?.length > 0 && (
                            <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black border border-primary/10 uppercase tracking-tighter">
                                {cat.subcategories.length} Elements
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => onToggleActive(cat._id, !cat.isActive)} className={`p-2 rounded-lg transition-all ${cat.isActive ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-rose-500 hover:bg-rose-500/10'}`}>
                    <Power className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onEdit(cat)} className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-lg"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(cat._id, cat.name)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
        </div>

        {isExpanded && (
            <div className="ml-8 p-4 rounded-xl border border-surface bg-bg/50 space-y-4 animate-in fade-in slide-in-from-top-2 border-l-4 border-l-primary/30">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30" />
                        <input
                            value={subName}
                            onChange={(e) => setSubName(e.target.value)}
                            placeholder="Add element / subcategory..."
                            className="w-full rounded-lg border border-surface bg-bg pl-9 pr-3 py-2 text-xs text-text outline-none focus:border-primary transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && onAddSub(cat._id)}
                        />
                    </div>
                    <button onClick={() => onAddSub(cat._id)} className="p-2 rounded-lg bg-primary text-black hover:scale-105 active:scale-95 transition-all shadow-md shadow-primary/10">
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.subcategories?.length > 0 ? (
                        cat.subcategories.map(sub => (
                            <SubcategoryItem 
                                key={sub._id} 
                                sub={sub} 
                                categoryId={cat._id} 
                                onEdit={onEditSub} 
                                onDelete={onDeleteSub}
                                onToggle={onToggleSub}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-6 text-center border-2 border-dashed border-surface rounded-xl bg-surface/30">
                            <p className="text-[10px] text-muted italic font-bold uppercase tracking-widest opacity-40">Empty Container</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
);

export default function CategoryManagementPage() {
    const { categories, loadCategories, addCategory, updateCategory, deleteCategory, addSubcategory, updateSubcategory, deleteSubcategory, notify } = useAdminStore()
    const [catName, setCatName] = useState('')
    const [subName, setSubName] = useState('')
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => { loadCategories() }, [loadCategories])

    const handleCreateCat = async () => {
        if (!catName.trim()) return notify('error', 'Category name required')
        try {
            await addCategory({ name: catName.trim() })
            setCatName('')
        } catch {}
    }

    const handleAddSub = async (catId) => {
        if (!subName.trim()) return
        try {
            await addSubcategory(catId, { name: subName.trim() })
            setSubName('')
        } catch {}
    }

    const handleToggleCat = (id) => setExpandedId(expandedId === id ? null : id)

    return (
        <div className="space-y-8 pb-20 max-w-5xl">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-text">Dynamic Category Manager</h1>
                <p className="text-sm opacity-60 text-text">Simple, scalable hierarchy for posts and search logic.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-surface bg-surface p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-base font-bold mb-6 text-text">
                            <FolderPlus className="h-5 w-5 text-primary" /> Create New Category
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider opacity-60 text-text">Category Name</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
                                    <input
                                        value={catName}
                                        onChange={(e) => setCatName(e.target.value)}
                                        placeholder="e.g. Comedy, Entertainment..."
                                        className="w-full rounded-xl border border-surface bg-bg pl-10 pr-4 py-3 text-sm text-text outline-none focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <button onClick={handleCreateCat} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
                                <Plus className="h-4 w-4" /> Create Category
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right List */}
                <div className="lg:col-span-3 rounded-2xl border border-surface bg-surface p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-base font-bold text-text">
                            <ListTree className="h-5 w-5 text-primary" /> Active Categories
                        </div>
                        <span className="text-[10px] bg-bg px-2.5 py-1 rounded-md font-black uppercase tracking-widest text-muted border border-surface">
                            Total: {categories.length}
                        </span>
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map(cat => (
                            <CategoryCard 
                                key={cat._id}
                                cat={cat}
                                isExpanded={expandedId === cat._id}
                                onToggle={() => handleToggleCat(cat._id)}
                                onAddSub={handleAddSub}
                                onDelete={deleteCategory}
                                onToggleActive={(id, status) => updateCategory(id, { isActive: status })}
                                onEdit={(c) => {
                                    const val = prompt('Rename Category:', c.name)
                                    if(val) updateCategory(c._id, { name: val })
                                }}
                                subName={subName}
                                setSubName={setSubName}
                                onDeleteSub={deleteSubcategory}
                                onToggleSub={(catId, subId, status) => updateSubcategory(catId, subId, { isActive: status })}
                                onEditSub={(s) => {
                                    const val = prompt('Rename Subcategory:', s.name)
                                    if(val) updateSubcategory(expandedId, s._id, { name: val })
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
