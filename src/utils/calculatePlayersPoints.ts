export function calculatePlayerPoints(position: number, kills: number): number {
  let positionPoints = 0;

  if (position === 1) {
    positionPoints = 10;
  } else if (position === 2) {
    positionPoints = 6;
  } else if (position === 3) {
    positionPoints = 5;
  } else if (position === 4) {
    positionPoints = 4;
  } else if (position === 5) {
    positionPoints = 3;
  } else if (position === 6) {
    positionPoints = 2;
  } else if (position === 7 || position === 8) {
    positionPoints = 1;
  } else if (position >= 9 && position <= 16) {
    positionPoints = 0;
  } else {
    // Handle invalid positions if necessary
    positionPoints = 0;
  }

  const killPoints = kills;
  return positionPoints + killPoints;
}

export function getKdRank(kills: number, deaths: number): string {
  if (deaths === 0) {
    // Prevent division by zero; if kills > 0 and no deaths, consider as legend
    return "legend";
  }

  const kdRatio = kills / deaths;

  if (kdRatio >= 2.5) {
    return "legend";
  } else if (kdRatio >= 2.0) {
    return "ultra pro";
  } else if (kdRatio >= 1.5) {
    return "pro";
  } else if (kdRatio >= 1.0) {
    return "noob";
  } else if (kdRatio >= 0.5) {
    return "ultra noob";
  } else {
    return "bot";
  }
}
