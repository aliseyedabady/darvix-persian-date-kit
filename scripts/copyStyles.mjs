import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const distDir = path.join(rootDir, 'dist')
const srcCss = path.join(rootDir, 'src', 'styles', 'base.css')
const distCss = path.join(distDir, 'styles.css')

await mkdir(distDir, { recursive: true })
await copyFile(srcCss, distCss)


