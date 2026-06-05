import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useCallStore } from '../../store/useCallStore';
import { agoraService } from '../../services/agoraService';
import { getSocket } from '../../../../socket';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff, Camera } from 'lucide-react';

// ─── RAW AGORA CALL ENGINE ────────────────────────────────────────────────────
// Uses the raw Agora SDK instead of hooks to get reliable connection state.
function ActiveCallEngine({ appId, channelName, token, uid, callType, onEndCall }) {
    const clientRef = useRef(null);
    const localTracksRef = useRef({ mic: null, cam: null });

    const [remoteUsers, setRemoteUsers] = useState([]);
    const [connected, setConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [error, setError] = useState(null);

    // Map of uid -> { videoTrack, audioTrack }
    const remoteVideoRefs = useRef({});

    useEffect(() => {
        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        // Remote user events
        const handleUserPublished = async (user, mediaType) => {
            await client.subscribe(user, mediaType);

            if (mediaType === 'audio' && user.audioTrack) {
                user.audioTrack.play();
            }

            setRemoteUsers(prev => {
                const existing = prev.find(u => u.uid === user.uid);
                if (existing) {
                    return prev.map(u => u.uid === user.uid ? user : u);
                }
                return [...prev, user];
            });
        };

        const handleUserUnpublished = (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        };

        const handleUserLeft = (user) => {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        };

        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);

        let isMounted = true;

        const joinAndPublish = async () => {
            try {
                // uid must be a number; 0 = auto-assign
                const numUid = typeof uid === 'number' ? uid : (parseInt(uid, 10) || 0);
                console.log('[Agora] Joining channel:', channelName, 'uid:', numUid);
                await client.join(appId, channelName, token || null, numUid);
                
                if (!isMounted) {
                    client.leave();
                    return;
                }
                
                setConnected(true);
                console.log('[Agora] Joined channel successfully');

                // Create and publish local tracks
                const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
                if (!isMounted) {
                    micTrack.close();
                    return;
                }
                localTracksRef.current.mic = micTrack;

                const tracksToPublish = [micTrack];

                if (callType === 'video') {
                    const camTrack = await AgoraRTC.createCameraVideoTrack();
                    if (!isMounted) {
                        camTrack.close();
                        return;
                    }
                    localTracksRef.current.cam = camTrack;
                    tracksToPublish.push(camTrack);
                }

                await client.publish(tracksToPublish);
                console.log('[Agora] Published local tracks');
            } catch (err) {
                if (!isMounted || err?.message?.includes('OPERATION_ABORTED') || err?.message?.includes('cancel')) {
                    console.log('[Agora] Ignored abort error during unmount or remount');
                    return;
                }
                console.error('[Agora] Failed to join or publish:', err);
                setError(err.message || 'Failed to connect to call');
            }
        };

        joinAndPublish();

        return () => {
            isMounted = false;
            // Cleanup
            client.off('user-published', handleUserPublished);
            client.off('user-unpublished', handleUserUnpublished);
            client.off('user-left', handleUserLeft);

            const { mic, cam } = localTracksRef.current;
            if (mic) { mic.stop(); mic.close(); }
            if (cam) { cam.stop(); cam.close(); }

            client.leave().catch(() => {});
        };
    }, [appId, channelName, token, uid, callType]);

    // Play remote video tracks into DOM nodes
    useEffect(() => {
        remoteUsers.forEach(user => {
            if (user.videoTrack && remoteVideoRefs.current[user.uid]) {
                user.videoTrack.play(remoteVideoRefs.current[user.uid]);
            }
        });
    }, [remoteUsers]);

    const toggleMute = () => {
        const mic = localTracksRef.current.mic;
        if (mic) {
            mic.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        const cam = localTracksRef.current.cam;
        if (cam) {
            cam.setMuted(!isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    if (error) {
        return (
            <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center gap-4">
                <p className="text-red-400 font-semibold">⚠️ Connection Error</p>
                <p className="text-gray-400 text-sm max-w-xs text-center">{error}</p>
                <button onClick={onEndCall} className="px-6 py-3 bg-red-600 rounded-full text-white font-medium">
                    Leave Call
                </button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col">
            {/* Status Header */}
            <div className="absolute top-0 w-full p-5 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                    <span className="font-semibold text-sm drop-shadow-md">
                        {connected ? (remoteUsers.length > 0 ? 'In Call' : 'Waiting...') : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative flex items-center justify-center bg-gray-900">
                {callType === 'video' ? (
                    <>
                        {/* Remote video full-screen */}
                        {remoteUsers.map(user => (
                            <div
                                key={user.uid}
                                ref={node => {
                                    if (node) {
                                        remoteVideoRefs.current[user.uid] = node;
                                        if (user.videoTrack) user.videoTrack.play(node);
                                    }
                                }}
                                className="absolute inset-0"
                                style={{ background: '#111' }}
                            />
                        ))}

                        {remoteUsers.length === 0 && (
                            <div className="text-gray-500 text-sm">Waiting for other user to join...</div>
                        )}

                        {/* Local video PiP */}
                        <div className="absolute bottom-28 right-5 w-28 h-40 bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-20">
                            {localTracksRef.current.cam && !isVideoOff ? (
                                <div
                                    ref={node => {
                                        if (node && localTracksRef.current.cam) {
                                            localTracksRef.current.cam.play(node);
                                        }
                                    }}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <VideoOff size={28} className="text-gray-500" />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Audio-only view */
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.4)] animate-pulse">
                            <Phone size={50} className="text-white" />
                        </div>
                        <div className="text-xl font-semibold">Audio Call</div>
                        {remoteUsers.length === 0 && connected && (
                            <div className="text-gray-400 text-sm">Waiting for other user to join...</div>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-0 w-full py-8 flex justify-center items-center gap-8 bg-gradient-to-t from-black/90 to-transparent">
                <button
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                    {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                </button>

                {callType === 'video' && (
                    <button
                        onClick={toggleVideo}
                        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                    >
                        {isVideoOff ? <VideoOff size={22} /> : <Camera size={22} />}
                    </button>
                )}

                <button
                    onClick={onEndCall}
                    title="End call"
                    className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/40 transition-transform hover:scale-105"
                >
                    <PhoneOff size={26} />
                </button>
            </div>
        </div>
    );
}

// ─── SYNTH RINGTONE HOOK ──────────────────────────────────────────────────────
function useRingtone(isRinging) {
    useEffect(() => {
        if (!isRinging) return;

        let audioCtx;
        let interval;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const playBeep = () => {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                osc.frequency.setValueAtTime(480, audioCtx.currentTime + 0.2);
                gain.gain.setValueAtTime(0, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.08, audioCtx.currentTime + 1.5);
                gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.6);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(audioCtx.currentTime);
                osc.stop(audioCtx.currentTime + 1.6);
            };

            playBeep();
            interval = setInterval(playBeep, 3000);
        } catch (e) {
            console.log('[Ringtone] AudioContext not supported');
        }

        return () => {
            if (interval) clearInterval(interval);
            if (audioCtx) audioCtx.close();
        };
    }, [isRinging]);
}

// ─── MAIN OVERLAY COMPONENT ───────────────────────────────────────────────────
export default function CallScreen() {
    const { incomingCall, outgoingCall, activeCall, clearCall, setActiveCall } = useCallStore();
    const socket = getSocket();

    const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '8ff09ad0256b4706881f558fcaf5807e';

    useRingtone(!activeCall && (!!incomingCall || !!outgoingCall));

    // ── Accept incoming call
    const handleAccept = async () => {
        if (!incomingCall) return;
        try {
            socket.emit('accept_call', {
                callerId: incomingCall.callerData.id,
                channelName: incomingCall.channelName
            });
            const randomUid = Math.floor(Math.random() * 900000) + 100000;
            const { token, uid } = await agoraService.getToken(incomingCall.channelName, randomUid);
            setActiveCall({
                channelName: incomingCall.channelName,
                callType: incomingCall.callType,
                token,
                uid,
                otherUserId: incomingCall.callerData.id
            });
        } catch (err) {
            console.error('[Call] Failed to accept call:', err);
            clearCall();
        }
    };

    // ── Reject incoming call
    const handleReject = () => {
        if (incomingCall) {
            socket.emit('reject_call', {
                callerId: incomingCall.callerData.id,
                channelName: incomingCall.channelName,
                callType: incomingCall.callType
            });
        }
        clearCall();
    };

    // ── End any call
    const handleEndCall = () => {
        const otherUserId = activeCall?.otherUserId || incomingCall?.callerData?.id || outgoingCall?.receiverData?.id;
        const channelName = activeCall?.channelName || incomingCall?.channelName || outgoingCall?.channelName;
        const callType = activeCall?.callType || incomingCall?.callType || outgoingCall?.callType;
        if (otherUserId && channelName) {
            socket.emit('end_call', { otherUserId, channelName, callType });
        }
        clearCall();
    };

    // ── Caller: fetch token once receiver accepted
    useEffect(() => {
        if (!activeCall || activeCall.token) return;
        const randomUid = Math.floor(Math.random() * 900000) + 100000;
        agoraService.getToken(activeCall.channelName, randomUid)
            .then(({ token, uid }) => {
                setActiveCall({ ...activeCall, token, uid });
            })
            .catch(err => {
                console.error('[Call] Failed to get token:', err);
                clearCall();
            });
    }, [activeCall]);

    if (!incomingCall && !outgoingCall && !activeCall) return null;

    // ── Active call screen (token ready)
    if (activeCall && activeCall.token) {
        return (
            <ActiveCallEngine
                appId={APP_ID}
                channelName={activeCall.channelName}
                token={activeCall.token}
                uid={activeCall.uid}
                callType={activeCall.callType}
                onEndCall={handleEndCall}
            />
        );
    }

    // ── Ringing / outgoing overlay
    const callData = incomingCall || outgoingCall;
    const displayUser = incomingCall ? incomingCall.callerData : outgoingCall?.receiverData;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-white/5 scale-125 animate-ping" />
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/20 relative z-10 bg-gray-800 flex items-center justify-center">
                        {displayUser?.avatar ? (
                            <img src={displayUser.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-white/60">
                                {displayUser?.username?.[0]?.toUpperCase() || '?'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-xl font-bold">{displayUser?.username || 'Unknown'}</p>
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-1.5 justify-center">
                        {callData?.callType === 'video' ? <Video size={14} /> : <Phone size={14} />}
                        {incomingCall ? 'Incoming call...' : 'Calling...'}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-10 mt-8">
                    {incomingCall && (
                        <button
                            onClick={handleReject}
                            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                            <PhoneOff size={26} />
                        </button>
                    )}
                    {incomingCall && (
                        <button
                            onClick={handleAccept}
                            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg hover:scale-105 transition-transform animate-bounce"
                        >
                            {incomingCall.callType === 'video' ? <Video size={26} /> : <Phone size={26} />}
                        </button>
                    )}
                    {outgoingCall && (
                        <button
                            onClick={handleEndCall}
                            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                            <PhoneOff size={26} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
