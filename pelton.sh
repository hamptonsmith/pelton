#!/bin/bash

set -e

function provision() {
    if ! which docker &>/dev/null; then
        wget -qO- https://get.docker.com/ | sh
    fi

    if ! which docker-compose &> /dev/null; then
        COMPOSE_VERSION=`git ls-remote https://github.com/docker/compose | grep refs/tags | grep -oE "[0-9]+\.[0-9][0-9]+\.[0-9]+$" | sort --version-sort | tail -n 1`
        sh -c "curl -L https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose"
        chmod +x /usr/local/bin/docker-compose
        sh -c "curl -L https://raw.githubusercontent.com/docker/compose/${COMPOSE_VERSION}/contrib/completion/bash/docker-compose > /etc/bash_completion.d/docker-compose"
    fi

    if ! which git &> /dev/null; then
        apt-get install git
    fi

    if ! which node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_14.x | bash
        apt-get install -y nodejs
    fi

    if [[ -d /usr/local/lib/pelton ]]; then
        cd /usr/local/lib/pelton
        git pull
    else
        cd /usr/local/lib
        git clone https://github.com/hamptonsmith/pelton.git
    fi

    NEW_HASH=$(\
            sha256sum /usr/local/lib/pelton/package-lock.json | cut -d' ' -f1)
    OLD_HASH=$(cat /etc/pelton/build-hash 2>/dev/null)

    if [[ "$NEW_HASH" !== "$OLD_HAS" ]]; then
        cd /usr/local/lib/pelton
        npm ci
        echo "$NEW_HASH" > /etc/pelton/build-hash
    fi

    if ! which pelton &> /dev/null; then
        ln -s /usr/local/lib/pelton/app.js /usr/bin/pelton
    fi
}

provision
