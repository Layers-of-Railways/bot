FROM docker.io/library/node:20-alpine
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN apk add npm python3 build-base pango-dev cairo-dev

RUN which python

RUN export PYTHON=$(which python)

RUN pnpm config set python "$(which python)"

RUN pnpm install --frozen-lockfile

COPY . .

CMD [ "pnpm", "run", "start" ]
