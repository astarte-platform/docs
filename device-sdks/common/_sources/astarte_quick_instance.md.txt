<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Astarte quick instance

This tutorial will guide you through bringing up your first Astarte instance.
After completing this tutorial you will have an Astarte instance running on your host machine
and will be ready to connect any of the available Astarte devices to it.
You may choose to simulate a device on the same machine where the Astarte instance is running or
use two different machines for hosting Astarte and the device.

For more information on how to create a device using your favorite language/framework check out the
[get started page](get_started.md).

## Before you begin

First of all, please keep in mind that **this setup is not meant to be used in production**: by
default, no persistence is involved, the installation does not have any recovery mechanism, and you
will have to restart services manually in case something goes awry. This guide is great if you want
to take Astarte for a spin, or if you want to use an isolated instance for development.

### Astarte dependencies

You will need a machine with at least 4GB of RAM, a recent 64-bit operating system with
[Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/install/) and
[astartectl](https://github.com/astarte-platform/astartectl) installed. This procedure has been
tested on several systems, and is validated and maintained against Ubuntu 24.04 and macOS 10.15
Catalina, but any other modern operating system should work.

Docker version >= 19, Docker compose version >= 2.21 and astartectl >= v24.5.2 are recommended.

```sh
docker -v && docker compose version && astartectl version
```

### For linux users

Due to ScyllaDB requirements, if you're working on a Linux machine you should make sure that
`aio-max-nr` is at least `1048576`:

```sh
cat /proc/sys/fs/aio-max-nr
```

If it's less than that, you'll need to edit your `/etc/sysctl.conf` file

```Kconfig
fs.aio-max-nr = 1048576
```

and to persist this configuration

```sh
sudo sysctl -p
```

### Device dependencies

After completing this guide you will have an Astarte instance running and be ready to connect
devices to it.
Depending on your preference you could simulate a device directly on the same machine containing
the Astarte instance or on dedicated hardware connected in the same LAN.

If you want to connect dedicated hardware then you should perform some extra steps to help the
device resolve the Astarte URLs to the local IP address of your host machine.

#### Find your local area network IP address

First, find the IP address of your host machine in the LAN where both the device and the host
will be connected.
On Linux, this can be done using the command `ip addr show`. This will list all network interfaces
with their associated IP addresses.

#### Configure Astarte for your local address

For this demo, we will use an external service [`nip.io`](https://nip.io/) which works
as a wildcard DNS for any IP address.
Setting an environment variable on your system will provide Astarte with this information.
```sh
export DOCKER_COMPOSE_ASTARTE_BASE_DOMAIN="astarte.<YOUR IP ADDRESS>.nip.io"
```

## Installing Astarte and creating a realm with the utility script

If you are in a pinch we provide a quick setup script that automatically clones the Astarte
repository, runs the docker containers, and creates a test realm (named `test`).
It simply chains the commands listed in the two next steps together and requires some simple
user prompts to proceed with each action.
Since it's a bash script it only runs on Linux, so if you are working on Windows you will have
to follow the manual instructions.

Download the script using curl:
```sh
curl --proto '=https' --tlsv1.2 -O -sSf https://raw.githubusercontent.com/astarte-platform/sdk-doc/refs/heads/master/astarte-setup.sh
```
Then you can execute the script:
```sh
bash astarte-setup.sh
```

After running the script you can skip directly to the [next steps](#next-steps) section.

## Manually install Astarte

To get our Astarte instance running as fast as possible, we will install Astarte's standalone
distribution. It includes a tunable Docker Compose which brings up Astarte and every companion
service needed for it to work.

To do so, simply clone Astarte's main repository and use its scripts to bring it up:

```sh
git clone https://github.com/astarte-platform/astarte.git -b release-1.2 && cd astarte
docker run -v $(pwd)/compose:/compose astarte/docker-compose-initializer:1.2.0
docker compose pull
docker compose up -d
```

`docker-compose-initializer` will generate a root CA for devices, a key pair for Housekeeping, and
a self-signed certificate for the broker (note: this is a *really* bad idea in production).
You can tune the compose file further to use legitimate certificates and custom keys, but this is
out of the scope of this tutorial.

Compose might take some time to bring everything up, but usually within a minute from the containers
creation Astarte will be ready.
You can reach Astarte at the following addresses:

* `api.astarte.<YOUR IP ADDRESS>.nip.io`: Astarte API, in detail:
  * `api.astarte.<YOUR IP ADDRESS>.nip.io/appengine`: AppEngine
  * `api.astarte.<YOUR IP ADDRESS>.nip.io/housekeeping`: Housekeeping
  * `api.astarte.<YOUR IP ADDRESS>.nip.io/pairing`: Pairing
  * `api.astarte.<YOUR IP ADDRESS>.nip.io/realmmanagement`: Realm Management
* `broker.astarte.<YOUR IP ADDRESS>.nip.io`: VerneMQ broker
* `dashboard.astarte.<YOUR IP ADDRESS>.nip.io`: Astarte Dashboard

Where `<YOUR IP ADDRESS>.nip.io` can be substituted with `localhost` if you you did not set
`DOCKER_COMPOSE_ASTARTE_BASE_DOMAIN` using your local IP address and want to run the device
on the same machine as your Astarte instance.

Moreover, Compose will forward the following ports to your machine:

* `80`: HTTP
* `8883`: MQTTS

## Manually create a realm

Now that we have our instance up and running, we can start setting up a realm for our device.
We'll call our realm `test`. Given we have no SSO or Authentication mechanism set up, we're just
going to generate a public key to sign our JWTs with.

You can create one with `astartectl`:

```sh
astartectl utils gen-keypair test
```

Use `astartectl` to create a new realm:

```sh
astartectl housekeeping realms create test --astarte-url http://api.astarte.<YOUR IP ADDRESS>.nip.io -k compose/astarte-keys/housekeeping_private.pem --realm-public-key test_public.pem -y
```

This creates a `test` realm, which should be ready to be used almost immediately.
Remember to replace `<YOUR IP ADDRESS>.nip.io` with `localhost` if you did not set
`DOCKER_COMPOSE_ASTARTE_BASE_DOMAIN` using your local IP and want to run the device
on the same machine as your Astarte instance.

Let's then generate an authorization token in the form of a JWT.

```sh
astartectl utils gen-jwt all-realm-apis -e 0 -k test_private.pem
```

The JWT generated will provide you access to all APIs of the realm. In production environments,
more fine-tuned tokens should be carefully generated and used depending on needs, but this is out of
the scope of this tutorial.

## Access the Astarte dashboard

The Astarte dashboard is a useful GUI tool that provides control over your Astarte installation.
You can find the Astarte dashboard for your newly created instance at
`http://dashboard.astarte.<YOUR IP ADDRESS>.nip.io` if you did set the
`DOCKER_COMPOSE_ASTARTE_BASE_DOMAIN` variable with your IP or at
`http://dashboard.astarte.localhost` if you didn't.
You will be prompted for some login information. In the `realm` field you can place the name
of your newly created realm (`test`) while in the `token` field you can place the access token
generated in the previous step.

## Next steps

You now have access to an Astarte instance and can continue with any of the
[device get started guides](get_started.md) of your liking.

## Cleaning up

When you're done with your tests and developments, you can use `docker compose` again to tear down
your Astarte instance simply by issuing:

```sh
docker compose down
```

Unless you add the `-v ` option, persistencies will be kept and next time you will
`docker compose up` the cluster will come back in the very same state you left it last time.
`docker compose down -v` is extremely useful during development, especially if you want a clean
slate for testing your applications or your routines every time.

## Final notes

Running Astarte through `docker compose` is the fastest way to go from zero to hero. However,
**please keep in mind this setup is unlikely to hold for long in production and is by design broken
for large installations**.

This method is great for development and for trying out the system. If you wish to deploy Astarte
in a more robust environment, have a look at a [managed Astarte instance](https://astarte.cloud/),
or manage your own with the
[Astarte Kubernetes Operator](https://docs.astarte-platform.org/astarte-kubernetes-operator/latest/001-intro_administrator.html).
