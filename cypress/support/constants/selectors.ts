import type { FieldConfig, RankField } from '~/shared/schema'

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
  Menu: {
    SETTINGS: testId('menu-item-settings'),
    HOME: testId('menu-item-home'),
  },
  TaskCard: {
    CARD: testIdStartsWith('task-card-'),
    TITLE: testId('task-title'),
    EXPAND_BTN: testIdStartsWith('button-expand-'),
    COLLAPSE_BTN: testIdStartsWith('button-collapse-'),
  },
  TaskForm: {
    FORM: testId('task-form'),
    NAME_INPUT: testId('task-name-input'),
    TIME_SPENT_INPUT: testId('time-spent-input'),
    TIME_SPENT_INPUT_HOURS: testId('time-spent-input-hours'),
    TIME_SPENT_INPUT_MINUTES: testId('time-spent-input-minutes'),
    MARK_COMPLETED_CHECKBOX: testId('mark-completed-checkbox'),
    rankSelect: (field: RankField) => testId(`rank-select-${field}`),
    SUBMIT_BTN: testId('submit-button'),
    CANCEL_BTN: testId('cancel-button'),
    ADD_SUBTASK_BTN: testId('button-add-subtask'),
    SUBTASK_ROW: testIdStartsWith('subtask-row-'),
  },
  Settings: {
    FieldConfig: {
      visibleCheckbox: (field: keyof FieldConfig) =>
        testId(`checkbox-${field}-visible`),
      requiredCheckbox: (field: keyof FieldConfig) =>
        testId(`checkbox-${field}-required`),
    },
  },
} as const
