/* Web Worker : décodage des images hors du thread d'affichage.
   Le moteur ZXing (WebAssembly) est chargé localement : aucune donnée ne quitte le téléphone. */
importScripts("lib/zxing-reader.js");

ZXingWASM.prepareZXingModule({
  overrides: {
    locateFile: (path, prefix) => (path.endsWith(".wasm") ? "lib/zxing_reader.wasm" : prefix + path),
  },
});

const LIVE_OPTIONS = {
  tryHarder: true,
  tryRotate: true,
  tryInvert: true,
  tryDownscale: true,
  maxNumberOfSymbols: 8,
  textMode: "HRI",
  eanAddOnSymbol: "Read",
};

const DEEP_OPTIONS = { ...LIVE_OPTIONS, tryDenoise: true, maxNumberOfSymbols: 32 };

self.onmessage = async (e) => {
  const { id, imageData, deep } = e.data;
  try {
    const results = await ZXingWASM.readBarcodes(imageData, deep ? DEEP_OPTIONS : LIVE_OPTIONS);
    const out = results
      .filter((r) => r.isValid)
      .map((r) => ({
        format: r.format,
        symbology: r.symbology,
        symbologyIdentifier: r.symbologyIdentifier,
        contentType: r.contentType,
        text: r.text,
        bytes: r.bytes,
        hasECI: r.hasECI,
        position: r.position,
        rotation: r.rotation,
        isMirrored: r.isMirrored,
        isInverted: r.isInverted,
        sequenceSize: r.sequenceSize,
        sequenceIndex: r.sequenceIndex,
        sequenceId: r.sequenceId,
        lineCount: r.lineCount,
        extra: r.extra,
        version: r.version,
        ecLevel: r.ecLevel,
        readerInit: r.readerInit,
        symbol: r.symbol && r.symbol.width ? { data: r.symbol.data, width: r.symbol.width, height: r.symbol.height } : null,
      }));
    self.postMessage({ id, results: out, width: imageData.width, height: imageData.height });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
