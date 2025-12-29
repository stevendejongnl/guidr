/**
 * Parses a semver version string into its numeric components.
 * @param version - Version string in format "major.minor.patch"
 * @returns Object with major, minor, patch numbers or null if invalid
 */
export function parseVersion(
  version: string
): { major: number; minor: number; patch: number } | null {
  const parts = version.split('.')
  if (parts.length !== 3) {
    return null
  }

  const major = parseInt(parts[0], 10)
  const minor = parseInt(parts[1], 10)
  const patch = parseInt(parts[2], 10)

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return null
  }

  return { major, minor, patch }
}

/**
 * Compares two semver version strings.
 * @param a - First version string
 * @param b - Second version string
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const versionA = parseVersion(a)
  const versionB = parseVersion(b)

  if (!versionA || !versionB) {
    return 0
  }

  if (versionA.major !== versionB.major) {
    return versionA.major < versionB.major ? -1 : 1
  }

  if (versionA.minor !== versionB.minor) {
    return versionA.minor < versionB.minor ? -1 : 1
  }

  if (versionA.patch !== versionB.patch) {
    return versionA.patch < versionB.patch ? -1 : 1
  }

  return 0
}

/**
 * Checks if an app version is within the supported version range.
 * @param appVersion - Current app version
 * @param minVersion - Minimum supported version (null means no lower bound)
 * @param maxVersion - Maximum supported version (null means no upper bound)
 * @returns true if version is supported, false otherwise
 */
export function isVersionSupported(
  appVersion: string,
  minVersion?: string | null,
  maxVersion?: string | null
): boolean {
  // If no constraints, version is supported
  if (!minVersion && !maxVersion) {
    return true
  }

  // Check minimum version constraint
  if (minVersion) {
    const comparison = compareVersions(appVersion, minVersion)
    if (comparison < 0) {
      return false
    }
  }

  // Check maximum version constraint
  if (maxVersion) {
    const comparison = compareVersions(appVersion, maxVersion)
    if (comparison > 0) {
      return false
    }
  }

  return true
}

