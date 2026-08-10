import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';

import { ComponentSlot, ManualPshDialog, PshPicker } from '@/components/pickers';
import { NumberField, SegmentedField, StepperField } from '@/components/form';
import { LoadEditor, TotalLoadEditor } from '@/components/LoadEditor';
import { StepHeader, StepNav } from '@/components/WizardScaffold';
import {
  AuditTrailList,
  KeyValueRow,
  SectionTitle,
  StatCard,
  WarningsList,
} from '@/components/results';
import { referenceInverterFor, REFERENCE_BATTERY, REFERENCE_CONTROLLER } from '@/core/data/referenceComponents';
import { batteryAgingAnalysis } from '@/core/formulas/batteryAging';
import { designSystem } from '@/core/engine';
import { estimateCost } from '@/core/formulas/costing';
import { monthLabel } from '@/core/formulas/production';
import { annualOptimalTilt, orientationFactors } from '@/core/formulas/tilt';
import type {
  BatteryChemistry,
  BatterySpec,
  CableSpec,
  ChargeControllerSpec,
  InverterSpec,
  LoadItem,
  LoadMode,
  PanelSpec,
  StandardsPolicy,
  SystemInput,
  SystemType,
  SystemVoltage,
} from '@/core/types';
import type { ComponentRecord } from '@/data/types';
import type { ScenarioRecord } from '@/db/repos/projects';
import type { SuggestRequirements } from '@/db/suggest';
import { suggestComponents } from '@/db/suggest';
import { useCatalogStore } from '@/store/catalog';
import { useProjectStore } from '@/store/projects';
import { useReferenceStore } from '@/store/reference';
import { CURRENCY_SYMBOLS, useSettingsStore } from '@/store/settings';
import { useUnitFormatters } from '@/hooks/useUnitFormatters';

export const WIZARD_STEPS = 5;

const cToF = (c: number): number => (c * 9) / 5 + 32;
const fToC = (f: number): number => ((f - 32) * 5) / 9;
const mToFt = (m: number): number => m * 3.28084;
const ftToM = (ft: number): number => ft / 3.28084;

type VoltageChoice = 'auto' | '12' | '24' | '48';

