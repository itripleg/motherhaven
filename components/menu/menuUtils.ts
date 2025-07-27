// components/menu/menuUtils.ts
import { navItems, type NavItem } from "./menuData";
import { presetThemes } from "@/app/theme/presetThemes";

export const isActiveRoute = (href: string, pathname: string): boolean => {
  // Exact match for most routes
  if (pathname === href) {
    return true;
  }

  // DEX matches /dex exactly and dynamic token pages
  if (href === "/dex") {
    return (
      pathname === "/dex" ||
      (pathname.startsWith("/dex/") &&
        !pathname.startsWith("/factory") &&
        pathname.split("/").length === 3)
    ); // /dex/[tokenAddress]
  }

  // Pet page matches /pet exactly
  if (href === "/pet") {
    return pathname === "/pet";
  }

  return false;
};

export const formatAddress = (addr: string): string => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const getCurrentNavItem = (pathname: string): NavItem => {
  const baseItem = navItems.find((item) => isActiveRoute(item.href, pathname));

  // If on a token page, show DEX with token info
  if (
    pathname.startsWith("/dex/") &&
    !pathname.startsWith("/factory") &&
    pathname.split("/").length === 3
  ) {
    return {
      href: "/dex",
      label: "DEX • Token Page",
      iconName: "ArrowLeftRight",
      description: "Trading pair",
    };
  }

  // If on pet page, show pet info
  if (pathname === "/pet") {
    return {
      href: "/pet",
      label: "Community Pet",
      iconName: "Heart",
      description: "Caring for Testy",
    };
  }

  return (
    baseItem || {
      label: "Navigate",
      iconName: "Home",
      href: "#",
    }
  );
};

export const getCurrentThemeName = (colors: any[]): string => {
  // Simple heuristic to detect current theme
  const currentPrimary = colors[0];

  for (const preset of presetThemes) {
    const presetPrimary = preset.colors[0];
    if (
      Math.abs(currentPrimary.hue - presetPrimary.hue) < 10 &&
      Math.abs(currentPrimary.saturation - presetPrimary.saturation) < 10 &&
      Math.abs(currentPrimary.lightness - presetPrimary.lightness) < 10
    ) {
      return preset.name;
    }
  }
  return "Custom";
};

export const applyThemePreset = (
  preset: (typeof presetThemes)[0],
  colors: any[],
  applyColors: any
): void => {
  const newColors = colors.map((color, index) => ({
    ...color,
    ...preset.colors[index],
  }));
  applyColors(newColors);
};
