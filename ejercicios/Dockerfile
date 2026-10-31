# Sitio estático de los ejercicios del máster. Se despliega en Railway con Root Directory = /ejercicios.
# Caddy sirve los archivos; no hay Node, base de datos ni datos de bandas.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv
RUN rm -f /srv/Caddyfile /srv/Dockerfile /srv/README.md
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
