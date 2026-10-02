import { Button, DatePicker, Input, Label, SlidingToggleGroup } from '@monesto/rune';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '@/shared/config/routes';
import {
  AssetStylePicker,
  type AssetIconName,
} from '@/entities/wishlist';
import { PageHeader } from '@/shared/ui/page-header';
import { PageTransition } from '@/shared/ui/page-transition';
import * as db from '@/kernel/db';
import type { MoneyFlowCurrency } from '@/kernel/types';
import { formScroll, formShell, numeric } from '@/shared/lib/layout';

export function WishlistForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<MoneyFlowCurrency>('rub');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [style, setStyle] = useState<{
    icon: AssetIconName;
    bgColor: string;
    iconColor: string;
  }>({ icon: 'sparkles', bgColor: '#FCE7F3', iconColor: '#DB2777' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await db.createWishlistItem({
        name: name.trim(),
        currency,
        price: price.trim() ? numeric(price) : null,
        url: url.trim() || null,
        note: note.trim() || null,
        icon: style.icon,
        bg_color: style.bgColor,
        icon_color: style.iconColor,
        planned_date: plannedDate || null,
      });
      await navigate({
        to: ROUTES.wishlist.index,
        search: { tab: plannedDate ? 'planned' : 'items' },
        replace: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition fill>
      <main className={formShell}>
        <PageHeader title="Новая хотелка" backTo={ROUTES.wishlist.index} />

        <div className={formScroll}>
          <div>
            <Label required>Название</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, наушники"
            />
          </div>

          <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Цена
              </Label>
              <SlidingToggleGroup
                size="sm"
                value={currency}
                onValueChange={(key) => setCurrency(key as MoneyFlowCurrency)}
                options={[
                  { value: 'rub', label: '₽' },
                  { value: 'usd', label: '$' },
                ]}
              />
            </div>
            <Input
              format="money"
              suffix={currency === 'usd' ? '$' : '₽'}
              withRelativeSuffix
              className="border-0 bg-white text-lg font-bold shadow-none ring-1 ring-slate-200"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Необязательно"
            />
          </div>

          <div>
            <Label>Ссылка</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Необязательно"
            />
          </div>

          <div>
            <Label>Заметка</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Необязательно"
            />
          </div>

          <div>
            <Label>Когда планирую купить</Label>
            <DatePicker
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Необязательно. Если указать — хотелка сразу попадёт в «Запланировано»
            </p>
          </div>

          <AssetStylePicker
            icon={style.icon}
            bgColor={style.bgColor}
            iconColor={style.iconColor}
            onIconChange={(icon) => setStyle((s) => ({ ...s, icon }))}
            onBgChange={(bgColor) => setStyle((s) => ({ ...s, bgColor }))}
            onIconColorChange={(iconColor) => setStyle((s) => ({ ...s, iconColor }))}
          />
        </div>

        <div className="shrink-0 space-y-2 border-t border-slate-100 bg-[#f8fafc] px-0 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!name.trim() || saving}
            onClick={() => void save()}
          >
            Добавить
          </Button>
          <button
            type="button"
            className="w-full py-2 text-center text-sm text-slate-400"
            onClick={() => void navigate({ to: ROUTES.wishlist.index })}
          >
            Отмена
          </button>
        </div>
      </main>
    </PageTransition>
  );
}
