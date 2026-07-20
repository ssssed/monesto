import { Text, View } from 'react-native';

interface Props {
  title: string;
  children: React.ReactNode;
}

export function ReportSection({ title, children }: Props) {
  return (
    <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <Text className="mb-3 text-base font-semibold text-slate-900">{title}</Text>
      {children}
    </View>
  );
}
