const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const isWindows = process.platform === 'win32'
const ytdlpCmd = isWindows ? `"${path.join(__dirname, 'yt-dlp.exe')}"` : 'yt-dlp'

/**
 * Busca músicas no YouTube e retorna lista
 */
async function searchMusic(query) {
  return new Promise((resolve, reject) => {
    // Busca 5 resultados e pega info em JSON
    const cmd = `${ytdlpCmd} "ytsearch5:${query}" --dump-json --flat-playlist --no-warnings --quiet`

    exec(cmd, { timeout: 30000 }, (error, stdout) => {
      if (error || !stdout.trim()) return reject(new Error('Erro ao buscar músicas'))

      try {
        const results = stdout.trim().split('\n')
          .filter(Boolean)
          .map(line => {
            const data = JSON.parse(line)
            return {
              title: data.title || 'Sem título',
              id: data.id,
              duration: formatDuration(data.duration),
              channel: data.uploader || data.channel || 'Desconhecido',
              url: `https://www.youtube.com/watch?v=${data.id}`
            }
          })
          .slice(0, 5)

        resolve(results)
      } catch (err) {
        reject(new Error('Erro ao processar resultados'))
      }
    })
  })
}

/**
 * Baixa áudio de uma URL como MP3
 */
async function downloadMusic(url) {
  const tmpDir = os.tmpdir()
  const tmpId = `music_${Date.now()}`
  const outputTemplate = path.join(tmpDir, `${tmpId}.%(ext)s`)

  return new Promise((resolve, reject) => {
    const cmd = `${ytdlpCmd} -f "bestaudio" --extract-audio --audio-format mp3 --audio-quality 0 --no-playlist --no-warnings --quiet -o "${outputTemplate}" "${url}"`

    exec(cmd, { timeout: 120000 }, (error) => {
      if (error) {
        const fallback = `${ytdlpCmd} -f "bestaudio/best" --no-playlist --no-warnings --quiet -o "${outputTemplate}" "${url}"`
        exec(fallback, { timeout: 120000 }, (err2) => {
          if (err2) return reject(new Error('Não foi possível baixar o áudio'))
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
        if (!found) return reject(new Error('Arquivo não encontrado após download'))
        const filePath = path.join(dir, found)
        const buffer = fs.readFileSync(filePath)
        try { fs.unlinkSync(filePath) } catch {}
        resolve({ buffer, filename: found })
      } catch (err) {
        reject(err)
      }
    }, 1000)
  })
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '??:??'
  const s = parseInt(seconds)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  return `${m}:${String(s % 60).padStart(2,'0')}`
}

module.exports = { searchMusic, downloadMusic }