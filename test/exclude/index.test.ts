import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { createRsbuild } from '@rsbuild/core';

import { getRandomPort } from '../helper';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should build with excluded modules', async ({ page }) => {
  const { pluginTailwindCSS } = await import('../../src');
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [
        pluginTailwindCSS({
          exclude: ['./src/exclude.js'],
        }),
      ],
      server: {
        port: getRandomPort(),
      },
    },
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();

  await page.goto(urls[0]);

  const display = await page.evaluate(() => {
    const el = document.getElementById('test');

    if (!el) {
      throw new Error('#test not found');
    }

    return window.getComputedStyle(el).getPropertyValue('display');
  });

  expect(display).toBe('flex');

  const textAlign = await page.evaluate(() => {
    const el = document.getElementById('exclude');

    if (!el) {
      throw new Error('#exclude not found');
    }

    return window.getComputedStyle(el).getPropertyValue('text-align');
  });

  expect(textAlign).not.toBe('center');

  // The `not-exclude.js` imported by `exclude.js` should not be excluded.
  const paddingTop = await page.evaluate(() => {
    const el = document.getElementById('not-exclude');

    if (!el) {
      throw new Error('#not-exclude not found');
    }

    return window.getComputedStyle(el).getPropertyValue('padding-top');
  });

  expect(paddingTop).toBe('16px');

  await server.close();
});
