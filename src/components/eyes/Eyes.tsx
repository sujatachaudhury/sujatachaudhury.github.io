'use client';

import { useEffect, useRef } from 'react';
import styles from './Eyes.module.css';

export function Eyes() {
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const eyes = [leftEyeRef.current, rightEyeRef.current];
      
      eyes.forEach((eye) => {
        if (!eye) return;
        
        const rect = eye.getBoundingClientRect();
        const eyeCenterX = rect.left + rect.width / 2;
        const eyeCenterY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
        const distance = Math.min(10, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 10);
        
        const pupilX = Math.cos(angle) * distance;
        const pupilY = Math.sin(angle) * distance;
        
        const pupil = eye.querySelector(`.${styles.pupil}`) as HTMLElement;
        if (pupil) {
          pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={styles.container}>
      <div ref={leftEyeRef} className={styles.eye}>
        <div className={styles.pupil} />
      </div>
      
      <div ref={rightEyeRef} className={styles.eye}>
        <div className={styles.pupil} />
      </div>
    </div>
  );
}