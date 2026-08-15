export type EquationKey =
  | 'totalEnergy'
  | 'peakPower'
  | 'surgePower'
  | 'inverter'
  | 'battery'
  | 'batterySeparate'
  | 'solarPanels'
  | 'batteryCurrent'
  | 'solarCurrent'
  | 'loadCurrent'
  | 'cableSize'
  | 'autonomy'
  | 'voltageGuide';

export interface EquationDefinition {
  title: string;
  formula: string;
  variables: string[];
  example: string;
}

export const EQUATION_KEYS: EquationKey[] = [
  'totalEnergy',
  'peakPower',
  'surgePower',
  'inverter',
  'battery',
  'batterySeparate',
  'solarPanels',
  'batteryCurrent',
  'solarCurrent',
  'loadCurrent',
  'cableSize',
  'autonomy',
  'voltageGuide',
];

export const EQUATION_CATEGORIES: { id: string; keys: EquationKey[] }[] = [
  { id: 'energy', keys: ['totalEnergy', 'peakPower', 'surgePower'] },
  { id: 'components', keys: ['inverter', 'batterySeparate', 'solarPanels'] },
  { id: 'currents', keys: ['batteryCurrent', 'solarCurrent', 'loadCurrent', 'cableSize'] },
  { id: 'efficiency', keys: ['autonomy', 'voltageGuide'] },
];

