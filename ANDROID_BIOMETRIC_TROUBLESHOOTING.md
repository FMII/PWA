# 🤖 Solución de Problemas - Biometría en Android

## ⚠️ Problema: No aparece el prompt de biometría en Android

### ✅ Requisitos para que funcione en Android:

1. **HTTPS obligatorio** (excepto localhost)
   - En desarrollo local puede no funcionar si usas IP
   - Debe usar un dominio con SSL/TLS válido
   - O usar un túnel con HTTPS (ngrok, localtunnel, etc.)

2. **Dispositivo configurado correctamente**
   - El dispositivo debe tener configurada huella digital o Face Unlock
   - Ir a: Ajustes > Seguridad > Huella digital / Desbloqueo facial
   - Debe haber al menos una huella/cara registrada

3. **Chrome actualizado**
   - Mínimo Chrome 70+
   - Ir a: chrome://settings/help
   - Actualizar si es necesario

4. **Permisos del sitio**
   - Chrome debe tener permisos para usar biometría
   - Ir a: chrome://settings/content/securityKeys

### 🔧 Verificación paso a paso:

#### 1. Abre la consola del navegador en tu Android

En Chrome Android:
1. Ve a `chrome://inspect`
2. Habilita "Discover USB devices"
3. Conecta tu Android por USB
4. Inspecciona tu app

#### 2. Revisa los logs de la consola

Deberías ver:
```javascript
Biometric available: true
Is Android: true
Protocol: https:
```

Si ves `false` o errores, ahí está el problema.

### 🌐 Solución: Usar HTTPS en desarrollo

#### Opción 1: Usar ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Servir tu app
npm run build
npx http-server www -p 8080

# En otra terminal, crear túnel HTTPS
ngrok http 8080
```

Esto te dará una URL HTTPS como: `https://abc123.ngrok.io`

#### Opción 2: Usar localtunnel

```bash
# Servir tu app
npm run build
npx http-server www -p 8080

# En otra terminal
npx localtunnel --port 8080
```

#### Opción 3: Configurar SSL local (Avanzado)

```bash
# Generar certificado local
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Servir con HTTPS
npx http-server www -p 8080 -S -C cert.pem -K key.pem
```

### 📱 Flujo correcto en Android:

1. Usuario abre la app (HTTPS)
2. Se registra/inicia sesión
3. Aparece el prompt: "¿Habilitar inicio rápido?"
4. Usuario acepta
5. **Aparece el prompt nativo de Android**: "Verificar identidad con huella digital"
6. Usuario pone su huella
7. ✅ Biometría registrada

### 🐛 Debugging

Si sigue sin funcionar, verifica en la consola:

```javascript
// Debería retornar true
await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

// Debería existir
window.PublicKeyCredential !== undefined

// Debería ser https: (en producción)
window.location.protocol
```

### ⚡ Código de prueba rápido

Abre la consola en tu Android y ejecuta:

```javascript
// Test 1: ¿Está disponible?
console.log('WebAuthn:', 'PublicKeyCredential' in window);

// Test 2: ¿Biometría disponible?
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  .then(available => console.log('Biometric available:', available));

// Test 3: ¿Es HTTPS?
console.log('Protocol:', window.location.protocol);

// Test 4: User agent
console.log('User agent:', navigator.userAgent);
```

### 🎯 Configuración de producción

Para producción, asegúrate de:

1. **Dominio con SSL válido** (Let's Encrypt, Cloudflare, etc.)
2. **Configurar CORS** si la API está en otro dominio
3. **Actualizar `environment.prod.ts`** con la URL correcta

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'
};
```

### 📊 Estadísticas de compatibilidad

- ✅ Android 7.0+ con Chrome 70+
- ✅ Android 8.0+ mejor soporte
- ⚠️ Android 6.0 o menor: No soportado
- ⚠️ Navegadores que no sean Chrome: Limitado

### 🔐 Seguridad

La biometría NUNCA sale del dispositivo. WebAuthn solo recibe:
- Una credencial pública (no la huella)
- Una firma criptográfica
- Un ID de la credencial

La huella/cara se queda en el hardware del dispositivo (TEE/Secure Enclave).

### 💡 Tips adicionales

1. **Mensaje claro al usuario**: Si falla, explica que necesita tener configurada la huella
2. **Fallback siempre disponible**: Mantén el login con contraseña
3. **No forzar**: Hazlo opcional
4. **Probar en diferentes dispositivos**: Algunos fabricantes (Samsung, Xiaomi) tienen peculiaridades

### 🆘 Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `NotAllowedError` | Usuario canceló o no hay huella configurada | Pedir que configure huella en Ajustes |
| `NotSupportedError` | HTTP (no HTTPS) o navegador viejo | Usar HTTPS o actualizar Chrome |
| `SecurityError` | Dominio inválido o localhost con problemas | Verificar dominio/SSL |
| No aparece el prompt | Varias causas | Revisar todos los requisitos arriba |

### 📞 Soporte

Si después de todo esto sigue sin funcionar:

1. Revisa los logs de la consola (chrome://inspect)
2. Verifica que el dispositivo tenga huella configurada
3. Prueba en un dispositivo diferente
4. Asegúrate de estar usando HTTPS

---

**TL;DR para Android:**
- ✅ Usa HTTPS (ngrok, localtunnel, o dominio real)
- ✅ Configura huella en el dispositivo
- ✅ Chrome actualizado
- ✅ Abre la consola y revisa los logs
