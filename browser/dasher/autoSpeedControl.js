// (c) 2026 The ACE Centre-North, UK registered charity 1089313.
// MIT licensed, see https://opensource.org/licenses/MIT

export default class AutoSpeedControl {
  constructor() {
    this._factor = 1;
    this._angles = [];
    this._maxSamples = 24;
    this._minFactor = 0.65;
    this._maxFactor = 1.35;
    this._minRadius = 55;
    this._sampleScale = 480;
    this._sampleOffset = 10;
    this._upRate = 0.015;
    this._downRate = 0.03;
    this._lowVariance = 0.12;
    this._highVariance = 0.32;
  }

  get factor() {
    return this._factor;
  }

  reset() {
    this._factor = 1;
    this._angles = [];
  }

  update(rawX, rawY, baseSpeed, elapsedMillis) {
    if (
      typeof rawX !== 'number' ||
      typeof rawY !== 'number' ||
      typeof baseSpeed !== 'number'
    ) {
      return this._factor;
    }

    const radius = Math.hypot(rawX, rawY);
    if (radius < this._minRadius || baseSpeed <= 0) {
      this._angles = [];
      this._factor += (1 - this._factor) * 0.08;
      return this._factor;
    }

    const sampleTarget = Math.max(
        8,
        Math.round(this._sampleScale / Math.max(0.01, baseSpeed) + this._sampleOffset),
    );
    this._maxSamples = Math.min(60, sampleTarget);

    this._angles.push(Math.atan2(rawY, rawX));
    if (this._angles.length > this._maxSamples) {
      this._angles.shift();
    }

    if (this._angles.length < 8) {
      return this._factor;
    }

    let meanX = 0;
    let meanY = 0;
    this._angles.forEach((angle) => {
      meanX += Math.cos(angle);
      meanY += Math.sin(angle);
    });
    meanX /= this._angles.length;
    meanY /= this._angles.length;

    const meanVectorLength = Math.hypot(meanX, meanY);
    const variance = 1 - Math.min(1, meanVectorLength);
    const stepScale = Math.max(0.4, Math.min(2.2, elapsedMillis / 33));

    if (variance < this._lowVariance) {
      this._factor += this._upRate * stepScale;
    } else if (variance > this._highVariance) {
      this._factor -= this._downRate * stepScale;
    } else {
      this._factor += (1 - this._factor) * 0.02 * stepScale;
    }

    this._factor = Math.max(this._minFactor, Math.min(this._maxFactor, this._factor));
    return this._factor;
  }
}
