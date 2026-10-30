const {
	FEATURE_DEFINITIONS,
	LEGACY_FEATURE_MAP,
	INDUSTRY_PRESETS,
} = require('../../../shared/constants/features')

/**
 * Resolves all effective features for a tenant based on plan, overrides, and dependencies.
 */
function resolveEffectiveFeatures(plan = 'starter', rawOverrides = {}) {
	const normalizedPlan = String(plan || 'starter').toLowerCase()
	const overrides = { ...(rawOverrides || {}) }

	// Expand legacy overrides if present
	for (const [legacyKey, newKey] of Object.entries(LEGACY_FEATURE_MAP)) {
		if (overrides[legacyKey] !== undefined && overrides[newKey] === undefined) {
			overrides[newKey] = Boolean(overrides[legacyKey])
		}
	}

	const resolved = {}

	// Step 1: Base plan defaults
	for (const feat of FEATURE_DEFINITIONS) {
		const isDefaultInPlan = feat.defaultIn.includes(normalizedPlan)
		resolved[feat.key] = isDefaultInPlan
	}

	// Step 2: Apply tenant specific overrides
	for (const feat of FEATURE_DEFINITIONS) {
		if (overrides[feat.key] !== undefined) {
			resolved[feat.key] = Boolean(overrides[feat.key])
		}
	}

	// Step 3: Enforce dependencies (if dependency is missing, disable feature or flag warning)
	for (const feat of FEATURE_DEFINITIONS) {
		if (resolved[feat.key] && Array.isArray(feat.dependencies)) {
			for (const depKey of feat.dependencies) {
				if (!resolved[depKey]) {
					// Dependency unmet: disable dependent feature to preserve architectural integrity
					resolved[feat.key] = false
					break
				}
			}
		}
	}

	// Step 4: Populate legacy boolean flags for backward compatibility
	for (const [legacyKey, newKey] of Object.entries(LEGACY_FEATURE_MAP)) {
		resolved[legacyKey] = Boolean(resolved[newKey])
	}

	return resolved
}

/**
 * Validates dependencies for a proposed set of feature overrides.
 * Returns { valid: boolean, errors: string[] }
 */
function validateFeatureDependencies(proposedFeatures = {}) {
	const errors = []
	for (const feat of FEATURE_DEFINITIONS) {
		const isEnabled = Boolean(proposedFeatures[feat.key])
		if (isEnabled && Array.isArray(feat.dependencies)) {
			for (const depKey of feat.dependencies) {
				if (!proposedFeatures[depKey]) {
					const depDef = FEATURE_DEFINITIONS.find((d) => d.key === depKey)
					const depName = depDef ? depDef.name : depKey
					errors.push(`Feature "${feat.name}" requires "${depName}" to be enabled.`)
				}
			}
		}
	}
	return {
		valid: errors.length === 0,
		errors,
	}
}

/**
 * Returns feature configuration for an industry preset.
 */
function getPresetFeatures(presetKey) {
	const preset = INDUSTRY_PRESETS[presetKey]
	if (!preset) return null

	const features = {}
	for (const feat of FEATURE_DEFINITIONS) {
		features[feat.key] = preset.recommendedFeatures.includes(feat.key)
	}
	return features
}

module.exports = {
	resolveEffectiveFeatures,
	validateFeatureDependencies,
	getPresetFeatures,
}

