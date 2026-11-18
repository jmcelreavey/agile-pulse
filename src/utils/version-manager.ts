/**
 * Utility functions for managing semantic version numbers
 */

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
}

/**
 * Parse a semantic version string (e.g., "1.2.3") into components
 */
export function parseVersion(version: string): SemanticVersion {
  const parts = version.split(".").map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(
      `Invalid version format: ${version}. Expected format: "major.minor.patch"`
    );
  }

  return {
    major: parts[0]!,
    minor: parts[1]!,
    patch: parts[2]!,
  };
}

/**
 * Convert semantic version components back to string
 */
export function formatVersion(version: SemanticVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Increment the patch version (e.g., "1.2.3" -> "1.2.4")
 */
export function incrementPatchVersion(version: string): string {
  const parsed = parseVersion(version);
  return formatVersion({
    ...parsed,
    patch: parsed.patch + 1,
  });
}

/**
 * Increment the minor version and reset patch (e.g., "1.2.3" -> "1.3.0")
 */
export function incrementMinorVersion(version: string): string {
  const parsed = parseVersion(version);
  return formatVersion({
    ...parsed,
    minor: parsed.minor + 1,
    patch: 0,
  });
}

/**
 * Increment the major version and reset minor and patch (e.g., "1.2.3" -> "2.0.0")
 */
export function incrementMajorVersion(version: string): string {
  const parsed = parseVersion(version);
  return formatVersion({
    major: parsed.major + 1,
    minor: 0,
    patch: 0,
  });
}

/**
 * Get the next version based on the current version
 * Defaults to incrementing patch version
 */
export function getNextVersion(
  currentVersion: string | null | undefined
): string {
  if (!currentVersion) {
    return "0.0.1"; // First version
  }

  try {
    return incrementPatchVersion(currentVersion);
  } catch {
    // If parsing fails, start fresh
    return "0.0.1";
  }
}

/**
 * Validate that a version string is in correct semantic version format
 */
export function isValidVersion(version: string): boolean {
  try {
    parseVersion(version);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compare two versions and return -1, 0, or 1
 */
export function compareVersions(a: string, b: string): number {
  try {
    const versionA = parseVersion(a);
    const versionB = parseVersion(b);

    if (versionA.major !== versionB.major) {
      return versionA.major - versionB.major;
    }
    if (versionA.minor !== versionB.minor) {
      return versionA.minor - versionB.minor;
    }
    return versionA.patch - versionB.patch;
  } catch {
    // If parsing fails, fall back to string comparison
    return a.localeCompare(b);
  }
}
