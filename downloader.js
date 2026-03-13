const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const isWindows = process.platform === 'win32'
const ytdlpCmd = isWindows ? `"${path.join(__dirname, 'yt-dlp.exe')}"` : 'yt-dlp'

function detectPlatform(url) {
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'TikTok'
  if (url.includes('twitter.com') || url.includes('x.com') || url.includes('t.co')) return 'Twitter/X'
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) return 'Facebook'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
  return 'Desconhecido'
}

async function downloadVideo(url) {
  const platform = detectPlatform(url)
  console.log(`📥 Baixando de ${platform}: ${url}`)

  const tmpDir = os.tmpdir()
  const tmpId = `dl_${Date.now()}`
  const outputTemplate = path.join(tmpDir, `${tmpId}.%(ext)s`)

  return new Promise((resolve, reject) => {
    const command = `${ytdlpCmd} --no-playlist -f "best[height<=720]/best" --merge-output-format mp4 -o "${outputTemplate}" --no-warnings --quiet "${url}"`

    exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        // Tentar sem formato especifico
        const fallback = `${ytdlpCmd} --no-playlist -o "${outputTemplate}" --no-warnings --quiet "${url}"`
        exec(fallback, { timeout: 120000 }, (err2) => {
          if (err2) {
            return reject(new Error(`Nao foi possivel baixar de ${platform}. Verifique se o link eh valido e publico.`))
          }
          findFile(tmpDir, tmpId).then(resolve).catch(reject)
        })
        return
      }
      findFile(tmpDir, tmpId).then(resolve).catch(reject)
    })
  })
}

function findFile(dir, prefix) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const files = fs.readdirSync(dir)
        const found = files.find(f => f.startsWith(prefix))

        if (!found) {
          return reject(new Error('Arquivo nao encontrado apos download'))
        }

        const filePath = path.join(dir, found)
        const buffer = fs.readFileSync(filePath)
        const ext = path.extname(found).toLowerCase()

        try { fs.unlinkSync(filePath) } catch {}

        const type = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? 'image' : 'video'

        resolve({
          type,
          buffer,
          caption: '📥 Baixado pelo bot!'
        })
      } catch (err) {
        reject(err)
      }
    }, 1000)
  })
}

module.exports = { downloadVideo, detectPlatform }