export function DesignWizard(props: {
  mode: 'create' | 'edit';
  initial?: ScenarioRecord;
  onSaved: (projectId: string, scenarioId: string) => void;
}) {
  const { mode, initial, onSaved } = props;
  const theme = useTheme();
  const reference = useReferenceStore();
  const lists = useCatalogStore((s) => s.lists);
  const loadKind = useCatalogStore((s) => s.loadKind);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [loadMode, setLoadMode] = useState<LoadMode>(initial?.loadMode ?? 'appliances');
  const [loads, setLoads] = useState<LoadItem[]>(initial?.loads ?? []);
  const [totalDailyKwh, setTotalDailyKwh] = useState<number | null>(initial?.totalDailyKwh ?? null);
  const [totalPeakKw, setTotalPeakKw] = useState<number | null>(initial?.totalPeakKw ?? null);
  const [totalSurgeKw, setTotalSurgeKw] = useState<number | null>(initial?.totalSurgeKw ?? null);
  const [totalLoadIsAc, setTotalLoadIsAc] = useState<boolean>(initial?.totalLoadIsAc ?? true);
  const [systemType, setSystemType] = useState<SystemType>(initial?.systemType ?? 'off-grid');
  const [winterPsh, setWinterPsh] = useState<number | null>(initial?.winterPsh ?? null);
  const [summerPsh, setSummerPsh] = useState<number | null>(initial?.summerPsh ?? null);
  const [pshLocationId, setPshLocationId] = useState<string | null>(
    initial?.pshLocation?.id ?? null,
  );
  const [minTemperatureC, setMinTemperatureC] = useState<number | null>(
    initial?.minTemperatureC ?? -10,
  );
  const [autonomyDays, setAutonomyDays] = useState(initial?.autonomyDays ?? 2);
  const [chemistry, setChemistry] = useState<BatteryChemistry>(initial?.chemistry ?? 'lifepo4');
  const [voltage, setVoltage] = useState<VoltageChoice>(
    initial?.systemVoltageV != null ? (String(initial.systemVoltageV) as VoltageChoice) : 'auto',
  );
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(
    initial?.selectedPanelId ?? null,
  );
  const [selectedInverterId, setSelectedInverterId] = useState<string | null>(
    initial?.selectedInverterId ?? null,
  );
  const [selectedBatteryId, setSelectedBatteryId] = useState<string | null>(
    initial?.selectedBatteryId ?? null,
  );
  const [selectedControllerId, setSelectedControllerId] = useState<string | null>(
    initial?.selectedControllerId ?? null,
  );
  const [selectedPvCableId, setSelectedPvCableId] = useState<string | null>(
    initial?.selectedPvCableId ?? null,
  );
  const [selectedDcCableId, setSelectedDcCableId] = useState<string | null>(
    initial?.selectedDcCableId ?? null,
  );
  const [selectedAcCableId, setSelectedAcCableId] = useState<string | null>(
    initial?.selectedAcCableId ?? null,
  );
  const [inverterEfficiency, setInverterEfficiency] = useState<number | null>(
    initial?.inverterEfficiency ?? null,
  );
  const [systemLossFactor, setSystemLossFactor] = useState<number | null>(
    initial?.systemLossFactor ?? null,
  );
  const [dcVoltageDropPercent, setDcVoltageDropPercent] = useState<number | null>(
    initial?.dcVoltageDropPercent ?? null,
  );
  const [acVoltageDropPercent, setAcVoltageDropPercent] = useState<number | null>(
    initial?.acVoltageDropPercent ?? null,
  );
  const [tempDeratingFactor, setTempDeratingFactor] = useState<number | null>(
    initial?.tempDeratingFactor ?? null,
  );
  const [pvCableLengthM, setPvCableLengthM] = useState<number | null>(
    initial?.pvCableLengthM ?? null,
  );
  const [dcCableLengthM, setDcCableLengthM] = useState<number | null>(
    initial?.dcCableLengthM ?? null,
  );
  const [acCableLengthM, setAcCableLengthM] = useState<number | null>(
    initial?.acCableLengthM ?? null,
  );
  const [busbarRatingA, setBusbarRatingA] = useState<number | null>(initial?.busbarRatingA ?? null);
  const [mainBreakerA, setMainBreakerA] = useState<number | null>(initial?.mainBreakerA ?? null);
  const [tilt, setTilt] = useState<number | null>(initial?.tiltDeg ?? null);
  const [azimuth, setAzimuth] = useState<number | null>(initial?.azimuthDeg ?? null);
  const [shadingLossPct, setShadingLossPct] = useState<number | null>(
    initial?.shadingFactor != null ? Math.round((1 - initial.shadingFactor) * 100) : null,
  );
  const [fuelPricePerL, setFuelPricePerL] = useState<number | null>(initial?.fuelPricePerL ?? null);
  const [generatorChargeHoursPerDay, setGeneratorChargeHoursPerDay] = useState<number | null>(
    initial?.generatorChargeHoursPerDay ?? null,
  );
  const [manualPshOpen, setManualPshOpen] = useState(false);

  useEffect(() => {
    if (!reference.loaded) reference.load().catch((e) => console.error('Reference load failed', e));
    const kinds = ['panel', 'inverter', 'battery', 'controller', 'cable'] as const;
    kinds.forEach((kind) => {
      if (!lists[kind]) loadKind(kind).catch((e) => console.error(`Load ${kind} failed`, e));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill from the configured default PSH location in create mode, derived
  // rather than stored so no state is set inside an effect. Explicit user edits
  // (pshLocationId / winterPsh / summerPsh) always win over the default.
  const defaultPshLocationId = useSettingsStore((s) => s.defaultPshLocationId);
  const effectiveLocation = useMemo(() => {
    if (mode !== 'create') return null;
    const id = pshLocationId ?? defaultPshLocationId;
    return reference.psh.find((l) => l.id === id) ?? null;
  }, [mode, pshLocationId, defaultPshLocationId, reference.psh]);
  const effectivePshLocationId = effectiveLocation?.id ?? pshLocationId;
  const effectiveWinterPsh = winterPsh ?? effectiveLocation?.winterPsh ?? 4.0;
  const effectiveSummerPsh = summerPsh ?? effectiveLocation?.summerPsh ?? 6.0;
  const effectiveLatitude = effectiveLocation?.latitude ?? initial?.pshLocation?.latitude ?? 25;

  const effectiveTilt = tilt ?? effectiveLocation?.recommendedTilt ?? annualOptimalTilt(effectiveLatitude, 'winter');
  const effectiveAzimuth = azimuth ?? (effectiveLatitude >= 0 ? 180 : 0);
  const effectiveShadingFactor =
    shadingLossPct === null ? 1 : Math.max(0.5, (100 - shadingLossPct) / 100);
  const recommendedTilt = annualOptimalTilt(effectiveLatitude, 'winter');
  const tiltSensitivity = useMemo(() => {
    const azimuthDeg = effectiveAzimuth;
    return [0, 15, 30, 45, 60].map((t) => ({
      tilt: t,
      factor: orientationFactors(effectiveLatitude, t, azimuthDeg).annual,
    }));
  }, [effectiveLatitude, effectiveAzimuth]);

  const resolved = useMemo<NonNullable<SystemInput['selected']>>(() => {
    const panel = selectedPanelId
      ? (lists.panel?.find((r) => r.id === selectedPanelId)?.spec as PanelSpec | undefined)
      : undefined;
    const inverter = selectedInverterId
      ? (lists.inverter?.find((r) => r.id === selectedInverterId)?.spec as InverterSpec | undefined)
      : undefined;
    const battery = selectedBatteryId
      ? (lists.battery?.find((r) => r.id === selectedBatteryId)?.spec as BatterySpec | undefined)
      : undefined;
    const controller = selectedControllerId
      ? (lists.controller?.find((r) => r.id === selectedControllerId)?.spec as
          ChargeControllerSpec | undefined)
      : undefined;
    const pvCable = selectedPvCableId
      ? (lists.cable?.find((r) => r.id === selectedPvCableId)?.spec as CableSpec | undefined)
      : undefined;
    const dcCable = selectedDcCableId
      ? (lists.cable?.find((r) => r.id === selectedDcCableId)?.spec as CableSpec | undefined)
      : undefined;
    const acCable = selectedAcCableId
      ? (lists.cable?.find((r) => r.id === selectedAcCableId)?.spec as CableSpec | undefined)
      : undefined;
    return { panel, inverter, battery, controller, pvCable, dcCable, acCable };
  }, [
    lists,
    selectedPanelId,
    selectedInverterId,
    selectedBatteryId,
    selectedControllerId,
    selectedPvCableId,
    selectedDcCableId,
    selectedAcCableId,
  ]);

  const standardsPolicy = useSettingsStore((s) => s.standardsPolicy);
  const setStandardsPolicy = useSettingsStore((s) => s.setStandardsPolicy);
  const tempUnit = useSettingsStore((s) => s.units.temp);
  const lengthUnit = useSettingsStore((s) => s.units.length);

  const input = useMemo<SystemInput>(() => {
    return {
      loads,
      loadMode,
      totalDailyKwh: totalDailyKwh ?? undefined,
      totalPeakKw: totalPeakKw ?? undefined,
      totalSurgeKw: totalSurgeKw ?? undefined,
      totalLoadIsAc,
      systemType,
      winterPsh: effectiveWinterPsh,
      summerPsh: effectiveSummerPsh,
      latitude: effectiveLatitude,
      tilt: effectiveTilt,
      azimuth: effectiveAzimuth,
      shadingFactor: effectiveShadingFactor,
      fuelPricePerL: fuelPricePerL ?? undefined,
      generatorChargeHoursPerDay: generatorChargeHoursPerDay ?? undefined,
      autonomyDays,
      chemistry,
      systemVoltageOverride: voltage === 'auto' ? undefined : (Number(voltage) as SystemVoltage),
      minTemperatureC: minTemperatureC ?? undefined,
      inverterEfficiency: inverterEfficiency ?? undefined,
      systemLossFactor: systemLossFactor ?? undefined,
      dcVoltageDropPercent: dcVoltageDropPercent ?? undefined,
      acVoltageDropPercent: acVoltageDropPercent ?? undefined,
      tempDeratingFactor: tempDeratingFactor ?? undefined,
      pvCableLengthM: pvCableLengthM ?? undefined,
      dcCableLengthM: dcCableLengthM ?? undefined,
      acCableLengthM: acCableLengthM ?? undefined,
      busbarRatingA: busbarRatingA ?? undefined,
      mainBreakerA: mainBreakerA ?? undefined,
      standardsPolicy,
      selected: {
        panel: resolved.panel,
        inverter: resolved.inverter,
        battery: resolved.battery,
        controller: resolved.controller,
        pvCable: resolved.pvCable,
        dcCable: resolved.dcCable,
        acCable: resolved.acCable,
      },
    };
  }, [
    loads,
    loadMode,
    totalDailyKwh,
    totalPeakKw,
    totalSurgeKw,
    totalLoadIsAc,
    systemType,
    effectiveWinterPsh,
    effectiveSummerPsh,
    effectiveLatitude,
    effectiveTilt,
    effectiveAzimuth,
    effectiveShadingFactor,
    fuelPricePerL,
    generatorChargeHoursPerDay,
    autonomyDays,
    chemistry,
    voltage,
    minTemperatureC,
    inverterEfficiency,
    systemLossFactor,
    dcVoltageDropPercent,
    acVoltageDropPercent,
    tempDeratingFactor,
    pvCableLengthM,
    dcCableLengthM,
    acCableLengthM,
    busbarRatingA,
    mainBreakerA,
    standardsPolicy,
    resolved,
  ]);

  const { result, resultError } = useMemo(() => {
    try {
      return { result: designSystem(input), resultError: null as string | null };
    } catch (error) {
      return {
        result: null,
        resultError: error instanceof Error ? error.message : 'Design calculation failed',
      };
    }
  }, [input]);

  const baselineLimits = () => {
    if (systemType === 'off-grid') {
      const c = REFERENCE_CONTROLLER;
      return { min: 48, max: c.maxPvVoltageV, current: c.ratedCurrentA, maxV: c.maxPvVoltageV };
    }
    const inv = referenceInverterFor(systemType);
    return {
      min: inv.mpptVoltageRangeMinV,
      max: inv.mpptVoltageRangeMaxV,
      current: inv.maxPvCurrentA * inv.mpptCount,
      maxV: inv.maxPvVoltageV,
    };
  };

  const autoSuggest = async () => {
    setBusy(true);
    setSaveError(null);
    try {
      const baseline = designSystem({ ...input, selected: {} });
      const limits = baselineLimits();
      const req: SuggestRequirements = {
        requiredArrayWatts: baseline.pv.requiredArrayWatts,
        recommendedContinuousWatts: baseline.inverter.recommendedContinuousWatts,
        recommendedSurgeWatts: baseline.inverter.recommendedSurgeWatts,
        systemVoltage: baseline.battery.systemVoltageV,
        systemType,
        chemistry,
        requiredKwh: baseline.battery.requiredKwh,
        controllerMinCurrentA: baseline.controller.minCurrentA,
        controllerMaxPvVoltageRequiredV: baseline.controller.maxPvVoltageRequiredV,
        mpptMinVoltageV: limits.min,
        mpptMaxVoltageV: limits.max,
        maxInputVoltageV: limits.maxV,
        minTemperatureC: minTemperatureC ?? -10,
      };
      const suggestion = suggestComponents(
        req,
        (lists.panel ?? []) as ComponentRecord<PanelSpec>[],
        (lists.inverter ?? []) as ComponentRecord<InverterSpec>[],
        (lists.battery ?? []) as ComponentRecord<BatterySpec>[],
        (lists.controller ?? []) as ComponentRecord<ChargeControllerSpec>[],
      );
      setSelectedPanelId(suggestion.panelId);
      setSelectedInverterId(suggestion.inverterId);
      setSelectedBatteryId(suggestion.batteryId);
      setSelectedControllerId(suggestion.controllerId);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Component suggestion failed');
    } finally {
      setBusy(false);
    }
  };

  const isOnGrid = systemType === 'on-grid';
  const isOffGrid = systemType === 'off-grid';
  const step1Valid = mode === 'edit' || projectName.trim().length > 0;

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const patch = {
        systemType,
        systemVoltageV: voltage === 'auto' ? null : (Number(voltage) as SystemVoltage),
        chemistry,
        autonomyDays,
        winterPsh: effectiveWinterPsh,
        summerPsh: effectiveSummerPsh,
        pshLocationId: effectivePshLocationId,
        minTemperatureC,
        inverterEfficiency,
        systemLossFactor,
        dcVoltageDropPercent,
        acVoltageDropPercent,
        tempDeratingFactor,
        pvCableLengthM,
        dcCableLengthM,
        acCableLengthM,
        busbarRatingA,
        mainBreakerA,
        tiltDeg: tilt,
        azimuthDeg: azimuth,
        shadingFactor: shadingLossPct === null ? null : Math.max(0.5, (100 - shadingLossPct) / 100),
        fuelPricePerL,
        generatorChargeHoursPerDay,
        selectedPanelId,
        selectedInverterId,
        selectedBatteryId,
        selectedControllerId,
        selectedPvCableId,
        selectedDcCableId,
        selectedAcCableId,
        loadMode,
        loads,
        totalDailyKwh,
        totalPeakKw,
        totalSurgeKw,
        totalLoadIsAc,
      };
      let projectId = '';
      let scenarioId = '';
      if (mode === 'create') {
        const project = await useProjectStore.getState().create({
          name: projectName.trim(),
          clientName: clientName.trim() || undefined,
          scenarioName: 'Base design',
          systemType,
          loads,
        });
        projectId = project.id;
        scenarioId = project.scenarios[0].id;
        await useProjectStore.getState().updateScenario(scenarioId, patch);
      } else if (initial) {
        projectId = initial.projectId;
        scenarioId = initial.id;
        await useProjectStore.getState().updateScenario(scenarioId, patch);
      }
      if (result) await useProjectStore.getState().saveDesignResult(scenarioId, result);
      onSaved(projectId, scenarioId);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step < WIZARD_STEPS) setStep((s) => s + 1);
    else save();
  };

  const wizardMode = useSettingsStore((s) => s.wizardMode);
  const expert = wizardMode === 'expert';

  const loadSection = (
    <>
      <SegmentedField
        label="Load description"
        value={loadMode}
        onChange={(v) => setLoadMode(v as LoadMode)}
        options={[
          { value: 'appliances', label: 'Appliances' },
          { value: 'total', label: 'Total (kWh)' },
        ]}
      />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {loadMode === 'appliances'
          ? 'List every appliance — the most accurate way to size the system.'
          : 'Enter the whole site’s daily consumption (e.g. from a bill or meter). Peak and surge loads are estimated when left blank.'}
      </Text>
      {loadMode === 'appliances' ? (
        <LoadEditor loads={loads} presets={reference.presets} onChangeLoads={setLoads} />
      ) : (
        <TotalLoadEditor
          totalDailyKwh={totalDailyKwh}
          totalPeakKw={totalPeakKw}
          totalSurgeKw={totalSurgeKw}
          totalLoadIsAc={totalLoadIsAc}
          onChange={({
            totalDailyKwh: kwh,
            totalPeakKw: peak,
            totalSurgeKw: surge,
            totalLoadIsAc: isAc,
          }) => {
            setTotalDailyKwh(kwh);
            setTotalPeakKw(peak);
            setTotalSurgeKw(surge);
            setTotalLoadIsAc(isAc);
          }}
        />
      )}
    </>
  );

  const step1 = (
    <View style={styles.gap}>
      {mode === 'create' ? (
        <>
          <Card mode="outlined">
            <Card.Content style={styles.gap}>
              <TextInput
                mode="outlined"
                label="Project name *"
                value={projectName}
                onChangeText={setProjectName}
                dense
              />
              <TextInput
                mode="outlined"
                label="Client name"
                value={clientName}
                onChangeText={setClientName}
                dense
              />
            </Card.Content>
          </Card>
          <SectionTitle title="Load audit" icon="format-list-bulleted" />
          {loadSection}
        </>
      ) : (
        loadSection
      )}
    </View>
  );

  const step2 = (
    <View style={styles.gap}>
      <PshPicker
        locations={reference.psh}
        selectedId={effectivePshLocationId}
        onSelect={(location) => {
          setPshLocationId(location.id);
          setWinterPsh(location.winterPsh);
          setSummerPsh(location.summerPsh);
        }}
        onClear={() => {
          setPshLocationId(null);
        }}
      />
      <Button
        icon="map-marker-plus-outline"
        mode="outlined"
        onPress={() => setManualPshOpen(true)}
        style={styles.suggestButton}
      >
        Add manual location
      </Button>
      <SectionTitle title="Peak sun hours (manual override)" icon="weather-sunny" />
      <View style={styles.row}>
        <NumberField
          label="Winter PSH"
          value={effectiveWinterPsh}
          onChange={setWinterPsh}
          unit="h/day"
        />
        <NumberField
          label="Summer PSH"
          value={effectiveSummerPsh}
          onChange={setSummerPsh}
          unit="h/day"
        />
      </View>
      <NumberField
        label="Min. ambient temperature"
        value={
          minTemperatureC === null
            ? null
            : tempUnit === 'f'
              ? cToF(minTemperatureC)
              : minTemperatureC
        }
        onChange={(v) => setMinTemperatureC(v === null ? null : tempUnit === 'f' ? fToC(v) : v)}
        unit={tempUnit === 'f' ? '°F' : '°C'}
        decimals={0}
        min={-60}
        max={tempUnit === 'f' ? 140 : 60}
        helperText="Used for worst-cold Voc derating (NEC 690.7)."
      />
    </View>
  );

  const step3 = (
    <View style={styles.gap}>
      <SegmentedField
        label="System type"
        value={systemType}
        onChange={(v) => setSystemType(v as SystemType)}
        options={[
          { value: 'on-grid', label: 'On-grid' },
          { value: 'hybrid', label: 'Hybrid' },
          { value: 'off-grid', label: 'Off-grid' },
        ]}
      />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {SYSTEM_TYPE_HELP[systemType]}
      </Text>
      {!isOnGrid ? (
        <>
          <StepperField
            label="Days of autonomy"
            value={autonomyDays}
            onChange={setAutonomyDays}
            min={1}
            max={10}
          />
          <SegmentedField
            label="Battery chemistry"
            value={chemistry}
            onChange={(v) => setChemistry(v as BatteryChemistry)}
            options={[
              { value: 'lifepo4', label: 'LiFePO4' },
              { value: 'agm-gel', label: 'AGM/Gel' },
              { value: 'flooded', label: 'Flooded' },
            ]}
          />
        </>
      ) : null}
      <SegmentedField
        label="System voltage"
        value={voltage}
        onChange={(v) => setVoltage(v as VoltageChoice)}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: '12', label: '12 V' },
          { value: '24', label: '24 V' },
          { value: '48', label: '48 V' },
        ]}
      />

      <Button
        mode={advancedOpen ? 'contained-tonal' : 'outlined'}
        icon={advancedOpen ? 'chevron-up' : 'chevron-down'}
        onPress={() => setAdvancedOpen((v) => !v)}
        style={styles.suggestButton}
      >
        Advanced engineering inputs
      </Button>
      {advancedOpen ? (
        <Card mode="outlined">
          <Card.Content style={styles.gap}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Optional — blank fields fall back to the engine defaults.
            </Text>
            <View style={styles.row}>
              <NumberField
                label="Inverter efficiency"
                value={inverterEfficiency === null ? null : inverterEfficiency * 100}
                onChange={(v) => setInverterEfficiency(v === null ? null : v / 100)}
                unit="%"
                decimals={1}
                min={50}
                max={100}
              />
              <NumberField
                label="System loss factor"
                value={systemLossFactor === null ? null : systemLossFactor * 100}
                onChange={(v) => setSystemLossFactor(v === null ? null : v / 100)}
                unit="%"
                decimals={1}
                min={0}
                max={100}
              />
            </View>
            <View style={styles.row}>
              <NumberField
                label="DC voltage drop limit"
                value={dcVoltageDropPercent}
                onChange={setDcVoltageDropPercent}
                unit="%"
                decimals={1}
                min={0}
                max={10}
              />
              <NumberField
                label="AC voltage drop limit"
                value={acVoltageDropPercent}
                onChange={setAcVoltageDropPercent}
                unit="%"
                decimals={1}
                min={0}
                max={10}
              />
            </View>
            <NumberField
              label="Cable temp derating factor"
              value={tempDeratingFactor === null ? null : tempDeratingFactor * 100}
              onChange={(v) => setTempDeratingFactor(v === null ? null : v / 100)}
              unit="%"
              decimals={1}
              min={0}
              max={100}
              helperText="Rooftop temperature derating applied to conductor ampacity."
            />
            <View style={styles.row}>
              <NumberField
                label="PV cable length"
                value={
                  pvCableLengthM === null
                    ? null
                    : lengthUnit === 'ft'
                      ? mToFt(pvCableLengthM)
                      : pvCableLengthM
                }
                onChange={(v) =>
                  setPvCableLengthM(v === null ? null : lengthUnit === 'ft' ? ftToM(v) : v)
                }
                unit={lengthUnit === 'ft' ? 'ft' : 'm'}
                decimals={1}
                min={0}
              />
              <NumberField
                label="DC cable length"
                value={
                  dcCableLengthM === null
                    ? null
                    : lengthUnit === 'ft'
                      ? mToFt(dcCableLengthM)
                      : dcCableLengthM
                }
                onChange={(v) =>
                  setDcCableLengthM(v === null ? null : lengthUnit === 'ft' ? ftToM(v) : v)
                }
                unit={lengthUnit === 'ft' ? 'ft' : 'm'}
                decimals={1}
                min={0}
              />
            </View>
            <NumberField
              label="AC cable length"
              value={
                acCableLengthM === null
                  ? null
                  : lengthUnit === 'ft'
                    ? mToFt(acCableLengthM)
                    : acCableLengthM
              }
              onChange={(v) =>
                setAcCableLengthM(v === null ? null : lengthUnit === 'ft' ? ftToM(v) : v)
              }
              unit={lengthUnit === 'ft' ? 'ft' : 'm'}
              decimals={1}
              min={0}
            />
            <View style={styles.row}>
              <NumberField
                label="Busbar rating"
                value={busbarRatingA}
                onChange={setBusbarRatingA}
                unit="A"
                decimals={0}
                min={0}
                max={5000}
              />
              <NumberField
                label="Main breaker"
                value={mainBreakerA}
                onChange={setMainBreakerA}
                unit="A"
                decimals={0}
                min={0}
                max={5000}
              />
            </View>
          </Card.Content>
        </Card>
      ) : null}
    </View>
  );

  const step4 = (
    <View style={styles.gap}>
      <Button
        mode="contained-tonal"
        icon="auto-fix"
        onPress={autoSuggest}
        loading={busy}
        style={styles.suggestButton}
      >
        Auto-suggest components
      </Button>
      <ComponentSlot
        kind="panel"
        label="PV panel"
        selectedId={selectedPanelId}
        onSelect={setSelectedPanelId}
        helperText="Minimizes panel count within the MPPT string limits."
      />
      <ComponentSlot
        kind="inverter"
        label="Inverter"
        selectedId={selectedInverterId}
        onSelect={setSelectedInverterId}
        helperText={
          isOnGrid ? 'Grid-tied string inverter.' : 'Must match the battery bank voltage.'
        }
      />
      {!isOnGrid ? (
        <ComponentSlot
          kind="battery"
          label="Battery"
          selectedId={selectedBatteryId}
          onSelect={setSelectedBatteryId}
          helperText={`Matched to ${chemistry} chemistry and ${voltage === 'auto' ? 'recommended' : `${voltage} V`} voltage.`}
        />
      ) : null}
      {isOffGrid ? (
        <ComponentSlot
          kind="controller"
          label="Charge controller"
          selectedId={selectedControllerId}
          onSelect={setSelectedControllerId}
          helperText="MPPT recommended above 200 W array."
        />
      ) : null}
      <SectionTitle title="Conductors (optional)" icon="cable-data" />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Leave unselected to let the engine size each run automatically. A chosen cable is honored
        and checked against ampacity and voltage-drop limits.
      </Text>
      <ComponentSlot
        kind="cable"
        label="PV source cable"
        selectedId={selectedPvCableId}
        onSelect={setSelectedPvCableId}
        helperText="Runs from the array to the inverter / controller (derated for rooftop temperature)."
      />
      {!isOnGrid ? (
        <ComponentSlot
          kind="cable"
          label="DC battery cable"
          selectedId={selectedDcCableId}
          onSelect={setSelectedDcCableId}
          helperText="Runs between the battery bank and the inverter DC input."
        />
      ) : null}
      <ComponentSlot
        kind="cable"
        label="AC output cable"
        selectedId={selectedAcCableId}
        onSelect={setSelectedAcCableId}
        helperText="Runs from the inverter AC output to the main distribution."
      />
    </View>
  );

  const step5 = (
    <ResultsView
      result={result}
      error={resultError}
      onAutoSuggest={autoSuggest}
      busy={busy}
      standardsPolicy={standardsPolicy}
      onStandardsPolicyChange={setStandardsPolicy}
      tilt={tilt}
      setTilt={setTilt}
      azimuth={azimuth}
      setAzimuth={setAzimuth}
      effectiveTilt={effectiveTilt}
      effectiveAzimuth={effectiveAzimuth}
      effectiveLatitude={effectiveLatitude}
      recommendedTilt={recommendedTilt}
      tiltSensitivity={tiltSensitivity}
      shadingLossPct={shadingLossPct}
      setShadingLossPct={setShadingLossPct}
      fuelPricePerL={fuelPricePerL}
      setFuelPricePerL={setFuelPricePerL}
      generatorChargeHoursPerDay={generatorChargeHoursPerDay}
      setGeneratorChargeHoursPerDay={setGeneratorChargeHoursPerDay}
    />
  );

  return (
    <View style={styles.container}>
      {!expert ? (
        <StepHeader
          step={step}
          total={WIZARD_STEPS}
          title={STEP_TITLES[step]}
          subtitle={STEP_SUBTITLES[step]}
        />
      ) : null}
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {expert ? (
          <View style={styles.gap}>
            {mode === 'create' ? (
              <SectionTitle title="1 · Project & loads" icon="folder-outline" />
            ) : null}
            {step1}
            <SectionTitle title="2 · Location & solar" icon="weather-sunny" />
            {step2}
            <SectionTitle title="3 · System type" icon="power-plug-outline" />
            {step3}
            <SectionTitle title="4 · Components" icon="wrench-outline" />
            {step4}
            <SectionTitle title="5 · Results" icon="chart-box-outline" />
            {step5}
          </View>
        ) : (
          <>
            {step === 1 ? step1 : null}
            {step === 2 ? step2 : null}
            {step === 3 ? step3 : null}
            {step === 4 ? step4 : null}
            {step === 5 ? step5 : null}
          </>
        )}
      </ScrollView>

      {!expert ? (
        <StepNav
          onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
          onNext={goNext}
          nextLabel={step === WIZARD_STEPS ? (saving ? 'Saving…' : 'Save & finish') : 'Next'}
          nextDisabled={step === 1 ? !step1Valid : step === 5 ? !result : false}
          busy={saving}
        />
      ) : (
        <Button
          mode="contained"
          icon="content-save-outline"
          onPress={save}
          loading={saving}
          disabled={mode === 'create' ? !step1Valid : false}
          style={styles.expertSave}
        >
          Save & finish
        </Button>
      )}

      <ManualPshDialog
        visible={manualPshOpen}
        onDismiss={() => setManualPshOpen(false)}
        onAdd={async (entry) => {
          const location = await reference.addPshManual(entry);
          setPshLocationId(location.id);
          setWinterPsh(location.winterPsh);
          setSummerPsh(location.summerPsh);
        }}
      />
      <Snackbar visible={saveError !== null} onDismiss={() => setSaveError(null)} duration={4000}>
        {saveError ?? ''}
      </Snackbar>
    </View>
  );
}

