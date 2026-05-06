import fs from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';

const repoRoot = new URL('..', import.meta.url);
const repoPath = new URL('.', repoRoot).pathname;
const publicDir = path.join(repoPath, 'data', 'public');
const inputTimelineStateFile = process.env.JOURNAL_TIMELINE_STATE_FILE || path.join(publicDir, 'timeline-state.json');
const inputTodosFile = process.env.JOURNAL_TODOS_FILE || path.join(publicDir, 'todos.json');
const inputDiaryDir = process.env.JOURNAL_DIARY_DIR || path.join(publicDir, 'diary');
const isSample = normalizeBool(process.env.JOURNAL_SAMPLE_MODE, true);
const defaultGeneratedDataModule = path.join(repoPath, 'src', 'data.generated.js');
const generatedDataModule = process.env.JOURNAL_GENERATED_DATA_MODULE || defaultGeneratedDataModule;
const outFile = process.env.JOURNAL_RUNTIME_OUT_FILE || path.join(repoPath, 'public', 'runtime.js');

async function readDiaryMap() {
  const files = (await fs.readdir(inputDiaryDir)).filter((file) => file.endsWith('.md')).sort();
  const entries = await Promise.all(files.map(async (file) => {
    const fullPath = path.join(inputDiaryDir, file);
    const contents = await fs.readFile(fullPath, 'utf8');
    return [file.replace(/\.md$/, ''), contents];
  }));
  return Object.fromEntries(entries);
}

async function writeGeneratedDataModule() {
  const [timelineStateText, todosText, rawDiary] = await Promise.all([
    fs.readFile(inputTimelineStateFile, 'utf8'),
    fs.readFile(inputTodosFile, 'utf8'),
    readDiaryMap(),
  ]);
  const buildJournalDataImport = relativeImportPath(
    path.dirname(generatedDataModule),
    path.join(repoPath, 'src', 'build-journal-data.js')
  );
  const moduleSource = `import { buildJournalData } from ${JSON.stringify(buildJournalDataImport)};\n\nconst timelineStateText = ${JSON.stringify(timelineStateText)};\nconst rawDiary = ${JSON.stringify(rawDiary, null, 2)};\nconst rawTodos = ${todosText.trim()};\n\nwindow.JOURNAL_DATA = buildJournalData({ timelineStateText, rawDiary, rawTodos, isSample: ${isSample ? 'true' : 'false'} });\n`;
  await fs.mkdir(path.dirname(generatedDataModule), { recursive: true });
  await fs.writeFile(generatedDataModule, moduleSource);
}

function normalizeBool(value, fallback) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

async function main() {
  await writeGeneratedDataModule();
  const entryPoint = await resolveRuntimeEntryPoint();
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    format: 'iife',
    globalName: 'JournalRuntime',
    outfile: outFile,
    loader: {
      '.jsx': 'jsx',
    },
  });
}

async function resolveRuntimeEntryPoint() {
  if (path.resolve(generatedDataModule) === path.resolve(defaultGeneratedDataModule)) {
    return path.join(repoPath, 'src', 'runtime-entry.js');
  }
  const entryPoint = path.join(path.dirname(generatedDataModule), 'runtime-entry.js');
  const generatedDataImport = `./${path.basename(generatedDataModule)}`;
  const source = [
    `import ${JSON.stringify(relativeImportPath(path.dirname(entryPoint), path.join(repoPath, 'src', 'tweaks-panel.jsx')))};`,
    `import ${JSON.stringify(generatedDataImport)};`,
    `import ${JSON.stringify(relativeImportPath(path.dirname(entryPoint), path.join(repoPath, 'src', 'app.jsx')))};`,
    '',
  ].join('\n');
  await fs.writeFile(entryPoint, source);
  return entryPoint;
}

function relativeImportPath(fromDir, targetFile) {
  let relative = path.relative(fromDir, targetFile).split(path.sep).join('/');
  if (!relative.startsWith('.')) {
    relative = `./${relative}`;
  }
  return relative;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
