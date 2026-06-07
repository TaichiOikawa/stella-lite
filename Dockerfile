FROM node:24-alpine
WORKDIR /app

ARG YARN_VERSION=4.12.0

RUN corepack enable
RUN corepack prepare yarn@${YARN_VERSION} --activate

COPY . .
RUN yarn install --immutable

RUN yarn prisma generate
RUN yarn build

ENV NODE_ENV=production

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Apply schema to DB, then start the server
CMD ["sh", "-c", "yarn prisma db push && yarn start"]
