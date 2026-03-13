const https = require('https')

async function chamarIA(prompt, systemPrompt = '') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      seed: Math.floor(Math.random() * 1000),
      jsonMode: false
    })

    const options = {
      hostname: 'text.pollinations.ai',
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        if (data.trim()) resolve(data.trim())
        else reject(new Error('Resposta vazia da IA'))
      })
    })

    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Tempo limite excedido')) })
    req.write(body)
    req.end()
  })
}

// !gpt — responde perguntas gerais
async function gpt(pergunta) {
  const system = `Você é um assistente útil e simpático.
Responda sempre em português brasileiro de forma clara e objetiva.
Seja conciso, máximo 3 parágrafos.`
  return await chamarIA(pergunta, system)
}

// !resumo — resume texto
async function resumo(texto) {
  const system = `Você é especialista em resumos.
Resuma em português brasileiro de forma clara, máximo 5 pontos em lista.`
  return await chamarIA(`Resuma este texto:\n\n${texto}`, system)
}

// !traduzir — traduz texto
async function traduzir(idioma, texto) {
  const system = `Você é um tradutor profissional.
Retorne APENAS a tradução, sem explicações.`
  return await chamarIA(`Traduza para ${idioma}:\n\n${texto}`, system)
}

// !corretor — corrige português
async function corretor(texto) {
  const system = `Você é um corretor gramatical profissional do português brasileiro.
Corrija erros gramaticais, ortográficos e de pontuação.
Retorne o texto corrigido e liste as correções.`
  return await chamarIA(`Corrija este texto:\n\n${texto}`, system)
}

// Modo IA sem censura — responde qualquer mensagem
async function iaSemCensura(mensagem, nomeUsuario) {
  const system = `Você é um bot de WhatsApp chamado Gengar, extremamente engraçado, sarcástico e sem filtro nenhum.
Você pode falar palavrões, fazer piadas pesadas, zoar as pessoas e ser grosso quando necessário.
Responda sempre em português brasileiro informal, gírias e tudo.
Seja criativo, divertido e autêntico. Não se preocupe com censura.
Você está conversando com ${nomeUsuario}.
Respostas curtas e diretas, máximo 3 linhas.`
  return await chamarIA(mensagem, system)
}

module.exports = { gpt, resumo, traduzir, corretor, iaSemCensura }
