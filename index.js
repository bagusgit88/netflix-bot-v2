require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const puppeteer = require('puppeteer');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Simpan data user sementara
const userSessions = new Map();

// Helper: Delay dengan promise
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi animasi loading dengan rotating text
async function sendRotatingLoadingText(ctx, texts, stopSignal) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let textIndex = 0;
  const interval = 400;
  
  const message = await ctx.reply(`${frames[frameIndex]} ${texts[textIndex]}`);
  
  const intervalId = setInterval(async () => {
    if (stopSignal.stopped) {
      clearInterval(intervalId);
      return;
    }
    
    frameIndex = (frameIndex + 1) % frames.length;
    
    // Ganti text setiap 6 detik
    if (frameIndex % 15 === 0) {
      textIndex = (textIndex + 1) % texts.length;
    }
    
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        message.message_id,
        null,
        `${frames[frameIndex]} ${texts[textIndex]}`
      );
    } catch (e) {
      // Ignore edit errors
    }
  }, interval);
  
  return { message, intervalId };
}

// Command /start
bot.start(async (ctx) => {
  await ctx.replyWithHTML(
    '👋 <b>Selamat Datang di Netflix Setup Bot!</b>\n\n' +
    '🎬 Bot ini membantu Anda mengatur profil Netflix dengan mudah dan cepat.\n\n' +
    '🔹 <b>Fitur:</b>\n' +
    '   • Atur nama profil otomatis\n' +
    '   • Set PIN untuk setiap profil\n' +
    '   • Auto-detect profil yang ada\n\n' +
    '📱 Ketik /setup untuk memulai\n' +
    '❓ Ketik /help untuk bantuan\n\n' +
    '<i>⚠️ Hubungi @piechel jika ada error.</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Setup', 'start_setup')],
      [Markup.button.callback('📖 Bantuan', 'show_help')]
    ])
  );
});

// Command /help
bot.help(async (ctx) => {
  await ctx.replyWithHTML(
    '📖 <b>Panduan Penggunaan</b>\n\n' +
    '<b>Step-by-Step:</b>\n\n' +
    '1️⃣ Ketik /setup atau klik tombol <b>Mulai Setup</b>\n\n' +
    '2️⃣ Pilih fitur yang Anda inginkan:\n' +
    '   • <b>Atur Nama Profil</b> - Ubah nama 5 profil Netflix\n' +
    '   • <b>Atur PIN Profil</b> - Set PIN untuk tiap profil\n' +
    '   • <b>Atur Nama + PIN</b> - Lengkap!\n\n' +
    '3️⃣ Kirim <b>link reset password</b> Netflix\n' +
    '   (Link dikirim ke email Anda)\n\n' +
    '4️⃣ Kirim <b>password</b> akun Netflix\n\n' +
    '5️⃣ Ikuti instruksi selanjutnya\n\n' +
    '6️⃣ Selesai! ✅\n\n' +
    '<i>💡 Tip: Bot akan auto-detect profil yang sudah ada</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Setup', 'start_setup')],
      [Markup.button.callback('🏠 Kembali', 'back_to_start')]
    ])
  );
});

// Command /setup
bot.command('setup', async (ctx) => {
  const session = userSessions.get(ctx.from.id) || {};
  
  session.step = 'choose_feature';
  
  await ctx.replyWithHTML(
    '🎯 <b>Pilih Fitur yang Anda Inginkan:</b>\n\n' +
    '📝 <b>Atur Nama Profil</b>\n' +
    '   Ubah nama 5 profil Netflix sekaligus\n\n' +
    '🔐 <b>Atur PIN Profil</b>\n' +
    '   Set PIN 4 digit untuk setiap profil\n\n' +
    '🎨 <b>Atur Nama + PIN</b>\n' +
    '   Lengkap! Atur nama dan PIN sekaligus\n\n' +
    '<i>Pilih salah satu di bawah ini:</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('📝 Atur Nama Profil', 'feat_nama')],
      [Markup.button.callback('🔐 Atur PIN Profil', 'feat_pin')],
      [Markup.button.callback('🎨 Atur Nama + PIN', 'feat_both')],
      [Markup.button.callback('❌ Batal', 'cancel')]
    ])
  );
  
  userSessions.set(ctx.from.id, session);
});