const STEP_TITLES: Record<number, string> = {
  1: 'Project & loads',
  2: 'Location & solar',
  3: 'System type',
  4: 'Components',
  5: 'Results',
};

const STEP_SUBTITLES: Record<number, string> = {
  1: 'Name the project and list every appliance you will power.',
  2: 'Pick the installation city or enter peak sun hours manually.',
  3: 'Choose how the system connects and its storage settings.',
  4: 'Select hardware from the catalog or let the app suggest.',
  5: 'Review recommendations, warnings and the full audit trail.',
};

const SYSTEM_TYPE_HELP: Record<SystemType, string> = {
  'on-grid': 'Feeds solar into the grid. No battery bank required (grid is the backup).',
  hybrid: 'Battery backup plus grid connection. Runs loads during outages.',
  'off-grid': 'Fully independent with battery storage and a charge controller.',
};

function ResultsView(props: {
  result: ReturnType<typeof designSystem> | null;
  error: string | null;
  onAutoSuggest: () => void;
  busy: boolean;
  standardsPolicy: StandardsPolicy;
  onStandardsPolicyChange: (policy: StandardsPolicy) => void;
  tilt: number | null;
  setTilt: (value: number | null) => void;
  azimuth: number | null;
  setAzimuth: (value: number | null) => void;
  effectiveTilt: number;
  effectiveAzimuth: number;
  effectiveLatitude: number;
  recommendedTilt: number;
  tiltSensitivity: { tilt: number; factor: number }[];
  shadingLossPct: number | null;
  setShadingLossPct: (value: number | null) => void;
  fuelPricePerL: number | null;
  setFuelPricePerL: (value: number | null) => void;
  generatorChargeHoursPerDay: number | null;
  setGeneratorChargeHoursPerDay: (value: number | null) => void;
}) {
  const {
    result,
    error,
    onAutoSuggest,
    busy,
    standardsPolicy,
    onStandardsPolicyChange,
    tilt,
    setTilt,
    azimuth,
    setAzimuth,
    effectiveTilt,
    effectiveAzimuth,
    effectiveLatitude,
    recommendedTilt,
    tiltSensitivity,
    shadingLossPct,
    setShadingLossPct,
    fuelPricePerL,
    setFuelPricePerL,
    generatorChargeHoursPerDay,
    setGeneratorChargeHoursPerDay,
  } = props;
  const theme = useTheme();
  const f = useUnitFormatters();
  const powerUnit = useSettingsStore((s) => s.units.power);
  const electricRate = useSettingsStore((s) => s.electricRate);
  const setElectricRate = useSettingsStore((s) => s.setElectricRate);
  const discountRate = useSettingsStore((s) => s.discountRate);
  const setDiscountRate = useSettingsStore((s) => s.setDiscountRate);
  const systemLifeYears = useSettingsStore((s) => s.systemLifeYears);
  const setSystemLifeYears = useSettingsStore((s) => s.setSystemLifeYears);
  const tariffEscalationRate = useSettingsStore((s) => s.tariffEscalationRate);
  const setTariffEscalationRate = useSettingsStore((s) => s.setTariffEscalationRate);
  const currency = useSettingsStore((s) => s.currency);
  const [costOpen, setCostOpen] = useState(false);

  if (error) {
    return (
      <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
        {error}
      </Text>
    );
  }
  if (!result) return null;

  const { dailyLoad, pv, battery, inverter, controller, cables, protection } = result;
  const useKw = powerUnit === 'kw';
  const isOnGrid = result.input.systemType === 'on-grid';
  const isOffGrid = result.input.systemType === 'off-grid';
  const currencySymbol = CURRENCY_SYMBOLS[currency];
  const cost = estimateCost(result, {
    electricRate,
    currency: currencySymbol,
    discountRate,
    systemLifeYears,
    tariffEscalationRate,
  });
  const money = (value: number): string => `${currencySymbol}${f.number(value, 2)}`;

  return (
    <View style={styles.gap}>
      <View style={styles.statRow}>
        <StatCard
          label="Daily energy"
          value={f.number(
            useKw ? dailyLoad.totalWhPerDay / 1000 : dailyLoad.totalWhPerDay,
            useKw ? 2 : 0,
          )}
          unit={useKw ? 'kWh/day' : 'Wh/day'}
          icon="lightning-bolt"
          tint={theme.colors.primary}
        />
        <StatCard
          label="Peak load"
          value={f.power(dailyLoad.peakSimultaneousWatts)}
          icon="gauge"
          tint={theme.colors.primary}
        />
      </View>
      <View style={styles.statRow}>
        <StatCard
          label="PV array"
          value={f.power(pv.actualArrayWatts)}
          hint={`${pv.seriesCount}S × ${pv.parallelCount}P panels`}
          icon="solar-panel"
          tint={theme.colors.secondary}
        />
        {!isOnGrid ? (
          <StatCard
            label="Battery bank"
            value={f.number(battery.actualCapacityAh, 0)}
            unit="Ah"
            hint={`${battery.batteryCount} cells · ${f.number(useKw ? battery.actualCapacityKwh : battery.actualCapacityKwh * 1000, useKw ? 2 : 0)} ${useKw ? 'kWh' : 'Wh'}`}
            icon="battery"
            tint={theme.colors.tertiary}
          />
        ) : null}
      </View>
      <View style={styles.statRow}>
        <StatCard
          label="Inverter"
          value={f.power(inverter.recommendedContinuousWatts)}
          hint={`Surge ${f.power(inverter.recommendedSurgeWatts)}`}
          icon="transmission-tower"
          tint={theme.colors.primary}
        />
        {isOffGrid ? (
          <StatCard
            label="Controller"
            value={controller.minCurrentA > 0 ? f.number(controller.minCurrentA, 1) : '—'}
            unit={controller.minCurrentA > 0 ? 'A' : undefined}
            hint={controller.recommendedType}
            icon="cog"
            tint={theme.colors.primary}
          />
        ) : null}
      </View>

      <SectionTitle title="Compliance & warnings" icon="shield-alert-outline" />
      <SegmentedField
        label="Standards policy"
        value={standardsPolicy}
        onChange={(v) => onStandardsPolicyChange(v as StandardsPolicy)}
        options={[
          { value: 'strict', label: 'Strict' },
          { value: 'advisory', label: 'Advisory' },
          { value: 'off', label: 'Off' },
        ]}
      />
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {standardsPolicy === 'strict'
          ? 'International codes enforced as-is.'
          : standardsPolicy === 'advisory'
            ? 'Standards checks shown as advisories — local-market components are accepted.'
            : 'Standards checks hidden; engineering safety checks still apply.'}
      </Text>
      <WarningsList warnings={result.warnings} />

      <SectionTitle title="Electrical summary" icon="format-list-bulleted" />
      <Card mode="outlined">
        <Card.Content>
          <KeyValueRow label="System voltage" value={`${battery.systemVoltageV} V`} />
          <KeyValueRow
            label="Array Voc (cold)"
            value={`${f.number(result.compliance.arrayVocColdV, 1)} V`}
            strong
          />
          <KeyValueRow
            label="PV source cable"
            value={`${f.cableSize(cables.pvSource.crossSectionMm2)} · ${f.number(cables.pvSource.voltageDropPercent, 2)}% drop`}
          />
          <KeyValueRow
            label="DC output cable"
            value={`${f.cableSize(cables.dcOutput.crossSectionMm2)} · ${f.number(cables.dcOutput.voltageDropPercent, 2)}% drop`}
          />
          <KeyValueRow
            label="AC output cable"
            value={`${f.cableSize(cables.acOutput.crossSectionMm2)} · ${f.number(cables.acOutput.voltageDropPercent, 2)}% drop`}
          />
          <KeyValueRow label="PV source OCPD" value={`${protection.pvSourceOcpdStandardA} A`} />
          <KeyValueRow label="AC breaker" value={`${protection.acBreakerStandardA} A`} />
          <KeyValueRow
            label="Backfeed rule"
            value={protection.backfeedPasses ? 'Passes' : 'Fails'}
          />
        </Card.Content>
      </Card>

      <SectionTitle title="Production & yield" icon="chart-bar" />
      <View style={styles.statRow}>
        <StatCard
          label="Annual yield"
          value={f.number(result.production.annualKwh, 0)}
          unit="kWh/yr"
          hint="PVWatts-style monthly simulation"
          icon="solar-power"
          tint={theme.colors.tertiary}
        />
        <StatCard
          label="Performance ratio"
          value={`${f.number(result.production.performanceRatio * 100, 0)}%`}
          hint={`Avg temp derate ${f.number(result.production.temperatureDerateAvg * 100, 0)}%`}
          icon="chart-areaspline"
          tint={theme.colors.secondary}
        />
      </View>
      <NumberField
        label="Shading loss"
        value={shadingLossPct}
        onChange={setShadingLossPct}
        unit="%"
        helperText="Trees, buildings or inter-row shadowing (0 = no shading)."
        min={0}
        max={50}
        decimals={0}
      />
      <Card mode="outlined">
        <Card.Content>
          <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
            Monthly yield (kWh)
          </Text>
          <View style={styles.barChart}>
            {result.production.months.map((m) => {
              const maxEnergy = Math.max(...result.production.months.map((x) => x.energyKwh), 1);
              const heightPct = Math.max(4, (m.energyKwh / maxEnergy) * 100);
              return (
                <View key={m.month} style={styles.barColumn}>
                  <Text variant="labelSmall" style={styles.barValue}>
                    {f.number(m.energyKwh, 0)}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPct}%`, backgroundColor: theme.colors.primary },
                      ]}
                    />
                  </View>
                  <Text variant="labelSmall" style={styles.barLabel}>
                    {monthLabel(m.month)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <Card mode="outlined">
        <Card.Content>
          <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
            Tilt &amp; orientation
          </Text>
          <View style={styles.statRow}>
            <NumberField
              label="Array tilt"
              value={tilt}
              onChange={setTilt}
              unit="°"
              min={0}
              max={60}
              decimals={0}
              helperText={`Recommended ${recommendedTilt}° for this latitude`}
            />
            <NumberField
              label="Azimuth"
              value={azimuth}
              onChange={setAzimuth}
              unit="°"
              min={0}
              max={360}
              decimals={0}
              helperText="0 = north · 180 = south"
            />
          </View>
          <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            {effectiveAzimuth === (effectiveLatitude >= 0 ? 180 : 0)
              ? `Array faces the equator at ${effectiveTilt}° tilt — optimal orientation.`
              : `Array is ${result.production.orientation?.azimuthFromEquator ?? 0}° off equator-facing (yield factor ×${f.number(result.production.orientation?.annualFactor ?? 1, 2)}).`}
          </Text>
          <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            Annual yield vs tilt (current azimuth)
          </Text>
          <View style={styles.sensRow}>
            {tiltSensitivity.map((s) => {
              const heightPct = Math.max(6, s.factor * 100);
              const active = Math.round(effectiveTilt) === s.tilt;
              return (
                <View key={s.tilt} style={styles.sensCol}>
                  <Text variant="labelSmall" style={styles.sensValue}>
                    {f.number(s.factor * 100, 0)}%
                  </Text>
                  <View style={styles.sensTrack}>
                    <View
                      style={[
                        styles.sensFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: active ? theme.colors.primary : theme.colors.outline,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="labelSmall" style={styles.sensLabel}>
                    {s.tilt}°
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      <SectionTitle title="Cost & payback" icon="currency-usd" />
      <Button
        mode={costOpen ? 'contained-tonal' : 'outlined'}
        icon={costOpen ? 'chevron-up' : 'chevron-down'}
        onPress={() => setCostOpen((v) => !v)}
        style={styles.suggestButton}
      >
        Cost estimate & ROI
      </Button>
      {costOpen ? (
        <View style={styles.gap}>
          <View style={styles.statRow}>
            <StatCard
              label="Est. system cost"
              value={money(cost.total)}
              icon="cash-multiple"
              tint={theme.colors.primary}
            />
            <StatCard
              label="Payback"
              value={cost.simplePaybackYears === null ? '—' : f.number(cost.simplePaybackYears, 1)}
              unit={cost.simplePaybackYears === null ? undefined : 'yrs'}
              hint={cost.simplePaybackYears === null ? 'Set a grid rate' : undefined}
              icon="timeline-clock"
              tint={theme.colors.secondary}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              label="Annual yield"
              value={f.number(cost.annualProductionKwh, 0)}
              unit="kWh/yr"
              hint="At the site's peak sun hours"
              icon="solar-power"
              tint={theme.colors.tertiary}
            />
            <StatCard
              label="Annual savings"
              value={money(cost.annualSavings)}
              hint="Yield × grid rate"
              icon="trending-up"
              tint={theme.colors.primary}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              label="Discounted payback"
              value={
                cost.financial.discountedPaybackYears === null
                  ? '—'
                  : f.number(cost.financial.discountedPaybackYears, 1)
              }
              unit={cost.financial.discountedPaybackYears === null ? undefined : 'yrs'}
              hint={`${f.number(cost.financial.discountRate * 100, 0)}% discount rate`}
              icon="timeline-clock-outline"
              tint={theme.colors.secondary}
            />
            <StatCard
              label="NPV"
              value={money(cost.financial.netPresentValue)}
              hint={`${cost.financial.systemLifeYears} year cash-flow`}
              icon="chart-areaspline"
              tint={theme.colors.primary}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              label="LCOE"
              value={
                cost.financial.lcoe === null ? '—' : `${currencySymbol}${f.number(cost.financial.lcoe, 3)}`
              }
              unit="per kWh"
              hint="Levelized cost of energy"
              icon="equalizer"
              tint={theme.colors.tertiary}
            />
            <StatCard
              label="Battery replacements"
              value={f.number(cost.financial.batteryReplacements.length, 0)}
              unit="over life"
              hint={
                cost.financial.batteryReplacements.length === 0
                  ? 'Within system life'
                  : cost.financial.batteryReplacements.map((r) => `yr ${r.year}`).join(', ')
              }
              icon="battery-alert"
              tint={theme.colors.secondary}
            />
          </View>

          <Card mode="outlined">
            <Card.Content>
              {cost.lines.map((line) => (
                <KeyValueRow
                  key={line.id}
                  label={`${line.label} · ${f.number(line.quantity, line.quantity < 10 ? 2 : 0)} ${line.unit} × ${currencySymbol}${f.number(line.unitPrice, 2)}`}
                  value={money(line.total)}
                />
              ))}
              <Divider style={styles.costDivider} />
              <KeyValueRow label="Equipment subtotal" value={money(cost.equipmentSubtotal)} />
              <KeyValueRow label="Balance of system (BOS)" value={money(cost.bosTotal)} />
              <KeyValueRow label="Installation & labor" value={money(cost.laborTotal)} />
              <KeyValueRow label="Total estimate" value={money(cost.total)} strong />
            </Card.Content>
          </Card>

          <Card mode="outlined">
            <Card.Content>
              <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
                Battery aging
              </Text>
              {cost.batteryAging ? (
                <>
                  <KeyValueRow
                    label={`Expected lifespan (${Math.round(result.battery.depthOfDischarge * 100)}% DoD)`}
                    value={
                      Number.isFinite(cost.batteryAging.lifespanYears)
                        ? `${f.number(cost.batteryAging.lifespanYears, 1)} yrs`
                        : 'System lifetime'
                    }
                  />
                  <KeyValueRow
                    label="Cycling · cycles"
                    value={`${f.number(cost.batteryAging.cyclesPerDay, 2)}/day · ${f.number(cost.batteryAging.effectiveCycleLife, 0)}`}
                  />
                  <Text variant="bodySmall" style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}>
                    Lifespan vs depth of discharge
                  </Text>
                  <View style={styles.sensRow}>
                    {[0.3, 0.5, 0.7, 0.8, 0.9].map((dod) => {
                      const spec = result.input.selected?.battery ?? REFERENCE_BATTERY;
                      const years = batteryAgingAnalysis({
                        ratedCycles: spec.cycles ?? 0,
                        ratedDoD: spec.recommendedDoD,
                        actualDoD: dod,
                        chemistry: result.input.chemistry,
                        batteryKwh: result.battery.actualCapacityKwh,
                        dailyCycledKwh: result.dailyLoad.totalWhPerDay / 1000,
                        systemLifeYears: systemLifeYears,
                      }).lifespanYears;
                      const capped = Number.isFinite(years) ? Math.min(years, 30) : 30;
                      const active = Math.abs(dod - result.battery.depthOfDischarge) < 0.05;
                      return (
                        <View key={dod} style={styles.sensCol}>
                          <Text variant="labelSmall" style={styles.sensValue}>
                            {Number.isFinite(years) ? f.number(years, 0) : '∞'}
                          </Text>
                          <View style={styles.sensTrack}>
                            <View
                              style={[
                                styles.sensFill,
                                {
                                  height: `${Math.max(6, (capped / 30) * 100)}%`,
                                  backgroundColor: active ? theme.colors.tertiary : theme.colors.outline,
                                },
                              ]}
                            />
                          </View>
                          <Text variant="labelSmall" style={styles.sensLabel}>
                            {f.number(dod * 100, 0)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  No battery bank modelled (on-grid).
                </Text>
              )}
            </Card.Content>
          </Card>

          {result.generator ? (
            <Card mode="outlined">
              <Card.Content>
                <Text variant="labelMedium" style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
                  Backup generator (hybrid)
                </Text>
                <KeyValueRow
                  label="Recommended rating"
                  value={`${f.number(result.generator.recommendedKw, 0)} kW`}
                />
                <KeyValueRow
                  label="Required battery charger"
                  value={`${f.number(result.generator.requiredChargerKw, 1)} kW`}
                />
                <KeyValueRow
                  label="Estimated runtime"
                  value={`${f.number(result.generator.runtimeHoursPerDay, 1)} h/day`}
                />
                <KeyValueRow
                  label="Fuel consumption"
                  value={`${f.number(result.generator.dailyFuelL, 1)} L/day · ${f.number(result.generator.annualFuelL, 0)} L/yr`}
                />
                {result.generator.annualFuelCost !== null ? (
                  <KeyValueRow
                    label="Annual fuel cost"
                    value={money(result.generator.annualFuelCost)}
                  />
                ) : null}
                <NumberField
                  label="Diesel price"
                  value={fuelPricePerL}
                  onChange={setFuelPricePerL}
                  unit={`${currencySymbol}/L`}
                  helperText="Optional — adds the generator running cost to the estimate."
                  decimals={2}
                  min={0}
                  max={5}
                />
                <NumberField
                  label="Recharge window"
                  value={generatorChargeHoursPerDay}
                  onChange={setGeneratorChargeHoursPerDay}
                  unit="h/day"
                  helperText="Hours per day the generator runs to recharge the battery bank. Lower = larger charger."
                  decimals={1}
                  min={1}
                  max={24}
                />
              </Card.Content>
            </Card>
          ) : null}

          <NumberField
            label="Grid electric rate"
            value={electricRate}
            onChange={(v) => setElectricRate(v ?? 0)}
            unit={`${currencySymbol}/kWh`}
            helperText="Drives annual savings and the simple payback."
            decimals={3}
            min={0}
            max={2}
          />
          <NumberField
            label="Discount rate"
            value={discountRate}
            onChange={(v) => setDiscountRate(v ?? 0)}
            unit="%"
            helperText="Annual discount rate for NPV and discounted payback."
            decimals={1}
            min={0}
            max={25}
          />
          <NumberField
            label="System life"
            value={systemLifeYears}
            onChange={(v) => setSystemLifeYears(v ?? 25)}
            unit="years"
            helperText="Cash-flow analysis period (battery replacements within it)."
            decimals={0}
            min={1}
            max={40}
          />
          <NumberField
            label="Tariff escalation"
            value={tariffEscalationRate}
            onChange={(v) => setTariffEscalationRate(v ?? 0)}
            unit="% / yr"
            helperText="Annual increase applied to grid-rate savings."
            decimals={1}
            min={0}
            max={15}
          />

          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {cost.assumptions.map((assumption) => `• ${assumption}`).join('\n')}
          </Text>
        </View>
      ) : null}

      <SectionTitle title="Audit trail (show your work)" icon="calculator" />
      <AuditTrailList steps={result.audit} />

      <Button
        icon="auto-fix"
        mode="outlined"
        onPress={onAutoSuggest}
        loading={busy}
        style={styles.suggestButton}
      >
        Re-suggest components
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  gap: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  costDivider: {
    marginVertical: 8,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 150,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 8,
    color: '#8a97a0',
    marginBottom: 2,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '80%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  barLabel: {
    fontSize: 8,
    color: '#8a97a0',
    marginTop: 2,
  },
  sensRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 90,
    marginTop: 4,
  },
  sensCol: {
    flex: 1,
    alignItems: 'center',
  },
  sensValue: {
    fontSize: 8,
    color: '#8a97a0',
    marginBottom: 2,
  },
  sensTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sensFill: {
    width: '70%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  sensLabel: {
    fontSize: 9,
    color: '#8a97a0',
    marginTop: 2,
  },
  suggestButton: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  expertSave: {
    marginTop: 8,
  },
});
