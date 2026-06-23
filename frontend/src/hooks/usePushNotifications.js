import { useState, useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../config/firebase';
import axios from 'axios';

export const usePushNotifications = (token, showToast) => {
  const [fcmToken, setFcmToken] = useState(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const isRequesting = useRef(false);

  useEffect(() => {
    // Only run if we are logged in (have an API token) and haven't already requested this session
    if (!token || isRequesting.current) return;

    const requestPermissionAndGenerateToken = async () => {
      try {
        isRequesting.current = true;
        
        // Wait for service worker to be ready
        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers are not supported by this browser.');
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsPermissionGranted(true);
          
          if (!messaging) {
              console.warn('Firebase messaging not initialized. Check your config.');
              return;
          }

          const currentToken = await getToken(messaging, { 
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration
          });

          if (currentToken) {
            setFcmToken(currentToken);
            // Send token to backend
            await axios.post(
              `${import.meta.env.VITE_API_URL}/fcm/register`,
              { fcmToken: currentToken },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('✅ FCM Token generated and saved to backend');
          } else {
            console.warn('No FCM registration token available. Request permission to generate one.');
          }
        } else {
          console.warn('Notification permission not granted.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    requestPermissionAndGenerateToken();

    // Listen for foreground messages
    let unsubscribe = () => {};
    if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
            console.log('[Foreground Message Received]: ', payload);
            if (showToast && payload.notification) {
                showToast(`${payload.notification.title}: ${payload.notification.body}`);
            }
        });
    }

    return () => {
      unsubscribe();
    };
  }, [token, showToast]);

  return { fcmToken, isPermissionGranted };
};