// Callback query handlers
bot.action('start_setup', async (ctx) => {
  await ctx.answerCbQuery();
  
  const session = userSessions.get(ctx.from.id) || {};
  session.step = 'choose_feature';
  
  await ctx.replyWithHTML(
    '🎯 <b>Pilih Fitur yang Anda Inginkan:</b>\n\n' +
    '📝 <b>Atur Nama Profil</b>\n' +
    '   Ubah nama 5 profil Netflix sekaligus\n\n' +
    '🔐 <b>Atur PIN Profil</b>\n' +
    '   Set PIN 4 digit untuk setiap profil\n\n' +
    '🎨 <b>Atur Nama + PIN</b>\n' +
    '   Lengkap! Atur nama dan PIN sekaligus\n\n' +
    '<i>Pilih salah satu di bawah ini:</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('📝 Atur Nama Profil', 'feat_nama')],
      [Markup.button.callback('🔐 Atur PIN Profil', 'feat_pin')],
      [Markup.button.callback('🎨 Atur Nama + PIN', 'feat_both')],
      [Markup.button.callback('❌ Batal', 'cancel')]
    ])
  );
  
  userSessions.set(ctx.from.id, session);
});

bot.action('show_help', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.replyWithHTML(
    '📖 <b>Panduan Penggunaan</b>\n\n' +
    '<b>Step-by-Step:</b>\n\n' +
    '1️⃣ Ketik /setup atau klik tombol <b>Mulai Setup</b>\n\n' +
    '2️⃣ Pilih fitur yang Anda inginkan:\n' +
    '   • <b>Atur Nama Profil</b> - Ubah nama 5 profil Netflix\n' +
    '   • <b>Atur PIN Profil</b> - Set PIN untuk tiap profil\n' +
    '   • <b>Atur Nama + PIN</b> - Lengkap!\n\n' +
    '3️⃣ Kirim <b>link reset password</b> Netflix\n' +
    '   (Link dikirim ke email Anda)\n\n' +
    '4️⃣ Kirim <b>password</b> akun Netflix\n\n' +
    '5️⃣ Ikuti instruksi selanjutnya\n\n' +
    '6️⃣ Selesai! ✅\n\n' +
    '<i>💡 Tip: Bot akan auto-detect profil yang sudah ada</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Setup', 'start_setup')],
      [Markup.button.callback('🏠 Kembali', 'back_to_start')]
    ])
  );
});

bot.action('back_to_start', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.replyWithHTML(
    '👋 <b>Selamat Datang di Netflix Setup Bot!</b>\n\n' +
    '🎬 Bot ini membantu Anda mengatur profil Netflix dengan mudah dan cepat.\n\n' +
    '🔹 <b>Fitur:</b>\n' +
    '   • Atur nama profil otomatis\n' +
    '   • Set PIN untuk setiap profil\n' +
    '   • Auto-detect profil yang ada\n\n' +
    '📱 Ketik /setup untuk memulai\n' +
    '❓ Ketik /help untuk bantuan\n\n' +
    '<i>⚠️ Educational purpose only</i>',
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 Mulai Setup', 'start_setup')],
      [Markup.button.callback('📖 Bantuan', 'show_help')]
    ])
  );
});

bot.action('feat_nama', async (ctx) => {
  await ctx.answerCbQuery('📝 Atur Nama Profil dipilih');
  const session = userSessions.get(ctx.from.id);
  if (!session) return;
  
  session.feature = 'nama';
  session.step = 'waiting_link';
  
  await ctx.replyWithHTML(
    '📝 <b>Mode: Atur Nama Profil</b>\n\n' +
    '📎 <b>Step 1:</b> Kirim link reset password Netflix\n\n' +
    '<i>💡 Link biasanya dikirim ke email Anda dengan subjek "Reset your Netflix password"</i>\n\n' +
    '<b>Contoh link:</b>\n' +
    '<code>https://www.netflix.com/password?g=...</code>',
    Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
  );
  
  userSessions.set(ctx.from.id, session);
});

bot.action('feat_pin', async (ctx) => {
  await ctx.answerCbQuery('🔐 Atur PIN Profil dipilih');
  const session = userSessions.get(ctx.from.id);
  if (!session) return;
  
  session.feature = 'pin';
  session.step = 'waiting_link';
  
  await ctx.replyWithHTML(
    '🔐 <b>Mode: Atur PIN Profil</b>\n\n' +
    '📎 <b>Step 1:</b> Kirim link reset password Netflix\n\n' +
    '<i>💡 Link biasanya dikirim ke email Anda dengan subjek "Reset your Netflix password"</i>\n\n' +
    '<b>Contoh link:</b>\n' +
    '<code>https://www.netflix.com/password?g=...</code>',
    Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
  );
  
  userSessions.set(ctx.from.id, session);
});

