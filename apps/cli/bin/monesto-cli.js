#!/usr/bin/env node

// ESM loader for the compiled CLI entry point
import('../dist/cli.js')
  .then((mod) => {
    if (typeof mod.main === 'function') {
      return mod.main(process.argv);
    }
    console.error('Entry module does not export main()');
    process.exit(1);
  })
  .catch((error) => {
    console.error('Failed to start @monesto/cli:', error);
    process.exit(1);
  });

