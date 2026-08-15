export type Lang = 'ar' | 'en';

export interface AppStrings {
  appTitle: string;
  appSubtitle: string;
  language: string;
  tabCalculator: string;
  tabEquations: string;
  tabHistory: string;
  resetCalculator: string;

  modeSelectorTitle: string;
  modeDetailed: string;
  modeMonthly: string;
  modeRooftop: string;

  detailedTitle: string;
  detailedSubtitle: string;
  colNumber: string;
  colName: string;
  colQty: string;
  colPower: string;
  colDayHours: string;
  colNightHours: string;
  colType: string;
  colDelete: string;
  addAppliance: string;
  loadSamples: string;
  systemLossLabel: string;
  detailedNote: string;
  namePlaceholder: string;

  monthlyTitle: string;
  monthlySubtitle: string;
  monthlyConsumption: string;
  monthlyConsumptionHint: string;
  kwhPrice: string;
  kwhPriceHint: string;
  consumptionPattern: string;
  patternNormal: string;
  patternDay: string;
  patternNight: string;
  patternBalanced: string;
  monthlyHowItWorks: string;
  estimatedDaily: string;
  distribution: string;
  monthlyCost: string;
  localCurrency: string;
  estimateNote: string;

  rooftopTitle: string;
  rooftopSubtitle: string;
  roofArea: string;
  roofAreaHint: string;
  roofDirection: string;
  dirSouth: string;
  dirSoutheast: string;
  dirSouthwest: string;
  dirEast: string;
  dirWest: string;
  roofAngle: string;
  angle15: string;
  angle20: string;
  angle25: string;
  angle30: string;
  angle35: string;
  panelType: string;
  panelStandard: string;
  panelHigh: string;
  panelPremium: string;
  rooftopWarning: string;
  rooftopMaxPower: string;
  rooftopPanelCount: string;
  rooftopPanelSuffix: string;
  rooftopRequiredArea: string;
  rooftopApprox: string;
  rooftopAreaNote: string;

  settingsTitle: string;
  regionLabel: string;
  regionSunny: string;
  regionModerate: string;
  regionCloudy: string;
  regionNorthern: string;
  sunHoursLabel: string;
  sunHoursHint: string;
  systemVoltageLabel: string;
  voltage12: string;
  voltage24: string;
  voltage48: string;
  voltage96: string;
  batteryTypeLabel: string;
  batteryLifepo4: string;
  batteryLithium: string;
  batteryLeadAcid: string;
  batteryTypeNameLifepo4: string;
  batteryTypeNameLithium: string;
  batteryTypeNameLeadAcid: string;
  cyclesLifepo4: string;
  cyclesLithium: string;
  cyclesLeadAcid: string;
  dodLabel: string;
  dod50: string;
  dod60: string;
  dod70: string;
  dod80: string;
  dod85: string;
  dod90: string;
  expandFuture: string;
  backupDays: string;
  backupDaysCount: string;
  voltageGuideNote: string;
  voltageGuide12: string;
  voltageGuide24: string;
  voltageGuide48: string;
  voltageGuide96: string;

  btnCalculate: string;
  btnReset: string;
  btnExport: string;
  btnPrint: string;

  resultsTitle: string;
  statKwhDay: string;
  statPeak: string;
  statSurge: string;
  statAutonomy: string;
  distributionTitle: string;
  dayKwh: string;
  nightKwh: string;
  dayNightRatio: string;
  distributionNote: string;
  chartDay: string;
  chartNight: string;
  dayWord: string;
  nightWord: string;

  inverterTitle: string;
  specsTitle: string;
  batteryTitle: string;
  solarTitle: string;
  systemVoltage: string;
  continuousPower: string;
  peakPowerCap: string;
  efficiency: string;
  phase: string;
  phaseSingle: string;
  phaseThree: string;
  batteryType: string;
  batteryCapacity: string;
  batteryAh: string;
  dodValue: string;
  nightEnergy: string;
  dayEnergy: string;
  autonomyDays: string;
  chargeCycles: string;
  backupDaysValue: string;
  solarCount: string;
  solarCountSuffix: string;
  solarType: string;
  solarEfficiency: string;
  solarStrings: string;
  solarPanelsPerString: string;
  solarStringVoltage: string;

  calcDetailsTitle: string;
  colParameter: string;
  colValue: string;
  colExplanation: string;

  detailTotalEnergy: string;
  detailDayEnergy: string;
  detailNightEnergy: string;
  detailDistribution: string;
  detailPeakLoad: string;
  detailSurgeLoad: string;
  detailSystemLoss: string;
  detailSunHours: string;
  detailInputMode: string;
  detailTotalEnergyDesc: string;
  detailDayEnergyDesc: string;
  detailNightEnergyDesc: string;
  detailDistributionDesc: string;
  detailPeakLoadDesc: string;
  detailSurgeLoadDesc: string;
  detailSystemLossDesc: string;
  detailSunHoursDesc: string;
  detailInputModeDesc: string;
  modeDetailedName: string;
  modeMonthlyName: string;
  modeRooftopName: string;
  dayNightSeparator: string;

  currentsTitle: string;
  colCurrentType: string;
  colCurrentValue: string;
  colCableSize: string;
  colBreaker: string;
  currentBattery: string;
  currentSolar: string;
  currentLoad: string;
  breaker32: string;
  breaker25: string;
  breaker63: string;

  tipsTitle: string;
  tipsInstallTitle: string;
  tipsMaintainTitle: string;
  tipVoltage: string;
  tipOrientation: string;
  tipTilt: string;
  tipBatteryCables: string;
  tipSolarCables: string;
  tipClean: string;
  tipConnections: string;
  tipMonitor: string;
  tipBatteryMaintenance: string;
  tipReports: string;
  importantNote: string;

