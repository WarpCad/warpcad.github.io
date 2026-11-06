// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * The pre-push test gate, modelled on the app's `scripts/todo-progress.mjs stamp` (TODO/build-014).
 *
 *   node scripts/test-stamp.mjs run          run `npm test`; store a record if it passed
 *   node scripts/test-stamp.mjs verify-push  the `.githooks/pre-push` entry point
 *
 * A record is keyed by a git tree hash: the exact set of files the tests ran against. A push of
 * `main` is accepted only when the pushed commit has the same tree as a stored passing record.
 * Tree hashes ignore commit messages and history, so committing the tested files later still
 * matches, and any edit to a tested file does not. `verify-push` never runs the tests.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const RECORD = '.test-record.json'
const ZERO_SHA = '0'.repeat(40)
const GATED_REF = 'refs/heads/main'
const RUN_COMMAND = 'node scripts/test-stamp.mjs run'

/**
 * @param {string[]} args
 * @param {Record<string, string>} [env]
 * @returns {string} trimmed stdout
 */
function git(args, env = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

/**
 * Tree hash of the working tree, including untracked files that are not ignored. It builds a
 * throwaway index so the real staging area is never touched.
 * @returns {string} tree sha
 */
export function workingTreeHash() {
  const dir = mkdtempSync(join(tmpdir(), 'warpcad-site-index-'))
  try {
    const env = { GIT_INDEX_FILE: join(dir, 'index') }
    git(['read-tree', 'HEAD'], env)
    git(['add', '-A'], env)
    return git(['write-tree'], env)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** @returns {{ tree: string, passed: boolean, at: string, command: string } | null} */
export function readRecord() {
  try {
    return JSON.parse(readFileSync(RECORD, 'utf8'))
  } catch {
    return null
  }
}

/** Run the whole suite and store the outcome against the tree it ran on. */
function run() {
  const before = workingTreeHash()
  console.log(`test-stamp: running npm test on tree ${before.slice(0, 9)}`)
  const result = spawnSync('npm', ['test'], { stdio: 'inherit' })
  // Editing a tested file mid-run means the run proves nothing about the tree it is stored under.
  const after = workingTreeHash()
  const passed = result.status === 0 && before === after
  const record = { tree: before, passed, at: new Date().toISOString(), command: 'npm test' }
  writeFileSync(RECORD, JSON.stringify(record, null, 2) + '\n')

  if (result.status !== 0) {
    console.error(`test-stamp: npm test failed; nothing vouches for tree ${before.slice(0, 9)}`)
    process.exit(1)
  }
  if (before !== after) {
    console.error('test-stamp: files changed while the tests ran; run again to record a result')
    process.exit(1)
  }
  console.log(`test-stamp: stored a passing run for tree ${before.slice(0, 9)}`)
}

/**
 * Check each ref git is about to push. Pure apart from `git rev-parse` and the record file.
 * @param {string} stdin lines of `<local ref> <local sha> <remote ref> <remote sha>`
 * @returns {{ ok: boolean, lines: string[] }}
 */
export function verifyPush(stdin) {
  const lines = []
  let ok = true
  for (const line of stdin.split('\n')) {
    const [, localSha, remoteRef] = line.trim().split(/\s+/)
    if (!localSha || remoteRef !== GATED_REF || localSha === ZERO_SHA) continue

    const tree = git(['rev-parse', `${localSha}^{tree}`])
    const record = readRecord()
    if (record?.tree === tree && record.passed) {
      lines.push(`tests passed on ${localSha.slice(0, 9)}`)
    } else {
      ok = false
      lines.push(
        `push refused: the tests have not passed on ${localSha.slice(0, 9)}.`,
        record && record.tree !== tree
          ? `  the last recorded run was on tree ${record.tree.slice(0, 9)}, which is not this commit's tree.`
          : `  no passing run is recorded for this commit's tree.`,
        `  Run: ${RUN_COMMAND}`,
      )
    }
  }
  return { ok, lines }
}

const [command] = process.argv.slice(2)
if (command === 'run') {
  run()
} else if (command === 'verify-push') {
  const { ok, lines } = verifyPush(readFileSync(0, 'utf8'))
  for (const l of lines) (ok ? console.log : console.error)(l)
  process.exit(ok ? 0 : 1)
} else {
  console.error('usage: node scripts/test-stamp.mjs run | verify-push')
  process.exit(2)
}
