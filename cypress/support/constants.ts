export const testId = <S extends string>(testid: S) =>
  `[data-testid="${testid}"]` as const
export const testIdStartsWith = <S extends string>(testid: S) =>
  `[data-testid^="${testid}"]` as const
export const testIdContains = <S extends string>(testid: S) =>
  `[data-testid*="${testid}"]` as const
export const testIdEndsWith = <S extends string>(testid: S) =>
  `[data-testid$="${testid}"]` as const

export const Selectors = {
  CREATE_TASK_BUTTON: testId('button-create-task'),
  TRY_GUEST_BUTTON: testId('button-try-guest'),
  TASK_NAME_INPUT: 'textarea[placeholder="Task name"]',
  SUBMIT_BUTTON: 'button[type="submit"]',
  TASK_CARD: testIdStartsWith('task-card-'),
} as const
