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
  CREATE_TASK_BUTTON: testId('button-create-task'),
  TRY_GUEST_BUTTON: testId('button-try-guest'),
  TaskForm: {
    TASK_NAME_INPUT: testId('task-name-input'),
    SUBMIT_BUTTON: testId('submit-button'),
    CANCEL_BUTTON: testId('cancel-button'),
  },
  TASK_CARD: testIdStartsWith('task-card-'),
} as const
