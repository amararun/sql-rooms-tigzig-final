import fs from 'fs'
import path from 'path'

const depsDir = path.resolve('node_modules/.vite/deps')
const filesToPatch = [
  '@sqlrooms_sql-editor.js',
  '@sqlrooms_room-shell.js',
]

console.log('🔧 Patching Vite bundled files...')

filesToPatch.forEach(file => {
  const filePath = path.join(depsDir, file)
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8')
    let changed = false

    // Patch 1: Remove h-[18px] height restriction
    const patch1 = content.replace(
      /className: cn\(className, ['"]h-\[18px\]['"]\)/g,
      'className: className'
    )
    if (patch1 !== content) {
      content = patch1
      changed = true
      console.log(`  ✓ Removed height restriction in ${file}`)
    }

    // Patch 2: Replace ColumnTypeBadge with plain text (text-[11px])
    const patch2 = content.replace(
      /_jsx\(ColumnTypeBadge, \{ className: ['"]opacity-50['"], columnType: nodeObject\.columnType, typeCategory: nodeObject\.columnTypeCategory \}\)/g,
      '_jsx("span", { className: "text-[11px] w-[70px] flex-shrink-0 truncate", children: nodeObject.columnType })'
    )
    if (patch2 !== content) {
      content = patch2
      changed = true
      console.log(`  ✓ Replaced ColumnTypeBadge with plain text in ${file}`)
    }

    // Patch 3: Change column name font size to text-[11px]
    const patch3 = content.replace(
      /_jsx\(["']span["'], \{ className: ['"]text-xs['"], children: nodeObject\.name \}\)/g,
      '_jsx("span", { className: "text-[11px]", children: nodeObject.name })'
    )
    if (patch3 !== content) {
      content = patch3
      changed = true
      console.log(`  ✓ Changed column name font size in ${file}`)
    }

    // Patch 4: Add truncate to table name
    const patch4 = content.replace(
      /_jsx\(["']span["'], \{ className: ['"]text-sm['"], children: name \}\)/g,
      '_jsx("span", { className: "text-sm truncate", children: name })'
    )
    if (patch4 !== content) {
      content = patch4
      changed = true
      console.log(`  ✓ Added truncate to table name in ${file}`)
    }

    // Patch 5: Add overflow-hidden to table container
    const patch5 = content.replace(
      /["']flex w-full items-center justify-between gap-2["']/g,
      '"flex w-full items-center justify-between gap-2 overflow-hidden"'
    )
    if (patch5 !== content) {
      content = patch5
      changed = true
      console.log(`  ✓ Added overflow-hidden to table container in ${file}`)
    }

    if (changed) {
      fs.writeFileSync(filePath, content)
      console.log(`✅ Successfully patched ${file}`)
    } else {
      console.log(`⚠️  No changes needed for ${file}`)
    }
  } else {
    console.log(`❌ File not found: ${file}`)
  }
})

console.log('✨ Done!')
