// components/menu/menuData.ts
export interface NavItem {
  href: string;
  label: string;
  iconName: string;
  description?: string;
}

export interface ThemePreset {
  name: string;
  description: string;
  colors: Array<{
    hue: number;
    saturation: number;
    lightness: number;
  }>;
}

export const navItems: NavItem[] = [
  {
    href: "/dex",
    label: "DEX",
    iconName: "ArrowLeftRight",
    description: "Trade tokens",
  },
  {
    href: "/dex/factory",
    label: "Token Factory",
    iconName: "Factory",
    description: "Create tokens",
  },
  {
    href: "/pet",
    label: "Community Pet",
    iconName: "Heart",
    description: "Feed & care for Testy",
  },
  {
    href: "/bots",
    label: "Bots",
    iconName: "Bot",
    description: "Transparent Volume Bots",
  },
  {
    href: "/games",
    label: "Games",
    iconName: "GamepadIcon",
    description: "We're building games!",
  },
  {
    href: "/faucet",
    label: "Faucet",
    iconName: "Droplets",
    description: "Get test tokens",
  },
  {
    href: "/roadmap",
    label: "Road to Riches",
    iconName: "Map",
    description: "Our roadmap",
  },
];

export const userMenuItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    iconName: "BarChart3",
    description: "Portfolio overview",
  },
  {
    href: "/theme",
    label: "Theme",
    iconName: "Palette",
    description: "Customize appearance",
  },
];

export const themePresets: ThemePreset[] = [
  {
    name: "Motherhaven Classic",
    description: "Original purple theme",
    colors: [
      { hue: 263, saturation: 60, lightness: 50 },
      { hue: 240, saturation: 5, lightness: 11 },
      { hue: 240, saturation: 6, lightness: 9 },
    ],
  },
  {
    name: "Ocean Blue",
    description: "Deep ocean vibes",
    colors: [
      { hue: 200, saturation: 80, lightness: 55 },
      { hue: 210, saturation: 15, lightness: 12 },
      { hue: 180, saturation: 70, lightness: 10 },
    ],
  },
  {
    name: "Forest Green",
    description: "Natural and calming",
    colors: [
      { hue: 140, saturation: 60, lightness: 45 },
      { hue: 150, saturation: 10, lightness: 10 },
      { hue: 120, saturation: 50, lightness: 15 },
    ],
  },
  {
    name: "Sunset Orange",
    description: "Warm and energetic",
    colors: [
      { hue: 25, saturation: 85, lightness: 55 },
      { hue: 30, saturation: 8, lightness: 12 },
      { hue: 45, saturation: 75, lightness: 15 },
    ],
  },
  {
    name: "Royal Purple",
    description: "Elegant and premium",
    colors: [
      { hue: 280, saturation: 75, lightness: 50 },
      { hue: 270, saturation: 8, lightness: 9 },
      { hue: 290, saturation: 65, lightness: 15 },
    ],
  },
];
