export const CalculateChartLinePositionUtil = (
  width: number,
  sprintLength: number,
  currentDay: number,
  actualSectionWidths?: number[]
): number => {
  if (width === 0 || sprintLength === 0) {
    return 0;
  }

  if (currentDay === 0) {
    // Start day - position at the very beginning
    return 47; // Just the base offset
  }

  let pixelPosition: number;

  if (actualSectionWidths && actualSectionWidths.length >= currentDay) {
    // Use actual DOM measurements for precise positioning
    pixelPosition = actualSectionWidths
      .slice(0, currentDay)
      .reduce((sum, width) => sum + width, 0);
  } else {
    // Simple fallback when DOM measurements aren't available yet
    pixelPosition = (width / sprintLength) * currentDay;
  }

  return pixelPosition + 47;
};
