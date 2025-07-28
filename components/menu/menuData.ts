// components/menu/menuData.ts
export interface NavItem {
  href: string;
  label: string;
  iconName: string;
  description?: string;
}

export const navItems: NavItem[] = [
  {
    href: "/dex",
    label: "DEX",
    iconName: "ArrowLeftRight",
    description: "Trade tokens",
  },

  {
    href: "/factory",
    label: "Grand Factory",
    iconName: "Factory",
    description: "Create tokenize community",
  },
  {
    href: "/roadmap",
    label: "Road to Riches",
    iconName: "Map",
    description: "Our roadmap",
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
  // {
  //   href: "/games",
  //   label: "Games",
  //   iconName: "GamepadIcon",
  //   description: "We're building games!",
  // },
  {
    href: "/faucet",
    label: "Faucet",
    iconName: "Droplets",
    description: "Get test tokens",
  },
];

export const userMenuItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    iconName: "BarChart3",
    description: "Portfolio overview",
  },
];