export const EQUATIONS_AR: Record<EquationKey, EquationDefinition> = {
  totalEnergy: {
    title: 'حساب الطاقة اليومية الإجمالية',
    formula: 'E_total = E_day + E_night',
    variables: [
      'E_day = الطاقة النهارية (ك.و.س)',
      'E_night = الطاقة الليلية (ك.و.س)',
      'E_day = Σ[Q × P × H_day] ÷ 1000',
      'E_night = Σ[Q × P × H_night] ÷ 1000',
    ],
    example: 'النهار: 15 ك.و.س، الليل: 25 ك.و.س ← الإجمالي: 40 ك.و.س',
  },
  peakPower: {
    title: 'حساب أقصى حمل متزامن',
    formula: 'P_peak = (Σ[Q × P]) × 0.7',
    variables: [
      '0.7 = عامل التزامن (70% من الأجهزة تعمل معاً)',
      'Σ = مجموع قدرات جميع الأجهزة',
      'الأجهزة نادراً ما تعمل كلها في نفس الوقت',
    ],
    example: 'إذا كان مجموع القدرات 3000 واط، أقصى حمل = 3000 × 0.7 = 2100 واط',
  },
  surgePower: {
    title: 'حساب تيار البدء الأقصى',
    formula: 'P_surge = Σ[Q × P × surge_factor]',
    variables: [
      'surge_factor = 1.0 للإلكترونيات',
      'surge_factor = 2.5 للمحركات الصغيرة',
      'surge_factor = 4.0 للمحركات المتوسطة',
      'surge_factor = 6.0 للمحركات الكبيرة',
      'المحركات تستهلك 3-6 أضعاف طاقتها عند البدء',
    ],
    example: 'ثلاجة 150 واط × عامل 4.0 = 600 واط عند البدء',
  },
  inverter: {
    title: 'حساب حجم الإنفرتر',
    formula: 'Inverter_size = MAX(P_peak × 1.25, P_surge ÷ 2)',
    variables: [
      '1.25 = هامش أمان 25%',
      'يجب أن يتحمل الإنفرتر 50% من تيار البدء على الأقل',
      'يتم التقريب لأقرب حجم قياسي (1000, 1500, 2000, 3000... واط)',
    ],
    example: 'أقصى حمل 2000 واط × 1.25 = 2500 واط ← إنفرتر 3000 واط',
  },
  battery: {
    title: 'حساب سعة البطارية (الطريقة التقليدية)',
    formula: 'Battery_capacity = (E_total × days_autonomy) ÷ (DOD × η_batt)',
    variables: [
      'E_total = الطاقة الإجمالية (نهار+ليل)',
      'days_autonomy = عدد أيام الاستقلالية',
      'DOD = عمق التفريغ',
      'η_batt = كفاءة البطارية',
    ],
    example: '40 ك.و.س × 2 يوم ÷ (0.8 × 0.95) = 105.3 ك.و.س',
  },
  batterySeparate: {
    title: 'حساب سعة البطارية (النهج الصحيح)',
    formula: 'Battery_capacity = (E_night × days_autonomy) ÷ (DOD × η_batt)',
    variables: [
      'E_night = الطاقة الليلية فقط (ك.و.س)',
      'E_day = الطاقة النهارية (تُستهلك مباشرة من الألواح)',
      'days_autonomy = عدد أيام الاستقلالية',
      'DOD = عمق التفريغ (مثلاً 0.8 لـ 80%)',
      'η_batt = كفاءة البطارية (0.85 لرصاص-حمض، 0.95 لليثيوم)',
      'ملاحظة: البطارية تخزن فقط الطاقة الليلية',
    ],
    example: 'الطاقة الليلية: 25 ك.و.س، الاستقلالية: 1 يوم ← 25 ÷ (0.8 × 0.95) = 32.9 ك.و.س',
  },
  solarPanels: {
    title: 'حساب قدرة الألواح الشمسية',
    formula: 'P_solar = (E_day + (E_night ÷ η_charge)) × (1 + losses) ÷ H_sun',
    variables: [
      'E_day = الطاقة النهارية (تستهلك مباشرة)',
      'E_night = الطاقة الليلية (تشحن البطارية)',
      'η_charge = كفاءة الشحن (85%)',
      'losses = 0.3 (30% فقد في النظام)',
      'H_sun = متوسط ساعات الشمس الفعالة',
    ],
    example: '15 ك.و.س نهار + (25 ÷ 0.85) ليل = 44.4 ك.و.س ← 44.4 × 1.3 ÷ 5.5 = 10.5 كيلوواط',
  },
  batteryCurrent: {
    title: 'حساب تيار البطارية',
    formula: 'I_batt = P_inverter ÷ V_system',
    variables: [
      'P_inverter = قدرة الإنفرتر (واط)',
      'V_system = جهد النظام (12, 24, 48, 96 فولت)',
      'كلما زاد الجهد قل التيار لنفس القدرة',
      'تقليل التيار يقلل من هبوط الجهد في الكابلات',
    ],
    example: '3000 واط ÷ 48 فولت = 62.5 أمبير',
  },
  solarCurrent: {
    title: 'حساب تيار الشحن الشمسي',
    formula: 'I_solar = P_solar ÷ V_system',
    variables: [
      'P_solar = قدرة الألواح الشمسية (واط)',
      'V_system = جهد النظام',
      'تيار الشحن أعلى من تيار البطارية بسبب كفاءة الشحن',
    ],
    example: '8000 واط ÷ 48 فولت = 166.7 أمبير',
  },
  loadCurrent: {
    title: 'حساب تيار الحمل',
    formula: 'I_load = P_peak ÷ V_system',
    variables: [
      'P_peak = أقصى حمل متزامن (واط)',
      'V_system = جهد النظام (12, 24, 48, 96 فولت)',
      'تيار الحمل هو أقصى تيار يسحبه النظام من الإنفرتر',
    ],
    example: 'أقصى حمل 2100 واط ÷ 48 فولت = 43.75 أمبير',
  },
  cableSize: {
    title: 'حساب مقاس الكابل',
    formula: 'Cable_size = (2 × L × I × ρ) ÷ (V_system × V_drop)',
    variables: [
      'L = طول الكابل (متر)',
      'I = التيار (أمبير)',
      'ρ = 0.0178 (مقاومة النحاس - أوم/مم²/م)',
      'V_drop = 0.03 (هبوط الجهد المسموح به - 3%)',
      'يتم التقريب لأقرب مقاس قياسي (1.5, 2.5, 4, 6, 10, 16... مم²)',
    ],
    example: 'تيار 62.5A، طول 10م: (2×10×62.5×0.0178)÷(48×0.03) = 15.4 مم² ← كابل 16 مم²',
  },
  autonomy: {
    title: 'حساب أيام الاستقلالية',
    formula: 'Days_autonomy = (C_batt × DOD × η) ÷ E_night',
    variables: [
      'C_batt = سعة البطارية (ك.و.س)',
      'DOD = عمق التفريغ',
      'η = كفاءة النظام الكلية (0.85-0.95)',
      'E_night = الطاقة الليلية (ك.و.س)',
      'الاستقلالية المثالية: 2-3 أيام للأنظمة المنزلية',
    ],
    example: '35 ك.و.س × 0.8 × 0.92 ÷ 25 ك.و.س = 1.03 يوم',
  },
  voltageGuide: {
    title: 'دليل اختيار جهد النظام',
    formula: 'الجهد الأعلى = تيار أقل = كفاءة أعلى',
    variables: [
      '12V: تيار عالي، كفاءة 85-90%، للأنظمة الصغيرة',
      '24V: توازن جيد، كفاءة 90-93%، للمنازل الصغيرة',
      '48V: تيار منخفض، كفاءة 95-97%، للمنازل الكبيرة',
      '96V: تيار منخفض جداً، كفاءة 97-98%، للتجاري والصناعي',
    ],
    example: 'نظام 3000 واط: 3000÷12=250A (تيار عالي), 3000÷48=62.5A (تيار منخفض)',
  },
};

