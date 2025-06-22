const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Adicionar resolução para plataformas web
config.resolver.platforms = ["ios", "android", "native", "web"];

module.exports = config;
