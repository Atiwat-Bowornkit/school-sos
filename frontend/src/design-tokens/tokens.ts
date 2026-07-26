export const tokens = {
  color: {
    brand: {
      primary: '#1E40AF',
      primaryDarken: '#172F82',
      secondary: '#2563EB',
      secondaryDarken: '#1D4ED8',
      accent: '#38BDF8',
    },
    semantic: {
      success: '#56CA00',
      info: '#16B1FF',
      warning: '#FFB400',
      error: '#FF4C51',
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    light: {
      background: '#F4F5FA',
      surface: '#FFFFFF',
      surfaceMuted: '#F7F6FA',
      text: '#2E263D',
      textMuted: '#6B647D',
      border: '#DBDADE',
      track: '#F0F2F8',
    },
    dark: {
      background: '#28243D',
      surface: '#312D4B',
      surfaceMuted: '#373452',
      text: '#E7E3FC',
      textMuted: '#B6BEE3',
      border: '#4A5072',
      track: '#474360',
    },
  },
  typography: {
    fontFamily: {
      heading:
        '"Inter", -apple-system, blinkmacsystemfont, "Segoe UI", roboto, "Helvetica Neue", arial, sans-serif',
      body:
        '"Inter", -apple-system, blinkmacsystemfont, "Segoe UI", roboto, "Helvetica Neue", arial, sans-serif',
      mono:
        '"SFMono-Regular", ui-monospace, "JetBrains Mono", "Cascadia Code", "Fira Code", monospace',
    },
    fontSize: {
      'xs': '0.75rem',
      'sm': '0.8125rem',
      'md': '0.9375rem',
      'lg': '1.125rem',
      'xl': '1.5rem',
      '2xl': '1.75rem',
      '3xl': '2.375rem',
      '4xl': '2.875rem',
    },
    lineHeight: {
      tight: '1.15',
      snug: '1.35',
      normal: '1.5',
      relaxed: '1.75',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    'xs': '4px',
    'sm': '8px',
    'md': '12px',
    'lg': '16px',
    'xl': '24px',
    '2xl': '32px',
    '3xl': '40px',
    '4xl': '48px',
  },
  radius: {
    xs: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    pill: '999px',
  },
  shadow: {
    xs: '0 1px 2px rgba(46, 38, 61, 0.08)',
    sm: '0 4px 12px rgba(46, 38, 61, 0.12)',
    md: '0 12px 24px rgba(46, 38, 61, 0.16)',
    lg: '0 18px 36px rgba(46, 38, 61, 0.18)',
  },
} as const

export type DesignTokens = typeof tokens
