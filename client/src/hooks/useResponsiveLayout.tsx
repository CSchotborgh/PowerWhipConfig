import { useState, useEffect } from 'react';

interface ResponsiveBreakpoints {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  wide: boolean;
  ultraWide: boolean;
  tv: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'wide' | 'ultraWide' | 'tv';
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  pixelRatio: number;
}

export function useResponsiveLayout() {
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    deviceType: 'desktop',
    orientation: 'landscape',
    isTouch: false,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>({
    mobile: false,
    tablet: false,
    desktop: true,
    wide: false,
    ultraWide: false,
    tv: false,
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const orientation = width > height ? 'landscape' : 'portrait';

      // Determine device type based on screen width
      let deviceType: ScreenInfo['deviceType'] = 'desktop';
      if (width <= 480) {
        deviceType = 'mobile';
      } else if (width <= 768) {
        deviceType = 'tablet';
      } else if (width <= 1280) {
        deviceType = 'desktop';
      } else if (width <= 1920) {
        deviceType = 'wide';
      } else if (width <= 2560) {
        deviceType = 'ultraWide';
      } else {
        deviceType = 'tv';
      }

      // Update breakpoints
      const newBreakpoints: ResponsiveBreakpoints = {
        mobile: width <= 480,
        tablet: width > 480 && width <= 1024,
        desktop: width > 1024 && width <= 1920,
        wide: width > 1920 && width <= 2560,
        ultraWide: width > 2560 && width <= 3840,
        tv: width > 3840,
      };

      setScreenInfo({
        width,
        height,
        deviceType,
        orientation,
        isTouch,
        pixelRatio,
      });

      setBreakpoints(newBreakpoints);

      // Add responsive classes to body for CSS targeting
      document.body.className = document.body.className
        .replace(/\b(mobile|tablet|desktop|wide|ultraWide|tv)-(small|medium|large|ultra-small)\b/g, '')
        .replace(/\b(portrait|landscape)-layout\b/g, '');

      // Add device-specific classes
      if (deviceType === 'mobile' && width <= 320) {
        document.body.classList.add('mobile-ultra-small');
      } else if (deviceType === 'mobile') {
        document.body.classList.add('mobile-small');
      } else if (deviceType === 'tablet' && width <= 768) {
        document.body.classList.add('tablet-small');
      } else if (deviceType === 'tablet') {
        document.body.classList.add('tablet-medium');
      } else if (deviceType === 'desktop' && width <= 1280) {
        document.body.classList.add('desktop-small');
      } else if (deviceType === 'desktop') {
        document.body.classList.add('desktop-standard');
      } else if (deviceType === 'wide') {
        document.body.classList.add('wide-screen');
      } else if (deviceType === 'ultraWide' || deviceType === 'tv') {
        document.body.classList.add('ultra-wide');
      }

      // Add orientation class
      document.body.classList.add(`${orientation}-layout`);
    };

    // Initial update
    updateScreenInfo();

    // Listen for resize events
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  // Helper functions for common responsive patterns
  const getGridColumns = () => {
    if (screenInfo.width <= 480) return 1;
    if (screenInfo.width <= 768) return 2;
    if (screenInfo.width <= 1024) return 3;
    if (screenInfo.width <= 1920) return 4;
    if (screenInfo.width <= 2560) return 6;
    return 8;
  };

  const getSidebarWidth = () => {
    if (screenInfo.width <= 480) return '100vw';
    if (screenInfo.width <= 768) return 'min(320px, 40vw)';
    if (screenInfo.width <= 1024) return 'min(360px, 35vw)';
    if (screenInfo.width <= 1920) return 'min(480px, 25vw)';
    if (screenInfo.width <= 2560) return 'min(560px, 22vw)';
    return 'min(640px, 20vw)';
  };

  const getContainerPadding = () => {
    if (screenInfo.width <= 480) return 'var(--space-sm)';
    if (screenInfo.width <= 768) return 'var(--space-md)';
    if (screenInfo.width <= 1920) return 'var(--space-lg)';
    return 'var(--space-xl)';
  };

  const getFontSize = () => {
    if (screenInfo.width <= 480) return 'var(--font-sm)';
    if (screenInfo.width <= 768) return 'var(--font-base)';
    if (screenInfo.width <= 1920) return 'var(--font-lg)';
    return 'var(--font-xl)';
  };

  const shouldCollapsePanels = () => {
    return screenInfo.width <= 768 || screenInfo.orientation === 'portrait';
  };

  const shouldStackVertically = () => {
    return screenInfo.width <= 480 || (screenInfo.orientation === 'portrait' && screenInfo.width <= 1024);
  };

  return {
    screenInfo,
    breakpoints,
    getGridColumns,
    getSidebarWidth,
    getContainerPadding,
    getFontSize,
    shouldCollapsePanels,
    shouldStackVertically,
  };
}

export default useResponsiveLayout;