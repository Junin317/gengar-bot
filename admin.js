/**
 * Verifica se o bot é admin do grupo
 */
async function botIsAdmin(client, groupJid) {
  try {
    const chat = await client.getChatById(groupJid)
    const botId = client.info.wid._serialized
    const participant = chat.participants.find(p => p.id._serialized === botId)
    return participant?.isAdmin || participant?.isSuperAdmin || false
  } catch { return false }
}

/**
 * Verifica se o sender é admin do grupo
 */
async function senderIsAdmin(client, groupJid, senderJid) {
  try {
    const chat = await client.getChatById(groupJid)
    const participant = chat.participants.find(p =>
      p.id._serialized === senderJid ||
      p.id._serialized.includes(senderJid.split('@')[0])
    )
    return participant?.isAdmin || participant?.isSuperAdmin || false
  } catch { return false }
}

/**
 * Remove participante do grupo (banir)
 */
async function banirParticipante(client, groupJid, participanteJid) {
  const chat = await client.getChatById(groupJid)
  await chat.removeParticipants([participanteJid])
}

/**
 * Rebaixa participante (silenciar = tirar admin)
 */
async function silenciarParticipante(client, groupJid, participanteJid) {
  const chat = await client.getChatById(groupJid)
  await chat.demoteParticipants([participanteJid])
}

/**
 * Promove participante (dessilenciar = dar admin de volta)
 */
async function dessilenciarParticipante(client, groupJid, participanteJid) {
  const chat = await client.getChatById(groupJid)
  await chat.promoteParticipants([participanteJid])
}

module.exports = {
  botIsAdmin,
  senderIsAdmin,
  banirParticipante,
  silenciarParticipante,
  dessilenciarParticipante
}