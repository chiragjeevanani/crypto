import { create } from 'zustand'

export const useModalStore = create((set) => ({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    onConfirm: null,

    showAlert: (title, message, type = 'info', onConfirm = null) => set({
        isOpen: true,
        title,
        message,
        type,
        onConfirm
    }),

    closeModal: () => set({ isOpen: false, onConfirm: null })
}))
