FROM nginx:alpine
LABEL org.opencontainers.image.source=https://github.com/jesperaberg1971/reclaim-backend

ARG CACHE_BUST=20260611-1400
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf.template

EXPOSE 80

# Railway injects $PORT at runtime; envsubst splices it into the nginx config.
# Single-quoted '${PORT}' restricts substitution to only that variable,
# leaving nginx's own $uri / $host variables untouched.
CMD ["/bin/sh", "-c", \
     "envsubst '${PORT}' < /etc/nginx/nginx.conf.template \
      > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
