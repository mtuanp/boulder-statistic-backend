# boulder-statistic-backend

This is the back-end for some statistic about the visitor count of my local boulder gyms.

# features

- track the visitor count of following boulder gyms:
  - http://kosmos-bouldern.de
- telegram notification on certain threshold.

# How to build and run

## start the backend

deno run --allow-net --allow-env --allow-read --allow-write --unstable src/app.ts

## run test

deno test --allow-net --allow-env --allow-read --allow-write --unstable src/\*\*/\*.spec.ts
