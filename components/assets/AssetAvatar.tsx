import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { IoniconName } from '@/lib/providers/assetIcons';

interface Props {
  icon: string;
  bgColor: string;
  iconColor: string;
  size?: number;
}

export function AssetAvatar({ icon, bgColor, iconColor, size = 48 }: Props) {
  return (
    <View
      className="items-center justify-center rounded-2xl"
      style={{
        width: size,
        height: size,
        backgroundColor: bgColor,
        borderRadius: size * 0.35,
      }}>
      <Ionicons name={(icon as IoniconName) || 'wallet-outline'} size={size * 0.45} color={iconColor} />
    </View>
  );
}

export function TrendPill({
  value,
  positive,
}: {
  value: string;
  positive: boolean;
}) {
  return (
    <View
      className={`rounded-full px-2.5 py-1 ${positive ? 'bg-emerald-50' : 'bg-red-50'}`}>
      <Text className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {value}
      </Text>
    </View>
  );
}
