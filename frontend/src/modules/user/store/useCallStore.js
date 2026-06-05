import { create } from 'zustand';

export const useCallStore = create((set, get) => ({
    incomingCall: null, // { callerData: { id, username, avatar }, channelName, callType }
    outgoingCall: null, // { receiverData: { id, username, avatar }, channelName, callType }
    activeCall: null,   // { channelName, callType, token, uid }
    isCalling: false,

    setIncomingCall: (callData) => set({ incomingCall: callData }),
    setOutgoingCall: (callData) => set({ outgoingCall: callData, isCalling: true }),
    setActiveCall: (callData) => set({ 
        activeCall: callData, // { channelName, callType, token, uid, otherUserId }
        incomingCall: null, 
        outgoingCall: null, 
        isCalling: false 
    }),
    clearCall: () => set({ 
        incomingCall: null, 
        outgoingCall: null, 
        activeCall: null, 
        isCalling: false 
    }),
}));
