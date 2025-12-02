// src/theme.js - Design system and utilities

export const lightTheme = {
  bg: {
    primary: "#ffffff",
    secondary: "#f8f9fa",
    tertiary: "#fafbfc",
    hover: "#f0f2f5"
  },
  text: {
    primary: "#1a1a1a",
    secondary: "#666666",
    tertiary: "#999999",
    inverted: "#ffffff"
  },
  border: "#e1e4e8",
  divider: "#f0f0f0",
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowMd: "rgba(0, 0, 0, 0.12)",
  shadowLg: "rgba(0, 0, 0, 0.16)",
  
  // Brand colors - 更现代的配色
  primary: "#0066ff",      // 鲜艳蓝色
  primaryLight: "#e6f0ff",
  primaryDark: "#0052cc",
  primaryHover: "#0052cc",
  
  accent: "#ff4757",       // 现代红色
  success: "#10b981",      // 翠绿色
  warning: "#f59e0b",      // 琥珀色
  error: "#ef4444",        // 鲜红色
  info: "#3b82f6",         // 天蓝色
  
  // Message colors
  userBg: "#0066ff",
  userText: "#ffffff",
  assistantBg: "#f8f9fa",
  assistantText: "#1a1a1a",
  
  // Semantic
  pinned: "#f59e0b",
  rated: "#10b981",
  cached: "#3b82f6"
};

export const darkTheme = {
  bg: {
    primary: "#0d1117",
    secondary: "#161b22",
    tertiary: "#1c2128",
    hover: "#21262d"
  },
  text: {
    primary: "#e6edf3",
    secondary: "#8b949e",
    tertiary: "#6e7681",
    inverted: "#0d1117"
  },
  border: "#30363d",
  divider: "#21262d",
  shadow: "rgba(0, 0, 0, 0.4)",
  shadowMd: "rgba(0, 0, 0, 0.6)",
  shadowLg: "rgba(0, 0, 0, 0.8)",
  
  // Brand colors
  primary: "#58a6ff",      // 亮蓝色
  primaryLight: "#1c2d41",
  primaryDark: "#79c0ff",
  primaryHover: "#79c0ff",
  
  accent: "#ff7b72",
  success: "#3fb950",
  warning: "#d29922",
  error: "#f85149",
  info: "#58a6ff",
  
  // Message colors
  userBg: "#1f6feb",
  userText: "#ffffff",
  assistantBg: "#161b22",
  assistantText: "#e6edf3",
  
  // Semantic
  pinned: "#d29922",
  rated: "#3fb950",
  cached: "#58a6ff"
};

// Spacing system
export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  xxl: "32px"
};

// Typography
export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
  fontSize: {
    xs: "11px",
    sm: "12px",
    base: "14px",
    md: "15px",
    lg: "16px",
    xl: "18px",
    xxl: "20px"
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75
  }
};

// Global styles for both themes
export const globalStyles = (theme) => ({
  body: {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize.base,
    backgroundColor: theme.bg.primary,
    color: theme.text.primary,
    transition: "background-color 0.3s ease, color 0.3s ease",
    lineHeight: typography.lineHeight.normal
  },
  button: {
    fontFamily: "inherit",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: typography.fontWeight.medium
  },
  input: {
    fontFamily: "inherit",
    borderRadius: "8px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  },
  textarea: {
    fontFamily: "inherit",
    borderRadius: "8px",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease"
  }
});

// Toast notification manager (simple implementation)
let toastId = 0;
const toastListeners = [];

export const createToastManager = () => ({
  subscribe: (listener) => {
    toastListeners.push(listener);
    return () => {
      const idx = toastListeners.indexOf(listener);
      if (idx > -1) toastListeners.splice(idx, 1);
    };
  },
  notify: (message, type = "info", duration = 3000) => {
    const id = toastId++;
    const toast = { id, message, type };
    toastListeners.forEach(listener => listener(toast));
    if (duration > 0) {
      setTimeout(() => {
        toastListeners.forEach(listener => listener({ id, remove: true }));
      }, duration);
    }
    return id;
  }
});

export const toastManager = createToastManager();

// Common styles
export const commonStyles = (theme) => ({
  flexCenter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  flexBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  flexColumn: {
    display: "flex",
    flexDirection: "column"
  },
  card: {
    backgroundColor: theme.bg.primary,
    borderRadius: "12px",
    boxShadow: `0 2px 8px ${theme.shadow}`,
    border: `1px solid ${theme.border}`,
    transition: "all 0.2s ease"
  },
  cardHover: {
    backgroundColor: theme.bg.primary,
    borderRadius: "12px",
    boxShadow: `0 2px 8px ${theme.shadow}`,
    border: `1px solid ${theme.border}`,
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      boxShadow: `0 8px 24px ${theme.shadowMd}`,
      transform: "translateY(-2px)"
    }
  },
  buttonPrimary: {
    backgroundColor: theme.primary,
    color: theme.text.inverted,
    border: "none",
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.primaryHover,
      transform: "translateY(-1px)",
      boxShadow: `0 4px 12px ${theme.shadowMd}`
    },
    "&:active": {
      transform: "translateY(0)"
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none"
    }
  },
  buttonSecondary: {
    backgroundColor: theme.bg.secondary,
    color: theme.text.primary,
    border: `1px solid ${theme.border}`,
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: theme.bg.hover,
      borderColor: theme.primary
    }
  }
});

// Highlight search text utility
export const highlightText = (text, query) => {
  if (!query || !text) return text;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) => 
    part.toLowerCase() === query.toLowerCase() 
      ? `<mark style="background-color: #ffd700; padding: 2px 4px; border-radius: 3px;">${part}</mark>`
      : part
  ).join('');
};
