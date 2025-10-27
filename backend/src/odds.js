export function computeOdds(mySeed, oppSeed) {
    if (!Number.isFinite(mySeed) || !Number.isFinite(oppSeed)) throw new Error('Seeds must be numbers');
    if (oppSeed <= 0) throw new Error('oppSeed must be > 0');
    return 1 + (mySeed / oppSeed);
  }
  