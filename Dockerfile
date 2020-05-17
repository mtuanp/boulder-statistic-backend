FROM hayd/alpine-deno:latest

ENV TZ=Europe/Berlin
WORKDIR /app
VOLUME ["/data"]

# Prefer not to run as root.
USER deno

# Cache the dependencies as a layer (the following two steps are re-run only when deps.ts is modified).
# Ideally fetch deps.ts will download and compile _all_ external files used in main.ts.
COPY ./src ./src
COPY .env .env
RUN deno cache --unstable src/app.ts

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--unstable", "src/app.ts"]