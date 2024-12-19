import React, { createContext, useContext, useState, useEffect } from 'react';

interface PermissionsState {
  camera: boolean;
  location: boolean;
  geolocation: { latitude: number; longitude: number } | null;
  error: string | null;
}

interface PermissionsContextType extends PermissionsState {
  requestPermissions: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
  error: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PermissionsState>({
    camera: false,
    location: false,
    geolocation: null,
    error: null,
  });

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIOSChrome = isIOS && /CriOS/.test(navigator.userAgent);

  const getPlatformSpecificInstructions = () => {
    if (isIOSChrome) {
      return "To enable camera on iOS Chrome:\n1. Tap the three dots (⋮)\n2. Tap Settings\n3. Tap Site Settings\n4. Tap Camera\n5. Allow camera access";
    }
    if (isIOS) {
      return "To enable permissions on iOS:\n1. Go to Settings\n2. Find this web app\n3. Enable Camera and Location access";
    }
    return "To enable permissions:\n1. Tap the lock/info icon in the address bar\n2. Enable Camera and Location permissions";
  };

  const requestCameraPermission = async () => {
    setState(prev => ({ ...prev, error: null }));

    try {
      // Try with ideal constraints first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        stream.getTracks().forEach(track => track.stop());
        setState(prev => ({ ...prev, camera: true }));
        return true;
      } catch (err) {
        console.log('Initial camera request failed, trying fallback...', err);
        
        // First fallback: try without width/height
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } }
          });
          stream.getTracks().forEach(track => track.stop());
          setState(prev => ({ ...prev, camera: true }));
          return true;
        } catch (err) {
          console.log('First fallback failed, trying basic video...', err);
          
          // Second fallback: try just { video: true }
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setState(prev => ({ ...prev, camera: true }));
            return true;
          } catch (finalErr) {
            console.error('All camera fallbacks failed:', finalErr);
            const error = isIOSChrome 
              ? 'Camera access denied. Please enable camera access in Chrome settings.'
              : `Camera access denied. ${getPlatformSpecificInstructions()}`;
            setState(prev => ({ ...prev, error }));
            return false;
          }
        }
      }
    } catch (err) {
      console.error('Camera permission error:', err);
      setState(prev => ({ 
        ...prev, 
        error: `Camera access denied. ${getPlatformSpecificInstructions()}`
      }));
      return false;
    }
  };

  const requestPermissions = async () => {
    setState(prev => ({ ...prev, error: null }));

    try {
      // Request camera permission
      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) return false;

      // Request location permission
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        setState(prev => ({
          ...prev,
          location: true,
          geolocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        }));
      } catch (err) {
        console.error('Location permission error:', err);
        setState(prev => ({ 
          ...prev, 
          error: `Location access denied. ${getPlatformSpecificInstructions()}`
        }));
        return false;
      }

      return true;
    } catch (err) {
      console.error('Permission error:', err);
      setState(prev => ({ 
        ...prev, 
        error: `Please grant camera and location permissions to use this app. ${getPlatformSpecificInstructions()}`
      }));
      return false;
    }
  };

  useEffect(() => {
    let watchId: number;

    if (state.location && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setState(prev => ({
            ...prev,
            geolocation: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
          }));
        },
        (error) => {
          console.error('Error watching location:', error);
        },
        { 
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [state.location]);

  return (
    <PermissionsContext.Provider 
      value={{ 
        ...state,
        requestPermissions,
        requestCameraPermission
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}; 