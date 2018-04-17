FROM ubuntu:xenial

RUN apt-get update \
    && apt-get install curl -y \
    && curl -sL https://deb.nodesource.com/setup_8.x | bash - \
    && apt-get install libcurl4-openssl-dev -y \
    && apt-get install -y nodejs \
    && apt-get install mosquitto -y \
    && /etc/init.d/mosquitto start

ADD . .

RUN npm install

EXPOSE 1883/tcp

CMD ["sh", "start.sh"]