import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function formatDate(date: Date | string | number): string {
	return format(new Date(date), 'd MMM yyyy', { locale: ru });
}
