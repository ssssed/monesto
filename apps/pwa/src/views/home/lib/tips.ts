export interface SeasonalTip {
  id: string;
  title: string;
  body: string;
}

export function getSeasonalTips(today: Date = new Date()): SeasonalTip[] {
  const month = today.getMonth() + 1;
  const tips: SeasonalTip[] = [];

  if (month === 11 || month === 12) {
    tips.push({
      id: 'nye-buffer',
      title: 'Перед Новым годом расходы обычно растут',
      body: 'Заложите буфер на подарки и праздничный стол — разовым расходом или правилом «остаток на праздники».',
    });
  }

  if (month >= 5 && month <= 8) {
    tips.push({
      id: 'summer-vacation',
      title: 'Сезон отпусков',
      body: 'Если едете отдыхать — укажите даты отпуска: зарплата пересчитается по рабочим дням, а отпускные попадут в отчёт.',
    });
  }

  if (month === 1) {
    tips.push({
      id: 'january-holidays',
      title: 'Январские праздники',
      body: 'Выплаты в начале года часто сдвигаются. Сверьте даты цикла — производственный календарь уже учтён.',
    });
  }

  if (month === 3 || month === 4) {
    tips.push({
      id: 'spring-taxes',
      title: 'Весна — время разовых платежей',
      body: 'Страховка, налоги, школьные сборы: добавьте разовым расходом в нужный цикл, чтобы остаток не «уплыл».',
    });
  }

  if (month === 9) {
    tips.push({
      id: 'september-school',
      title: 'Сентябрь бьёт по бюджету',
      body: 'Учёба и сезонные покупки лучше заложить заранее — одним разовым расходом на ближайший цикл.',
    });
  }

  return tips;
}
