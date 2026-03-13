const sharp = require('sharp')
const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

async function createSticker(buffer, type = 'image') {
  if (type === 'image' || type === 'sticker') {
    return createImageSticker(buffer)
  } else if (type === 'video') {
    return createVideoSticker(buffer)
  }
  throw new Error('Tipo de midia nao suportado')
}

async function createImageSticker(buffer) {
  try {
    const webpBuffer = await sharp(buffer)
      .resize(512, 512, { fit: 'fill' })
      .webp({ quality: 80 })
      .toBuffer()
    return webpBuffer
  } catch (err) {
    throw new Error(`Falha ao converter imagem: ${err.message}`)
  }
}

async function createVideoSticker(buffer) {
  const tmpDir = os.tmpdir()
  const tmpId = Date.now()
  const inputPath = path.join(tmpDir, `input_${tmpId}.mp4`)
  const outputPath = path.join(tmpDir, `sticker_${tmpId}.webp`)

  fs.writeFileSync(inputPath, buffer)

  return new Promise((resolve, reject) => {
    const cmd = `ffmpeg -y -i "${inputPath}" -vf "scale=512:512,fps=15" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset default -an -vsync 0 -t 10 "${outputPath}"`

    exec(cmd, (error) => {
      try { fs.unlinkSync(inputPath) } catch {}
      if (error || !fs.existsSync(outputPath)) {
        return reject(new Error(`FFmpeg falhou: ${error?.message}`))
      }
      const webpBuffer = fs.readFileSync(outputPath)
      try { fs.unlinkSync(outputPath) } catch {}
      resolve(webpBuffer)
    })
  })
}

module.exports = { createSticker }