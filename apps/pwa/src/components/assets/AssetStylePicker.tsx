import { Button, Label } from '@monesto/rune';
import { cn } from '@monesto/rune';

import {
  ASSET_ICON_OPTIONS,
  BG_COLOR_OPTIONS,
  ICON_COLOR_OPTIONS,
  type AssetIconName,
} from '@/lib/providers/assetIcons';
import { AssetAvatar } from './AssetAvatar';

export function AssetStylePicker({
  icon,
  bgColor,
  iconColor,
  onIconChange,
  onBgChange,
  onIconColorChange,
}: {
  icon: AssetIconName;
  bgColor: string;
  iconColor: string;
  onIconChange: (v: AssetIconName) => void;
  onBgChange: (v: string) => void;
  onIconColorChange: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Иконка</Label>
        <div className="mt-2 flex flex-wrap gap-2.5 p-1">
          {ASSET_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.name}
              type="button"
              onClick={() => onIconChange(opt.name)}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                icon === opt.name
                  ? 'ring-2 ring-[var(--color-primary)] ring-offset-2'
                  : '',
              )}
              style={{ backgroundColor: bgColor }}
              aria-label={opt.label}
            >
              <AssetAvatar
                icon={opt.name}
                bgColor="transparent"
                iconColor={iconColor}
                size="sm"
                className="h-8 w-8"
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Цвет фона</Label>
        <div className="mt-2 flex flex-wrap gap-2.5 p-1">
          {BG_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onBgChange(color)}
              className={cn(
                'h-8 w-8 shrink-0 rounded-full border',
                bgColor === color
                  ? 'ring-2 ring-slate-900 ring-offset-2'
                  : 'border-slate-200',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Цвет иконки</Label>
        <div className="mt-2 flex flex-wrap gap-2.5 p-1">
          {ICON_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onIconColorChange(color)}
              className={cn(
                'relative h-8 w-8 shrink-0 rounded-full',
                iconColor === color ? 'ring-2 ring-slate-900 ring-offset-2' : '',
              )}
              style={{ backgroundColor: color }}
            >
              {iconColor === color ? (
                <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white" />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function StylePreviewFooter({
  onSave,
  onCancel,
  saveLabel = 'Сохранить',
}: {
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="space-y-3 pt-2">
      <Button className="w-full" size="lg" onClick={onSave}>
        {saveLabel}
      </Button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full py-2 text-center text-sm font-medium text-slate-400"
      >
        Отмена
      </button>
    </div>
  );
}
