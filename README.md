# boulder-statistic-backend

This is the back-end for some statistic about visitor count of my local boulder gyms. It have telegram integration for notification purpose.

Telegram Bot: http://t.me/BoulderGymBot

# features

- track the visitor count of following boulder gyms:
  - http://kosmos-bouldern.de
  - https://boulderhalle-leipzig.de
  - https://www.kletterhalle-leipzig.de
- telegram notification on certain threshold.

# bot commands
- /kosmosstatus
  - retrieve the actual visitor status from [kosmos](http://kosmos-bouldern.de)
- /kosmoson
  - activate the threshold notification from [kosmos](http://kosmos-bouldern.de)
- /kosmosoff
  - deactivate the threshold notification from [kosmos](http://kosmos-bouldern.de)

- /blocstatus
  - retrieve the actual visitor status from [bloc bouldering](https://boulderhalle-leipzig.de)
- /blocon
  - activate the threshold notification from [bloc bouldering](https://boulderhalle-leipzig.de)
- /blocoff
  - deactivate the threshold notification from [bloc bouldering](https://boulderhalle-leipzig.de)

- /bloc_climbingstatus
  - retrieve the actual visitor status from [bloc climbing](https://www.kletterhalle-leipzig.de)
- /bloc_climbingon
  - activate the threshold notification from [bloc climbing](https://www.kletterhalle-leipzig.de)
- /bloc_climbingoff
  - deactivate the threshold notification from [bloc climbing](https://www.kletterhalle-leipzig.de)

# How to build and run

## precondition

- install [deno](https://deno.land) | last tested version 1.0.3
- get telegram api token [here](https://core.telegram.org/bots)

## start the backend

deno run --allow-net --allow-env --allow-read --allow-write --unstable src/app.ts

## run test

deno test --allow-net --allow-env --allow-read --allow-write --unstable
