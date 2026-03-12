const testId = <S extends string>(testid: S) =>
  `[data-testid="${testid}"]` as const
const testIdStartsWith = <S extends string>(testid: S) =>
  `[data-testid^="${testid}"]` as const
// biome-ignore lint/correctness/noUnusedVariables: remove rule when/if used
const testIdContains = <S extends string>(testid: S) =>
  `[data-testid*="${testid}"]` as const
// biome-ignore lint/correctness/noUnusedVariables: remove rule when/if used
const testIdEndsWith = <S extends string>(testid: S) =>
  `[data-testid$="${testid}"]` as const

export const Selectors = {
  CREATE_TASK_BTN: testId('button-create-task'),
  BACK_BTN: testId('button-back'),
  MENU_BTN: testId('button-menu'),
  LandingPage: {
    TRY_GUEST_BTN: testId('button-try-guest'),
  },
  TaskCard: {
    CARD: testIdStartsWith('task-card-'),
    TITLE: testId('task-title'),
  },
  TaskForm: {
    NAME_INPUT: testId('task-name-input'),
    RankSelect: {
      PRIORITY: testId('rank-select-priority'),
      EASE: testId('rank-select-ease'),
      ENJOYMENT: testId('rank-select-enjoyment'),
      TIME: testId('rank-select-time'),
    },
    SUBMIT_BTN: testId('submit-button'),
    CANCEL_BTN: testId('cancel-button'),
  },
  Menu: {
    SETTINGS: testId('menu-item-settings'),
    HOME: testId('menu-item-home'),
  },
  Settings: {
    FieldConfig: {
      visibleCheckbox: (field: string) => testId(`checkbox-${field}-visible`),
      requiredCheckbox: (field: string) => testId(`checkbox-${field}-required`),
    },
  },
} as const
