FROM debian:8-slim

RUN apt update \
    && apt install -y curl \
    && curl -sL https://deb.nodesource.com/setup_9.x | bash - \
    && apt install nodejs

ADD . .

CMD ["npm", "run", "cloud"]