# Launch Runbook

Runbook operativo para dejar `mimsiui` usable como app Expo autenticada contra Auth0 y publicada mediante Tailscale Funnel desde el MSI.

## 1. Estado actual

Ya está implementado en este repo:

- backend `FastAPI` con validación OIDC/JWT por `issuer`, `audience` y JWKS
- scopes separados `mimsiui.read` y `mimsiui.write`
- app Expo con `expo-auth-session`, deep link `mimsiui://auth/callback` y sesión persistida
- pantallas de overview, tasks, services, account, chat y context
- soporte de build Android interna con EAS

## 2. Lo que ya deberías tener creado

- cuenta Expo
- tenant Auth0
- API `mimsiui-api`
- Native App `mimsiui-mobile`
- scopes `mimsiui.read` y `mimsiui.write`
- callback URL `mimsiui://auth/callback`
- logout URL `mimsiui://auth/callback`

## 3. Lo que falta para dejarlo operativo

1. Rellenar `backend/.env`
2. Rellenar `mobile/.env`
3. Arrancar el backend localmente en el MSI o en la máquina donde vive `mimsibot`
4. Conectar ese host a Tailscale
5. Publicar el backend con `tailscale funnel`
6. Elegir modo de acceso inicial:
   - `tailnet-only` con Tailscale en el móvil y URL `http://*.ts.net:8000`
   - `funnel` público con URL `https://*.ts.net`
7. Actualizar `EXPO_PUBLIC_API_BASE_URL` y `TRUSTED_HOSTS_RAW` con el hostname real `*.ts.net`
8. Hacer una build Android interna para probar login real fuera de Expo Go
9. Verificar login, lectura y operaciones `write`

## 4. Variables y de dónde salen

### Auth0

- `AUTH_ISSUER` y `EXPO_PUBLIC_OIDC_ISSUER`
  sale del dominio de tu tenant Auth0
  ejemplo: `https://dev-example.eu.auth0.com/`

- `AUTH_AUDIENCE` y `EXPO_PUBLIC_OIDC_AUDIENCE`
  sale del `Identifier` del API
  ejemplo: `https://mimsiui-api`

- `AUTH_CLIENT_ID` y `EXPO_PUBLIC_OIDC_CLIENT_ID`
  sale del `Client ID` de la Native App

- `AUTH_REQUIRED_SCOPE` y `EXPO_PUBLIC_OIDC_SCOPE`
  valor fijo: `mimsiui.read`

- `AUTH_ADMIN_SCOPE` y `EXPO_PUBLIC_OIDC_WRITE_SCOPE`
  valor fijo: `mimsiui.write`

### Backend público

- `EXPO_PUBLIC_API_BASE_URL`
  sale de la URL pública del backend
  si usas Funnel será algo como `https://hostname.tailnet-name.ts.net`

- `TRUSTED_HOSTS_RAW`
  debe contener ese mismo hostname público, sin `https://`

## 5. Plantilla de `backend/.env`

Archivo: `backend/.env`

```env
MIMSIBOT_DB_PATH=/opt/mimsibot/data/tasks.db
MIMSIBOT_ROOT=/opt/mimsibot
AUTH_ENABLED=true
AUTH_ISSUER=https://TU_TENANT.auth0.com/
AUTH_AUDIENCE=https://mimsiui-api
AUTH_CLIENT_ID=TU_CLIENT_ID_NATIVE
AUTH_REQUIRED_SCOPE=mimsiui.read
AUTH_ADMIN_SCOPE=mimsiui.write
AUTH_ADMIN_SUBJECTS_RAW=
AUTH_ADMIN_EMAILS_RAW=mimsibot@tu-dominio
AUTH_REQUIRE_EMAIL_VERIFIED=true
TRUSTED_HOSTS_RAW=
FORCE_HTTPS=false
CORS_ORIGINS_RAW=
```

Notas:

- deja `TRUSTED_HOSTS_RAW` vacío hasta tener el hostname real del Funnel
- deja `FORCE_HTTPS=false` al principio mientras validas el proxy/túnel
- si luego publicas con hostname fijo y todo responde bien, puedes endurecer `FORCE_HTTPS`

