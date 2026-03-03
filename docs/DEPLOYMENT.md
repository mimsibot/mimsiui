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
npm run android:preview
```

Esa build es la correcta para probar login OIDC real, deep links y secure storage fuera de Expo Go.

Esto encaja bien con un bot que hace cambios frecuentes en UI sin obligar a reinstalar APK cada vez.

## Topología recomendada

- `mimsibot` y `mimsiui-api` en la misma red privada o mismo host
- reverse proxy HTTPS delante de FastAPI
- OIDC externo para identidad
- app Android hablando solo con `mimsiui-api`

## Flujo final

`React Native -> FastAPI -> mimsibot`

Slack queda como canal secundario. SSH queda para mantenimiento profundo, no para operación diaria.
