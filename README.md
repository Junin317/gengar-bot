# 🤖 WhatsApp Bot — Figurinhas & Download de Vídeos

Bot para WhatsApp com **comandos simples** para criar figurinhas e baixar vídeos de redes sociais.

---

## ✅ Funcionalidades

| Comando | O que faz |
|---|---|
| `!figurinha` | Cria figurinha a partir de imagem ou vídeo |
| `!dl <url>` | Baixa vídeo do Instagram, TikTok, Twitter/X, Facebook |
| `!help` | Mostra todos os comandos |

---

## 📋 Pré-requisitos

Antes de instalar, você precisa ter instalado:

### 1. Node.js (versão 18 ou superior)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versão
node --version
```

### 2. FFmpeg (para figurinhas animadas)
```bash
# Ubuntu/Debian
sudo apt install ffmpeg -y

# macOS (Homebrew)
brew install ffmpeg

# Windows
# Baixe em: https://ffmpeg.org/download.html
# Adicione ao PATH do sistema
```

### 3. yt-dlp (para download de vídeos)
```bash
# Linux/macOS
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Windows
# Baixe o yt-dlp.exe em: https://github.com/yt-dlp/yt-dlp/releases
# Coloque na pasta do bot ou adicione ao PATH

# Atualizar yt-dlp (recomendado regularmente)
yt-dlp -U
```

---

## 🚀 Instalação

```bash
# 1. Clone ou baixe esta pasta
cd whatsapp-bot

# 2. Instale as dependências
npm install

# 3. Inicie o bot
npm start
```

---

## 📱 Conectar ao WhatsApp

1. Rode `npm start`
2. Um **QR Code** aparecerá no terminal
3. Abra o WhatsApp no celular
4. Vá em **Configurações → Aparelhos conectados → Conectar aparelho**
5. Escaneie o QR Code
6. ✅ Pronto! O bot está ativo!

> A sessão é salva na pasta `auth/`. Não é necessário escanear novamente.

---

## 💬 Como usar

### 🖼️ Criar Figurinha
```
1. Envie uma imagem no WhatsApp
2. (ou responda uma imagem existente)
3. Digite: !figurinha
```

```
1. Envie um vídeo curto (máx 10 segundos)
2. Digite: !figurinha
3. O bot cria uma figurinha animada! 🎉
```

### 📥 Baixar Vídeo
```
!dl https://www.instagram.com/p/XXXXX
!dl https://vm.tiktok.com/XXXXX
!dl https://twitter.com/user/status/XXXXX
!dl https://www.facebook.com/watch/?v=XXXXX
!dl https://fb.watch/XXXXX
```

---

## 🗂️ Estrutura de Arquivos

```
whatsapp-bot/
├── index.js        # Arquivo principal do bot
├── sticker.js      # Módulo de criação de figurinhas
├── downloader.js   # Módulo de download de vídeos
├── package.json    # Dependências do projeto
├── auth/           # Sessão do WhatsApp (criada automaticamente)
└── README.md       # Este arquivo
```

---

## ⚙️ Configurações Avançadas (Opcional)

Para usar o bot em grupos, não há configuração extra. Ele responde em **PVs e grupos**.

Para rodar em segundo plano (servidor):
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
pm2 start index.js --name "whatsapp-bot"
pm2 save
pm2 startup
```

---

## ❓ Problemas Comuns

| Problema | Solução |
|---|---|
| QR Code não aparece | Verifique se o Node.js está na versão 18+ |
| Figurinha não criada | Instale o FFmpeg corretamente |
| Vídeo não baixa | Atualize o yt-dlp: `yt-dlp -U` |
| Bot desconecta | Delete a pasta `auth/` e escaneie o QR novamente |
| Erro de permissão | Rode com `sudo` no Linux |

---

## ⚠️ Aviso Legal

Este bot usa a biblioteca **Baileys** que se conecta ao WhatsApp de forma não-oficial.  
Use com responsabilidade. Não use para spam.  
O WhatsApp pode banir contas que fazem uso automatizado abusivo.

---

## 🛠️ Tecnologias

- [Baileys](https://github.com/WhiskeySockets/Baileys) — Conexão WhatsApp
- [sharp](https://sharp.pixelplumbing.com/) — Processamento de imagens
- [FFmpeg](https://ffmpeg.org/) — Conversão de vídeos para WebP animado
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — Download de vídeos

---

_Feito com ❤️ — Bot WhatsApp completo_