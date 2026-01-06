export function getAdditionalHeight(elRect: DOMRect, keyboardHeight = 377): number {
	const windowHeight = window.innerHeight;

	// Максимальная доступная нижняя граница (над клавиатурой)
	const maxBottom = windowHeight - keyboardHeight;

	// Если элемент уже виден полностью, добавка не нужна
	if (elRect?.bottom <= maxBottom) return 0;

	// Сколько нужно сдвинуть контейнер вверх
	const extraHeight = elRect?.bottom - maxBottom;
	console.log(extraHeight, elRect);

	return extraHeight;
}