bot.action('feat_both', async (ctx) => {
  await ctx.answerCbQuery('🎨 Atur Nama + PIN dipilih');
  const session = userSessions.get(ctx.from.id);
  if (!session) return;
  
  session.feature = 'both';
  session.step = 'waiting_link';
  
  await ctx.replyWithHTML(
    '🎨 <b>Mode: Atur Nama + PIN</b>\n\n' +
    '📎 <b>Step 1:</b> Kirim link reset password Netflix\n\n' +
    '<i>💡 Link biasanya dikirim ke email Anda dengan subjek "Reset your Netflix password"</i>\n\n' +
    '<b>Contoh link:</b>\n' +
    '<code>https://www.netflix.com/password?g=...</code>',
    Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
  );
  
  userSessions.set(ctx.from.id, session);
});

bot.action('cancel', async (ctx) => {
  await ctx.answerCbQuery('Setup dibatalkan');
  const userId = ctx.from.id;
  
  userSessions.delete(userId);
  
  await ctx.replyWithHTML(
    '❌ <b>Setup Dibatalkan</b>\n\n' +
    'Ketik /setup untuk memulai lagi.',
    Markup.inlineKeyboard([[Markup.button.callback('🚀 Mulai Setup', 'start_setup')]])
  );
});

bot.action('clear_data', async (ctx) => {
  await ctx.answerCbQuery('🗑️ Data Anda telah dihapus dari server');
  const userId = ctx.from.id;
  
  userSessions.delete(userId);
  
  await ctx.replyWithHTML(
    '🗑️ <b>Data Berhasil Dihapus</b>\n\n' +
    '✅ Semua data Anda (link, password, PIN) telah dihapus dari server bot.\n\n' +
    '<i>Terima kasih telah menggunakan bot kami! 🙏</i>',
    Markup.inlineKeyboard([[Markup.button.callback('🏠 Kembali ke Menu', 'back_to_start')]])
  );
});

