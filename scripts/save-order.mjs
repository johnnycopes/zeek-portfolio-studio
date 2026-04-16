/**
 * save-order.mjs
 *
 * Snapshots the current orderRank of every galleryImage document in Sanity
 * and writes it to scripts/original-order.json.
 *
 * Run this BEFORE applying any reorder so you can revert later:
 *   node scripts/save-order.mjs
 *
 * To revert after applying a scattered order:
 *   SANITY_AUTH_TOKEN=<token> node scripts/apply-order.mjs scripts/original-order.json
 */

import {writeFileSync} from 'fs'
import {join, dirname} from 'path'
import {fileURLToPath} from 'url'
import {createClient} from '../node_modules/@sanity/client/dist/index.js'

const PROJECT_ID = 'wasxg3b6'
const DATASET = 'production'
const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const client = createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  console.log('Fetching current document order from Sanity...')
  const docs = await client.fetch(
    `*[_type == "galleryImage"] | order(orderRank asc) { _id, title, orderRank }`,
  )

  console.log(`Found ${docs.length} documents.`)

  const output = {
    savedAt: new Date().toISOString(),
    count: docs.length,
    // Each entry preserves the original orderRank so apply-order.mjs can
    // restore exact values (not just relative sequence) when reverting.
    docs,
  }

  const outputPath = join(__dirname, 'original-order.json')
  writeFileSync(outputPath, JSON.stringify(output, null, 2))
  console.log(`Saved to: ${outputPath}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
