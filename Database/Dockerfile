FROM postgres

# /!\ IMPORTANT /!\ #
# /!\ This is the default configuration, you need to override it with a .env file in the same folder as your docker-compose.yml #
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=floraccess

COPY *.sql /docker-entrypoint-initdb.d/