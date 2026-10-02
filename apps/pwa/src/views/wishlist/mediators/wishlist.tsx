import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@monesto/rune';
import { getRouteApi } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { ROUTES } from '@/shared/config/routes';
import { shell } from '@/shared/lib/layout';
import { PageHeader } from '@/shared/ui/page-header';
import { PageTransition } from '@/shared/ui/page-transition';
import * as db from '@/kernel/db';
import { PlanDateSheet } from '@/entities/wishlist';
import type { WishlistItem } from '@/kernel/types';
import { AddFab } from '../ui/add-fab';
import { WishlistList } from './wishlist-list';

const route = getRouteApi(ROUTES.wishlist.index);

export function Wishlist() {
  const { tab } = route.useSearch();
  const [activeTab, setActiveTab] = useState<'items' | 'planned'>(tab ?? 'items');
  const [allItems, setAllItems] = useState<WishlistItem[] | null>(null);
  const [planTarget, setPlanTarget] = useState<WishlistItem | null>(null);

  const reload = useCallback(() => {
    void db.getAllWishlistItems().then(setAllItems);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const unplanned = (allItems ?? []).filter((item) => !item.planned_date);
  const planned = (allItems ?? []).filter((item) => item.planned_date);

  const confirmPlan = async (plannedDateIso: string) => {
    if (!planTarget) return;
    await db.updateWishlistItem(planTarget.id, { planned_date: plannedDateIso });
    setPlanTarget(null);
    reload();
  };

  return (
    <PageTransition>
      <main className={shell}>
        <PageHeader title="Вишлист" backTo={ROUTES.home} />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'items' | 'planned')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items" className="gap-1.5">
              Хотелки
              <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[11px]">
                {unplanned.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="planned" className="gap-1.5">
              Запланировано
              <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[11px]">
                {planned.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="items">
            <WishlistList
              items={unplanned}
              variant="items"
              onDeleted={reload}
              onPlanRequested={setPlanTarget}
            />
          </TabsContent>
          <TabsContent value="planned">
            <WishlistList items={planned} variant="planned" onDeleted={reload} />
          </TabsContent>
        </Tabs>
      </main>

      <PlanDateSheet
        item={planTarget}
        onOpenChange={(open) => {
          if (!open) setPlanTarget(null);
        }}
        onConfirm={(iso) => void confirmPlan(iso)}
      />

      <AddFab />
    </PageTransition>
  );
}
