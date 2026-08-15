import { create } from 'zustand';
import type { EquationKey } from '@/core/equations';

export interface EquationOpenState {
  key: EquationKey;
  actualValue?: string;
}

interface UiState {
  equation: EquationOpenState | null;
  openEquation: (key: EquationKey, actualValue?: string) => void;
  closeEquation: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  equation: null,
  openEquation: (key, actualValue) => set({ equation: { key, actualValue } }),
  closeEquation: () => set({ equation: null }),
}));
