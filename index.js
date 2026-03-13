const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const qrcode = require('qrcode-terminal')
const https = require('https')
const { createSticker } = require('./sticker')
const { downloadVideo } = require('./downloader')
const { downloadMusic, searchMusic } = require('./music')
const { dado, moeda, sorteio, frase, horoscopo, getMeme } = require('./fun')
const { botIsAdmin, senderIsAdmin, banirParticipante, silenciarParticipante, dessilenciarParticipante } = require('./admin')
const { gpt, resumo, traduzir, corretor, iaSemCensura } = require('./ia')
const { clima, cotacao, crypto, cep, noticias } = require('./info')
const { BOT_NAME, OWNER_NAME, OWNER_NUMBER } = require('./config')

const OWNER_LID = '65335210328201@lid'
const searchSessions = {}
const grupoRegras = {}
const MENU_IMAGE_URL = 'https://i.pinimg.com/736x/0d/a0/8c/0da08c7d9d9c86988ed3112b5d609e71.jpg'

// Grupos com modo IA ativado { grupoJid: true }
const modoIAAtivo = {}

const client = new Client({
  authStrategy: new LocalAuth(),
puppeteer: {
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
}
})

client.on('qr', (qr) => {
  console.clear()
  console.log('==================================================')
  console.log(`  ${BOT_NAME} - ESCANEIE O QR CODE`)
  console.log('==================================================')
  qrcode.generate(qr, { small: true })
  console.log('==================================================\n')
})

client.on('ready', () => { console.clear(); console.log(`✅ ${BOT_NAME} conectado!\n`) })
client.on('authenticated', () => console.log('✅ Autenticado!'))
client.on('auth_failure', (m) => console.log('❌ Falha:', m))
client.on('disconnected', (r) => { console.log('❌ Desconectado:', r); client.initialize() })

client.on('group_join', async (notification) => {
  try {
    const chat = await notification.getChat()
    await chat.sendMessage(
      `👋 Bem-vindo(a) ao *${chat.name}*, @${notification.id.participant.split('@')[0]}! 🎉\n\nDigite *!help* para ver os comandos.`,
      { mentions: [notification.id.participant] }
    )
  } catch (err) { console.error('Erro bemvindo:', err.message) }
})

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WhatsAppBot/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return downloadImage(res.headers.location).then(resolve).catch(reject)
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

