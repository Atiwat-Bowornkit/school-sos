import { defineThemeConfig } from '@core'
import { Skins } from '@core/enums'
import { breakpointsVuetify } from '@vueuse/core'
import { VIcon } from 'vuetify/components/VIcon'

import {
  AppContentLayoutNav,
  ContentWidth,
  FooterType,
  NavbarType,
} from '@layouts/enums'

export const { themeConfig, layoutConfig } = defineThemeConfig({
  app: {
    title: 'School SOS' as Lowercase<string>,
    logo: h(VIcon, {
      'icon': 'ri-alarm-warning-fill',
      'color': 'primary',
      'size': 36,
      'aria-label': 'School SOS',
    }),
    contentWidth: ContentWidth.Boxed,
    contentLayoutNav: AppContentLayoutNav.Vertical,
    overlayNavFromBreakpoint: breakpointsVuetify.md + 16, // 16 for scrollbar. Docs: https://next.vuetifyjs.com/en/features/display-and-platform/
    i18n: {
      enable: false,
      defaultLocale: 'en',
      langConfig: [
        {
          label: 'English',
          i18nLang: 'en',
          isRTL: false,
        },
        {
          label: 'French',
          i18nLang: 'fr',
          isRTL: false,
        },
        {
          label: 'Arabic',
          i18nLang: 'ar',
          isRTL: true,
        },
      ],
    },
    theme: 'light',
    skin: Skins.Default,
    iconRenderer: VIcon,
  },
  navbar: {
    type: NavbarType.Sticky,
    navbarBlur: true,
  },
  footer: { type: FooterType.Static },
  verticalNav: {
    isVerticalNavCollapsed: false,
    defaultNavItemIconProps: { icon: 'ri-circle-line' },
    isVerticalNavSemiDark: false,
  },
  horizontalNav: {
    type: 'sticky',
    transition: 'slide-y-reverse-transition',
    popoverOffset: 4,
  },

  /*
  // ℹ️  In below Icons section, you can specify icon for each component. Also you can use other props of v-icon component like `color` and `size` for each icon.
  // Such as: chevronDown: { icon: 'ri-arrow-down-s-line', color:'primary', size: '24' },
  */
  icons: {
    chevronDown: { icon: 'ri-arrow-down-s-line' },
    chevronRight: { icon: 'ri-arrow-right-s-line' },
    close: { icon: 'ri-close-line' },
    verticalNavPinned: { icon: 'ri-radio-button-line' },
    verticalNavUnPinned: { icon: 'ri-circle-line' },
    sectionTitlePlaceholder: { icon: 'ri-subtract-line' },
  },
})
