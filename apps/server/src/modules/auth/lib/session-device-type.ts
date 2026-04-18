import { SessionDeviceType } from '@prisma/client';
import { UAParser } from 'ua-parser-js';

/**
 * Грубая классификация клиента по User-Agent для одной сессии на (user, класс устройства).
 * Одинаковый тип у двух разных устройств теоретически возможен (два Android-телефона) —
 * это компромисс без отпечатка с клиента.
 */
export function sessionDeviceTypeFromUserAgent(
  userAgent: string | undefined,
): SessionDeviceType {
  if (!userAgent?.trim()) {
    return SessionDeviceType.unknown;
  }

  const parser = new UAParser(userAgent);
  const osName = (parser.getOS().name ?? '').toLowerCase();
  const ua = userAgent.toLowerCase();

  if (
    osName.includes('ios') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('ipados')
  ) {
    return SessionDeviceType.ios;
  }

  if (osName.includes('android') || ua.includes('android')) {
    return SessionDeviceType.android;
  }

  if (osName.includes('mac')) {
    return SessionDeviceType.macos;
  }

  if (osName.includes('windows')) {
    return SessionDeviceType.windows;
  }

  if (
    osName.includes('linux') ||
    osName.includes('ubuntu') ||
    osName.includes('debian') ||
    ua.includes('linux')
  ) {
    return SessionDeviceType.linux;
  }

  return SessionDeviceType.web;
}