  reportTitle: string;
  reportInfoTitle: string;
  reportDate: string;
  reportVersion: string;
  reportInputMethod: string;
  reportSystemVoltage: string;
  reportSessionId: string;
  reportSaveHint: string;
  btnSaveSession: string;
  btnGenerateReport: string;

  equationsTitle: string;
  equationsSubtitle: string;
  categoryEnergy: string;
  categoryComponents: string;
  categoryCurrents: string;
  categoryEfficiency: string;
  equationsHowTitle: string;
  eqHow1: string;
  eqHow2: string;
  eqHow3: string;
  eqHow4: string;
  variablesLabel: string;
  exampleLabel: string;
  yourValueLabel: string;
  gotIt: string;

  techInfoTitle: string;
  techVoltageTitle: string;
  techVoltage12: string;
  techVoltage24: string;
  techVoltage48: string;
  techVoltage96: string;
  techEfficiencyTitle: string;
  techEfficiency1: string;
  techEfficiency2: string;
  techEfficiency3: string;
  techEfficiency4: string;
  techEfficiency5: string;

  validation: {
    nameRequired: string;
    nameTooShort: string;
    nameTooLong: string;
    nameInvalidChars: string;
    notANumber: string;
    powerMin: string;
    powerMax: string;
    qtyMin: string;
    qtyMax: string;
    hoursNegative: string;
    hoursMax: string;
    hoursMultiple: string;
    hoursTotalExceeds: string;
    dayHoursPrefix: string;
    nightHoursPrefix: string;
    noAppliances: string;
    appliancePrefix: string;
    monthlyRange: string;
    rooftopRange: string;
    sunHoursRange: string;
    systemLossRange: string;
    errorsCount: string;
    warningHoursTotal: string;
    warningHighPower: string;
    warningNoHours: string;
  };

  messages: {
    loaded: string;
    loadError: string;
    calculated: string;
    calculateError: string;
    resetConfirm: string;
    resetDone: string;
    sessionSaved: string;
    sessionSaveError: string;
    exportFirst: string;
    exportDone: string;
    exportError: string;
    samplesLoaded: string;
    sessionRestored: string;
    noSessions: string;
    confirmDelete: string;
    historyTitle: string;
    historySubtitle: string;
    sessionName: string;
    daysAgo: string;
    sessionEmpty: string;
    ok: string;
    cancel: string;
  };

  export: {
    title: string;
    date: string;
    inputMethod: string;
    statsTitle: string;
    energyDaily: string;
    energyDay: string;
    energyNight: string;
    peakLoad: string;
    surgeLoad: string;
    autonomy: string;
    componentsTitle: string;
    inverter: string;
    batteries: string;
    solar: string;
    detailsTitle: string;
  };
}

