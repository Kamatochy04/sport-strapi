const major = Number.parseInt(process.version.slice(1).split('.')[0], 10);
if (Number.isNaN(major) || major < 20) {
  console.error(
    '\nStrapi 5 требует Node.js 20+. Сейчас:',
    process.version,
    '\n',
    'Если команда «nvm» не найдена, nvm просто не загружен в эту сессию. Варианты:\n',
    '  1) Один раз в этом терминале:\n',
    '     export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use\n',
    '  2) Или из каталога strapi-app (подгружает nvm и запускает dev):\n',
    '     npm run dev:sh\n',
    '     (эквивалент: bash scripts/run-develop.sh)\n',
    '  3) Добавьте в ~/.zshrc строки из https://github.com/nvm-sh/nvm#installing-and-updating\n',
    '  4) Либо поставьте Node 20 системно (apt / https://nodejs.org/) и проверьте: node -v\n',
  );
  process.exit(1);
}