## 6. Plantilla de `mobile/.env`

Archivo: `mobile/.env`

```env
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_OIDC_ISSUER=https://TU_TENANT.auth0.com/
EXPO_PUBLIC_OIDC_CLIENT_ID=TU_CLIENT_ID_NATIVE
EXPO_PUBLIC_OIDC_AUDIENCE=https://mimsiui-api
EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read
EXPO_PUBLIC_OIDC_WRITE_SCOPE=mimsiui.write
```

Nota:

- `EXPO_PUBLIC_API_BASE_URL` se rellena solo después de tener la URL pública del Funnel

## 6.1 Configuración exacta en Auth0 free

### Database connection

En Auth0:

1. ve a `Authentication -> Database`
2. crea o reutiliza una connection tipo username/password
3. abre esa connection
4. en `Applications` habilita `mimsiui-mobile`

Sin eso, el usuario puede existir en Auth0 pero la app no podrá usar esa connection.

### Política de contraseña

Dentro de la misma connection:

1. localiza `Password Policy`
2. selecciona al menos `Good`
3. si tu plan/tenant lo permite, usa `Excellent`

### Verificación de email

Revisa dos sitios:

1. `Authentication -> Database -> <connection>`
2. `Branding -> Email Templates -> Verify Email`

Necesitas que Auth0 pueda enviar el correo de verificación y que el usuario termine con `email_verified=true`.

### Usuario de prueba

1. ve a `User Management -> Users`
2. pulsa `Create User`
3. elige la database connection correcta
4. usa un email real
5. define contraseña fuerte
6. guarda
7. abre el usuario y usa `Send Verification Email` si hace falta
8. no pruebes operaciones `write` hasta que ese usuario tenga `email_verified=true`

### Usuario admin recomendado

Para preparar el futuro servicio admin del bot:

1. crea un usuario Auth0 dedicado, por ejemplo `mimsibot@tu-dominio`
2. verifica su email
3. úsalo como admin principal
4. copia su email a `AUTH_ADMIN_EMAILS_RAW`
5. opcionalmente copia también su `sub` a `AUTH_ADMIN_SUBJECTS_RAW`

Si configuras cualquiera de esas listas, el backend exigirá coincidencia explícita para operaciones `write`.

## 7. Arrancar backend local

En la máquina que vaya a exponer el backend:

```bash
cd /home/eager-eagle/code/mimsiui/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Comprobación local:

```bash
curl http://127.0.0.1:8000/health
```

Respuesta esperada:

```json
{"ok":true,"service":"mimsiui-api"}
```

## 8. Levantar acceso Tailscale en el MSI

Esto debe hacerse en el MSI, no en la app Expo.

### 8.1 Instalar Tailscale

```bash
sudo apt-get update
sudo apt-get install -y tailscale
sudo systemctl enable --now tailscaled
```

### 8.2 Conectar el MSI al tailnet

Si ya tienes `TAILSCALE_AUTH_KEY` en `/home/eager-eagle/code/mimsibot/.env`:

```bash
set -a
source /home/eager-eagle/code/mimsibot/.env
set +a

