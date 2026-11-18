/**
 * Retrieves the initials of a given text.
 *
 * @param text The text to get the initials from.
 * @param limit The maximum number of initials to return.
 */
export const GetInitialsUtil = (text: string, limit?: number) => {
  const initials = text
    .toUpperCase()
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, limit);
  return initials;
};
