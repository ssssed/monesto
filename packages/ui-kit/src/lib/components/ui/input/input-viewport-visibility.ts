const VIEWPORT_TOLERANCE_PX = 1;

/** Порог: слой с меньшей непрозрачностью не считаем перекрытием (видно содержимое под ним). */
const MAX_OVERLAY_OPACITY_TO_IGNORE = 0.04;

/**
 * Селекторы панелей портала (дроер/диалог), которые могут лежать поверх инпута, не будучи его предком в DOM.
 */
const FOREIGN_PANEL_SELECTOR = '[data-slot="drawer-content"], [data-dialog-content]';

/**
 * Границы визуального viewport (учёт мобильного UI, зума).
 */
function getVisualViewportBounds(): { top: number; left: number; width: number; height: number } {
	if (typeof window === 'undefined') {
		return { top: 0, left: 0, width: 0, height: 0 };
	}
	const vv = window.visualViewport;
	if (vv) {
		return {
			top: vv.offsetTop,
			left: vv.offsetLeft,
			width: vv.width,
			height: vv.height
		};
	}
	return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
}

/**
 * Пересечение прямоугольника элемента с визуальным viewport.
 * @param rect — клиентский прямоугольник элемента
 */
function getRectIntersectionWithVisualViewport(rect: DOMRect): { iw: number; ih: number } {
	const { top: vt, left: vl, width: vw, height: vh } = getVisualViewportBounds();
	const vb = vt + vh;
	const vr = vl + vw;
	const interTop = Math.max(rect.top, vt);
	const interBottom = Math.min(rect.bottom, vb);
	const interLeft = Math.max(rect.left, vl);
	const interRight = Math.min(rect.right, vr);
	return {
		iw: Math.max(0, interRight - interLeft),
		ih: Math.max(0, interBottom - interTop)
	};
}

/**
 * Достаточная видимость зоны значения (без требования целиком rect — высокий lg-инпут).
 * @param rect — клиентский прямоугольник элемента
 */
function isValueRegionVisiblyInViewport(rect: DOMRect): boolean {
	const t = VIEWPORT_TOLERANCE_PX;
	if (rect.width <= 0 || rect.height <= 0) return false;

	const { top: vt, left: vl, width: vw, height: vh } = getVisualViewportBounds();
	const vb = vt + vh;
	const vr = vl + vw;

	const { iw, ih } = getRectIntersectionWithVisualViewport(rect);
	const minH = Math.max(20, rect.height * 0.22);
	const minW = Math.max(24, rect.width * 0.28);
	if (ih < minH || iw < minW) return false;

	const cx = rect.left + rect.width / 2;
	const cy = rect.top + rect.height * 0.22;
	return (
		cx >= vl - t &&
		cx <= vr + t &&
		cy >= vt - t &&
		cy <= vb + t
	);
}

/**
 * Цепочка предков не скрыта через display/visibility/opacity.
 * @param el — элемент
 */
function isElementChainDisplayed(el: HTMLElement): boolean {
	let node: HTMLElement | null = el;
	while (node) {
		const s = getComputedStyle(node);
		if (s.visibility === 'hidden' || s.display === 'none') return false;
		const op = parseFloat(s.opacity);
		if (!Number.isNaN(op) && op === 0) return false;
		node = node.parentElement;
	}
	return true;
}

/**
 * Слой hit-test, который не скрывает превью: оверлеи дроера/диалога (vaul, bits-ui) или почти прозрачная плоскость.
 * @param node — узел из стека `elementsFromPoint`
 */
function isIgnorableHitStackLayer(node: Element): boolean {
	if (!(node instanceof HTMLElement)) return false;
	const slot = node.dataset.slot ?? node.getAttribute('data-slot');
	if (slot === 'drawer-overlay') return true;
	if (node.hasAttribute('data-vaul-overlay')) return true;
	// bits-ui Dialog/Drawer: оверлей портала
	if (node.hasAttribute('data-dialog-overlay')) return true;
	const op = parseFloat(getComputedStyle(node).opacity);
	if (!Number.isNaN(op) && op < MAX_OVERLAY_OPACITY_TO_IGNORE) return true;
	return false;
}

/**
 * Попадание точки в ту же «ветку», что и отслеживаемый корень (кнопка/обёртка инпута).
 * @param node — узел из стека `elementsFromPoint`
 * @param target — корень отслеживаемого инпута
 */
function isHitElementInTargetSubtree(node: Element, target: HTMLElement): boolean {
	if (target === node) return true;
	if (target.contains(node)) return true;
	if (node.contains(target)) return true;
	return false;
}

/**
 * Доходит ли луч до инпута, если пропускать только затемняющие/прозрачные слои.
 * @param x — координата X в координатах viewport
 * @param y — координата Y в координатах viewport
 * @param target — корень отслеживаемого инпута
 */