sudo tailscale up --authkey="$TAILSCALE_AUTH_KEY" --hostname="${SERVER_HOSTNAME:-mimsibot}" --ssh
```

Comprobaciones:

```bash
tailscale status
tailscale ip -4
```

### 8.3 Modo inmediato: acceso tailnet-only

Si el móvil tendrá Tailscale instalado y conectado a la misma tailnet, no hace falta esperar a Funnel. Basta con exponer el backend en el nodo y usar el hostname `*.ts.net` con puerto `8000`.

URL esperada para la app:

```env
EXPO_PUBLIC_API_BASE_URL=http://mimsibot.tail8ded01.ts.net:8000
```

Requisito:

- Android preview con `usesCleartextTraffic=true`
- Tailscale conectado en el móvil

### 8.4 Publicar el backend con Funnel

```bash
tailscale funnel 8000
tailscale funnel status
```

La primera vez Tailscale puede pedir aprobación web para habilitar Funnel en el tailnet.

### 8.5 Probar el hostname público

Cuando `tailscale funnel status` te muestre un hostname `*.ts.net`:

```bash
curl https://TU_HOST.ts.net/health
```

Si responde bien, usa ese mismo hostname en los `env`.

## 9. Actualizar los `env`

### 9.1 Modo tailnet-only

`backend/.env`

```env
MIMSIBOT_DB_PATH=/opt/mimsibot/data/tasks.db
MIMSIBOT_ROOT=/opt/mimsibot
AUTH_ENABLED=true
AUTH_ISSUER=https://TU_TENANT.auth0.com/
AUTH_AUDIENCE=https://mimsiui-api
AUTH_CLIENT_ID=TU_CLIENT_ID_NATIVE
AUTH_REQUIRED_SCOPE=mimsiui.read
AUTH_ADMIN_SCOPE=mimsiui.write
AUTH_ADMIN_SUBJECTS_RAW=
AUTH_ADMIN_EMAILS_RAW=mimsibot@tu-dominio
AUTH_REQUIRE_EMAIL_VERIFIED=true
TRUSTED_HOSTS_RAW=mimsibot.tail8ded01.ts.net
FORCE_HTTPS=false
CORS_ORIGINS_RAW=
```

`mobile/.env`

```env
EXPO_PUBLIC_API_BASE_URL=http://mimsibot.tail8ded01.ts.net:8000
EXPO_PUBLIC_OIDC_ISSUER=https://TU_TENANT.auth0.com/
EXPO_PUBLIC_OIDC_CLIENT_ID=TU_CLIENT_ID_NATIVE
EXPO_PUBLIC_OIDC_AUDIENCE=https://mimsiui-api
EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read
EXPO_PUBLIC_OIDC_WRITE_SCOPE=mimsiui.write
```

### 9.2 Modo Funnel público

Ejemplo con hostname real:

`backend/.env`

```env
MIMSIBOT_DB_PATH=/opt/mimsibot/data/tasks.db
MIMSIBOT_ROOT=/opt/mimsibot
AUTH_ENABLED=true
AUTH_ISSUER=https://TU_TENANT.auth0.com/
AUTH_AUDIENCE=https://mimsiui-api
AUTH_CLIENT_ID=TU_CLIENT_ID_NATIVE
AUTH_REQUIRED_SCOPE=mimsiui.read
AUTH_ADMIN_SCOPE=mimsiui.write
AUTH_ADMIN_SUBJECTS_RAW=
AUTH_ADMIN_EMAILS_RAW=mimsibot@tu-dominio
AUTH_REQUIRE_EMAIL_VERIFIED=true
TRUSTED_HOSTS_RAW=mimsibot-example.tailxyz.ts.net
FORCE_HTTPS=false
CORS_ORIGINS_RAW=
```

`mobile/.env`

```env
EXPO_PUBLIC_API_BASE_URL=https://mimsibot-example.tailxyz.ts.net
EXPO_PUBLIC_OIDC_ISSUER=https://TU_TENANT.auth0.com/
EXPO_PUBLIC_OIDC_CLIENT_ID=TU_CLIENT_ID_NATIVE
EXPO_PUBLIC_OIDC_AUDIENCE=https://mimsiui-api
EXPO_PUBLIC_OIDC_SCOPE=mimsiui.read
EXPO_PUBLIC_OIDC_WRITE_SCOPE=mimsiui.write
```

Después reinicia backend y vuelve a lanzar la app o la build.

## 9.1 Despliegue rápido por SSH al MSI

Si el MSI ya está accesible en `192.168.1.68`, puedes dejar backend + service + Funnel con:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/deploy-ssh-funnel.sh
```

Este script:

- sincroniza el repo a `/opt/mimsiui`
- recrea `backend/.venv`
- ejecuta `pytest`
- instala/recarga `mimsiui-api.service`
- arranca el backend
- intenta habilitar `tailscale funnel 8000`
- si `Funnel` o `Serve` no están habilitados en la tailnet, deja igualmente el backend listo y te muestra la URL tailnet-only para usar desde móvil con Tailscale

