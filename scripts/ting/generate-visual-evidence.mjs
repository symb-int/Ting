import path from 'node:path';
import { promises as fs } from 'node:fs';
import sharp from 'sharp';

const repositoryRoot = path.resolve(import.meta.dirname, '..', '..');
const evidenceDirectory = path.join(repositoryRoot, 'docs', 'ting', 'I01-NACHWEISE');

const pairs = [
  ...['1440x900', '1024x768', '390x844', '799x844', '800x844', '1150x900', '1151x900'].map(
    (size) => ({ view: 'new', size }),
  ),
  ...['1440x900', '1024x768', '390x844'].map((size) => ({ view: 'login', size })),
  ...['1440x900', '1024x768', '390x844'].map((size) => ({ view: 'conversation', size })),
];

const results = [];

for (const pair of pairs) {
  const stem = `${pair.view}-${pair.size}`;
  const referencePath = path.join(evidenceDirectory, `reference-${stem}.jpg`);
  const implementationPath = path.join(evidenceDirectory, `implementation-${stem}.jpg`);
  const reference = await fs.readFile(referencePath);
  const implementation = await fs.readFile(implementationPath);

  const [referenceMetadata, implementationMetadata] = await Promise.all([
    sharp(reference).metadata(),
    sharp(implementation).metadata(),
  ]);

  if (
    referenceMetadata.width !== implementationMetadata.width ||
    referenceMetadata.height !== implementationMetadata.height
  ) {
    throw new Error(`Abmessungen stimmen für ${stem} nicht überein.`);
  }

  await sharp(implementation)
    .composite([{ input: reference, blend: 'over', opacity: 0.5 }])
    .png()
    .toFile(path.join(evidenceDirectory, `overlay-${stem}.png`));

  await sharp(implementation)
    .composite([{ input: reference, blend: 'difference' }])
    .linear(3)
    .png()
    .toFile(path.join(evidenceDirectory, `difference-${stem}.png`));

  const [referenceRaw, implementationRaw] = await Promise.all([
    sharp(reference).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(implementation).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  let absoluteDifference = 0;
  let changedPixels = 0;
  const channels = referenceRaw.info.channels;
  const pixelCount = referenceRaw.info.width * referenceRaw.info.height;

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    let pixelChanged = false;
    const offset = pixel * channels;
    for (let channel = 0; channel < channels; channel += 1) {
      const difference = Math.abs(
        referenceRaw.data[offset + channel] - implementationRaw.data[offset + channel],
      );
      absoluteDifference += difference;
      pixelChanged ||= difference > 16;
    }
    changedPixels += Number(pixelChanged);
  }

  results.push({
    view: pair.view,
    size: pair.size,
    width: referenceRaw.info.width,
    height: referenceRaw.info.height,
    meanAbsoluteChannelDifference: Number(
      (absoluteDifference / (pixelCount * channels)).toFixed(4),
    ),
    changedPixelRatioAt16: Number((changedPixels / pixelCount).toFixed(6)),
  });
}

await fs.writeFile(
  path.join(evidenceDirectory, 'visual-diff-metrics.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);

console.log(`Visuelle Nachweise erzeugt: ${results.length} Vergleichspaare.`);
