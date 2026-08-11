#!/usr/bin/env node
/**
 * Verify that package.json version is a valid SemVer string and matches the
 * latest Git tag (if tags exist). Fails if the working tree is dirty.
 */

import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
const version = pkg.version

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/

if (!semverPattern.test(version)) {
  console.error(`Invalid SemVer in package.json: ${version}`)
  process.exit(1)
}

let latestTag = null
try {
  latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8', cwd: ROOT }).trim()
} catch {
  // No tags yet; this is acceptable.
}

if (latestTag && latestTag !== `v${version}`) {
  console.error(`package.json version v${version} does not match latest tag ${latestTag}`)
  process.exit(1)
}

try {
  const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: ROOT }).trim()
  if (status) {
    console.error('Working tree is dirty; commit changes before releasing')
    process.exit(1)
  }
} catch {
  // git not available
}

console.log(`Version check passed: v${version}`)
