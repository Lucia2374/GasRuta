// Metro necesita esta configuracion extra para que expo-sqlite funcione
// en la version web (usa WebAssembly por debajo).
// Ver: https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Soporte para archivos .wasm como recurso.
config.resolver.assetExts.push('wasm');

// Encabezados COEP y COOP que exige SharedArrayBuffer en el navegador.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