export const EQUATIONS_EN: Record<EquationKey, EquationDefinition> = {
  totalEnergy: {
    title: 'Total daily energy calculation',
    formula: 'E_total = E_day + E_night',
    variables: [
      'E_day = day energy (kWh)',
      'E_night = night energy (kWh)',
      'E_day = Σ[Q × P × H_day] ÷ 1000',
      'E_night = Σ[Q × P × H_night] ÷ 1000',
    ],
    example: 'Day: 15 kWh, night: 25 kWh → total: 40 kWh',
  },
  peakPower: {
    title: 'Maximum simultaneous load calculation',
    formula: 'P_peak = (Σ[Q × P]) × 0.7',
    variables: [
      '0.7 = simultaneity factor (70% of appliances run together)',
      'Σ = sum of all appliance powers',
      'Appliances rarely all run at the same time',
    ],
    example: 'If total power is 3000 W, peak load = 3000 × 0.7 = 2100 W',
  },
  surgePower: {
    title: 'Maximum start-up current calculation',
    formula: 'P_surge = Σ[Q × P × surge_factor]',
    variables: [
      'surge_factor = 1.0 for electronics',
      'surge_factor = 2.5 for small motors',
      'surge_factor = 4.0 for medium motors',
      'surge_factor = 6.0 for large motors',
      'Motors draw 3-6 times their rated power at start-up',
    ],
    example: 'Fridge 150 W × factor 4.0 = 600 W at start-up',
  },
  inverter: {
    title: 'Inverter size calculation',
    formula: 'Inverter_size = MAX(P_peak × 1.25, P_surge ÷ 2)',
    variables: [
      '1.25 = 25% safety margin',
      'The inverter must withstand at least 50% of the start-up current',
      'Rounded up to the nearest standard size (1000, 1500, 2000, 3000... W)',
    ],
    example: 'Peak load 2000 W × 1.25 = 2500 W → 3000 W inverter',
  },
  battery: {
    title: 'Battery capacity (traditional method)',
    formula: 'Battery_capacity = (E_total × days_autonomy) ÷ (DOD × η_batt)',
    variables: [
      'E_total = total energy (day + night)',
      'days_autonomy = number of autonomy days',
      'DOD = depth of discharge',
      'η_batt = battery efficiency',
    ],
    example: '40 kWh × 2 days ÷ (0.8 × 0.95) = 105.3 kWh',
  },
  batterySeparate: {
    title: 'Battery capacity (correct approach)',
    formula: 'Battery_capacity = (E_night × days_autonomy) ÷ (DOD × η_batt)',
    variables: [
      'E_night = night energy only (kWh)',
      'E_day = day energy (consumed directly from panels)',
      'days_autonomy = number of autonomy days',
      'DOD = depth of discharge (e.g. 0.8 for 80%)',
      'η_batt = battery efficiency (0.85 lead-acid, 0.95 lithium)',
      'Note: the battery only stores night energy',
    ],
    example: 'Night energy: 25 kWh, autonomy: 1 day → 25 ÷ (0.8 × 0.95) = 32.9 kWh',
  },
  solarPanels: {
    title: 'Solar panel power calculation',
    formula: 'P_solar = (E_day + (E_night ÷ η_charge)) × (1 + losses) ÷ H_sun',
    variables: [
      'E_day = day energy (consumed directly)',
      'E_night = night energy (charges the battery)',
      'η_charge = charge efficiency (85%)',
      'losses = 0.3 (30% system losses)',
      'H_sun = average effective sun hours',
    ],
    example: '15 kWh day + (25 ÷ 0.85) night = 44.4 kWh → 44.4 × 1.3 ÷ 5.5 = 10.5 kW',
  },
  batteryCurrent: {
    title: 'Battery current calculation',
    formula: 'I_batt = P_inverter ÷ V_system',
    variables: [
      'P_inverter = inverter power (W)',
      'V_system = system voltage (12, 24, 48, 96 V)',
      'Higher voltage means lower current for the same power',
      'Lower current reduces voltage drop in cables',
    ],
    example: '3000 W ÷ 48 V = 62.5 A',
  },
  solarCurrent: {
    title: 'Solar charge current calculation',
    formula: 'I_solar = P_solar ÷ V_system',
    variables: [
      'P_solar = solar panel power (W)',
      'V_system = system voltage',
      'Charge current is higher than battery current due to charge efficiency',
    ],
    example: '8000 W ÷ 48 V = 166.7 A',
  },
  loadCurrent: {
    title: 'Load current calculation',
    formula: 'I_load = P_peak ÷ V_system',
    variables: [
      'P_peak = maximum simultaneous load (W)',
      'V_system = system voltage (12, 24, 48, 96 V)',
      'Load current is the maximum current drawn from the inverter',
    ],
    example: 'Peak load 2100 W ÷ 48 V = 43.75 A',
  },
  cableSize: {
    title: 'Cable size calculation',
    formula: 'Cable_size = (2 × L × I × ρ) ÷ (V_system × V_drop)',
    variables: [
      'L = cable length (meters)',
      'I = current (amps)',
      'ρ = 0.0178 (copper resistivity - ohm/mm2/m)',
      'V_drop = 0.03 (allowed voltage drop - 3%)',
      'Rounded up to the nearest standard size (1.5, 2.5, 4, 6, 10, 16... mm2)',
    ],
    example: 'Current 62.5A, length 10m: (2×10×62.5×0.0178)÷(48×0.03) = 15.4 mm2 → 16 mm2 cable',
  },
  autonomy: {
    title: 'Autonomy days calculation',
    formula: 'Days_autonomy = (C_batt × DOD × η) ÷ E_night',
    variables: [
      'C_batt = battery capacity (kWh)',
      'DOD = depth of discharge',
      'η = total system efficiency (0.85-0.95)',
      'E_night = night energy (kWh)',
      'Ideal autonomy: 2-3 days for home systems',
    ],
    example: '35 kWh × 0.8 × 0.92 ÷ 25 kWh = 1.03 days',
  },
  voltageGuide: {
    title: 'System voltage selection guide',
    formula: 'Higher voltage = lower current = higher efficiency',
    variables: [
      '12V: high current, 85-90% efficiency, for small systems',
      '24V: good balance, 90-93% efficiency, for small homes',
      '48V: low current, 95-97% efficiency, for large homes',
      '96V: very low current, 97-98% efficiency, for commercial/industrial',
    ],
    example: '3000 W system: 3000÷12=250A (high current), 3000÷48=62.5A (low current)',
  },
};
