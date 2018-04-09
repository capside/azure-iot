FROM ubuntu:xenial

RUN apt-get update && apt-get install -y \
    nodejs \
    libboost1.58-all-dev \
    libcurl4-openssl-dev

WORKDIR /app
COPY ./ ./

CMD ["nodejs", "app.js", "cloud"]