import type { DeviceTypeId } from '@/core/types';
import type { Lang } from './strings';

export const DEVICE_TYPE_NAMES: Record<Lang, Record<DeviceTypeId, string>> = {
  ar: {
    resistance: 'جهاز مقاومة (سخان، إضاءة)',
    electronics: 'جهاز إلكتروني (تلفزيون، كمبيوتر)',
    small_motor: 'محرك صغير (مروحة)',
    medium_motor: 'محرك متوسط (ثلاجة، مضخة)',
    large_motor: 'محرك كبير (مكيف، غسالة)',
  },
  en: {
    resistance: 'Resistive device (heater, lighting)',
    electronics: 'Electronic device (TV, computer)',
    small_motor: 'Small motor (fan)',
    medium_motor: 'Medium motor (fridge, pump)',
    large_motor: 'Large motor (AC, washing machine)',
  },
};

export const SAMPLE_APPLIANCE_NAMES: Record<Lang, string[]> = {
  ar: [
    'لمبة LED',
    'تلفزيون LED',
    'مروحة سقف',
    'ثلاجة حديثة',
    'مضخة ماء',
    'غسالة أوتوماتيك',
    'راوتر إنترنت',
    'شاحن هواتف',
  ],
  en: [
    'LED bulb',
    'LED TV',
    'Ceiling fan',
    'Modern fridge',
    'Water pump',
    'Washing machine',
    'Internet router',
    'Phone chargers',
  ],
};

export const SOLAR_PANEL_TYPE_NAMES: Record<Lang, { id: string; label: string }> = {
  ar: { id: 'mono', label: 'أحادي البلورية (Mono PERC)' },
  en: { id: 'mono', label: 'Monocrystalline (Mono PERC)' },
};
