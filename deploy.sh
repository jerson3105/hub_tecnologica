#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
SERVICE_NAME="${SERVICE_NAME:-hub-tecnologica}"
HEALTHCHECK_URL="${HEALTHCHECK_URL:-http://127.0.0.1:5000/api/health}"
SKIP_CLIENT_BUILD="${SKIP_CLIENT_BUILD:-0}"
SKIP_SERVER_RESTART="${SKIP_SERVER_RESTART:-0}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Falta el comando requerido: $1" >&2
    exit 1
  fi
}

run_systemctl() {
  if [[ "$(id -u)" -eq 0 ]]; then
    systemctl "$@"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    sudo systemctl "$@"
    return
  fi

  echo "Se requiere root o sudo para ejecutar systemctl." >&2
  exit 1
}

needs_match() {
  local pattern="$1"
  local haystack="$2"
  if [[ -z "$haystack" ]]; then
    return 1
  fi

  grep -Eq "$pattern" <<<"$haystack"
}

wait_for_healthcheck() {
  local attempt
  for attempt in $(seq 1 15); do
    if curl -fsS "$HEALTHCHECK_URL"; then
      printf '\n'
      return 0
    fi

    sleep 2
  done

  return 1
}

require_command git
require_command node
require_command npm
require_command curl

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "No se encontro .git en $APP_DIR. Ejecuta el script desde la raiz del repo." >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/server/.env" ]]; then
  echo "Falta server/.env. El backend no puede desplegarse sin variables de entorno." >&2
  exit 1
fi

tracked_changes="$(git -C "$APP_DIR" status --porcelain --untracked-files=no)"
if [[ -n "$tracked_changes" ]]; then
  echo "Hay cambios locales rastreados en el repo. Haz commit o descarta esos cambios antes de desplegar." >&2
  echo "$tracked_changes" >&2
  exit 1
fi

log "Actualizando codigo desde $REMOTE/$BRANCH"
previous_head="$(git -C "$APP_DIR" rev-parse HEAD)"
git -C "$APP_DIR" fetch "$REMOTE" "$BRANCH"

if [[ "$previous_head" != "$(git -C "$APP_DIR" rev-parse FETCH_HEAD)" ]]; then
  git -C "$APP_DIR" pull --ff-only "$REMOTE" "$BRANCH"
else
  log "El repositorio ya estaba actualizado"
fi

current_head="$(git -C "$APP_DIR" rev-parse HEAD)"
changed_files="$(git -C "$APP_DIR" diff --name-only "$previous_head" "$current_head" || true)"

server_manifest_changed=0
client_manifest_changed=0
server_changed=0
client_changed=0
service_needs_restart=0

if needs_match '^server/(package\.json|package-lock\.json)$' "$changed_files"; then
  server_manifest_changed=1
fi

if needs_match '^client/(package\.json|package-lock\.json)$' "$changed_files"; then
  client_manifest_changed=1
fi

if needs_match '^server/' "$changed_files"; then
  server_changed=1
fi

if needs_match '^client/' "$changed_files"; then
  client_changed=1
fi

if [[ ! -d "$APP_DIR/server/node_modules" ]]; then
  server_manifest_changed=1
fi

if [[ ! -d "$APP_DIR/client/node_modules" ]]; then
  client_manifest_changed=1
fi

mkdir -p "$APP_DIR/server/logs" "$APP_DIR/server/uploads"

if [[ "$server_manifest_changed" -eq 1 ]]; then
  log "Instalando dependencias del backend"
  (
    cd "$APP_DIR/server"
    npm ci --omit=dev
  )
fi

if [[ "$client_manifest_changed" -eq 1 ]]; then
  log "Instalando dependencias del frontend"
  (
    cd "$APP_DIR/client"
    npm ci
  )
fi

if [[ "$SKIP_CLIENT_BUILD" != "1" ]] && [[ "$client_changed" -eq 1 || "$client_manifest_changed" -eq 1 || ! -d "$APP_DIR/client/dist" ]]; then
  log "Compilando frontend"
  (
    cd "$APP_DIR/client"
    npm run build
  )
fi

if [[ "$server_changed" -eq 1 || "$server_manifest_changed" -eq 1 ]]; then
  service_needs_restart=1
fi

if ! run_systemctl is-active --quiet "$SERVICE_NAME"; then
  service_needs_restart=1
fi

if [[ "$SKIP_SERVER_RESTART" != "1" ]] && [[ "$service_needs_restart" -eq 1 ]]; then
  log "Reiniciando servicio $SERVICE_NAME"
  run_systemctl restart "$SERVICE_NAME"
fi

log "Verificando estado del servicio"
run_systemctl is-active --quiet "$SERVICE_NAME"

log "Probando healthcheck en $HEALTHCHECK_URL"
if ! wait_for_healthcheck; then
  echo "El healthcheck fallo despues del despliegue." >&2
  run_systemctl status --no-pager "$SERVICE_NAME" || true
  exit 1
fi

log "Deploy completado en $(git -C "$APP_DIR" rev-parse --short HEAD)"