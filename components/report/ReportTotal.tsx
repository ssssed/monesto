import { Text, View } from 'react-native';

interface Props {
  label: string;
  amount: string;
  highlight?: boolean;
  testID?: string;
}

export function ReportTotal({ label, amount, highlight, testID }: Props) {
  return (
    <View
      className={`mt-2 flex-row items-center justify-between border-t border-slate-100 pt-3 ${highlight ? 'rounded-xl bg-blue-50 px-3 py-3' : ''}`}
      testID={testID}>
      <Text className={`text-sm ${highlight ? 'font-bold text-blue-600' : 'font-semibold text-slate-900'}`}>
        {label}
      </Text>
      <Text className={`text-sm ${highlight ? 'font-bold text-blue-600' : 'font-semibold text-slate-900'}`}>
        {amount}
      </Text>
    </View>
  );
}
