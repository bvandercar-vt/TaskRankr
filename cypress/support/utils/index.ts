export * from './api'

export const getElementArrayText = ($elements: JQuery<HTMLElement>) =>
  $elements.toArray().map(($el) => $el.textContent)