export const ar: AppStrings = {
  appTitle: '☀️ حاسبة النظام الشمسية العالمية',
  appSubtitle: 'أداة متقدمة لحساب مكونات نظام الطاقة الشمسية بدقة فنية عالية',
  language: 'اللغة',
  tabCalculator: 'الحاسبة',
  tabEquations: 'المعادلات',
  tabHistory: 'السجل',
  resetCalculator: '🔄 إعادة ضبط الحاسبة',

  modeSelectorTitle: '🎯 اختر طريقة الإدخال المناسبة لك:',
  modeDetailed: '📋 الإدخال التفصيلي (أجهزة)',
  modeMonthly: '💰 الإدخال الشهري (فاتورة)',
  modeRooftop: '🏠 الإدخال بالمساحة (سقف)',

  detailedTitle: '📊 الإدخال التفصيلي: قائمة الأجهزة الكهربائية',
  detailedSubtitle: 'أدخل تفاصيل جميع الأجهزة الكهربائية مع ساعات التشغيل اليومية',
  colNumber: '#',
  colName: 'اسم الجهاز',
  colQty: 'الكمية',
  colPower: 'القدرة (واط)',
  colDayHours: 'ساعات النهار',
  colNightHours: 'ساعات الليل',
  colType: 'نوع الجهاز',
  colDelete: 'حذف',
  addAppliance: '+ إضافة جهاز جديد',
  loadSamples: 'تحميل أمثلة شائعة',
  systemLossLabel: 'فقد النظام %',
  detailedNote: '💡 ملاحظة فنية: يتم حساب تيار البدء تلقائياً حسب نوع الجهاز (محركات: 3-5x، إلكترونيات: 1x)',
  namePlaceholder: 'مثل: تلفزيون، ثلاجة...',

  monthlyTitle: '💰 الإدخال الشهري: من فاتورة الكهرباء',
  monthlySubtitle: 'أدخل استهلاكك الشهري من الكهرباء للحصول على تقدير سريع',
  monthlyConsumption: 'الاستهلاك الشهري (كيلوواط ساعة)',
  monthlyConsumptionHint: 'متوسط الاستهلاك المنزلي: 300-800 ك.و.س/شهر',
  kwhPrice: 'سعر الكيلوواط ساعة (عملة محلية)',
  kwhPriceHint: 'أدخل سعر الكهرباء في منطقتك',
  consumptionPattern: 'نمط الاستهلاك اليومي',
  patternNormal: 'استهلاك عادي (50% نهار، 50% ليل)',
  patternDay: 'معظم الاستهلاك نهاراً (70% نهار، 30% ليل)',
  patternNight: 'معظم الاستهلاك ليلاً (30% نهار، 70% ليل)',
  patternBalanced: 'متوازن (60% نهار، 40% ليل)',
  monthlyHowItWorks: '💡 كيف يعمل: النظام سيحول استهلاكك الشهري إلى استهلاك يومي، ثم يحسب النظام المناسب.',
  estimatedDaily: 'الاستهلاك اليومي المقدر:',
  distribution: 'التوزيع:',
  monthlyCost: 'التكلفة الشهرية:',
  localCurrency: 'عملة محلية',
  estimateNote: '(هذه أرقام تقديرية للحساب المبدئي)',

  rooftopTitle: '🏠 الإدخال بالمساحة: حسب مساحة السقف المتاحة',
  rooftopSubtitle: 'أدخل مساحة السقف المتاحة لتركيب الألواح الشمسية',
  roofArea: 'مساحة السقف المتاحة (م²)',
  roofAreaHint: 'المساحة الصافية الخالية من الظل',
  roofDirection: 'اتجاه السقف',
  dirSouth: 'جنوب (الأفضل في النصف الشمالي)',
  dirSoutheast: 'جنوب شرق',
  dirSouthwest: 'جنوب غرب',
  dirEast: 'شرق',
  dirWest: 'غرب',
  roofAngle: 'زاوية الميل (°)',
  angle15: '15 درجة (مسطح تقريباً)',
  angle20: '20 درجة (مثالي لمعظم المناطق)',
  angle25: '25 درجة',
  angle30: '30 درجة (منحدر)',
  angle35: '35 درجة (منحدر جداً)',
  panelType: 'نوع الألواح الشمسية',
  panelStandard: 'قياسي (20% كفاءة)',
  panelHigh: 'عالي الكفاءة (22%+ كفاءة)',
  panelPremium: 'متميز (24%+ كفاءة)',
  rooftopWarning: '⚠️ ملاحظة: هذه الطريقة تعطيك الحد الأقصى للنظام الذي يمكن تركيبه، وليس بالضرورة ما تحتاجه.',
  rooftopMaxPower: 'الطاقة القصوى المتوقعة:',
  rooftopPanelCount: 'عدد الألواح المقترح:',
  rooftopPanelSuffix: 'لوح (400 واط لكل لوح)',
  rooftopRequiredArea: 'مساحة السقف المطلوبة:',
  rooftopApprox: 'م² تقريباً',
  rooftopAreaNote: '(المساحة الفعلية أكبر بنسبة 20% للتركيب والصيانة)',

  settingsTitle: '⚙️ إعدادات النظام الأساسية',
  regionLabel: 'منطقة الإقامة',
  regionSunny: 'مناطق مشمسة جداً',
  regionModerate: 'مناطق مشمسة',
  regionCloudy: 'مناطق غائمة جزئياً',
  regionNorthern: 'مناطق شمالية',
  sunHoursLabel: 'ساعات الشمس اليومية',
  sunHoursHint: 'متوسط ساعات الشمس الفعالة',
  systemVoltageLabel: 'جهد النظام (فولت)',
  voltage12: '12 فولت (أنظمة صغيرة)',
  voltage24: '24 فولت (أنظمة متوسطة)',
  voltage48: '48 فولت (أنظمة كبيرة)',
  voltage96: '96 فولت (أنظمة صناعية)',
  batteryTypeLabel: 'نوع البطارية',
  batteryLifepo4: 'ليثيوم (LiFePO4)',
  batteryLithium: 'ليثيوم عام',
  batteryLeadAcid: 'رصاص-حمض',
  batteryTypeNameLifepo4: 'ليثيوم حديد فوسفات (LiFePO4)',
  batteryTypeNameLithium: 'ليثيوم أيون (Lithium-ion)',
  batteryTypeNameLeadAcid: 'رصاص-حمض (Lead-Acid)',
  cyclesLifepo4: '6000+ دورة',
  cyclesLithium: '3000-5000 دورة',
  cyclesLeadAcid: '500-1000 دورة',
  dodLabel: 'عمق التفريغ %',
  dod50: '50% (للحفاظ على البطارية)',
  dod60: '60% (متوازن)',
  dod70: '70% (اقتصادي)',
  dod80: '80% (الأكثر شيوعاً)',
  dod85: '85% (استخدام كامل)',
  dod90: '90% (استخدام قصوى)',
  expandFuture: 'إضافة هامش للتوسع المستقبلي (20%)',
  backupDays: 'أيام احتياطية للأيام الغائمة',
  backupDaysCount: 'عدد الأيام الاحتياطية',
  voltageGuideNote: '💡 دليل اختيار جهد النظام:',
  voltageGuide12: '12V: أنظمة صغيرة حتى 1000 واط (كرفانات، إضاءة)',
  voltageGuide24: '24V: أنظمة منزلية صغيرة حتى 3000 واط',
  voltageGuide48: '48V: أنظمة منزلية متوسطة وكبيرة 3000-10000 واط',
  voltageGuide96: '96V: أنظمة تجارية وصناعية',

  btnCalculate: '🚀 احسب النظام الشمسي',
  btnReset: '🔄 إعادة ضبط الكل',
  btnExport: '📥 تصدير النتائج',
  btnPrint: '🖨️ طباعة التقرير',

  resultsTitle: '📈 نتائج الحساب الدقيقة',
  statKwhDay: 'كيلوواط ساعة/يوم',
  statPeak: 'واط (أقصى حمل)',
  statSurge: 'واط (تيار بدء)',
  statAutonomy: 'يوم (استقلالية)',
  distributionTitle: '📊 توزيع الطاقة اليومية',
  dayKwh: 'ك.و.س نهاراً',
  nightKwh: 'ك.و.س ليلاً',
  dayNightRatio: 'نسبة النهار/الليل',
  distributionNote: '💡 ملاحظة: الطاقة الليلية فقط هي التي تحتاج تخزين في البطارية',
  chartDay: 'النهار:',
  chartNight: 'الليل:',
  dayWord: 'نهار',
  nightWord: 'ليل',

  inverterTitle: '⚡ الإنفرتر الهجين',
  specsTitle: 'المواصفات الفنية:',
  batteryTitle: '🔋 نظام البطاريات',
  solarTitle: '☀️ الألواح الشمسية',
  systemVoltage: 'جهد النظام:',
  continuousPower: 'القدرة المستمرة:',
  peakPowerCap: 'قدرة الذروة:',
  efficiency: 'الكفاءة:',
  phase: 'الطور:',
  phaseSingle: 'أحادي الطور',
  phaseThree: 'ثلاثي الطور',
  batteryType: 'النوع:',
  batteryCapacity: 'السعة:',
  batteryAh: 'أمبير-ساعة',
  dodValue: 'عمق التفريغ:',
  nightEnergy: 'الطاقة الليلية:',
  dayEnergy: 'الطاقة النهارية:',
  autonomyDays: 'الاستقلالية:',
  chargeCycles: 'دورات الشحن:',
  backupDaysValue: 'أيام احتياطية:',
  solarCount: 'العدد:',
  solarCountSuffix: 'لوح ×',
  solarType: 'النوع:',
  solarEfficiency: 'الكفاءة:',
  solarStrings: 'السلاسل:',
  solarPanelsPerString: 'لوح/سلسلة)',
  solarStringVoltage: 'جهد السلسلة:',

  calcDetailsTitle: '📋 تفاصيل الحساب الفني',
  colParameter: 'المعيار',
  colValue: 'القيمة',
  colExplanation: 'الشرح',

  detailTotalEnergy: 'الطاقة اليومية الإجمالية',
  detailDayEnergy: 'الطاقة النهارية',
  detailNightEnergy: 'الطاقة الليلية',
  detailDistribution: 'توزيع الطاقة',
  detailPeakLoad: 'أقصى حمل متزامن',
  detailSurgeLoad: 'تيار البدء الأقصى',
  detailSystemLoss: 'فقد النظام',
  detailSunHours: 'ساعات الشمس الفعالة',
  detailInputMode: 'وضع الإدخال',
  detailTotalEnergyDesc: 'مجموع استهلاك جميع الأجهزة',
  detailDayEnergyDesc: 'الاستهلاك خلال ساعات النهار',
  detailNightEnergyDesc: 'الاستهلاك خلال ساعات الليل (تخزن في البطارية)',
  detailDistributionDesc: 'نسبة الاستهلاك النهاري إلى الليلي',
  detailPeakLoadDesc: '70% من إجمالي قدرة الأجهزة',
  detailSurgeLoadDesc: 'أقصى طاقة لحظة التشغيل',
  detailSystemLossDesc: 'خسائر في الكابلات والإنفرتر',
  detailSunHoursDesc: 'متوسط ساعات الشحن الشمسي',
  detailInputModeDesc: 'طريقة إدخال البيانات',
  modeDetailedName: 'تفصيلي',
  modeMonthlyName: 'شهري',
  modeRooftopName: 'سقف',
  dayNightSeparator: 'نهار،',

  currentsTitle: '⚡ حسابات التيارات الكهربائية',
  colCurrentType: 'نوع التيار',
  colCurrentValue: 'القيمة (أمبير)',
  colCableSize: 'مقاس الكابل المقترح',
  colBreaker: 'نوع القاطع',
  currentBattery: 'تيار البطارية الأقصى',
  currentSolar: 'تيار الشحن الشمسي',
  currentLoad: 'تيار الحمل',
  breaker32: 'قاطع 32A',
  breaker25: 'قاطع 25A',
  breaker63: 'قاطع 63A',

  tipsTitle: '🔧 توصيات التركيب والصيانة',
  tipsInstallTitle: 'توصيات التركيب:',
  tipsMaintainTitle: 'نصائح الصيانة:',
  tipVoltage: 'جهد النظام:',
  tipOrientation: 'اتجاه الألواح: جنوبي (في النصف الشمالي من الكرة الأرضية)',
  tipTilt: 'زاوية الميل: 20-30 درجة حسب خط العرض',
  tipBatteryCables: 'كابلات البطارية:',
  tipSolarCables: 'كابلات الألواح:',
  tipClean: 'تنظيف الألواح: كل أسبوعين أو بعد العواصف الترابية',
  tipConnections: 'فحص التوصيلات: شهرياً للكابلات والمشابك',
  tipMonitor: 'مراقبة الأداء: يومياً من خلال عداد الطاقة',
  tipBatteryMaintenance: 'صيانة البطاريات: حسب نوعها ودليل المصنع',
  tipReports: 'حفظ تقارير التشغيل: لمتابعة الأداء على المدى الطويل',
  importantNote: 'ملاحظة هامة: هذه الحسابات تقريبية وتحتاج مراجعة من فني متخصص قبل التنفيذ. العوامل المحلية مثل درجة الحرارة والغبار والظل تؤثر على أداء النظام.',

  reportTitle: '📄 تقرير النظام',
  reportInfoTitle: 'معلومات التقرير:',
  reportDate: 'تاريخ التوليد:',
  reportVersion: 'إصدار الحاسبة:',
  reportInputMethod: 'طريقة الإدخال:',
  reportSystemVoltage: 'جهد النظام:',
  reportSessionId: 'معرف الجلسة:',
  reportSaveHint: '💡 يمكنك حفظ هذا التقرير كمرجع مستقبلي',
  btnSaveSession: '💾 حفظ الجلسة',
  btnGenerateReport: '📄 إنشاء تقرير مفصل',

  equationsTitle: '🧮 مكتبة المعادلات الحسابية',
  equationsSubtitle: 'اضغط على أي معادلة لرؤية تفاصيل حسابها',
  categoryEnergy: 'الطاقة والاستهلاك',
  categoryComponents: 'مكونات النظام',
  categoryCurrents: 'التيارات والكابلات',
  categoryEfficiency: 'الكفاءة والأداء',
  equationsHowTitle: '💡 كيف تعمل الحسابات:',
  eqHow1: 'جميع الحسابات تستند إلى معادلات فيزيائية معترف بها',
  eqHow2: 'يتم إضافة هوامش أمان واقعية لكل مكون',
  eqHow3: 'التقريب يكون لأحجام المكونات القياسية المتوفرة بالسوق',
  eqHow4: 'يمكنك النقر على أيقونة ? لعرض المعادلة المستخدمة',
  variablesLabel: 'شرح المتغيرات:',
  exampleLabel: '📝 مثال عملي:',
  yourValueLabel: '🎯 القيمة المحسوبة في نظامك:',
  gotIt: 'فهمت ✓',

  techInfoTitle: '📚 معلومات تقنية مهمة',
  techVoltageTitle: 'كيفية اختيار جهد النظام:',
  techVoltage12: '12V: كفاءة 85-90%، أسلاك سميكة، تكلفة كابلات عالية',
  techVoltage24: '24V: كفاءة 90-93%، توازن جيد بين الكفاءة والتكلفة',
  techVoltage48: '48V: كفاءة 95-97%، أسلاك أرق، أفضل للأنظمة الكبيرة',
  techVoltage96: '96V: كفاءة 97-98%، للمحطات التجارية والصناعية',
  techEfficiencyTitle: 'نصائح لزيادة الكفاءة:',
  techEfficiency1: 'اختر جهداً أعلى للأنظمة الكبيرة لتقليل خسائر الكابلات',
  techEfficiency2: 'استخدم كابلات ذات مقاس مناسب للتيار المار',
  techEfficiency3: 'حافظ على تنظيف الألواح الشمسية بانتظام',
  techEfficiency4: 'اختر إنفرتر بموجة جيبية نقية لحماية الأجهزة',
  techEfficiency5: 'راقب درجة حرارة البطاريات واحفظها في مكان بارد',

  validation: {
    nameRequired: 'اسم الجهاز مطلوب',
    nameTooShort: 'الاسم قصير جداً',
    nameTooLong: 'الاسم طويل جداً',
    nameInvalidChars: 'يحتوي على رموز غير مسموحة',
    notANumber: 'يجب أن يكون رقماً',
    powerMin: 'الحد الأدنى 0.1 واط',
    powerMax: 'الحد الأقصى 50,000 واط',
    qtyMin: 'الحد الأدنى 1',
    qtyMax: 'الحد الأقصى 1000',
    hoursNegative: 'لا يمكن أن يكون سالباً',
    hoursMax: 'الحد الأقصى 24 ساعة',
    hoursMultiple: 'يجب أن يكون من مضاعفات 0.5',
    hoursTotalExceeds: 'ساعات التشغيل: المجموع يتجاوز 24 ساعة',
    dayHoursPrefix: 'ساعات النهار: ',
    nightHoursPrefix: 'ساعات الليل: ',
    noAppliances: 'لم تقم بإضافة أي أجهزة',
    appliancePrefix: 'الجهاز',
    monthlyRange: 'الاستهلاك الشهري يجب أن يكون بين 50 و 5000 كيلوواط ساعة',
    rooftopRange: 'مساحة السقف يجب أن تكون بين 5 و 500 متر مربع',
    sunHoursRange: 'ساعات الشمس يجب أن تكون بين 2 و 8 ساعات',
    systemLossRange: 'فقد النظام يجب أن يكون بين 10% و 40%',
    errorsCount: 'يوجد',
    warningHoursTotal: 'مجموع ساعات التشغيل يتجاوز 24 ساعة',
    warningHighPower: 'القدرة عالية جداً، تأكد من دقة الإدخال',
    warningNoHours: 'لم يتم إدخال ساعات تشغيل',
  },

  messages: {
    loaded: 'تم تحميل الحاسبة بنجاح. يمكنك الآن إدخال بيانات الأجهزة.',
    loadError: 'حدث خطأ أثناء التحميل. يرجى إعادة فتح التطبيق.',
    calculated: 'تم حساب النظام الشمسي بنجاح!',
    calculateError: 'حدث خطأ غير متوقع أثناء الحساب',
    resetConfirm: 'هل تريد إعادة ضبط جميع البيانات؟ سيتم فقدان جميع المدخلات الحالية.',
    resetDone: 'تم إعادة الضبط بنجاح',
    sessionSaved: 'تم حفظ الجلسة بنجاح',
    sessionSaveError: 'حدث خطأ أثناء حفظ الجلسة',
    exportFirst: 'يجب حساب النظام أولاً قبل التصدير',
    exportDone: 'تم تصدير التقرير بنجاح',
    exportError: 'حدث خطأ أثناء تصدير النتائج',
    samplesLoaded: 'تم تحميل الأمثلة الشائعة بنجاح',
    sessionRestored: 'تم استعادة الجلسة بنجاح',
    noSessions: 'لا توجد جلسات محفوظة',
    confirmDelete: 'هل تريد حذف هذه الجلسة؟',
    historyTitle: '💾 الجلسات المحفوظة',
    historySubtitle: 'اضغط على أي جلسة لاستعادتها',
    sessionName: 'حساب',
    daysAgo: 'يوم',
    sessionEmpty: 'لا توجد جلسات محفوظة بعد. احسب نظامك واضغط على "حفظ الجلسة".',
    ok: 'موافق',
    cancel: 'إلغاء',
  },

  export: {
    title: 'تقرير نظام الطاقة الشمسية',
    date: 'تاريخ التوليد:',
    inputMethod: 'طريقة الإدخال:',
    statsTitle: '📊 إحصائيات النظام:',
    energyDaily: 'الطاقة اليومية:',
    energyDay: 'الطاقة النهارية:',
    energyNight: 'الطاقة الليلية:',
    peakLoad: 'أقصى حمل:',
    surgeLoad: 'تيار البدء:',
    autonomy: 'الاستقلالية:',
    componentsTitle: '⚡ المكونات الرئيسية:',
    inverter: 'الإنفرتر:',
    batteries: 'البطاريات:',
    solar: 'الألواح الشمسية:',
    detailsTitle: '📋 تفاصيل الحساب:',
  },
};

