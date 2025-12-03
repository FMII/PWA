# 🔐 Autenticación Biométrica - Guía de Uso

## ¿Qué implementamos?

Autenticación biométrica usando **WebAuthn API** que permite:
- 📱 **Face ID** (iPhone/iPad)
- 👆 **Touch ID** (iPhone/iPad/Mac)
- 🖐️ **Huella digital** (Android)
- 💻 **Windows Hello** (PC con Windows)

## ¿Cómo funciona?

### 1️⃣ Primera vez (Registro)
1. Usuario inicia sesión con email y contraseña normalmente
2. Si la biometría está disponible, aparece un prompt preguntando si quiere habilitarla
3. Al aceptar, el sistema le pide usar su biometría (cara/huella)
4. La credencial se guarda localmente en el dispositivo

### 2️⃣ Siguientes veces (Login rápido)
1. En la pantalla de login aparece el botón "Usar Face ID / Huella"
2. Usuario hace clic
3. Se activa el sensor biométrico
4. ¡Login instantáneo sin contraseña!

## 🔧 Características

### ✅ Lo que hace:
- Detecta automáticamente si el dispositivo soporta biometría
- Guarda credenciales de forma segura en el dispositivo
- Permite desactivar la biometría en cualquier momento
- Funciona **100% del lado del cliente** (frontend)
- Compatible con múltiples dispositivos del mismo usuario

### 🔒 Seguridad:
- **No guarda contraseñas**: Solo guarda una credencial criptográfica
- **Privacidad total**: La información biométrica NUNCA sale del dispositivo
- **Autenticación de plataforma**: Usa el hardware de seguridad del dispositivo
- **Sin backend requerido**: Funciona completamente offline

## 📱 Compatibilidad

### ✅ Funciona en:
- **iOS/iPadOS**: Safari 14+, Chrome, Edge
- **Android**: Chrome 70+, Edge, Samsung Internet
- **macOS**: Safari 14+, Chrome, Edge, Firefox
- **Windows**: Edge, Chrome (con Windows Hello)

### ❌ NO funciona en:
- Navegadores antiguos
- Dispositivos sin sensor biométrico
- HTTP sin SSL (requiere HTTPS o localhost)

## 🎯 Flujo de Usuario

```
[Login Screen]
    ↓
[Usuario ya tiene biometría] → [Botón "Usar Face ID/Huella"] → ✅ Login instantáneo
    ↓
[Primera vez]
    ↓
[Login con email/contraseña]
    ↓
[¿Habilitar biometría?]
    ↓
[Sí] → [Escanea cara/huella] → ✅ Biometría activada
    ↓
[No] → Continúa normal
```

## 🧪 Cómo probar

### En localhost:
```bash
ng serve
```
Abre en Chrome: `http://localhost:4200/login`

### En producción (PWA):
```bash
npm run build
npx http-server www -p 8080 -c-1
```
Abre en Chrome: `http://localhost:8080`

### En móvil:
1. Usa el túnel: `https://dtxp3q4n-4200.usw3.devtunnels.ms/`
2. Abre en Chrome o Safari
3. Inicia sesión normalmente
4. Acepta habilitar la biometría
5. Cierra sesión y prueba el login rápido

## 💡 Notas importantes

1. **HTTPS requerido**: En producción debe usar HTTPS (localhost funciona sin SSL)
2. **Credenciales por dispositivo**: Cada dispositivo necesita su propio registro
3. **Almacenamiento local**: Las credenciales se guardan en `localStorage`
4. **Fallback**: Siempre mantén el login tradicional como respaldo

## 🔄 Integración con tu backend (opcional)

Si quieres validar con tu backend:

```typescript
// En login.component.ts, método loginWithBiometric()
const result = await this.biometricService.authenticateBiometric();

if (result.success) {
  // Enviar al backend para validación adicional
  const response = await this.http.post('/api/validate-biometric', {
    userId: result.userId,
    timestamp: Date.now()
  }).toPromise();
  
  if (response.valid) {
    // Login exitoso
    this.router.navigate(['/tabs']);
  }
}
```

## 📝 Archivos modificados

- ✅ `src/app/services/biometric-auth.service.ts` - Servicio principal
- ✅ `src/app/login/login.component.ts` - Lógica del componente
- ✅ `src/app/login/login.component.html` - UI con botones biométricos
- ✅ `src/app/login/login.component.scss` - Estilos

## 🎨 Personalización

### Cambiar el nombre de la app en el prompt:
```typescript
// En biometric-auth.service.ts línea ~44
rp: {
  name: "Tu App Name Aquí", // Cambia esto
  id: window.location.hostname,
}
```

### Cambiar el icono del botón:
```html
<!-- En login.component.html -->
<ion-icon name="finger-print"></ion-icon>  <!-- Cambia a: scan, hand-left, etc -->
```

## 🐛 Troubleshooting

### "WebAuthn no está disponible"
- Verifica que estés en HTTPS o localhost
- Actualiza el navegador
- Verifica que el dispositivo tenga sensor biométrico

### "No hay credenciales registradas"
- Inicia sesión primero con email/contraseña
- Acepta el prompt para habilitar biometría

### No aparece el prompt biométrico
- Verifica permisos del navegador
- En iOS: Settings > Safari > Auto-Fill
- En Android: Verifica que la huella esté configurada

## 🚀 Próximos pasos (opcional)

- [ ] Agregar timeout de sesión
- [ ] Múltiples métodos de autenticación
- [ ] Sincronización con backend
- [ ] Analytics de uso de biometría
- [ ] Recordar último método de login usado
