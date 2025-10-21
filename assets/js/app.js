(function () {
  const $ = (sel) => document.querySelector(sel);
  const els = {
    form: $('#link-form'),
    errorSummary: $('#error-summary'),
    frequency: $('#frequency'),
    distance: $('#distance'),
    txPower: $('#txPower'),
    txGain: $('#txGain'),
    rxGain: $('#rxGain'),
    txFeeder: $('#txFeeder'),
    rxFeeder: $('#rxFeeder'),
    miscLosses: $('#miscLosses'),
    rxThreshold: $('#rxThreshold'),
    fsplVal: $('#fsplVal'),
    eirpVal: $('#eirpVal'),
    rxPowerVal: $('#rxPowerVal'),
    fadeMarginVal: $('#fadeMarginVal'),
    addLossesVal: $('#addLossesVal'),
  };

  const log10 = Math.log10 || function (x) { return Math.log(x) / Math.LN10; };

  function toNumber(v, fallback = 0) {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(2);
  }

  function computeFsplGHzKm(fGHz, dKm) {
    return 92.45 + 20 * log10(fGHz) + 20 * log10(dKm);
  }

  function compute() {
    const fGHz = toNumber(els.frequency.value, NaN);
    const dKm = toNumber(els.distance.value, NaN);

    const txP = toNumber(els.txPower.value, 0);
    const txG = toNumber(els.txGain.value, 0);
    const rxG = toNumber(els.rxGain.value, 0);
    const txL = toNumber(els.txFeeder.value, 0);
    const rxL = toNumber(els.rxFeeder.value, 0);
    const miscL = toNumber(els.miscLosses.value, 0);
    const rxTh = toNumber(els.rxThreshold.value, 0);

    const errors = [];
    if (!Number.isFinite(fGHz) || fGHz <= 0) errors.push('Frequency must be a number greater than 0 GHz.');
    if (!Number.isFinite(dKm) || dKm <= 0) errors.push('Link distance must be a number greater than 0 km.');

    els.frequency.classList.toggle('invalid', errors.some(e => e.toLowerCase().includes('frequency')));
    els.distance.classList.toggle('invalid', errors.some(e => e.toLowerCase().includes('distance')));

    if (errors.length) {
      els.errorSummary.hidden = false;
      els.errorSummary.textContent = errors.join(' ');
      els.fsplVal.textContent = '—';
      els.eirpVal.textContent = '—';
      els.rxPowerVal.textContent = '—';
      els.fadeMarginVal.textContent = '—';
      els.addLossesVal.textContent = '0.00';
      return;
    } else {
      els.errorSummary.hidden = true;
      els.errorSummary.textContent = '';
    }

    const fspl = computeFsplGHzKm(fGHz, dKm);
    const eirp = txP + txG - txL;
    const additionalLosses = 0;
    const rxPower = eirp + rxG - rxL - fspl - miscL - additionalLosses;
    const fadeMargin = rxPower - rxTh;

    els.fsplVal.textContent = fmt(fspl);
    els.eirpVal.textContent = fmt(eirp);
    els.rxPowerVal.textContent = fmt(rxPower);
    els.fadeMarginVal.textContent = fmt(fadeMargin);
    els.addLossesVal.textContent = fmt(additionalLosses);
  }

  function onInput() {
    compute();
  }

  function onSubmit(e) {
    e.preventDefault();
    compute();
  }

  function onReset() {
    setTimeout(compute, 0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    els.form.addEventListener('input', onInput);
    els.form.addEventListener('submit', onSubmit);
    els.form.addEventListener('reset', onReset);
    compute();
  });
})();
