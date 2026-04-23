export * from './api'
export * from './navigation'
export * from './test-runner'

export const getElementArrayText = ($elements: JQuery<HTMLElement>) =>
  $elements.toArray().map(($el) => $el.textContent)
