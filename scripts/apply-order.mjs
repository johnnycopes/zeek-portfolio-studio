/**
 * apply-order.mjs
 *
 * Accepts a JSON file describing a desired document order and updates every
 * galleryImage document's orderRank in Sanity accordingly.
 *
 * Accepts two input formats:
 *   - Scattered order (array of {_id, title}):  scripts/scattered-order.json
 *   - Original snapshot (object with .docs array of {_id, title, orderRank}):
 *                                               scripts/original-order.json
 *
 * When given a snapshot with original orderRank values, those exact values are
 * restored — useful for a clean revert. When given a plain sequence, fresh
 * LexoRank values are generated in order.
 *
 * Patches are sent in batches of 100 to stay within Sanity's transaction limits.
 *
 * Usage:
 *   SANITY_AUTH_TOKEN=<token> node scripts/apply-order.mjs <path-to-json>
 *   SANITY_AUTH_TOKEN=<token> DRY_RUN=true node scripts/apply-order.mjs <path-to-json>
 */

import {readFileSync} from 'fs'
import {createClient} from '../node_modules/@sanity/client/dist/index.js'
import {LexoRank} from '../node_modules/lexorank/lib/index.js'

const PROJECT_ID = 'wasxg3b6'
const DATASET = 'production'
const BATCH_SIZE = 100
const DRY_RUN = process.env.DRY_RUN === 'true'

function getClient() {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) {
    throw new Error(
      'SANITY_AUTH_TOKEN is not set.\n' +
        'Get a token at: https://www.sanity.io/manage → project → API → Tokens',
    )
  }
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  })
}

/**
 * Generate N evenly-spaced LexoRank values starting from LexoRank.min().
 * Calls genNext() twice per step (matching orderable-document-list's own
 * approach) which leaves room for future manual insertions between entries.
 */
function generateRanks(count) {
  const ranks = []
  let rank = LexoRank.min()
  for (let i = 0; i < count; i++) {
    rank = rank.genNext().genNext()
    ranks.push(rank.toString())
  }
  return ranks
}

async function applyBatch(client, patches) {
  const transaction = client.transaction()
  for (const {id, orderRank} of patches) {
    transaction.patch(id, {set: {orderRank}})
  }
  await transaction.commit()
}

async function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error('Usage: node scripts/apply-order.mjs <path-to-order-json>')
    process.exit(1)
  }

  const raw = JSON.parse(readFileSync(inputPath, 'utf8'))

  // Detect format: snapshot ({savedAt, docs}) vs plain array ([{_id, title}])
  const isSnapshot = !Array.isArray(raw) && Array.isArray(raw.docs)
  const entries = isSnapshot ? raw.docs : raw

  console.log(
    `Input: ${entries.length} documents from "${inputPath}"` +
      (isSnapshot ? ` (snapshot from ${raw.savedAt})` : ' (sequence order)'),
  )

  if (DRY_RUN) console.log('\n=== DRY RUN — no writes will be made ===')

  // Build the list of {id, orderRank} pairs to apply.
  // Snapshot format: restore exact original orderRank values.
  // Sequence format: generate fresh ranks in the given order.
  let patches
  if (isSnapshot) {
    patches = entries.map(({_id, orderRank}) => ({id: _id, orderRank}))
    console.log('Mode: restoring original orderRank values exactly.\n')
  } else {
    const ranks = generateRanks(entries.length)
    patches = entries.map(({_id}, i) => ({id: _id, orderRank: ranks[i]}))
    console.log('Mode: assigning fresh LexoRank values in given sequence.\n')
  }

  if (DRY_RUN) {
    console.log('First 5 patches:')
    for (const p of patches.slice(0, 5)) {
      const entry = entries.find((e) => (e._id || e) === p.id)
      console.log(`  ${p.id}  ${p.orderRank}  "${entry?.title ?? ''}"`)
    }
    console.log(`  ... (${patches.length} total)`)
    console.log('\nDry run complete. No changes made.')
    return
  }

  const client = getClient()
  const batches = []
  for (let i = 0; i < patches.length; i += BATCH_SIZE) {
    batches.push(patches.slice(i, i + BATCH_SIZE))
  }

  console.log(
    `Sending ${patches.length} patches in ${batches.length} batches of up to ${BATCH_SIZE}...`,
  )

  for (let i = 0; i < batches.length; i++) {
    process.stdout.write(`  Batch ${i + 1}/${batches.length}... `)
    await applyBatch(client, batches[i])
    console.log('✓')
  }

  console.log(`\nDone. ${patches.length} documents updated.`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
