# 🔐 Integración con API Backend

## ✅ Configuración completada

### 📡 Servicios creados:

1. **`AuthService`** - Maneja autenticación y registro
   - `register()` - Crear nuevo usuario
   - `login()` - Iniciar sesión
   - `logout()` - Cerrar sesión
   - `getCurrentUser()` - Obtener usuario actual
   - `isAuthenticated()` - Verificar si está autenticado

2. **`authInterceptor`** - Agrega automáticamente el token a las peticiones HTTP

### 🔧 Configuración de API

En `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost/api'  // ← Tu API local
};
```

En `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-dominio.com/api'  // ← Cambia por tu URL de producción
};
```

### 📝 Formato de registro

El componente envía a `POST /api/users`:
```json
{
  "email": "usuario@example.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "password": "contraseña123",
  "roleId": 2
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "roleId": 2,
    "createdAt": "2025-12-02T00:00:00.000Z"
  },
  "msg": "Usuario creado exitosamente"
}
```

### 🔑 Formato de login

El componente envía a `POST /api/auth/login`:
```json
{
  "email": "usuario@example.com",
  "password": "contraseña123"
}
```

**Respuesta esperada:**
```json
{
  "data": {
    "id": 1,
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "roleId": 2,
    "createdAt": "2025-12-02T00:00:00.000Z"
  },
  "msg": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 🔐 Token de autenticación

El interceptor agrega automáticamente el header a todas las peticiones:
```
Authorization: Bearer <token>
```

### 📱 Flujo completo:

1. **Registro:**
   - Usuario llena formulario en `/register`
   - Click en "Crear Cuenta"
   - POST a `/api/users`
   - Usuario guardado en `localStorage`
   - Prompt para habilitar biometría (opcional)
   - Redirige a `/tabs`

2. **Login:**
   - Usuario ingresa credenciales en `/login`
   - Click en "Acceder"
   - POST a `/api/auth/login`
   - Token guardado en `localStorage`
   - Usuario guardado en `localStorage`
   - Prompt para habilitar biometría si no está configurada
   - Redirige a `/tabs`

3. **Login biométrico:**
   - Usuario hace click en "Usar Face ID / Huella"
   - Autentica con biometría
   - Obtiene credenciales guardadas localmente
   - Redirige a `/tabs`

### ⚙️ Configuración del roleId

Por defecto, el registro usa `roleId: 2`. Puedes cambiarlo en:

`src/app/register/register.component.ts` línea ~44:
```typescript
roleId: number = 2; // Cambia esto según tu sistema de roles
```

O agregar un selector en el formulario para que el usuario elija su rol.

### 🔄 Ajustar endpoint de login

Si tu endpoint de login es diferente a `/api/auth/login`, actualízalo en:

`src/app/services/auth.service.ts` línea ~58:
```typescript
login(data: LoginData): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data)
  // Cambia '/auth/login' por tu endpoint
}
```

### 🌐 CORS

Si tienes problemas de CORS en desarrollo, asegúrate de configurar tu backend para aceptar peticiones desde:
- `http://localhost:4200` (desarrollo)
- Tu dominio de producción

### 🐛 Manejo de errores

Los componentes muestran automáticamente mensajes de error:
- Errores de validación → Toast warning
- Errores de red/servidor → Toast danger
- Éxito → Toast success con mensaje personalizado

### 🧪 Probar

```bash
# Desarrollo
ng serve

# Producción (PWA)
npm run build
npx http-server www -p 8080 -c-1
```

Abre en: `http://localhost:4200/register` o `http://localhost:4200/login`
