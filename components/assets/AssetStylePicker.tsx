import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  ASSET_ICON_OPTIONS,
  BG_COLOR_OPTIONS,
  ICON_COLOR_OPTIONS,
  type IoniconName,
} from '@/lib/providers/assetIcons';

interface Props {
  icon: string;
  bgColor: string;
  iconColor: string;
  onIconChange: (icon: string) => void;
  onBgChange: (color: string) => void;
  onIconColorChange: (color: string) => void;
}

export function AssetStylePicker({
  icon,
  bgColor,
  iconColor,
  onIconChange,
  onBgChange,
  onIconColorChange,
}: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-slate-700">Иконка</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {ASSET_ICON_OPTIONS.map((option) => {
          const selected = icon === option.name;
          return (
            <Pressable
              key={option.name}
              onPress={() => onIconChange(option.name)}
              className={`h-12 w-12 items-center justify-center rounded-2xl border ${selected ? 'border-blue-500' : 'border-slate-200'}`}
              style={{ backgroundColor: bgColor }}>
              <Ionicons name={option.name as IoniconName} size={22} color={iconColor} />
            </Pressable>
          );
        })}
      </View>

      <Text className="mb-2 text-sm font-medium text-slate-700">Цвет фона</Text>
      <View className="mb-4 flex-row flex-wrap gap-2">
        {BG_COLOR_OPTIONS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onBgChange(color)}
            className={`h-9 w-9 rounded-full border-2 ${bgColor === color ? 'border-slate-900' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </View>

      <Text className="mb-2 text-sm font-medium text-slate-700">Цвет иконки</Text>
      <View className="flex-row flex-wrap gap-2">
        {ICON_COLOR_OPTIONS.map((color) => (
          <Pressable
            key={color}
            onPress={() => onIconColorChange(color)}
            className={`h-9 w-9 rounded-full border-2 ${iconColor === color ? 'border-slate-900' : 'border-white'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </View>
    </View>
  );
}
