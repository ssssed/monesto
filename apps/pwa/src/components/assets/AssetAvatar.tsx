import { cn } from '@monesto/rune';
import type { LucideIcon } from 'lucide-react';

import {
  ASSET_ICON_MAP,
  normalizeIconName,
  type AssetIconName,
} from '@/lib/providers/assetIcons';

export function AssetAvatar({
  icon,
  bgColor,
  iconColor,
  size = 'md',
  className,
}: {
  icon: string;
  bgColor: string;
  iconColor: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const key = normalizeIconName(icon);
  const Icon: LucideIcon = ASSET_ICON_MAP[key as AssetIconName] ?? ASSET_ICON_MAP.wallet;
  const box =
    size === 'lg' ? 'h-16 w-16 rounded-2xl' : size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-12 w-12 rounded-2xl';
  const iconSize = size === 'lg' ? 'h-8 w-8' : size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center', box, className)}
      style={{ backgroundColor: bgColor }}
    >
      <Icon className={iconSize} style={{ color: iconColor }} />
    </div>
  );
}
