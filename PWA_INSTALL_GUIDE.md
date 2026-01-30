# 📱 FOTIVA PWA - Guia de Instalação

## O que é PWA?

Progressive Web App (PWA) é uma tecnologia que permite que sites funcionem como aplicativos nativos no seu celular, com:

✅ **Instalação na tela inicial** - Ícone como um app real  
✅ **Funciona offline** - Acesse mesmo sem internet  
✅ **Rápido e responsivo** - Carregamento instantâneo  
✅ **Notificações push** - Alertas de vencimentos  
✅ **Atualizações automáticas** - Sempre na última versão  
✅ **Sem app store** - Instale direto do navegador  

---

## 📲 Como Instalar no Android

### Método 1: Chrome/Edge
1. Abra o FOTIVA no Chrome: `https://tailwind-fix-3.preview.emergentagent.com`
2. Toque no menu (⋮) no canto superior direito
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Confirme tocando em **"Instalar"**
5. Pronto! O ícone do FOTIVA aparecerá na sua tela inicial

### Método 2: Prompt Automático
1. Ao acessar o FOTIVA, aguarde 10 segundos
2. Um banner aparecerá automaticamente: **"Instalar FOTIVA"**
3. Toque em **"Instalar"**
4. O app será adicionado automaticamente

---

## 🍎 Como Instalar no iPhone/iPad

### Safari (único navegador com suporte PWA no iOS)
1. Abra o FOTIVA no Safari: `https://tailwind-fix-3.preview.emergentagent.com`
2. Toque no botão **Compartilhar** (quadrado com seta para cima)
3. Role e selecione **"Adicionar à Tela de Início"**
4. Edite o nome se desejar: "FOTIVA"
5. Toque em **"Adicionar"**
6. O ícone aparecerá na tela inicial

**⚠️ Nota**: No iOS, PWAs só funcionam no Safari. Chrome e Firefox não suportam instalação.

---

## 💻 Como Instalar no Desktop

### Chrome, Edge, Brave (Windows/Mac/Linux)
1. Abra o FOTIVA no navegador
2. Procure o ícone de instalação (➕) na barra de endereço
3. Ou vá em Menu (⋮) → **"Instalar FOTIVA"**
4. Confirme clicando em **"Instalar"**
5. O app abrirá em uma janela própria

---

## 🔧 Recursos PWA Disponíveis

### ✅ Já Implementado
- [x] Manifest.json configurado
- [x] Service Worker para cache offline
- [x] Ícones 192x192 e 512x512
- [x] Theme color (#4A9B6E)
- [x] Menu hamburguer mobile
- [x] Layout responsivo completo
- [x] Splash screen
- [x] Meta tags Apple
- [x] Prompt de instalação inteligente

### 🚧 Próximas Features
- [ ] Push notifications (alertas de vencimento)
- [ ] Background sync (sincronizar dados offline)
- [ ] Share API (compartilhar galerias)
- [ ] Shortcuts (atalhos rápidos)

---

## 🧪 Testar PWA Localmente

### Pré-requisitos
- HTTPS obrigatório (exceto localhost)
- Service Worker registrado

### Comandos de Teste

```bash
# 1. Build de produção
cd /app/frontend
yarn build

# 2. Servir build com HTTPS
npx serve -s build -p 3000

# 3. Testar no Chrome DevTools
# Abra: chrome://inspect/#service-workers
# Verifique se o Service Worker está ativo
```

### Lighthouse Audit
```bash
# Análise PWA no Chrome DevTools
1. Abra o site
2. F12 → Lighthouse
3. Selecione "Progressive Web App"
4. Clique em "Generate report"
5. Meta: 100/100 score
```

---

## 📊 Status da Implementação

| Feature | Status | Nota |
|---------|--------|------|
| Manifest | ✅ | Completo |
| Service Worker | ✅ | Cache + offline |
| Ícones | ⚠️ | Placeholders (substituir por PNG) |
| Meta Tags | ✅ | iOS + Android |
| Responsivo | ✅ | Mobile-first |
| Install Prompt | ✅ | Auto após 10s |
| Offline Fallback | ✅ | Cache de assets |
| Push Notifications | 🚧 | Backend pendente |

---

## 🐛 Troubleshooting

### App não aparece para instalação
- Verifique se está usando HTTPS
- Limpe cache do navegador
- Service Worker deve estar ativo

### Ícones não aparecem
- Substitua os placeholders por PNG reais
- Tamanhos: 192x192 e 512x512 pixels
- Formato: PNG com fundo transparente ou sólido

### iOS não instala
- Use apenas Safari
- Verifique se adicionou todas meta tags Apple
- iOS 11.3+ requerido

---

## 📝 Checklist de Produção

Antes de lançar em produção:

- [ ] Substituir ícones placeholder por PNG reais
- [ ] Configurar HTTPS no domínio
- [ ] Testar instalação Android (Chrome)
- [ ] Testar instalação iOS (Safari)
- [ ] Testar instalação Desktop
- [ ] Verificar funcionamento offline
- [ ] Lighthouse score 90+
- [ ] Configurar push notifications

---

## 🎯 Melhorias Futuras

1. **Push Notifications**
   - Alertas de vencimento de parcelas
   - Novos eventos agendados
   - Galerias compartilhadas

2. **Background Sync**
   - Sincronizar dados quando voltar online
   - Upload de fotos em segundo plano

3. **Share API**
   - Compartilhar galerias via WhatsApp
   - Enviar links de eventos

4. **Shortcuts**
   - Atalho rápido "Novo Evento"
   - Atalho "Ver Pagamentos Pendentes"

---

## 📞 Suporte

Para dúvidas ou problemas com a instalação do PWA, consulte:
- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev - PWA](https://web.dev/progressive-web-apps/)

---

**Desenvolvido com ❤️ usando Emergent E1**