client.on('message_create', async (msg) => {
  const text = msg.body.trim()
  const senderJid = msg.from
  const isGroup = senderJid.endsWith('@g.us')
  const senderNumber = senderJid.replace(/[^0-9]/g, '')
  const authorNumber = (msg.author || '').replace(/[^0-9]/g, '')
  const isOwner = senderNumber.includes(OWNER_NUMBER) || authorNumber.includes(OWNER_NUMBER) ||
                  senderJid === OWNER_LID || (msg.author || '') === OWNER_LID

  let senderName = 'Desconhecido'
  try { const c = await msg.getContact(); senderName = c.pushname || c.name || senderJid.split('@')[0] } catch {}

  const authorJid = msg.author || senderJid
  console.log(`[${isOwner ? '👑DONO' : senderJid}] ${senderName}: ${text}`)

  // ── SELECAO DE MUSICA ───────────────────────────────────
  if (searchSessions[senderJid] && /^\d+$/.test(text)) {
    const session = searchSessions[senderJid]
    const index = parseInt(text) - 1
    if (index < 0 || index >= session.results.length) { await msg.reply(`❌ Número inválido! Digite entre 1 e ${session.results.length}`); return }
    const chosen = session.results[index]
    delete searchSessions[senderJid]
    await msg.react('⏳')
    await msg.reply(`⬇️ Baixando: *${chosen.title}*\nAguarde...`)
    try {
      const result = await downloadMusic(chosen.url)
      await client.sendMessage(msg.from, new MessageMedia('audio/mpeg', result.buffer.toString('base64'), result.filename), { sendAudioAsVoice: false })
      await msg.react('✅')
    } catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !help ──────────────────────────────────────
  if (text.toLowerCase() === '!help' || text.toLowerCase() === '!menu') {
    const iaStatus = isGroup && modoIAAtivo[senderJid] ? '🟢 *ATIVADO*' : '🔴 *DESATIVADO*'
    const menuTexto =
      `╔════ 𝐂𝐨𝐦𝐚𝐧𝐝𝐨𝐬 ═════╗\n\n` +
      `🎨 *MÍDIA*\n` +
      `≫ *!figurinha* — cria figurinha de imagem/vídeo\n` +
      `≫ *!dl* (link) — baixa vídeo do Instagram,\n` +
      `   TikTok, YouTube, Twitter/X, Facebook\n` +
      `≫ *!play* (link ou nome) — baixa música MP3\n\n` +
      `🎮 *DIVERSÃO*\n` +
      `≫ *!dado* — rola um dado de 6 faces\n` +
      `≫ *!moeda* — cara ou coroa\n` +
      `≫ *!sorteio* @p1 @p2 — sorteia vencedor\n` +
      `≫ *!frase* — frase motivacional aleatória\n` +
      `≫ *!meme* — meme com foto traduzida\n` +
      `≫ *!horoscopo* (signo) — horóscopo do dia\n\n` +
      `🤖 *INTELIGÊNCIA ARTIFICIAL*\n` +
      `≫ *!gpt* (pergunta) — responde com IA\n` +
      `≫ *!resumo* (texto) — resume texto longo\n` +
      `≫ *!traduzir* (idioma) (texto) — traduz\n` +
      `≫ *!corretor* (texto) — corrige português\n` +
      `≫ *!ativaria* — IA sem censura no grupo\n` +
      `   Status: ${iaStatus}\n\n` +
      `📊 *INFORMAÇÕES*\n` +
      `≫ *!clima* (cidade) — previsão do tempo\n` +
      `≫ *!dolar* — cotação do dólar, euro e mais\n` +
      `≫ *!crypto* (moeda) — preço de cripto\n` +
      `≫ *!cep* (número) — busca endereço por CEP\n` +
      `≫ *!noticias* — top 5 notícias do Brasil\n\n` +
      `👥 *GRUPOS (só admin)*\n` +
      `≫ *!marcar* — menciona todos do grupo\n` +
      `≫ *!banir* @pessoa — remove do grupo\n` +
      `≫ *!silenciar* @pessoa — silencia membro\n` +
      `≫ *!dessilenciar* @pessoa — dessilencia\n` +
      `≫ *!regras* — exibe regras do grupo\n` +
      `≫ *!regras set* (texto) — define regras\n\n` +
      `⚙️ *OUTROS*\n` +
      `≫ *!help* | *!menu* — exibe este menu\n` +
      `≫ *!dono* — comando exclusivo do dono\n\n` +
      `╚═════ ${BOT_NAME} ═════╝`
    try {
      const imgBuffer = await downloadImage(MENU_IMAGE_URL)
      await client.sendMessage(msg.from, new MessageMedia('image/jpeg', imgBuffer.toString('base64')), { caption: menuTexto })
    } catch { await msg.reply(menuTexto) }
    return
  }

  // ── COMANDO: !dono ──────────────────────────────────────
  if (text.toLowerCase() === '!dono' && isOwner) {
    await msg.reply(`👑 Olá, *${OWNER_NAME || 'Dono'}*! Você é o dono do *${BOT_NAME}*!`)
    return
  }

  // ── COMANDO: !ativaria / !desativarIA ──────────────────
  if (text.toLowerCase() === '!ativaria' || text.toLowerCase() === '!desativaria') {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    const isAdmin = await senderIsAdmin(client, senderJid, authorJid)
    if (!isAdmin && !isOwner) { await msg.reply('❌ Apenas admins podem ativar/desativar a IA!'); return }

    if (modoIAAtivo[senderJid]) {
      delete modoIAAtivo[senderJid]
      await msg.reply('🔴 *Modo IA desativado!*\nO bot parou de responder todas as mensagens.')
    } else {
      modoIAAtivo[senderJid] = true
      await msg.reply('🟢 *Modo IA ativado!*\n\n🤖 Agora vou responder todas as mensagens do grupo.\n⚠️ _Modo sem censura — pode conter palavrões e humor pesado._\n\nUse *!ativaria* novamente para desativar.')
    }
    return
  }

  // ── COMANDO: !gpt ───────────────────────────────────────
  if (text.toLowerCase().startsWith('!gpt') || text.toLowerCase().startsWith('!ia') || text.toLowerCase().startsWith('!ask')) {
    const pergunta = text.split(' ').slice(1).join(' ').trim()
    if (!pergunta) { await msg.reply('❌ Faça uma pergunta!\nEx: !gpt Qual a capital do Brasil?'); return }
    await msg.react('🤔')
    await msg.reply('🤖 Pensando...')
    try {
      const resposta = await gpt(pergunta)
      await msg.reply(`🤖 *${BOT_NAME}*\n\n${resposta}`)
      await msg.react('✅')
    } catch (err) { await msg.reply('❌ Erro na IA: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !resumo ────────────────────────────────────
  if (text.toLowerCase().startsWith('!resumo')) {
    const texto = text.split(' ').slice(1).join(' ').trim()
    if (!texto) { await msg.reply('❌ Informe o texto!\nEx: !resumo (texto)'); return }
    await msg.react('⏳')
    try { await msg.reply(`📝 *Resumo:*\n\n${await resumo(texto)}`); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !traduzir ──────────────────────────────────
  if (text.toLowerCase().startsWith('!traduzir') || text.toLowerCase().startsWith('!traduz')) {
    const partes = text.split(' ').slice(1)
    const idioma = partes[0]; const texto = partes.slice(1).join(' ').trim()
    if (!idioma || !texto) { await msg.reply('❌ Use: !traduzir (idioma) (texto)'); return }
    await msg.react('⏳')
    try { await msg.reply(`🌐 *Tradução para ${idioma}:*\n\n${await traduzir(idioma, texto)}`); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !corretor ──────────────────────────────────
  if (text.toLowerCase().startsWith('!corretor') || text.toLowerCase().startsWith('!corrigir')) {
    const texto = text.split(' ').slice(1).join(' ').trim()
    if (!texto) { await msg.reply('❌ Informe o texto!\nEx: !corretor eu foi na escola onti'); return }
    await msg.react('⏳')
    try { await msg.reply(`✏️ *Correção:*\n\n${await corretor(texto)}`); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !clima ─────────────────────────────────────
  if (text.toLowerCase().startsWith('!clima')) {
    const cidade = text.split(' ').slice(1).join(' ').trim()
    if (!cidade) { await msg.reply('❌ Informe a cidade!\nEx: !clima Manaus'); return }
    await msg.react('⏳')
    try { await msg.reply(await clima(cidade)); await msg.react('✅') }
    catch { await msg.reply(`❌ Cidade não encontrada: ${cidade}`); await msg.react('❌') }
    return
  }

  // ── COMANDO: !dolar ─────────────────────────────────────
  if (['!dolar','!dólar','!cotacao','!cotação'].includes(text.toLowerCase())) {
    await msg.react('⏳')
    try { await msg.reply(await cotacao()); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !crypto ────────────────────────────────────
  if (text.toLowerCase().startsWith('!crypto') || text.toLowerCase().startsWith('!cripto')) {
    const moeda = text.split(' ').slice(1).join(' ').trim()
    if (!moeda) { await msg.reply('❌ Ex: !crypto bitcoin\nOpções: bitcoin, ethereum, solana, dogecoin, bnb, xrp'); return }
    await msg.react('⏳')
    try { await msg.reply(await crypto(moeda)); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !cep ───────────────────────────────────────
  if (text.toLowerCase().startsWith('!cep')) {
    const numero = text.split(' ')[1] || ''
    if (!numero) { await msg.reply('❌ Ex: !cep 69025000'); return }
    await msg.react('⏳')
    try { await msg.reply(await cep(numero)); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !noticias ──────────────────────────────────
  if (['!noticias','!notícias','!news'].includes(text.toLowerCase())) {
    await msg.react('⏳')
    try { await msg.reply(await noticias()); await msg.react('✅') }
    catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !marcar ────────────────────────────────────
  if (text.toLowerCase() === '!marcar' || text.toLowerCase() === '!todos') {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    try {
      const chat = await msg.getChat()
      const mentions = chat.participants.map(p => p.id._serialized)
      const nomes = chat.participants.map(p => `@${p.id.user}`).join(' ')
      await client.sendMessage(senderJid, `📢 *Marcando todos do grupo!*\n\n${nomes}`, { mentions })
    } catch (err) { await msg.reply('❌ Erro: ' + err.message) }
    return
  }

  // ── COMANDO: !banir ─────────────────────────────────────
  if (text.toLowerCase().startsWith('!banir') || text.toLowerCase().startsWith('!kick')) {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    const isAdmin = await senderIsAdmin(client, senderJid, authorJid)
    const isBotAdmin = await botIsAdmin(client, senderJid)
    if (!isAdmin && !isOwner) { await msg.reply('❌ Apenas admins!'); return }
    if (!isBotAdmin) { await msg.reply('❌ Preciso ser admin para banir!'); return }
    const mencionados = msg.mentionedIds
    if (!mencionados?.length) { await msg.reply('❌ Mencione quem banir!'); return }
    try {
      for (const jid of mencionados) {
        await banirParticipante(client, senderJid, jid)
        await msg.reply(`✅ @${jid.split('@')[0]} removido!`, undefined, { mentions: [jid] })
      }
    } catch (err) { await msg.reply('❌ Erro: ' + err.message) }
    return
  }

  // ── COMANDO: !silenciar ─────────────────────────────────
  if (text.toLowerCase().startsWith('!silenciar') || text.toLowerCase().startsWith('!mudo')) {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    const isAdmin = await senderIsAdmin(client, senderJid, authorJid)
    const isBotAdmin = await botIsAdmin(client, senderJid)
    if (!isAdmin && !isOwner) { await msg.reply('❌ Apenas admins!'); return }
    if (!isBotAdmin) { await msg.reply('❌ Preciso ser admin!'); return }
    const mencionados = msg.mentionedIds
    if (!mencionados?.length) { await msg.reply('❌ Mencione quem silenciar!'); return }
    try {
      for (const jid of mencionados) {
        await silenciarParticipante(client, senderJid, jid)
        await msg.reply(`🔇 @${jid.split('@')[0]} silenciado!`, undefined, { mentions: [jid] })
      }
    } catch (err) { await msg.reply('❌ Erro: ' + err.message) }
    return
  }

  // ── COMANDO: !dessilenciar ──────────────────────────────
  if (text.toLowerCase().startsWith('!dessilenciar') || text.toLowerCase().startsWith('!unmute')) {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    const isAdmin = await senderIsAdmin(client, senderJid, authorJid)
    const isBotAdmin = await botIsAdmin(client, senderJid)
    if (!isAdmin && !isOwner) { await msg.reply('❌ Apenas admins!'); return }
    if (!isBotAdmin) { await msg.reply('❌ Preciso ser admin!'); return }
    const mencionados = msg.mentionedIds
    if (!mencionados?.length) { await msg.reply('❌ Mencione quem dessilenciar!'); return }
    try {
      for (const jid of mencionados) {
        await dessilenciarParticipante(client, senderJid, jid)
        await msg.reply(`🔊 @${jid.split('@')[0]} dessilenciado!`, undefined, { mentions: [jid] })
      }
    } catch (err) { await msg.reply('❌ Erro: ' + err.message) }
    return
  }

  // ── COMANDO: !regras ────────────────────────────────────
  if (text.toLowerCase().startsWith('!regras')) {
    if (!isGroup) { await msg.reply('❌ Este comando só funciona em grupos!'); return }
    const partes = text.split(' ').slice(1).join(' ').trim()
    if (partes.startsWith('set ') || partes.startsWith('definir ')) {
      const isAdmin = await senderIsAdmin(client, senderJid, authorJid)
      if (!isAdmin && !isOwner) { await msg.reply('❌ Apenas admins!'); return }
      grupoRegras[senderJid] = partes.replace(/^set |^definir /, '').trim()
      await msg.reply('✅ Regras definidas!')
      return
    }
    const regras = grupoRegras[senderJid]
    await msg.reply(regras
      ? `📋 *Regras do Grupo*\n\n${regras}`
      : `📋 *Regras do Grupo*\n\n1. Respeite todos\n2. Sem spam\n3. Sem conteúdo impróprio\n4. Use os comandos com responsabilidade\n\n_Para personalizar: !regras set (texto)_`
    )
    return
  }

  // ── COMANDOS SIMPLES ────────────────────────────────────
  if (text.toLowerCase() === '!dado') { await msg.reply(dado()); return }
  if (text.toLowerCase() === '!moeda') { await msg.reply(moeda()); return }
  if (text.toLowerCase() === '!frase') { await msg.reply(frase()); return }

  if (text.toLowerCase().startsWith('!horoscopo') || text.toLowerCase().startsWith('!horóscopo')) {
    await msg.reply(horoscopo(text.split(' ').slice(1).join(' ').trim()))
    return
  }

  // ── COMANDO: !sorteio ───────────────────────────────────
  if (text.toLowerCase().startsWith('!sorteio')) {
    const mencionados = msg.mentionedIds || []
    if (!mencionados.length) { await msg.reply('❌ Mencione pelo menos uma pessoa!'); return }
    const nomes = []
    for (const jid of mencionados) {
      try { const c = await client.getContactById(jid); nomes.push(c.pushname || c.name || jid.split('@')[0]) }
      catch { nomes.push(jid.split('@')[0]) }
    }
    const index = sorteio(mencionados)
    const jidVencedor = mencionados[index]
    await client.sendMessage(msg.from,
      `🎉 *SORTEIO REALIZADO!*\n\n🏆 O vencedor é: @${jidVencedor.split('@')[0]}\n\n_Parabéns, ${nomes[index]}!_ 🎊`,
      { mentions: [jidVencedor] }
    )
    return
  }

  // ── COMANDO: !meme ──────────────────────────────────────
  if (text.toLowerCase() === '!meme') {
    try {
      await msg.react('⏳')
      const meme = await getMeme()
      const ext = meme.url.split('.').pop().split('?')[0].toLowerCase()
      await client.sendMessage(msg.from, new MessageMedia(ext === 'gif' ? 'image/gif' : 'image/jpeg', meme.buffer.toString('base64')), { caption: meme.titulo })
      await msg.react('✅')
    } catch { await msg.reply('❌ Erro ao buscar meme!'); await msg.react('❌') }
    return
  }

  // ── COMANDO: !figurinha ─────────────────────────────────
  if (text.toLowerCase().startsWith('!figurinha') || text.toLowerCase().startsWith('!sticker') || text.toLowerCase().startsWith('!fig')) {
    let mediaMsg = null
    if (msg.hasMedia) mediaMsg = msg
    else if (msg.hasQuotedMsg) { const q = await msg.getQuotedMessage(); if (q.hasMedia) mediaMsg = q }
    if (!mediaMsg) { await msg.reply('❌ Envie ou responda uma imagem/video!'); return }
    try {
      await msg.react('⏳')
      const media = await mediaMsg.downloadMedia()
      if (!media) { await msg.reply('❌ Não foi possível baixar!'); return }
      const stickerBuffer = await createSticker(Buffer.from(media.data, 'base64'), media.mimetype.startsWith('video') ? 'video' : 'image')
      await client.sendMessage(msg.from, new MessageMedia('image/webp', stickerBuffer.toString('base64')), {
        sendMediaAsSticker: true, stickerName: BOT_NAME, stickerAuthor: senderName
      })
      await msg.react('✅')
    } catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !dl ────────────────────────────────────────
  if (text.toLowerCase().startsWith('!dl') || text.toLowerCase().startsWith('!baixar') || text.toLowerCase().startsWith('!download')) {
    const url = text.split(' ')[1]
    if (!url?.startsWith('http')) { await msg.reply('❌ Informe a URL!'); return }
    try {
      await msg.react('⏳'); await msg.reply('⬇️ Baixando, aguarde...')
      const result = await downloadVideo(url)
      await client.sendMessage(msg.from, new MessageMedia(result.type === 'video' ? 'video/mp4' : 'image/jpeg', result.buffer.toString('base64')), {
        caption: `📥 Baixado por *${BOT_NAME}*\n🙋 Solicitado por: ${senderName}`
      })
      await msg.react('✅')
    } catch (err) { await msg.reply('❌ Erro:\n' + err.message); await msg.react('❌') }
    return
  }

  // ── COMANDO: !play ──────────────────────────────────────
  if (text.toLowerCase().startsWith('!play') || text.toLowerCase().startsWith('!musica') || text.toLowerCase().startsWith('!mp3')) {
    const query = text.split(' ').slice(1).join(' ').trim()
    if (!query) { await msg.reply('❌ Informe o nome ou link!'); return }
    if (query.startsWith('http')) {
      await msg.react('⏳'); await msg.reply('⬇️ Baixando áudio...')
      try {
        const result = await downloadMusic(query)
        await client.sendMessage(msg.from, new MessageMedia('audio/mpeg', result.buffer.toString('base64'), result.filename), { sendAudioAsVoice: false })
        await msg.react('✅')
      } catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
      return
    }
    await msg.react('🔍'); await msg.reply(`🔍 Buscando: *${query}*`)
    try {
      const results = await searchMusic(query)
      if (!results?.length) { await msg.reply('❌ Nenhum resultado!'); return }
      searchSessions[senderJid] = { results, query }
      let listText = `🎵 *Resultados para:* "${query}"\n─────────────────────\n`
      results.forEach((r, i) => { listText += `*${i + 1}.* ${r.title}\n     ⏱️ ${r.duration} | 👤 ${r.channel}\n\n` })
      listText += `─────────────────────\n_Digite o número desejado_`
      await msg.reply(listText); await msg.react('✅')
      setTimeout(() => { delete searchSessions[senderJid] }, 120000)
    } catch (err) { await msg.reply('❌ Erro: ' + err.message); await msg.react('❌') }
    return
  }

  // ── MODO IA — responde tudo (deve ficar por último) ─────
  if (isGroup && modoIAAtivo[senderJid] && text && !text.startsWith('!') && !msg.fromMe) {
    try {
      const resposta = await iaSemCensura(text, senderName)
      await msg.reply(resposta)
    } catch (err) { console.error('Erro modo IA:', err.message) }
    return
  }
})

client.initialize()