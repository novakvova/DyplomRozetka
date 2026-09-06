import {
    Cable,
    Gamepad2,
    Grid3x3,
    Headphones,
    Home,
    Laptop,
    Smartphone,
    type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    smartphones: Smartphone,
    laptops: Laptop,
    audio: Headphones,
    gaming: Gamepad2,
    home: Home,
    accessories: Cable,
};

export function getCategoryIcon(slug: string): LucideIcon {
    return CATEGORY_ICONS[slug] ?? Grid3x3;
}