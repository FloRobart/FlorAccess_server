FROM postgres:18-alpine3.22

# /!\ IMPORTANT /!\ #
# /!\ This is the default configuration, you need to override it with a .env file in the same folder as your docker-compose.yml #
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=floraccess

COPY ./functions/*.sql /docker-entrypoint-initdb.d/
COPY ./schema/*.sql /docker-entrypoint-initdb.d/
COPY ./triggers/*.sql /docker-entrypoint-initdb.d/
COPY ./migrations/*.sql /docker-entrypoint-initdb.d/
COPY ./seed/*.sql /docker-entrypoint-initdb.d/
# COPY ./views/*.sql /docker-entrypoint-initdb.d/