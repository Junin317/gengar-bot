const https = require('https')

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : require('http')
    mod.get(url, { headers: { 'User-Agent': 'WhatsAppBot/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve(data) }
      })
    }).on('error', reject)
  })
}

// ── !clima ─────────────────────────────────────────────
async function clima(cidade) {
  const encoded = encodeURIComponent(cidade)
  const data = await httpGet(`https://wttr.in/${encoded}?format=j1&lang=pt`)

  const current = data.current_condition[0]
  const area = data.nearest_area[0]
  const weather = data.weather[0]

  const cidade_nome = area.areaName[0].value
  const pais = area.country[0].value
  const temp = current.temp_C
  const sensacao = current.FeelsLikeC
  const umidade = current.humidity
  const vento = current.windspeedKmph
  const descricao = current.lang_pt?.[0]?.value || current.weatherDesc[0].value
  const maxTemp = weather.maxtempC
  const minTemp = weather.mintempC

  const emoji = getClimaEmoji(current.weatherCode)

  return (
    `${emoji} *Clima em ${cidade_nome}, ${pais}*\n\n` +
    `🌡️ Temperatura: *${temp}°C*\n` +
    `🤔 Sensação: *${sensacao}°C*\n` +
    `📊 Máx/Mín: *${maxTemp}°C / ${minTemp}°C*\n` +
    `💧 Umidade: *${umidade}%*\n` +
    `💨 Vento: *${vento} km/h*\n` +
    `☁️ Condição: *${descricao}*`
  )
}

function getClimaEmoji(code) {
  const c = parseInt(code)
  if (c === 113) return '☀️'
  if (c === 116) return '⛅'
  if ([119, 122].includes(c)) return '☁️'
  if ([143, 248, 260].includes(c)) return '🌫️'
  if ([176, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 353, 356, 359].includes(c)) return '🌧️'
  if ([179, 182, 185, 227, 230, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377].includes(c)) return '❄️'
  if ([200, 386, 389, 392, 395].includes(c)) return '⛈️'
  return '🌤️'
}

// ── !dolar ─────────────────────────────────────────────
async function cotacao() {
  const data = await httpGet('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL,ARS-BRL')

  const usd = data.USDBRL
  const eur = data.EURBRL
  const btc = data.BTCBRL
  const ars = data.ARSBRL

  const varUSD = parseFloat(usd.pctChange) >= 0 ? `📈 +${usd.pctChange}%` : `📉 ${usd.pctChange}%`
  const varEUR = parseFloat(eur.pctChange) >= 0 ? `📈 +${eur.pctChange}%` : `📉 ${eur.pctChange}%`

  return (
    `💵 *Cotações do dia*\n\n` +
    `🇺🇸 *Dólar (USD):* R$ ${parseFloat(usd.bid).toFixed(2)} ${varUSD}\n` +
    `🇪🇺 *Euro (EUR):* R$ ${parseFloat(eur.bid).toFixed(2)} ${varEUR}\n` +
    `🇦🇷 *Peso Arg (ARS):* R$ ${parseFloat(ars.bid).toFixed(4)}\n` +
    `₿ *Bitcoin (BTC):* R$ ${parseFloat(btc.bid).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}\n\n` +
    `_Atualizado agora_`
  )
}

// ── !crypto ────────────────────────────────────────────
async function crypto(moeda) {
  const moedas = {
    'bitcoin': 'BTC', 'btc': 'BTC',
    'ethereum': 'ETH', 'eth': 'ETH',
    'solana': 'SOL', 'sol': 'SOL',
    'dogecoin': 'DOGE', 'doge': 'DOGE',
    'bnb': 'BNB',
    'usdt': 'USDT', 'tether': 'USDT',
    'xrp': 'XRP', 'ripple': 'XRP',
    'cardano': 'ADA', 'ada': 'ADA',
  }

  const simbolo = moedas[moeda.toLowerCase()] || moeda.toUpperCase()
  const data = await httpGet(`https://economia.awesomeapi.com.br/json/last/${simbolo}-BRL`)
  const key = `${simbolo}BRL`

  if (!data[key]) return `❌ Criptomoeda *${simbolo}* não encontrada!\n\nExemplos: bitcoin, ethereum, solana, dogecoin, bnb, xrp`

  const coin = data[key]
  const preco = parseFloat(coin.bid)
  const variacao = parseFloat(coin.pctChange)
  const emoji = variacao >= 0 ? '📈' : '📉'
  const sinal = variacao >= 0 ? '+' : ''

  return (
    `₿ *${coin.name || simbolo}* (${simbolo})\n\n` +
    `💰 Preço: *R$ ${preco.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}*\n` +
    `${emoji} Variação 24h: *${sinal}${variacao.toFixed(2)}%*\n` +
    `📊 Máx: R$ ${parseFloat(coin.high).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}\n` +
    `📊 Mín: R$ ${parseFloat(coin.low).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}\n\n` +
    `_Atualizado agora_`
  )
}

// ── !cep ───────────────────────────────────────────────
async function cep(numero) {
  const cepLimpo = numero.replace(/[^0-9]/g, '')
  if (cepLimpo.length !== 8) return '❌ CEP inválido! Use 8 dígitos.\nEx: !cep 69025000'

  const data = await httpGet(`https://viacep.com.br/ws/${cepLimpo}/json/`)

  if (data.erro) return `❌ CEP *${cepLimpo}* não encontrado!`

  return (
    `📍 *CEP: ${data.cep}*\n\n` +
    `🏠 Logradouro: *${data.logradouro || 'N/A'}*\n` +
    `🏘️ Bairro: *${data.bairro || 'N/A'}*\n` +
    `🏙️ Cidade: *${data.localidade}*\n` +
    `🗺️ Estado: *${data.uf}*\n` +
    `📞 DDD: *${data.ddd}*`
  )
}

// ── !noticias ──────────────────────────────────────────
async function noticias() {
  const data = await httpGet('https://saurav.tech/NewsAPI/top-headlines/category/general/br.json')

  if (!data.articles || data.articles.length === 0) {
    return '❌ Não foi possível buscar as notícias agora. Tente mais tarde!'
  }

  const top5 = data.articles.slice(0, 5)
  let texto = `📰 *Últimas Notícias do Brasil*\n\n`

  top5.forEach((noticia, i) => {
    texto += `*${i + 1}.* ${noticia.title}\n`
    if (noticia.source?.name) texto += `   📡 _${noticia.source.name}_\n`
    texto += '\n'
  })

  texto += `_Atualizado agora_`
  return texto
}

module.exports = { clima, cotacao, crypto, cep, noticias }
