# Configuración de Email para Confirmación de Pedidos

## Configuración de Gmail

Para que el sistema de email funcione correctamente, necesitas configurar las credenciales de Gmail:

### 1. Crear una App Password en Gmail

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Ve a "Seguridad" en el menú lateral
3. En "Acceso a Google", selecciona "Contraseñas de aplicaciones"
4. Selecciona "Correo" y "Otro (nombre personalizado)"
5. Escribe "Ecommerce API" como nombre
6. Google generará una contraseña de 16 caracteres afoz ubpv vjnp msnm

### 2. Configurar las variables de entorno

Crea un archivo `.env` en la carpeta `ecommerce-api` con el siguiente contenido:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT
JWT_SECRET=tu-jwt-secret-super-seguro

# Email Configuration
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password-de-16-caracteres

# Server
PORT=3000
NODE_ENV=development
```

### 3. Instalar dotenv (si no está instalado)

```bash
npm install dotenv
```

### 4. Configurar dotenv en server.js

Asegúrate de que tu `server.js` tenga esta línea al inicio:

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

## Funcionalidades del Email

- **Confirmación de Pedidos**: Se envía automáticamente cuando se crea una orden
- **Bienvenida**: Se envía cuando un usuario se registra (opcional)

## Personalización

Puedes modificar las plantillas de email en `src/services/emailService.js` para personalizar:
- El diseño del email
- Los colores y estilos
- El contenido del mensaje
- El remitente

## Solución de Problemas

### Error: "Invalid login"
- Verifica que el EMAIL_USER sea correcto
- Asegúrate de usar la App Password, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté activada

### Error: "Connection timeout"
- Verifica tu conexión a internet
- Asegúrate de que el puerto 587 esté disponible

### Error: "Authentication failed"
- Regenera la App Password
- Verifica que no haya espacios en las variables de entorno
