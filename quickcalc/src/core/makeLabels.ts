import type { AppStrings } from '@/i18n/strings';
import type { CalculateSystemLabels } from './calculator';

export function makeLabels(t: AppStrings): CalculateSystemLabels {
  return {
    modeNames: {
      detailed: t.modeDetailedName,
      monthly: t.modeMonthlyName,
      rooftop: t.modeRooftopName,
    },
    dayWord: t.dayWord,
    nightWord: t.nightWord,
    phaseSingle: t.phaseSingle,
    phaseThree: t.phaseThree,
    typeLifepo4: t.batteryTypeNameLifepo4,
    typeLithium: t.batteryTypeNameLithium,
    typeLeadAcid: t.batteryTypeNameLeadAcid,
    cyclesLifepo4: t.cyclesLifepo4,
    cyclesLithium: t.cyclesLithium,
    cyclesLeadAcid: t.cyclesLeadAcid,
    detailLabels: {
      totalEnergy: t.detailTotalEnergy,
      dayEnergy: t.detailDayEnergy,
      nightEnergy: t.detailNightEnergy,
      distribution: t.detailDistribution,
      peakLoad: t.detailPeakLoad,
      surgeLoad: t.detailSurgeLoad,
      systemLoss: t.detailSystemLoss,
      sunHours: t.detailSunHours,
      inputMode: t.detailInputMode,
      totalEnergyDesc: t.detailTotalEnergyDesc,
      dayEnergyDesc: t.detailDayEnergyDesc,
      nightEnergyDesc: t.detailNightEnergyDesc,
      distributionDesc: t.detailDistributionDesc,
      peakLoadDesc: t.detailPeakLoadDesc,
      surgeLoadDesc: t.detailSurgeLoadDesc,
      systemLossDesc: t.detailSystemLossDesc,
      sunHoursDesc: t.detailSunHoursDesc,
      inputModeDesc: t.detailInputModeDesc,
    },
    currentLabels: {
      battery: t.currentBattery,
      solar: t.currentSolar,
      load: t.currentLoad,
      breakerBattery: t.breaker32,
      breakerSolar: t.breaker25,
      breakerLoad: t.breaker63,
    },
  };
}
