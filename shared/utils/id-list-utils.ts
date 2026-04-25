type HasId = { id: number | string }

export const getById = <T extends HasId>(
  allItems: T[],
  id: T['id'],
): T | undefined => allItems.find((i) => i.id === id)

export const removeIds = <T extends HasId>(
  allItems: T[],
  ids: T['id'][] | Set<T['id']>,
): T[] => {
  const idsSet = ids instanceof Set ? ids : new Set(ids)
  return allItems.filter((i) => !idsSet.has(i.id))
}

export const mapById = <T extends HasId>(allItems: T[]): Map<T['id'], T> =>
  new Map(allItems.map((i) => [i.id, i]))

export const updateItem = <T extends HasId>(
  allItems: T[],
  itemId: T['id'],
  updater: (item: T) => T,
): T[] => allItems.map((item) => (item.id === itemId ? updater(item) : item))
