#!/bin/bash

function provision() {
    if ! which docker &>/dev/null; then
        wget -qO- https://get.docker.com/ | sh
    fi

    if ! which docker-compose > &/dev/null; then
        COMPOSE_VERSION=`git ls-remote https://github.com/docker/compose | grep refs/tags | grep -oE "[0-9]+\.[0-9][0-9]+\.[0-9]+$" | sort --version-sort | tail -n 1`
        sh -c "curl -L https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose"
        chmod +x /usr/local/bin/docker-compose
        sh -c "curl -L https://raw.githubusercontent.com/docker/compose/${COMPOSE_VERSION}/contrib/completion/bash/docker-compose > /etc/bash_completion.d/docker-compose"
    fi

    if ! which pelton > &/dev/null; then
        
    fi
}

provision
