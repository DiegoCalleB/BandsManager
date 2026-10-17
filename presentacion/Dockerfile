# Sitio estático de la presentación del TFM. Se despliega en Railway con Root Directory = /presentacion.
# Caddy sirve los archivos; un servidor de Node mínimo (aviso/, solo en 127.0.0.1) atiende POST /aviso, que está APAGADO salvo que se active
# con AVISO_ACTIVO (ver aviso/servidor.mjs). Si Node fallara, Caddy sigue sirviendo la presentación.
FROM caddy:2-alpine
RUN apk add --no-cache nodejs
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN mkdir /app && mv /srv/aviso/servidor.mjs /app/servidor.mjs && rm -rf /srv/aviso /srv/Caddyfile /srv/Dockerfile
CMD ["sh", "-c", "node /app/servidor.mjs & exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
