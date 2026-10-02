import {
  Button,
  Input,
  Label,
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SlidingToggleGroup
} from '@monesto/rune';
import { formatDateDisplay } from '@monesto/rune';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { CalendarClock, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  AssetAvatar,
  AssetStylePicker,
  PlanDateSheet,
  StylePreviewFooter,
  type AssetIconName
} from '@/entities/wishlist';
import * as db from '@/kernel/db';
import type { MoneyFlowCurrency, WishlistItem } from '@/kernel/types';
import { ROUTES } from '@/shared/config/routes';
import { formatMoney } from '@/shared/lib/format';
import { nestedShell, numeric } from '@/shared/lib/layout';
import { ErrorPage } from '@/shared/ui/error-page';
import { PageHeader } from '@/shared/ui/page-header';
import { PageTransition } from '@/shared/ui/page-transition';

const route = getRouteApi(ROUTES.wishlist.detail);

export function WishlistDetail() {
  const { id } = route.useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<WishlistItem | null | undefined>(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState<MoneyFlowCurrency>('rub');
  const [editUrl, setEditUrl] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editStyle, setEditStyle] = useState<{
    icon: AssetIconName;
    bgColor: string;
    iconColor: string;
  }>({ icon: 'sparkles', bgColor: '#FCE7F3', iconColor: '#DB2777' });

  useEffect(() => {
    void db.getWishlistItemById(Number(id)).then(setItem);
  }, [id]);

  useEffect(() => {
    if (!item || !editOpen) return;
    setEditName(item.name);
    setEditPrice(item.price != null ? String(item.price) : '');
    setEditCurrency(item.currency);
    setEditUrl(item.url ?? '');
    setEditNote(item.note ?? '');
    setEditStyle({
      icon: item.icon as AssetIconName,
      bgColor: item.bg_color,
      iconColor: item.icon_color
    });
  }, [item, editOpen]);

  if (item === undefined) {
    return <main className={nestedShell}>Загрузка…</main>;
  }
  if (item === null) {
    return (
      <ErrorPage
        title="Хотелка не найдена"
        message="Возможно, её уже удалили"
        homeTo={ROUTES.wishlist.index}
      />
    );
  }

  const saveEdit = async () => {
    if (!editName.trim()) return;
    await db.updateWishlistItem(item.id, {
      name: editName.trim(),
      price: editPrice.trim() ? numeric(editPrice) : null,
      url: editUrl.trim() || null,
      note: editNote.trim() || null,
      icon: editStyle.icon,
      bg_color: editStyle.bgColor,
      icon_color: editStyle.iconColor
    });
    const updated = await db.getWishlistItemById(item.id);
    setItem(updated);
    setEditOpen(false);
  };

  const remove = async () => {
    await db.deleteWishlistItem(item.id);
    await navigate({ to: ROUTES.wishlist.index, replace: true });
  };

  const confirmPlan = async (plannedDateIso: string) => {
    await db.updateWishlistItem(item.id, { planned_date: plannedDateIso });
    const updated = await db.getWishlistItemById(item.id);
    setItem(updated);
    setPlanOpen(false);
  };

  return (
    <PageTransition>
      <main className={nestedShell}>
        <PageHeader
          title="Хотелка"
          backTo={ROUTES.wishlist.index}
          right={
            <Button variant="link" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />

        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <AssetAvatar
            icon={item.icon}
            bgColor={item.bg_color}
            iconColor={item.icon_color}
            size="lg"
          />
          <div>
            <p className="text-xl font-bold text-slate-900">{item.name}</p>
            <p className="mt-1 text-lg font-semibold text-slate-500">
              {item.price != null
                ? formatMoney(item.price, item.currency === 'usd' ? 'usd' : 'rub')
                : 'Цена не указана'}
            </p>
          </div>
        </div>

        {item.note ? (
          <p className="mb-4 rounded-2xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-500">
            {item.note}
          </p>
        ) : null}

        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-100 py-3 text-sm font-semibold text-[var(--color-primary)]"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть ссылку
          </a>
        ) : null}

        <div className="space-y-2.5 pt-2 pb-4">
          {item.planned_date ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <CalendarClock className="h-4 w-4" />
                Запланировано на {formatDateDisplay(item.planned_date)}
              </div>
              <button
                type="button"
                onClick={() => setPlanOpen(true)}
                className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
              >
                Изменить
              </button>
            </div>
          ) : (
            <Button className="w-full" size="lg" onClick={() => setPlanOpen(true)}>
              Запланировать покупку
            </Button>
          )}
          <button
            type="button"
            onClick={() => void remove()}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </button>
        </div>
      </main>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Редактировать</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div>
              <Label required>Название</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Цена
                </Label>
                <SlidingToggleGroup
                  size="sm"
                  value={editCurrency}
                  onValueChange={(key) => setEditCurrency(key as MoneyFlowCurrency)}
                  options={[
                    { value: 'rub', label: '₽' },
                    { value: 'usd', label: '$' }
                  ]}
                />
              </div>
              <Input
                format="money"
                suffix={editCurrency === 'usd' ? '$' : '₽'}
                withRelativeSuffix
                className="border-0 bg-white text-lg font-bold shadow-none ring-1 ring-slate-200"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <div>
              <Label>Ссылка</Label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
            </div>
            <div>
              <Label>Заметка</Label>
              <Input value={editNote} onChange={(e) => setEditNote(e.target.value)} />
            </div>
            <AssetStylePicker
              icon={editStyle.icon}
              bgColor={editStyle.bgColor}
              iconColor={editStyle.iconColor}
              onIconChange={(icon) => setEditStyle((s) => ({ ...s, icon }))}
              onBgChange={(bgColor) => setEditStyle((s) => ({ ...s, bgColor }))}
              onIconColorChange={(iconColor) => setEditStyle((s) => ({ ...s, iconColor }))}
            />
          </SheetBody>
          <SheetFooter className="sm:flex-col">
            <StylePreviewFooter
              onSave={() => void saveEdit()}
              onCancel={() => setEditOpen(false)}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PlanDateSheet
        item={planOpen ? item : null}
        onOpenChange={(open) => setPlanOpen(open)}
        onConfirm={(iso) => void confirmPlan(iso)}
      />
    </PageTransition>
  );
}