## 10. Expo y build real

Para login OIDC real no dependas de Expo Go. Usa una build interna:

```bash
cd /home/eager-eagle/code/mimsiui/mobile
npm install
npm test
npm run android:preview
```

El script `android:preview` ya existe y usa EAS build interna.

Para la primera prueba en móvil:

1. instala Tailscale en el teléfono
2. inicia sesión en la misma tailnet del MSI
3. genera la build preview con `EXPO_PUBLIC_API_BASE_URL=http://mimsibot.tail8ded01.ts.net:8000`
4. instala la APK interna
5. verifica `/health`, login y pantallas principales

Preparar el MSI como host de builds con `pnpm`:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/setup-mobile-build-host.sh
```

Lanzar la APK preview por SSH:

```bash
cd /home/eager-eagle/code/mimsiui
EXPO_TOKEN=tu_token_de_expo bash scripts/build-mobile-preview-ssh.sh
```

Consultar el estado de la build:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/check-mobile-build-ssh.sh
```

Si quieres una build concreta:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/check-mobile-build-ssh.sh 6d9b9bf7-09c3-4208-bbd2-052080efab02
```

Instalación en el móvil cuando la build quede `FINISHED`:

1. abre el enlace de la build en Expo
2. descarga la APK interna
3. en Android, permite instalar apps desde esa fuente si lo pide
4. instala la APK
5. abre `mimsiui`
6. comprueba login con Auth0
7. verifica que la app carga datos desde `https://mimsibot.tail8ded01.ts.net/`

## 11. Checklist de seguridad mínima antes de exponerlo

- Auth0 con database connection y política de contraseña fuerte
- verificación de email activada en Auth0
- database connection autorizada para `mimsiui-mobile`
- usuario admin dedicado `mimsibot` fijado por email o `sub`
- API Auth0 en `RS256`
- callback exacta `mimsiui://auth/callback`
- `AUTH_REQUIRE_EMAIL_VERIFIED=true`
- `AUTH_ENABLED=true`
- `mimsibot` no expuesto directamente a Internet
- solo FastAPI publicado por Funnel
- `TRUSTED_HOSTS_RAW` fijado al hostname real del Funnel
- no usar `AUTH_ENABLED=false` fuera de desarrollo
- revisar logs del backend al menos durante las primeras pruebas

## 12. Validación extremo a extremo

### Backend

```bash
curl https://TU_HOST.ts.net/health
curl https://TU_HOST.ts.net/api/v1/auth/config
```

### App

1. abrir la app Android instalada
2. pulsar login
3. completar login de Auth0
4. volver a la app por `mimsiui://auth/callback`
5. comprobar que `overview`, `tasks` y `services` cargan
6. comprobar que `/api/v1/auth/me` responde con claims válidos
7. comprobar que las operaciones `write` solo funcionan si `email_verified=true`

### Errores típicos

- `OIDC is not configured yet in this build`
  faltan variables en `mobile/.env` o la build no se regeneró

- `Bearer token required`
  la app no guardó sesión o no está enviando el token

- `Missing required scopes`
  Auth0 no está emitiendo `mimsiui.read` o `mimsiui.write`

- `Token validation failed`
  `issuer`, `audience` o `client_id` están mal copiados

- error de callback
  la URL en Auth0 no coincide con `mimsiui://auth/callback`

## 13. Trabajo pendiente después del primer acceso

1. añadir rate limiting delante del backend o en el proxy
2. fijar un proceso persistente para `uvicorn` o `systemd`
3. revisar si `FORCE_HTTPS=true` funciona bien detrás del túnel
4. definir si quieres mantener `Tailscale Funnel` como acceso principal o migrar a dominio propio
5. ampliar auditoría y logs de acceso para operaciones `write`

## 14. Referencias internas

- `docs/AUTH0_SETUP.md`
- `docs/OAUTH2.md`
- `docs/DEPLOYMENT.md`
- `mobile/lib/auth.tsx`
- `backend/app/security/oidc.py`
- `backend/app/main.py`
