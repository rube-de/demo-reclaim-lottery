import { task } from 'hardhat/config'
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'
import path from 'path'
import { promises as fs } from 'fs'
import canonicalize from 'canonicalize'

const TASK_EXPORT_ABIS = 'export-abis'

// Export ABIs task (keep existing functionality)
task(TASK_COMPILE, async (_args, hre, runSuper) => {
  await runSuper()
  await hre.run(TASK_EXPORT_ABIS)
})

task(TASK_EXPORT_ABIS, async (_args, hre) => {
  const srcDir = path.basename(hre.config.paths.sources)
  const outDir = path.join(hre.config.paths.root, 'abis')

  const [artifactNames] = await Promise.all([
    hre.artifacts.getAllFullyQualifiedNames(),
    fs.mkdir(outDir, { recursive: true }),
  ])

  await Promise.all(
    artifactNames.map(async fqn => {
      const { abi, contractName, sourceName } = await hre.artifacts.readArtifact(fqn)
      if (abi.length === 0 || !sourceName.startsWith(srcDir) || contractName.endsWith('Test')) return
      await fs.writeFile(`${path.join(outDir, contractName)}.json`, `${canonicalize(abi)}\n`)
    })
  )
})

// Import all lottery-related tasks
import './deploy-mock-verifier'
import './deploy-lottery'
import './deploy-all'
import './lottery-status'
import './lottery-info'
import './lottery-participants'
import './lottery-deposit-prize'
import './lottery-start'
import './lottery-end'
import './lottery-pick-winner'
import './lottery-reset'
