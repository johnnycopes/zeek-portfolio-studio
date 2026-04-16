/**
 * scatter-order.mjs
 *
 * Reads scripts/original-order.json and produces scripts/scattered-order.json —
 * a reordered sequence where images from the same project are spread as far
 * apart as possible using round-robin interleaving.
 *
 * Algorithm:
 *   1. Group documents by title (preserving relative order within each group,
 *      so the cover photo always precedes its sub-images).
 *   2. Sort groups by size descending so larger projects are distributed first
 *      and therefore spread most evenly.
 *   3. Round-robin: pull one document from each group per round, cycling until
 *      all groups are exhausted. Smaller groups drop out as they empty.
 *
 * Result: in any window of N consecutive images (where N = number of projects),
 * every project appears at most once during the early rounds. After single-image
 * projects are exhausted, the remaining multi-image projects continue cycling.
 *
 * Usage: node scripts/scatter-order.mjs
 */

import {readFileSync, writeFileSync} from 'fs'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function roundRobinInterleave(groups) {
  // Each group: { title, docs: [{_id, title, orderRank}] }
  // Sort largest-first so high-image-count projects get the widest spread.
  const sorted = [...groups].sort((a, b) => b.docs.length - a.docs.length)

  // cursors[i] = next doc index to pull from group i
  const cursors = new Array(sorted.length).fill(0)
  const result = []

  let remaining = sorted.length
  while (remaining > 0) {
    for (let i = 0; i < sorted.length; i++) {
      if (cursors[i] >= sorted[i].docs.length) continue
      result.push(sorted[i].docs[cursors[i]])
      cursors[i]++
      if (cursors[i] === sorted[i].docs.length) remaining--
    }
  }

  return result
}

function main() {
  const inputPath = join(__dirname, 'original-order.json')
  const {docs, savedAt} = JSON.parse(readFileSync(inputPath, 'utf8'))

  console.log(`Loaded ${docs.length} documents (snapshot from ${savedAt}).`)

  // Group by title, preserving existing relative order within each group.
  const groupMap = new Map()
  for (const doc of docs) {
    if (!groupMap.has(doc.title)) groupMap.set(doc.title, [])
    groupMap.get(doc.title).push(doc)
  }

  const groups = Array.from(groupMap.entries()).map(([title, groupDocs]) => ({
    title,
    docs: groupDocs,
  }))

  console.log(`\nProjects by image count (largest first):`)
  const sorted = [...groups].sort((a, b) => b.docs.length - a.docs.length)
  for (const g of sorted) {
    console.log(`  ${g.docs.length.toString().padStart(3)}  ${g.title}`)
  }

  const scattered = roundRobinInterleave(groups)

  // Verify: confirm total count and that every _id appears exactly once
  const inputIds = new Set(docs.map((d) => d._id))
  const outputIds = new Set(scattered.map((d) => d._id))
  if (inputIds.size !== outputIds.size || scattered.length !== docs.length) {
    throw new Error(`Integrity check failed: input=${docs.length}, output=${scattered.length}`)
  }

  // Show a preview of the first 30 to sanity-check the spread
  console.log(`\nFirst 30 in scattered order:`)
  for (let i = 0; i < Math.min(30, scattered.length); i++) {
    console.log(`  ${(i + 1).toString().padStart(3)}. ${scattered[i].title}`)
  }

  const output = scattered.map((d) => ({_id: d._id, title: d.title}))

  const outputPath = join(__dirname, 'scattered-order.json')
  writeFileSync(outputPath, JSON.stringify(output, null, 2))

  console.log(`\nTotal: ${scattered.length} documents in new order.`)
  console.log(`Saved to: ${outputPath}`)
  console.log(
    `\nTo apply:  SANITY_AUTH_TOKEN=<token> node scripts/apply-order.mjs scripts/scattered-order.json`,
  )
  console.log(
    `To revert: SANITY_AUTH_TOKEN=<token> node scripts/apply-order.mjs scripts/original-order.json`,
  )
}

main()