// Terima pesan text
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const session = userSessions.get(userId);
  
  if (!session) {
    return ctx.replyWithHTML(
      '⚠️ <b>Sesi tidak ditemukan</b>\n\n' +
      'Ketik /setup untuk memulai',
      Markup.inlineKeyboard([[Markup.button.callback('🚀 Mulai Setup', 'start_setup')]])
    );
  }
  
  const text = ctx.message.text;
  
  // Step 1: Terima link
  if (session.step === 'waiting_link') {
    if (!text.includes('netflix.com')) {
      return ctx.replyWithHTML(
        '❌ <b>Link Tidak Valid!</b>\n\n' +
        'Link harus mengandung <code>netflix.com</code>\n\n' +
        'Silakan kirim link yang benar.',
        Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
      );
    }
    
    session.link = text;
    session.step = 'waiting_password';
    
    await ctx.replyWithHTML(
      '✅ <b>Link diterima!</b>\n\n' +
      '🔑 <b>Step 2:</b> Kirim password akun Netflix Anda\n\n' +
      '<i>⚠️ Password Anda aman dan akan dihapus setelah proses selesai</i>',
      Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
    );
    
    userSessions.set(userId, session);
    return;
  }
  
  // Step 2: Terima password
  if (session.step === 'waiting_password') {
    session.password = text;
    
    const loadingTexts = [
      'Sedang memproses...',
      'Mohon tunggu ya kak...',
      'Mendeteksi profil Netflix...',
      'Tunggu sebentar...',
      'Hampir selesai...',
      'Sabar ya kak...'
    ];
    
    const stopSignal = { stopped: false };
    const { message: loadingMsg, intervalId } = await sendRotatingLoadingText(ctx, loadingTexts, stopSignal);
    
    try {
      const existingProfiles = await detectProfiles(session.link, session.password, ctx);
      
      stopSignal.stopped = true;
      clearInterval(intervalId);
      
      await delay(500);
      
      if (existingProfiles && existingProfiles.length > 0) {
        session.existingProfiles = existingProfiles;
        
        const profileList = existingProfiles.map((p, i) => `   ${i+1}. <b>${p}</b>`).join('\n');
        
        await ctx.replyWithHTML(
          '✅ <b>Profil Terdeteksi:</b>\n\n' +
          profileList + '\n\n' +
          '━━━━━━━━━━━━━━━━'
        );
      }
      
      await delay(500);
      
      // Logika berbeda untuk nama vs PIN
      if (session.feature === 'nama' || session.feature === 'both') {
        session.step = 'waiting_profile_names';
        userSessions.set(userId, session);
        
        await ctx.replyWithHTML(
          '👥 <b>Step 3:</b> Kirim 5 nama profil baru\n\n' +
          '<i>Pisahkan dengan koma (,)</i>\n\n' +
          '<b>Contoh:</b>\n' +
          '<code>Agus, Bowo, Cahyo, Darto, Eko</code>',
          Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
        );
      } else {
        session.profiles = existingProfiles;
        session.step = 'waiting_pins';
        session.currentPinIndex = 0;
        session.pins = [];
        userSessions.set(userId, session);
        
        await ctx.replyWithHTML(
          `🔐 <b>Step 3:</b> Set PIN untuk setiap profil\n\n` +
          `📌 PIN untuk profil "<b>${session.profiles[0]}</b>"\n\n` +
          `<i>Masukkan 4 digit angka</i>`,
          Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
        );
      }
      
    } catch (error) {
      console.error('Error detecting profiles:', error);
      stopSignal.stopped = true;
      clearInterval(intervalId);
      
      await delay(500);
      
      await ctx.replyWithHTML(
        '❌ <b>Gagal Mendeteksi Profil</b>\n\n' +
        'Terjadi kesalahan saat mengakses Netflix.\n\n' +
        'Silakan coba lagi dengan /setup',
        Markup.inlineKeyboard([[Markup.button.callback('🔄 Coba Lagi', 'start_setup')]])
      );
    }
    return;
  }
  
  // Step 3: Terima nama profil
  if (session.step === 'waiting_profile_names') {
    const profiles = text.split(',').map(p => p.trim());
    
    if (profiles.length !== 5) {
      return ctx.replyWithHTML(
        '❌ <b>Jumlah Profil Salah!</b>\n\n' +
        `Anda mengirim <b>${profiles.length} profil</b>, harus <b>5 profil</b>.\n\n` +
        'Silakan kirim ulang dengan format:\n' +
        '<code>Nama1, Nama2, Nama3, Nama4, Nama5</code>',
        Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
      );
    }
    
    session.profiles = profiles;
    
    if (session.feature === 'both') {
      session.step = 'waiting_pins';
      session.currentPinIndex = 0;
      session.pins = [];
      userSessions.set(userId, session);
      
      await ctx.replyWithHTML(
        `✅ <b>Nama profil diterima!</b>\n\n` +
        `🔐 <b>Step 4:</b> Set PIN untuk setiap profil\n\n` +
        `📌 PIN untuk profil "<b>${session.profiles[0]}</b>"\n\n` +
        `<i>Masukkan 4 digit angka</i>`,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
      );
    } else {
      const loadingTexts = [
        'Memproses setup Netflix...',
        'Sedang mengatur profil...',
        'Mohon tunggu ya kak...',
        'Tunggu sebentar...',
        'Hampir selesai...',
        'Sabar dikit lagi ya...'
      ];
      
      const stopSignal = { stopped: false };
      const { message: loadingMsg, intervalId } = await sendRotatingLoadingText(ctx, loadingTexts, stopSignal);
      
      try {
        await jalankanAutomasi(session, ctx);
        
        stopSignal.stopped = true;
        clearInterval(intervalId);
        
        await delay(1000);
        
        let rincian = '✅ <b>Setup Berhasil!</b>\n\n' +
                      '🎉 Profil Netflix Anda telah berhasil diatur.\n\n' +
                      '📋 <b>Rincian Profil:</b>\n\n';
        
        for (let i = 0; i < session.profiles.length; i++) {
          rincian += `${i+1}. <b>${session.profiles[i]}</b>\n`;
        }
        
        rincian += '\n<i>Silakan cek akun Netflix Anda sekarang!</i>';
        
        await ctx.replyWithHTML(
          rincian,
          Markup.inlineKeyboard([
            [Markup.button.callback('🗑️ Hapus Data Saya', 'clear_data')],
            [Markup.button.callback('🏠 Kembali ke Menu', 'back_to_start')]
          ])
        );
      } catch (error) {
        console.error('Error:', error);
        stopSignal.stopped = true;
        clearInterval(intervalId);
        
        await delay(1000);
        
        await ctx.replyWithHTML(
          '❌ <b>Setup Gagal</b>\n\n' +
          `<i>${error.message}</i>\n\n` +
          'Silakan coba lagi.',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Coba Lagi', 'start_setup')],
            [Markup.button.callback('🗑️ Hapus Data Saya', 'clear_data')]
          ])
        );
      }
      
      userSessions.delete(userId);
    }
    return;
  }
  
  // Step 4: Terima PIN per profil
  if (session.step === 'waiting_pins') {
    const pin = text.trim();
    
    if (!/^\d{4}$/.test(pin)) {
      return ctx.replyWithHTML(
        '❌ <b>PIN Tidak Valid!</b>\n\n' +
        'PIN harus <b>4 digit angka</b>.\n\n' +
        `Silakan kirim PIN untuk profil "<b>${session.profiles[session.currentPinIndex]}</b>" lagi.`,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
      );
    }
    
    if (!session.pins) session.pins = [];
    session.pins.push(pin);
    session.currentPinIndex++;
    
    if (session.currentPinIndex < session.profiles.length) {
      userSessions.set(userId, session);
      
      await ctx.replyWithHTML(
        `✅ PIN untuk "<b>${session.profiles[session.currentPinIndex - 1]}</b>" tersimpan!\n\n` +
        `📌 PIN untuk profil "<b>${session.profiles[session.currentPinIndex]}</b>"\n\n` +
        `<i>Masukkan 4 digit angka (${session.currentPinIndex + 1}/5)</i>`,
        Markup.inlineKeyboard([[Markup.button.callback('❌ Batal', 'cancel')]])
      );
      return;
    }
    
    const loadingTexts = [
      'Memproses setup Netflix...',
      'Sedang mengatur PIN profil...',
      'Mohon tunggu ya kak...',
      'Tunggu sebentar...',
      'Hampir selesai...',
      'Sabar dikit lagi ya...'
    ];
    
    const stopSignal = { stopped: false };
    const { message: loadingMsg, intervalId } = await sendRotatingLoadingText(ctx, loadingTexts, stopSignal);
    
    try {
      await jalankanAutomasi(session, ctx);
      
      stopSignal.stopped = true;
      clearInterval(intervalId);
      
      await delay(1000);
      
      let rincian = '✅ <b>Setup Berhasil!</b>\n\n' +
                    '🎉 Profil Netflix Anda telah berhasil diatur.\n\n' +
                    '📋 <b>Rincian Profil & PIN:</b>\n\n';
      
      for (let i = 0; i < session.profiles.length; i++) {
        rincian += `${i+1}. <b>${session.profiles[i]}</b>\n`;
        rincian += `   🔐 PIN: <code>${session.pins[i]}</code>\n\n`;
      }
      
      rincian += '<i>Silakan cek akun Netflix Anda sekarang!</i>';
      
      await ctx.replyWithHTML(
        rincian,
        Markup.inlineKeyboard([
          [Markup.button.callback('🗑️ Hapus Data Saya', 'clear_data')],
          [Markup.button.callback('🏠 Kembali ke Menu', 'back_to_start')]
        ])
      );
    } catch (error) {
      console.error('Error:', error);
      stopSignal.stopped = true;
      clearInterval(intervalId);
      
      await delay(1000);
      
      await ctx.replyWithHTML(
        '❌ <b>Setup Gagal</b>\n\n' +
        `<i>${error.message}</i>\n\n` +
        'Silakan coba lagi.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Coba Lagi', 'start_setup')],
          [Markup.button.callback('🗑️ Hapus Data Saya', 'clear_data')]
        ])
      );
    }
    
    userSessions.delete(userId);
  }
});

