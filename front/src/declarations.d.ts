// Declarações de módulos para assets estáticos importados como imagens.
// Sem isso, o TypeScript reclama com TS2307 ao fazer `import logo from './foo.png'`.
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.webp";
declare module "*.svg";
