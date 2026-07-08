export type MuscleFocusCount = {
  muscleGroup: string;
  setCount: number;
};

export type MuscleFocusPercent<T extends MuscleFocusCount = MuscleFocusCount> = T & {
  percent: number;
};

export const toMuscleFocusPercentages = <T extends MuscleFocusCount>(
  groups: T[],
): MuscleFocusPercent<T>[] => {
  const total = groups.reduce((sum, group) => sum + group.setCount, 0);
  if (total <= 0) return [];

  return groups.map((group) => ({
    ...group,
    percent: Math.round((group.setCount / total) * 100),
  }));
};
