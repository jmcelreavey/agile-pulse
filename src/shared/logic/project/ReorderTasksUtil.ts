type ReorderType<T> = T & {
  order: number;
  id: number;
};

export function ReorderUtil<T>(
  previousOrder: number | null,
  newOrder: number | null,
  items: ReorderType<T>[],
  itemToMove?: ReorderType<T>
): ReorderType<T>[] {
  // Create a new array and sort by order to ensure we start with correct ordering
  let result = [...items].sort((a, b) => a.order - b.order);

  // If we're inserting a new item
  if (previousOrder === null && newOrder !== null && itemToMove) {
    // Remove item if it already exists (prevents duplication)
    result = result.filter((item) => item.id !== itemToMove.id);

    // Shift all items at or after the insertion point
    result = result.map((item) => ({
      ...item,
      order: item.order >= newOrder ? item.order + 1 : item.order,
    }));

    // Insert the new item
    result.splice(newOrder, 0, { ...itemToMove, order: newOrder });
  }
  // If we're removing an item
  else if (previousOrder !== null && newOrder === null) {
    result = result.filter((item) => item.order !== previousOrder);

    // Shift down all items after the removal point
    result = result.map((item) => ({
      ...item,
      order: item.order > previousOrder ? item.order - 1 : item.order,
    }));
  }
  // If we're moving an existing item
  else if (previousOrder !== null && newOrder !== null) {
    const item = result.find((i) => i.order === previousOrder);
    if (item) {
      // Remove from old position
      result = result.filter((i) => i.order !== previousOrder);

      // Adjust orders based on move direction
      if (previousOrder < newOrder) {
        result = result.map((i) => ({
          ...i,
          order:
            i.order > previousOrder && i.order <= newOrder
              ? i.order - 1
              : i.order,
        }));
      } else {
        result = result.map((i) => ({
          ...i,
          order:
            i.order >= newOrder && i.order < previousOrder
              ? i.order + 1
              : i.order,
        }));
      }

      // Insert at new position
      result.splice(newOrder, 0, { ...item, order: newOrder });
    }
  }

  // Normalize all orders to ensure they're sequential
  return result.map((item, index) => ({
    ...item,
    order: index,
  }));
}
