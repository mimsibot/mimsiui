# Deployment

## Objetivo

Desplegar `mimsiui` de forma incremental y segura, de modo que el propio bot pueda aplicar cambios sin romper el acceso.

## Backend

El backend está preparado para despliegue por `git pull + smoke + restart + rollback`.

Archivos clave:

- `scripts/deploy-backend.sh`
- `scripts/smoke-backend.sh`
- `deploy/systemd/mimsiui-api.service`

Flujo:

1. guardar `HEAD` actual
2. `git pull --ff-only`
3. reconstruir `venv`
4. ejecutar `pytest`
5. ejecutar smoke local del backend
6. reiniciar `mimsiui-api.service`
7. si falla algo, rollback al `HEAD` anterior

## Mobile incremental

La app Expo está preparada para despliegue incremental vía OTA de JavaScript y assets usando EAS Update.

Archivos clave:

- `mobile/eas.json`
- `scripts/publish-mobile-update.sh`

Regla operativa:

- cambios JS / assets: `eas update`
- cambios nativos o nuevas dependencias nativas: nueva build Android

Primera build Android interna:

```bash
cd mobile
pnpm run android:preview
```

Esa build es la correcta para probar login OIDC real, deep links y secure storage fuera de Expo Go.

Preparación del host remoto de builds:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/setup-mobile-build-host.sh
```

Lanzar la build preview por SSH:

```bash
cd /home/eager-eagle/code/mimsiui
EXPO_TOKEN=tu_token bash scripts/build-mobile-preview-ssh.sh
```

Consultar el estado de la última build por SSH:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/check-mobile-build-ssh.sh
```

O consultar una build concreta:

```bash
cd /home/eager-eagle/code/mimsiui
bash scripts/check-mobile-build-ssh.sh 6d9b9bf7-09c3-4208-bbd2-052080efab02
```

Esto encaja bien con un bot que hace cambios frecuentes en UI sin obligar a reinstalar APK cada vez.

## Topología recomendada

- `mimsibot` y `mimsiui-api` en la misma red privada o mismo host
- reverse proxy HTTPS delante de FastAPI
- OIDC externo para identidad
- app Android hablando solo con `mimsiui-api`

## Flujo final

`React Native -> FastAPI -> mimsibot`

Slack queda como canal secundario. SSH queda para mantenimiento profundo, no para operación diaria.

## Superficie segura

- FastAPI expone solo API autenticada
- `mimsibot` no se expone directamente
- tareas y chat cruzan por tablas bridge persistentes
- el bot consume esas colas desde su propio proceso
