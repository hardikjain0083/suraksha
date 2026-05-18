import { useState, useCallback, useRef } from 'react';
import type { KeystrokeData, MouseData } from '../types/behavioral';

export const useBehavioralCapture = () => {
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeData>({
    dwellTimes: [],
    flightTimes: [],
    timestamps: [],
    totalKeys: 0
  });

  const [mouseData, setMouseData] = useState<MouseData>({
    velocities: [],
    clickPatterns: [],
    idleTimes: [],
    trajectory: []
  });

  // Refs to track previous states without triggering re-renders constantly
  const lastKeyDownTime = useRef<number | null>(null);
  const lastKeyUpTime = useRef<number | null>(null);
  
  const lastMouseMoveTime = useRef<number | null>(null);
  const lastMousePos = useRef<{x: number, y: number} | null>(null);

  const captureKeystrokeDown = useCallback((_event: KeyboardEvent | React.KeyboardEvent) => {
    const now = Date.now();
    
    setKeystrokeData(prev => {
      const newTimestamps = [...prev.timestamps, now];
      let newFlightTimes = [...prev.flightTimes];
      
      if (lastKeyUpTime.current !== null) {
        // Flight time: time between releasing previous key and pressing current key
        newFlightTimes.push(now - lastKeyUpTime.current);
      }
      
      return {
        ...prev,
        timestamps: newTimestamps,
        flightTimes: newFlightTimes,
        totalKeys: prev.totalKeys + 1
      };
    });
    
    lastKeyDownTime.current = now;
  }, []);

  const captureKeystrokeUp = useCallback((_event: KeyboardEvent | React.KeyboardEvent) => {
    const now = Date.now();
    
    if (lastKeyDownTime.current !== null) {
      const dwell = now - lastKeyDownTime.current;
      setKeystrokeData(prev => ({
        ...prev,
        dwellTimes: [...prev.dwellTimes, dwell]
      }));
    }
    
    lastKeyUpTime.current = now;
  }, []);

  const captureMouse = useCallback((event: MouseEvent | React.MouseEvent) => {
    const now = Date.now();
    const { clientX, clientY } = event;
    
    setMouseData(prev => {
      let newVelocities = [...prev.velocities];
      let newIdleTimes = [...prev.idleTimes];
      
      if (lastMousePos.current !== null && lastMouseMoveTime.current !== null) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const dt = now - lastMouseMoveTime.current;
        
        if (dt > 0) {
          const velocity = Math.sqrt(dx*dx + dy*dy) / dt;
          newVelocities.push(velocity);
        }
        
        if (dt > 500) {
          newIdleTimes.push(dt);
        }
      }
      
      return {
        ...prev,
        velocities: newVelocities,
        idleTimes: newIdleTimes,
        trajectory: [...prev.trajectory, { x: clientX, y: clientY, timestamp: now }]
      };
    });
    
    lastMousePos.current = { x: clientX, y: clientY };
    lastMouseMoveTime.current = now;
  }, []);

  const captureClick = useCallback((_event: MouseEvent | React.MouseEvent) => {
    setMouseData(prev => ({
      ...prev,
      clickPatterns: [...prev.clickPatterns, Date.now()]
    }));
  }, []);

  const reset = useCallback(() => {
    setKeystrokeData({
      dwellTimes: [],
      flightTimes: [],
      timestamps: [],
      totalKeys: 0
    });
    setMouseData({
      velocities: [],
      clickPatterns: [],
      idleTimes: [],
      trajectory: []
    });
    lastKeyDownTime.current = null;
    lastKeyUpTime.current = null;
    lastMouseMoveTime.current = null;
    lastMousePos.current = null;
  }, []);

  return { 
    keystrokeData, 
    mouseData, 
    captureKeystrokeDown, 
    captureKeystrokeUp, 
    captureMouse, 
    captureClick, 
    reset 
  };
};
