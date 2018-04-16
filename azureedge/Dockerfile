FROM ubuntu:xenial

RUN apt-get update \
    && apt-get install curl -y \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install libcurl4-openssl-dev -y \
    && apt-get install -y nodejs

ADD . .

RUN npm install

CMD ["sh", "start.sh"]