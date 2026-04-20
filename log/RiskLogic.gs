function calculateRiskFactor(integrity, ewAction, durationMs) {
  const badIntegrity = CONFIG.RISK_CRITERIA.BAD_INTEGRITY.includes(String(integrity));
  const ewFlag =
    typeof ewAction === 'boolean'
      ? ewAction
      : ['так', 'true', 'yes', '1'].includes(String(ewAction).trim().toLowerCase());
  const overDuration = Boolean(durationMs) && (durationMs / 60000) > CONFIG.RISK_CRITERIA.MAX_DURATION_MINUTES;

  return (badIntegrity || ewFlag || overDuration) ? 1 : 0;
}