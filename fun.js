const https = require('https')

// ── !dado ──────────────────────────────────────────────
function dado() {
  const resultado = Math.floor(Math.random() * 6) + 1
  const faces = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']
  return `🎲 O dado rolou e saiu: ${faces[resultado]} *${resultado}*`
}

// ── !moeda ─────────────────────────────────────────────
function moeda() {
  const resultado = Math.random() < 0.5 ? 'CARA 🟡' : 'COROA 🔵'
  return `🪙 A moeda girou e caiu: *${resultado}*`
}

// ── !sorteio ───────────────────────────────────────────
function sorteio(mencionados) {
  if (!mencionados || mencionados.length === 0) return null
  return Math.floor(Math.random() * mencionados.length)
}

// ── !frase ─────────────────────────────────────────────
function frase() {
  const frases = [
    '💡 "O sucesso é a soma de pequenos esforços repetidos dia após dia." — Robert Collier',
    '🔥 "Acredite em você mesmo e chegará um dia em que os outros não terão escolha senão acreditar em você." — Cynthia Kersey',
    '🌟 "Você é mais corajoso do que acredita, mais forte do que parece e mais inteligente do que pensa." — A.A. Milne',
    '💪 "A persistência é o caminho do êxito." — Charles Chaplin',
    '🚀 "Não espere por uma crise para descobrir o que é importante em sua vida." — Platão',
    '🌈 "A vida é 10% o que acontece com você e 90% como você reage a isso." — Charles Swindoll',
    '⚡ "Tudo que você sempre quis está do outro lado do medo." — George Addair',
    '🎯 "O segredo do sucesso é a constância do propósito." — Benjamin Disraeli',
    '🌺 "Comece onde você está. Use o que você tem. Faça o que você pode." — Arthur Ashe',
    '💎 "Grandes realizações são possíveis quando você dá importância aos pequenos começos." — Lao Tzu',
  ]
  return frases[Math.floor(Math.random() * frases.length)]
}

// ── !horoscopo ─────────────────────────────────────────
function horoscopo(signo) {
  const signos = {
    'aries': '♈', 'touro': '♉', 'gemeos': '♊', 'cancer': '♋',
    'leao': '♌', 'virgem': '♍', 'libra': '♎', 'escorpiao': '♏',
    'sagitario': '♐', 'capricornio': '♑', 'aquario': '♒', 'peixes': '♓'
  }
  const previsoes = [
    'Os astros indicam um dia cheio de energia e novas oportunidades. Aproveite!',
    'Momento ideal para tomar decisões importantes. Confie no seu instinto.',
    'Cuidado com gastos desnecessários hoje. Foque no que realmente importa.',
    'Uma surpresa agradável está a caminho. Mantenha o coração aberto.',
    'Excelente dia para relacionamentos. Conecte-se com quem você ama.',
    'Sua criatividade está em alta. Use isso a seu favor no trabalho.',
    'Dia de reflexão e autoconhecimento. Reserve um tempo para si mesmo.',
    'Boas notícias chegam em breve. Tenha paciência e fé.',
    'Evite conflitos desnecessários. A diplomacia será sua melhor aliada.',
    'Novos caminhos se abrem. Esteja disposto a sair da zona de conforto.',
  ]
  const signoNorm = signo?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const emoji = signos[signoNorm]
  if (!emoji) {
    return `❌ Signo não encontrado!\n\nSignos disponíveis:\n♈ Áries | ♉ Touro | ♊ Gêmeos | ♋ Câncer\n♌ Leão | ♍ Virgem | ♎ Libra | ♏ Escorpião\n♐ Sagitário | ♑ Capricórnio | ♒ Aquário | ♓ Peixes`
  }
  const previsao = previsoes[Math.floor(Math.random() * previsoes.length)]
  const signoFormatado = signo.charAt(0).toUpperCase() + signo.slice(1).toLowerCase()
  return `${emoji} *Horóscopo de ${signoFormatado}*\n\n🔮 ${previsao}\n\n_Que os astros iluminem seu caminho!_ ✨`
}

// ── Tradução simples via MyMemory API (gratuita) ───────
async function traduzir(texto) {
  return new Promise((resolve) => {
    const encoded = encodeURIComponent(texto.slice(0, 200))
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|pt-BR`

    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          const traduzido = json?.responseData?.translatedText
          resolve(traduzido && traduzido !== texto ? traduzido : texto)
        } catch {
          resolve(texto) // fallback: retorna original
        }
      })
    }).on('error', () => resolve(texto))
  })
}

// ── !meme — foto com legenda traduzida ─────────────────
async function getMeme() {
  const subreddits = ['memes', 'dankmemes', 'funny', 'me_irl', 'AdviceAnimals']
  const sub = subreddits[Math.floor(Math.random() * subreddits.length)]

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'meme-api.com',
      path: `/gimme/${sub}`,
      headers: { 'User-Agent': 'WhatsAppBot/1.0' }
    }

    https.get(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', async () => {
        try {
          const json = JSON.parse(data)
          if (!json.url || json.nsfw) return getMeme().then(resolve).catch(reject)

          // Baixar imagem
          const imageBuffer = await downloadImage(json.url)

          // Traduzir título
          const tituloPT = await traduzir(json.title)

          resolve({
            buffer: imageBuffer,
            titulo: `😂 ${tituloPT}`,
            url: json.url
          })
        } catch (err) {
          reject(new Error('Erro ao buscar meme'))
        }
      })
    }).on('error', () => reject(new Error('Sem conexão para buscar meme')))
  })
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : require('http')
    mod.get(url, { headers: { 'User-Agent': 'WhatsAppBot/1.0' } }, (res) => {
      // Seguir redirecionamentos
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

module.exports = { dado, moeda, sorteio, frase, horoscopo, getMeme }