function isTargetReachableThroughStack(x: number, y: number, target: HTMLElement): boolean {
	const list = document.elementsFromPoint(x, y);
	for (const node of list) {
		if (!(node instanceof Element)) continue;
		if (isIgnorableHitStackLayer(node)) continue;
		return isHitElementInTargetSubtree(node, target);
	}
	return false;
}

/**
 * Точки в полосе значения (верх + низ), чтобы учесть перекрытие нижней части поля шитом клавиатуры.
 * @param rect — клиентский rect инпута
 */
function getValueRegionSamplePoints(rect: DOMRect): { x: number; y: number }[] {
	const yTop = rect.top + rect.height * 0.22;
	const yBottom = rect.bottom - Math.max(4, rect.height * 0.08);
	const ix = Math.max(2, Math.min(rect.width * 0.18, 12));
	const cx = rect.left + rect.width / 2;
	return [
		{ x: cx, y: yTop },
		{ x: rect.left + ix, y: yTop },
		{ x: rect.right - ix, y: yTop },
		{ x: cx, y: yBottom }
	];
}

/**
 * Зона значения перекрыта панелью другого дроера/диалога (например клавиатура поверх поля внутри модалки).
 * Hit-test с `node.contains(target)` даёт ложное «видно» из‑за общего предка модалки.
 * @param target — отслеживаемый корень инпута
 * @param rect — его `getBoundingClientRect()`
 */
function isValueRegionCoveredByForeignPortalPanel(target: HTMLElement, rect: DOMRect): boolean {
	const panels = document.querySelectorAll(FOREIGN_PANEL_SELECTOR);
	const points = getValueRegionSamplePoints(rect);

	for (const node of panels) {
		if (!(node instanceof HTMLElement)) continue;
		if (node.contains(target)) continue;

		const s = getComputedStyle(node);
		if (s.display === 'none' || s.visibility === 'hidden') continue;
		const op = parseFloat(s.opacity);
		if (!Number.isNaN(op) && op === 0) continue;

		const pr = node.getBoundingClientRect();
		if (pr.width < 4 || pr.height < 4) continue;

		for (const { x, y } of points) {
			if (x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom) return true;
		}
	}
	return false;
}

/**
 * Hit-test по точкам в полосе значения: все попавшие в visual viewport должны «видеть» инпут сквозь допустимые слои.
 * @param target — элемент
 * @param rect — клиентский rect
 */
function isValueRegionHitTestClear(target: HTMLElement, rect: DOMRect): boolean {
	const { top: vt, left: vl, width: vw, height: vh } = getVisualViewportBounds();
	const vb = vt + vh;
	const vr = vl + vw;

	const points = getValueRegionSamplePoints(rect);
	let tested = false;
	for (const { x, y: py } of points) {
		if (x < vl || py < vt || x > vr || py > vb) continue;
		tested = true;
		if (!isTargetReachableThroughStack(x, py, target)) return false;
	}
	return tested;
}

/**
 * Инпут достаточно виден, чтобы не дублировать заголовок на клавиатуре.
 * @param el — DOM-элемент или `null`
 */
export function isElementActuallyVisibleToUser(el: HTMLElement | null): boolean {
	if (!el || typeof document === 'undefined' || typeof window === 'undefined') return false;
	if (!isElementChainDisplayed(el)) return false;

	const rect = el.getBoundingClientRect();
	if (!isValueRegionVisiblyInViewport(rect)) return false;
	if (isValueRegionCoveredByForeignPortalPanel(el, rect)) return false;

	return isValueRegionHitTestClear(el, rect);
}

/**
 * Подписка на видимость элемента: скролл/ресайз, visualViewport, размер элемента.
 * @param el — наблюдаемый элемент
 * @param onChange — флаг «достаточно виден пользователю»
 */
export function subscribeElementActuallyVisibleToUser(
	el: HTMLElement,
	onChange: (visible: boolean) => void
): () => void {
	function check() {
		onChange(isElementActuallyVisibleToUser(el));
	}

	check();

	let burstFrame = 0;
	function burst() {
		check();
		if (burstFrame++ < 28) requestAnimationFrame(burst);
	}
	requestAnimationFrame(burst);

	const onScrollOrResize = () => check();
	window.addEventListener('scroll', onScrollOrResize, true);
	window.addEventListener('resize', onScrollOrResize);
	const vv = typeof window !== 'undefined' ? window.visualViewport : null;
	if (vv) {
		vv.addEventListener('resize', onScrollOrResize);
		vv.addEventListener('scroll', onScrollOrResize);
	}
	const ro = new ResizeObserver(() => check());
	ro.observe(el);

	return () => {
		window.removeEventListener('scroll', onScrollOrResize, true);
		window.removeEventListener('resize', onScrollOrResize);
		if (vv) {
			vv.removeEventListener('resize', onScrollOrResize);
			vv.removeEventListener('scroll', onScrollOrResize);
		}
		ro.disconnect();
	};
}
