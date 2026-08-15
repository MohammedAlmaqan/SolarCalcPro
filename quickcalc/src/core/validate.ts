import type { AppStrings } from '@/i18n/strings';
import type { Appliance, SystemInput } from './types';

const NAME_PATTERN = /^[\p{L}\p{N}\s\-_.,;:]+$/u;

export function sanitizeName(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export function validateAppliance(appliance: Appliance, t: AppStrings['validation']): string[] {
  const errors: string[] = [];

  const name = appliance.name.trim();
  if (!name) errors.push(t.nameRequired);
  else if (name.length < 2) errors.push(t.nameTooShort);
  else if (name.length > 50) errors.push(t.nameTooLong);
  else if (!NAME_PATTERN.test(name)) errors.push(t.nameInvalidChars);

  if (isNaN(appliance.power)) errors.push(t.notANumber);
  else {
    if (appliance.power < 0.1) errors.push(t.powerMin);
    if (appliance.power > 50000) errors.push(t.powerMax);
  }

  if (isNaN(appliance.quantity)) errors.push(t.notANumber);
  else {
    if (appliance.quantity < 1) errors.push(t.qtyMin);
    if (appliance.quantity > 1000) errors.push(t.qtyMax);
  }

  validateHours(appliance.dayHours, t.dayHoursPrefix, errors, t);
  validateHours(appliance.nightHours, t.nightHoursPrefix, errors, t);

  if (
    !isNaN(appliance.dayHours) &&
    !isNaN(appliance.nightHours) &&
    appliance.dayHours + appliance.nightHours > 24
  ) {
    errors.push(`${t.hoursTotalExceeds}`);
  }

  return errors;
}

function validateHours(
  value: number,
  prefix: string,
  errors: string[],
  t: AppStrings['validation'],
): void {
  if (isNaN(value)) {
    errors.push(`${prefix}${t.notANumber}`);
    return;
  }
  if (value < 0) errors.push(`${prefix}${t.hoursNegative}`);
  if (value > 24) errors.push(`${prefix}${t.hoursMax}`);
  if (value % 0.5 !== 0) errors.push(`${prefix}${t.hoursMultiple}`);
}

export function validateSystemSettings(
  sunHours: number,
  systemLoss: number,
  t: AppStrings['validation'],
): string[] {
  const errors: string[] = [];
  if (isNaN(sunHours) || sunHours < 2 || sunHours > 8) {
    errors.push(t.sunHoursRange);
  }
  if (isNaN(systemLoss) || systemLoss < 10 || systemLoss > 40) {
    errors.push(t.systemLossRange);
  }
  return errors;
}

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateAllInputs(input: SystemInput, t: AppStrings): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.mode === 'detailed') {
    if (input.appliances.length === 0) {
      errors.push(t.validation.noAppliances);
    }

    input.appliances.forEach((appliance, index) => {
      const applianceErrors = validateAppliance(appliance, t.validation);
      applianceErrors.forEach((error) => {
        errors.push(`${t.validation.appliancePrefix} ${index + 1}: ${error}`);
      });

      const power = appliance.power;
      const dayHours = appliance.dayHours;
      const nightHours = appliance.nightHours;

      if (dayHours + nightHours > 24) {
        warnings.push(`${t.validation.appliancePrefix} ${index + 1}: ${t.validation.warningHoursTotal}`);
      }

      if (power > 5000) {
        warnings.push(`${t.validation.appliancePrefix} ${index + 1}: ${t.validation.warningHighPower}`);
      }

      if (dayHours === 0 && nightHours === 0) {
        warnings.push(`${t.validation.appliancePrefix} ${index + 1}: ${t.validation.warningNoHours}`);
      }
    });
  } else if (input.mode === 'monthly') {
    const monthlyKwh = input.monthly!.consumption;
    if (isNaN(monthlyKwh) || monthlyKwh < 50 || monthlyKwh > 5000) {
      errors.push(t.validation.monthlyRange);
    }
  } else if (input.mode === 'rooftop') {
    const area = input.rooftop!.area;
    if (isNaN(area) || area < 5 || area > 500) {
      errors.push(t.validation.rooftopRange);
    }
  }

  const settingsErrors = validateSystemSettings(
    input.settings.sunHours,
    input.settings.systemLoss,
    t.validation,
  );
  settingsErrors.forEach((error) => errors.push(error));

  return { errors, warnings };
}
