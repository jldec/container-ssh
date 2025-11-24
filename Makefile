.PHONY: build run

build:
	docker build --platform linux/amd64 -t container-ssh .

run:
	docker run --env-file .env --rm -p 22:22 -p 3000:3000 container-ssh
