// components/menu/IconHelper.tsx
import {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Factory,
  Map,
  Bot,
  GamepadIcon,
  Palette,
  Heart,
  Home,
} from "lucide-react";

const iconMap = {
  ArrowLeftRight,
  Droplets,
  BarChart3,
  Factory,
  Map,
  Bot,
  GamepadIcon,
  Palette,
  Heart,
  Home,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "h-4 w-4" }: IconProps) {
  const IconComponent = iconMap[name as keyof typeof iconMap];

  if (!IconComponent) {
    return <Home className={className} />;
  }

  return <IconComponent className={className} />;
}
