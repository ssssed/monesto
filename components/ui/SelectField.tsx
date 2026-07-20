import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';

export interface SelectOption<T extends string | number> {
  label: string;
  value: T;
}

interface Props<T extends string | number> {
  label?: string;
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  required?: boolean;
  testID?: string;
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Выберите…',
  required,
  testID,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View className="mb-3" testID={testID}>
      {label ? (
        <Text className="mb-2 text-sm font-medium text-slate-700">
          {label}
          {required ? <Text className="text-red-500"> *</Text> : null}
        </Text>
      ) : null}
      <Pressable
        className="rounded-xl border border-slate-200 bg-white px-3 py-3"
        onPress={() => setOpen(true)}>
        <Text className={`text-base ${selected ? 'text-slate-900' : 'text-slate-500'}`}>
          {selected?.label ?? placeholder}
        </Text>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text className="mb-3 text-center text-base font-semibold text-slate-900">
          {label ?? 'Выберите'}
        </Text>
        {options.map((option) => (
          <Pressable
            key={String(option.value)}
            className={`mb-2 rounded-xl px-4 py-3 ${value === option.value ? 'bg-blue-500' : 'bg-slate-50'}`}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
            }}>
            <Text
              className={`text-base ${value === option.value ? 'font-semibold text-white' : 'text-slate-900'}`}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}
