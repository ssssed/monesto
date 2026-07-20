import { Text, View } from 'react-native';

interface Props {
  label: string;
  amount: string;
  detail?: string;
  testID?: string;
}

export function ReportLineItem({ label, amount, detail, testID }: Props) {
  return (
    <View className="mb-2 flex-row items-start justify-between" testID={testID}>
      <View className="mr-3 flex-1">
        <Text className="text-sm text-slate-900">{label}</Text>
        {detail ? <Text className="text-xs text-slate-500">{detail}</Text> : null}
      </View>
      <Text className="text-sm font-medium text-slate-900">{amount}</Text>
    </View>
  );
}
