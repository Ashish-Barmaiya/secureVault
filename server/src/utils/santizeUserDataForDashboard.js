export function santizeUserDataForDashboard(user) {
  const { passwordHash, twoFactorSecret, digitalAssets, ...safeUser } = user;

  return {
    ...safeUser,
    digitalAssetCount: digitalAssets?.length || 0,

    heirs:
      user.heirs?.map(({ id, name, relationship, contactInfo, status }) => ({
        id,
        name,
        relationship,
        contactInfo,
        status,
      })) || [],

    activityLog:
      user.activityLog?.map(({ id, action, timestamp }) => ({
        id,
        action,
        timestamp,
      })) || [],
  };
}
