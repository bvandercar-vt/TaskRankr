type HasId = { id: number | string }

export const getById = <T extends HasId>(
  allItems: T[],
  id: T['id'],
): T | undefined => allItems.find((i) => i.id === id)

export const removeIds = <T extends HasId>(
  allItems: T[],
  ids: T['id'][],
): T[] => allItems.filter((i) => !ids.includes(i.id))

export const updateItem = <T extends HasId>(
  allItems: T[],
  itemId: T['id'],
  updater: (item: T) => T,
): T[] => allItems.map((item) => (item.id === itemId ? updater(item) : item))
