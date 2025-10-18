import * as mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'

export async function extractTextFromDocx(filePath: string) {
  if (!fs.existsSync(filePath)) throw new Error('File not found')
  const result = await mammoth.extractRawText({ path: filePath } as any)
  return result.value
}