export const en: AppStrings = {
  appTitle: '☀️ Universal Solar Calculator',
  appSubtitle: 'Advanced tool for sizing solar power system components with high technical accuracy',
  language: 'Language',
  tabCalculator: 'Calculator',
  tabEquations: 'Equations',
  tabHistory: 'History',
  resetCalculator: '🔄 Reset calculator',

  modeSelectorTitle: '🎯 Choose your preferred input method:',
  modeDetailed: '📋 Detailed input (appliances)',
  modeMonthly: '💰 Monthly input (bill)',
  modeRooftop: '🏠 Area input (rooftop)',

  detailedTitle: '📊 Detailed input: electrical appliance list',
  detailedSubtitle: 'Enter details of all electrical appliances with daily operating hours',
  colNumber: '#',
  colName: 'Appliance name',
  colQty: 'Qty',
  colPower: 'Power (W)',
  colDayHours: 'Day hours',
  colNightHours: 'Night hours',
  colType: 'Device type',
  colDelete: 'Delete',
  addAppliance: '+ Add new appliance',
  loadSamples: 'Load common examples',
  systemLossLabel: 'System loss %',
  detailedNote: '💡 Technical note: start-up current is calculated automatically by device type (motors: 3-5x, electronics: 1x)',
  namePlaceholder: 'e.g. TV, fridge...',

  monthlyTitle: '💰 Monthly input: from electricity bill',
  monthlySubtitle: 'Enter your monthly electricity consumption for a quick estimate',
  monthlyConsumption: 'Monthly consumption (kWh)',
  monthlyConsumptionHint: 'Average household consumption: 300-800 kWh/month',
  kwhPrice: 'Price per kWh (local currency)',
  kwhPriceHint: 'Enter the electricity price in your area',
  consumptionPattern: 'Daily consumption pattern',
  patternNormal: 'Normal consumption (50% day, 50% night)',
  patternDay: 'Mostly day consumption (70% day, 30% night)',
  patternNight: 'Mostly night consumption (30% day, 70% night)',
  patternBalanced: 'Balanced (60% day, 40% night)',
  monthlyHowItWorks: '💡 How it works: the system converts your monthly consumption to daily, then calculates the right system.',
  estimatedDaily: 'Estimated daily consumption:',
  distribution: 'Distribution:',
  monthlyCost: 'Monthly cost:',
  localCurrency: 'local currency',
  estimateNote: '(estimated figures for preliminary calculation)',

  rooftopTitle: '🏠 Area input: based on available roof area',
  rooftopSubtitle: 'Enter the available roof area for solar panel installation',
  roofArea: 'Available roof area (m²)',
  roofAreaHint: 'Net area free of shade',
  roofDirection: 'Roof direction',
  dirSouth: 'South (best in the northern hemisphere)',
  dirSoutheast: 'Southeast',
  dirSouthwest: 'Southwest',
  dirEast: 'East',
  dirWest: 'West',
  roofAngle: 'Tilt angle (°)',
  angle15: '15 degrees (almost flat)',
  angle20: '20 degrees (ideal for most areas)',
  angle25: '25 degrees',
  angle30: '30 degrees (sloped)',
  angle35: '35 degrees (very sloped)',
  panelType: 'Solar panel type',
  panelStandard: 'Standard (20% efficiency)',
  panelHigh: 'High efficiency (22%+ efficiency)',
  panelPremium: 'Premium (24%+ efficiency)',
  rooftopWarning: '⚠️ Note: this method gives you the maximum system that can be installed, not necessarily what you need.',
  rooftopMaxPower: 'Expected maximum power:',
  rooftopPanelCount: 'Suggested panel count:',
  rooftopPanelSuffix: 'panels (400 W each)',
  rooftopRequiredArea: 'Required roof area:',
  rooftopApprox: 'm² approx.',
  rooftopAreaNote: '(actual area is 20% larger for installation and maintenance)',

  settingsTitle: '⚙️ Basic system settings',
  regionLabel: 'Residence region',
  regionSunny: 'Very sunny areas',
  regionModerate: 'Sunny areas',
  regionCloudy: 'Partially cloudy areas',
  regionNorthern: 'Northern areas',
  sunHoursLabel: 'Daily sun hours',
  sunHoursHint: 'Average effective sun hours',
  systemVoltageLabel: 'System voltage (V)',
  voltage12: '12 V (small systems)',
  voltage24: '24 V (medium systems)',
  voltage48: '48 V (large systems)',
  voltage96: '96 V (industrial systems)',
  batteryTypeLabel: 'Battery type',
  batteryLifepo4: 'Lithium (LiFePO4)',
  batteryLithium: 'Lithium general',
  batteryLeadAcid: 'Lead-acid',
  batteryTypeNameLifepo4: 'Lithium Iron Phosphate (LiFePO4)',
  batteryTypeNameLithium: 'Lithium-ion',
  batteryTypeNameLeadAcid: 'Lead-Acid',
  cyclesLifepo4: '6000+ cycles',
  cyclesLithium: '3000-5000 cycles',
  cyclesLeadAcid: '500-1000 cycles',
  dodLabel: 'Depth of discharge %',
  dod50: '50% (to preserve the battery)',
  dod60: '60% (balanced)',
  dod70: '70% (economical)',
  dod80: '80% (most common)',
  dod85: '85% (full use)',
  dod90: '90% (maximum use)',
  expandFuture: 'Add future expansion margin (20%)',
  backupDays: 'Backup days for cloudy days',
  backupDaysCount: 'Number of backup days',
  voltageGuideNote: '💡 System voltage selection guide:',
  voltageGuide12: '12V: small systems up to 1000 W (caravans, lighting)',
  voltageGuide24: '24V: small home systems up to 3000 W',
  voltageGuide48: '48V: medium and large home systems 3000-10000 W',
  voltageGuide96: '96V: commercial and industrial systems',

  btnCalculate: '🚀 Calculate solar system',
  btnReset: '🔄 Reset all',
  btnExport: '📥 Export results',
  btnPrint: '🖨️ Print report',

  resultsTitle: '📈 Accurate calculation results',
  statKwhDay: 'kWh/day',
  statPeak: 'W (peak load)',
  statSurge: 'W (start-up current)',
  statAutonomy: 'days (autonomy)',
  distributionTitle: '📊 Daily energy distribution',
  dayKwh: 'kWh day',
  nightKwh: 'kWh night',
  dayNightRatio: 'Day/night ratio',
  distributionNote: '💡 Note: only night energy needs to be stored in the battery',
  chartDay: 'Day:',
  chartNight: 'Night:',
  dayWord: 'day',
  nightWord: 'night',

  inverterTitle: '⚡ Hybrid inverter',
  specsTitle: 'Technical specifications:',
  batteryTitle: '🔋 Battery system',
  solarTitle: '☀️ Solar panels',
  systemVoltage: 'System voltage:',
  continuousPower: 'Continuous power:',
  peakPowerCap: 'Peak power:',
  efficiency: 'Efficiency:',
  phase: 'Phase:',
  phaseSingle: 'Single-phase',
  phaseThree: 'Three-phase',
  batteryType: 'Type:',
  batteryCapacity: 'Capacity:',
  batteryAh: 'Ah',
  dodValue: 'Depth of discharge:',
  nightEnergy: 'Night energy:',
  dayEnergy: 'Day energy:',
  autonomyDays: 'Autonomy:',
  chargeCycles: 'Charge cycles:',
  backupDaysValue: 'Backup days:',
  solarCount: 'Count:',
  solarCountSuffix: 'panels ×',
  solarType: 'Type:',
  solarEfficiency: 'Efficiency:',
  solarStrings: 'Strings:',
  solarPanelsPerString: 'panels/string)',
  solarStringVoltage: 'String voltage:',

  calcDetailsTitle: '📋 Technical calculation details',
  colParameter: 'Parameter',
  colValue: 'Value',
  colExplanation: 'Explanation',

  detailTotalEnergy: 'Total daily energy',
  detailDayEnergy: 'Day energy',
  detailNightEnergy: 'Night energy',
  detailDistribution: 'Energy distribution',
  detailPeakLoad: 'Maximum simultaneous load',
  detailSurgeLoad: 'Maximum start-up current',
  detailSystemLoss: 'System loss',
  detailSunHours: 'Effective sun hours',
  detailInputMode: 'Input mode',
  detailTotalEnergyDesc: 'Sum of consumption of all appliances',
  detailDayEnergyDesc: 'Consumption during day hours',
  detailNightEnergyDesc: 'Consumption during night hours (stored in battery)',
  detailDistributionDesc: 'Ratio of day to night consumption',
  detailPeakLoadDesc: '70% of total appliance power',
  detailSurgeLoadDesc: 'Maximum power at start-up moment',
  detailSystemLossDesc: 'Losses in cables and inverter',
  detailSunHoursDesc: 'Average solar charging hours',
  detailInputModeDesc: 'Data entry method',
  modeDetailedName: 'Detailed',
  modeMonthlyName: 'Monthly',
  modeRooftopName: 'Rooftop',
  dayNightSeparator: 'day,',

  currentsTitle: '⚡ Electrical current calculations',
  colCurrentType: 'Current type',
  colCurrentValue: 'Value (A)',
  colCableSize: 'Suggested cable size',
  colBreaker: 'Breaker type',
  currentBattery: 'Maximum battery current',
  currentSolar: 'Solar charge current',
  currentLoad: 'Load current',
  breaker32: '32A breaker',
  breaker25: '25A breaker',
  breaker63: '63A breaker',

  tipsTitle: '🔧 Installation and maintenance recommendations',
  tipsInstallTitle: 'Installation recommendations:',
  tipsMaintainTitle: 'Maintenance tips:',
  tipVoltage: 'System voltage:',
  tipOrientation: 'Panel direction: south (in the northern hemisphere)',
  tipTilt: 'Tilt angle: 20-30 degrees depending on latitude',
  tipBatteryCables: 'Battery cables:',
  tipSolarCables: 'Panel cables:',
  tipClean: 'Clean panels: every two weeks or after dust storms',
  tipConnections: 'Check connections: monthly for cables and clamps',
  tipMonitor: 'Monitor performance: daily through the energy meter',
  tipBatteryMaintenance: 'Battery maintenance: according to type and manufacturer manual',
  tipReports: 'Keep operation reports: to track long-term performance',
  importantNote: 'Important note: these calculations are approximate and need review by a specialized technician before implementation. Local factors such as temperature, dust and shade affect system performance.',

  reportTitle: '📄 System report',
  reportInfoTitle: 'Report information:',
  reportDate: 'Generation date:',
  reportVersion: 'Calculator version:',
  reportInputMethod: 'Input method:',
  reportSystemVoltage: 'System voltage:',
  reportSessionId: 'Session ID:',
  reportSaveHint: '💡 You can save this report as a future reference',
  btnSaveSession: '💾 Save session',
  btnGenerateReport: '📄 Generate detailed report',

  equationsTitle: '🧮 Equations library',
  equationsSubtitle: 'Tap any equation to see its calculation details',
  categoryEnergy: 'Energy and consumption',
  categoryComponents: 'System components',
  categoryCurrents: 'Currents and cables',
  categoryEfficiency: 'Efficiency and performance',
  equationsHowTitle: '💡 How the calculations work:',
  eqHow1: 'All calculations are based on recognized physical equations',
  eqHow2: 'Realistic safety margins are added for each component',
  eqHow3: 'Rounded up to standard component sizes available in the market',
  eqHow4: 'Tap any ? icon to view the equation used',
  variablesLabel: 'Variables:',
  exampleLabel: '📝 Practical example:',
  yourValueLabel: '🎯 Your system calculated value:',
  gotIt: 'Got it ✓',

  techInfoTitle: '📚 Important technical information',
  techVoltageTitle: 'How to choose the system voltage:',
  techVoltage12: '12V: 85-90% efficiency, thick wires, high cable cost',
  techVoltage24: '24V: 90-93% efficiency, good balance between efficiency and cost',
  techVoltage48: '48V: 95-97% efficiency, thinner wires, best for large systems',
  techVoltage96: '96V: 97-98% efficiency, for commercial and industrial stations',
  techEfficiencyTitle: 'Tips to increase efficiency:',
  techEfficiency1: 'Choose a higher voltage for large systems to reduce cable losses',
  techEfficiency2: 'Use cables of appropriate size for the passing current',
  techEfficiency3: 'Keep solar panels clean regularly',
  techEfficiency4: 'Choose an inverter with a pure sine wave to protect devices',
  techEfficiency5: 'Monitor battery temperature and keep it in a cool place',

  validation: {
    nameRequired: 'Appliance name is required',
    nameTooShort: 'Name is too short',
    nameTooLong: 'Name is too long',
    nameInvalidChars: 'Contains disallowed characters',
    notANumber: 'Must be a number',
    powerMin: 'Minimum is 0.1 W',
    powerMax: 'Maximum is 50,000 W',
    qtyMin: 'Minimum is 1',
    qtyMax: 'Maximum is 1000',
    hoursNegative: 'Cannot be negative',
    hoursMax: 'Maximum is 24 hours',
    hoursMultiple: 'Must be a multiple of 0.5',
    hoursTotalExceeds: 'Operating hours: total exceeds 24 hours',
    dayHoursPrefix: 'Day hours: ',
    nightHoursPrefix: 'Night hours: ',
    noAppliances: 'You have not added any appliances',
    appliancePrefix: 'Appliance',
    monthlyRange: 'Monthly consumption must be between 50 and 5000 kWh',
    rooftopRange: 'Roof area must be between 5 and 500 m²',
    sunHoursRange: 'Sun hours must be between 2 and 8 hours',
    systemLossRange: 'System loss must be between 10% and 40%',
    errorsCount: 'There are',
    warningHoursTotal: 'Total operating hours exceeds 24 hours',
    warningHighPower: 'Power is very high, please verify the input',
    warningNoHours: 'No operating hours entered',
  },

  messages: {
    loaded: 'Calculator loaded successfully. You can now enter appliance data.',
    loadError: 'An error occurred during loading. Please reopen the app.',
    calculated: 'Solar system calculated successfully!',
    calculateError: 'An unexpected error occurred during calculation',
    resetConfirm: 'Do you want to reset all data? All current inputs will be lost.',
    resetDone: 'Reset completed successfully',
    sessionSaved: 'Session saved successfully',
    sessionSaveError: 'An error occurred while saving the session',
    exportFirst: 'You must calculate the system first before exporting',
    exportDone: 'Report exported successfully',
    exportError: 'An error occurred while exporting the results',
    samplesLoaded: 'Common examples loaded successfully',
    sessionRestored: 'Session restored successfully',
    noSessions: 'No saved sessions',
    confirmDelete: 'Do you want to delete this session?',
    historyTitle: '💾 Saved sessions',
    historySubtitle: 'Tap any session to restore it',
    sessionName: 'Calculation',
    daysAgo: 'days ago',
    sessionEmpty: 'No saved sessions yet. Calculate your system and press "Save session".',
    ok: 'OK',
    cancel: 'Cancel',
  },

  export: {
    title: 'Solar Energy System Report',
    date: 'Generation date:',
    inputMethod: 'Input method:',
    statsTitle: '📊 System statistics:',
    energyDaily: 'Daily energy:',
    energyDay: 'Day energy:',
    energyNight: 'Night energy:',
    peakLoad: 'Peak load:',
    surgeLoad: 'Start-up current:',
    autonomy: 'Autonomy:',
    componentsTitle: '⚡ Main components:',
    inverter: 'Inverter:',
    batteries: 'Batteries:',
    solar: 'Solar panels:',
    detailsTitle: '📋 Calculation details:',
  },
};
