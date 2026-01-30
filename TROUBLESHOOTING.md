# 🔧 FOTIVA - Troubleshooting Guide

## Problema: Layout desconfigurado ao abrir em nova aba

### Sintomas:
- App funciona no preview do Emergent
- Ao abrir em "Open in new tab", CSS/layout quebra
- Fonts não carregam
- Estilos aparecem incorretos

### Causas Possíveis:

#### 1. **Service Worker interferindo (MAIS PROVÁVEL)**
O Service Worker pode estar fazendo cache incorreto em desenvolvimento.

**Solução:**
```javascript
// Já implementado em /app/frontend/src/index.js
// SW só registra em produção agora
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register();
}
```

**Testar:**
1. Abra DevTools (F12)
2. Application → Service Workers
3. Clique em "Unregister" se houver algum ativo
4. Recarregue a página (Ctrl+Shift+R / Cmd+Shift+R)

#### 2. **Cache do navegador**

**Solução:**
```bash
# Limpar cache forçado
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Ou via DevTools
F12 → Network → "Disable cache" ✓
```

#### 3. **CORS ou CSP headers**

**Verificar:**
```bash
curl -I https://tailwind-fix-3.preview.emergentagent.com
```

Procure por:
- `access-control-allow-origin: *` ✓
- `content-security-policy` (se presente)

#### 4. **Fontes Google bloqueadas**

**Sintomas:** Texto aparece em fonte default (Times New Roman)

**Solução:**
```html
<!-- Já está em /app/frontend/public/index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
```

**Verificar:**
1. F12 → Network
2. Filtrar por "font"
3. Verificar se fonts.googleapis.com está carregando

#### 5. **Tailwind CSS não compilando**

**Verificar:**
```bash
# Frontend deve estar rodando
sudo supervisorctl status frontend

# Logs do frontend
tail -f /var/log/supervisor/frontend.out.log
```

Procure por:
```
webpack compiled successfully
```

#### 6. **Public URL incorreto**

**Verificar em /app/frontend/.env:**
```env
REACT_APP_BACKEND_URL=https://tailwind-fix-3.preview.emergentagent.com
```

**NÃO deve ter:**
```env
PUBLIC_URL=/algum-path  # ❌ Pode quebrar assets
```

---

## 🛠️ Soluções Rápidas

### Fix 1: Limpar tudo e reiniciar
```bash
# Limpar cache do React
rm -rf /app/frontend/node_modules/.cache

# Reiniciar frontend
sudo supervisorctl restart frontend

# Aguardar compilação
sleep 10 && tail -f /var/log/supervisor/frontend.out.log
```

### Fix 2: Desregistrar Service Worker manualmente

No navegador:
1. Abra: `chrome://serviceworker-internals` (Chrome)
2. Ou: F12 → Application → Service Workers
3. Clique "Unregister" em todos relacionados ao FOTIVA
4. Recarregue com Ctrl+Shift+R

### Fix 3: Modo Incognito
Teste em aba anônima para descartar problemas de cache/extensões

### Fix 4: Verificar console do navegador
```javascript
F12 → Console

// Erros comuns:
// ❌ "Failed to load resource" → Verifica paths
// ❌ "CORS error" → Verifica headers
// ❌ "Service Worker registration failed" → Normal em dev agora
```

---

## 📋 Checklist de Verificação

Quando layout estiver quebrado, verifique:

- [ ] Service Worker está desregistrado? (Application → SW)
- [ ] Cache limpo? (Ctrl+Shift+R)
- [ ] Frontend está rodando? (`supervisorctl status`)
- [ ] Webpack compilou? (`tail frontend.out.log`)
- [ ] Fontes carregando? (Network → fonts)
- [ ] CSS carregando? (Network → css)
- [ ] Console sem erros? (F12 → Console)
- [ ] Tentou modo incognito?

---

## 🔍 Debugging Avançado

### Ver requests em tempo real:
```bash
# Monitorar access logs
tail -f /var/log/nginx/access.log | grep fotiva
```

### Verificar build do React:
```bash
cd /app/frontend

# Verificar se todos arquivos estão lá
ls -la build/static/css/
ls -la build/static/js/

# Tamanho dos arquivos
du -sh build/
```

### Testar API isoladamente:
```bash
API_URL="https://tailwind-fix-3.preview.emergentagent.com"
curl -s "$API_URL/api/" | jq
```

---

## 🎯 Solução Definitiva (se nada funcionar)

### Rebuild completo:
```bash
cd /app/frontend

# 1. Limpar tudo
rm -rf node_modules/.cache
rm -rf build

# 2. Reinstalar dependências
yarn install

# 3. Reiniciar
sudo supervisorctl restart frontend

# 4. Verificar logs
tail -f /var/log/supervisor/frontend.out.log

# 5. Aguardar: "webpack compiled successfully"
```

---

## 📱 PWA Específico

Se o problema for **apenas no PWA instalado**:

### Limpar cache PWA:
1. Settings → Apps → FOTIVA → Storage
2. Clear Cache & Clear Data
3. Desinstalar e reinstalar

### Force update:
```javascript
// No navegador, console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

---

## ✅ Validação

Após aplicar fix, validar:

1. ✅ Landing page carrega corretamente
2. ✅ Login funciona
3. ✅ Dashboard exibe métricas
4. ✅ Sidebar aparece (desktop) ou menu hamburguer (mobile)
5. ✅ Fontes Work Sans e Inter carregam
6. ✅ Cores verde (#4A9B6E) e azul (#2C3E50) visíveis
7. ✅ Icons Lucide aparecem
8. ✅ Toasts (notificações) funcionam

---

## 🆘 Ainda não funciona?

**Compartilhe:**
1. Screenshot do problema
2. Console errors (F12 → Console)
3. Network tab (F12 → Network → filtrar failures)
4. Browser e versão
5. Modo (desktop/mobile, preview/new tab)

**Comandos úteis para coletar info:**
```bash
# Status dos serviços
sudo supervisorctl status

# Últimos logs
tail -n 100 /var/log/supervisor/frontend.out.log
tail -n 100 /var/log/supervisor/frontend.err.log

# Porta do frontend
netstat -tuln | grep 3000
```

---

Desenvolvido com ❤️ para ajudar na resolução de problemas do FOTIVA