// Fungsi untuk detect profil yang ada
async function detectProfiles(link, password, ctx) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  const profiles = [];
  const pageDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto(link, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    await pageDelay(2000);
    
    await page.goto('https://www.netflix.com/simplesetup/newprofiles', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await pageDelay(2000);
    
    const inputs = [
      'input[data-uia="field-ownerName"]',
      'input[data-uia="field-profile1Name"]',
      'input[data-uia="field-profile2Name"]',
      'input[data-uia="field-profile3Name"]',
      'input[data-uia="field-profile4Name"]'
    ];
    
    for (const selector of inputs) {
      try {
        const value = await page.$eval(selector, el => el.value);
        if (value) {
          profiles.push(value);
        } else {
          profiles.push(`Profil ${profiles.length + 1}`);
        }
      } catch (e) {
        profiles.push(`Profil ${profiles.length + 1}`);
      }
    }
    
    await browser.close();
    return profiles;
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Fungsi automasi Netflix
async function jalankanAutomasi(session, ctx) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  
  const page = await browser.newPage();
  const pageDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  try {
    await page.setViewport({ width: 1280, height: 720 });
    
    await page.goto(session.link, { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });
    await pageDelay(3000);
    
    if (session.feature === 'pin' || session.feature === 'both') {
      await page.goto('https://www.netflix.com/settings/migration', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await pageDelay(3000);
      
      const passwordInput = await page.$('input[data-uia="input-account-content-restrictions"]');
      if (passwordInput) {
        await passwordInput.type(session.password);
        await pageDelay(1000);
        
        await page.click('button[data-uia="btn-account-pin-submit"]');
        await pageDelay(4000);
        
        const profileElements = await page.$$('.parental-control-profile');
        
        for (let i = 0; i < profileElements.length && i < session.pins.length; i++) {
          const profile = profileElements[i];
          const pin = session.pins[i];
          
          const checkbox = await profile.$('input[type="checkbox"]');
          if (checkbox) {
            const isChecked = await page.evaluate(el => el.checked, checkbox);
            if (!isChecked) {
              await checkbox.click();
              await pageDelay(1000);
            }
          }
          
          const pinInputs = await profile.$$('.pin-input-container input[type="tel"]');
          
          if (pinInputs.length === 4) {
            for (let j = 0; j < 4; j++) {
              await pinInputs[j].click();
              await pageDelay(100);
              
              await pinInputs[j].evaluate(el => {
                el.value = '';
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              });
              
              await page.evaluate((input) => {
                input.focus();
              }, pinInputs[j]);
              
              await pageDelay(100);
            }
            
            await pageDelay(500);
            
            for (let j = 0; j < 4; j++) {
              const digit = pin[j];
              
              await pinInputs[j].click();
              await pageDelay(200);
              
              await pinInputs[j].type(digit, { delay: 100 });
              await pageDelay(200);
              
              await pinInputs[j].evaluate((el, d) => {
                el.value = d;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('blur', { bubbles: true }));
              }, digit);
              
              await pageDelay(200);
            }
            
            await pageDelay(1000);
          }
        }
        
        await pageDelay(2000);
        
        const applyBtn = await page.$('button[data-uia="profile-hub-migration-apply"]');
        if (applyBtn) {
          await applyBtn.click();
          await pageDelay(5000);
        }
      }
    }
    
    if (session.feature === 'nama' || session.feature === 'both') {
      await page.goto('https://www.netflix.com/simplesetup/newprofiles', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      await pageDelay(2000);
      
      const inputs = [
        'input[data-uia="field-ownerName"]',
        'input[data-uia="field-profile1Name"]',
        'input[data-uia="field-profile2Name"]',
        'input[data-uia="field-profile3Name"]',
        'input[data-uia="field-profile4Name"]'
      ];
      
      for (let i = 0; i < inputs.length && i < session.profiles.length; i++) {
        const input = await page.$(inputs[i]);
        if (input) {
          await input.click({ clickCount: 3 });
          await pageDelay(200);
          await input.type(session.profiles[i]);
          await pageDelay(300);
        }
      }
      
      await pageDelay(1000);
      await page.click('button[data-uia="cta_profiles_form"]');
      await pageDelay(3000);
      
      const nextBtn = await page.$('button[data-uia="cta_profiles_form"]');
      if (nextBtn) {
        await nextBtn.click();
        await pageDelay(2000);
      }
      
      const langBtn = await page.$('button[data-uia="cta-secondary-languages-inline"]');
      if (langBtn) {
        await langBtn.click();
        await pageDelay(2000);
      }
    }
    
  } catch (error) {
    console.error('Automation error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  
  // Skip kalau rate limit
  if (err.response && err.response.error_code === 429) {
    console.log('Rate limit hit, skipping error message');
    return;
  }
  
  try {
    ctx.replyWithHTML(
      '❌ <b>Terjadi Kesalahan</b>\n\n' +
      'Silakan coba lagi dengan /setup',
      Markup.inlineKeyboard([[Markup.button.callback('🔄 Coba Lagi', 'start_setup')]])
    );
  } catch (e) {
    console.error('Failed to send error message:', e);
  }
});

// Jalankan bot
bot.launch()
  .then(() => {
    console.log('✅ Bot berhasil jalan!');
  })
  .catch((err) => {
    console.error('❌ Bot gagal jalan:', err);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));