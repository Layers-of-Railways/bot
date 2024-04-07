FROM docker.io/library/node:20-alpine
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN apt-get install build-essential libcairo2-dev libpango1.0-dev -y

RUN which python

RUN export PYTHON=$(which python)

RUN pnpm config set python "$(which python)"

RUN pnpm install --frozen-lockfile

COPY . .

CMD [ "pnpm", "run", "start" ]
