export type WishlistTab = 'items' | 'planned' | 'completed';

let pendingTab: WishlistTab | null = null;

/** Запоминает вкладку, на которую нужно вернуться после навигации назад. */
export function rememberWishlistTab(tab: WishlistTab): void {
  pendingTab = tab;
}

export function readWishlistTab(): WishlistTab | null {
  return pendingTab;
}

export function clearWishlistTab(): void {
  pendingTab = null;
}
