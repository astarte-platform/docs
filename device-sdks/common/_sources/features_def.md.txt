<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Features definition

A set of possible features supported by the SDKs is presented in this section.
Each Astarte device SDK implements a slighly different set of features. While some might be
common to all the SDKs, others might be more relevant to some programming language or framework
and subequently be only implemented in a set of SDKs.

## Device ID generation

An Astarte instance identifies each device through an unique identifier.
Some of the Astarte device SDKs provide utilities to generate a device ID in a deterministic or
random manner. Some SDKs can extract information from the hardware to generate an unique identifier.
For more information regarding the device ID format can be found in the
[Astarte documentation](https://docs.astarte-platform.org/astarte/latest/010-design_principles.html#device-id).

## Device registration

Registering a new device to the an Astarte instance can be performed in two ways:
1. Using the registration utilities in the Astarte instance itself. Such utilities will produce
   a credential secret. Such credential secret can then be transferred to the device an used to
   connect to Astarte.
2. Using the on board registration utilities. This device APIs require an authorization JWT
   generated in the Astarte instance and then transferred to the device. The registration APIs
   will use the JWT token to negotiate a credential secret from the Astarte instance.

Both methods will require a valid device ID to perform the registration.

### On board device registration

Registering the device is performed using the
[Astarte API for device registration](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API#/agent/registerDevice).

## Interfaces parsing

The Astarte device SDKs are capable of parsing interfaces definitions expressed in a `.json` format.
All the interfaces definitions provided to a device make up the introspection of such device.
Each device will communicate its introspection to Astarte during the connection phase.

For more information regarding the definition of interfaces see the
[Astarte documentation](https://docs.astarte-platform.org/astarte/latest/030-interface.html).

## Device connection

Astarte device SDKs make use of platform specific MQTT libraries and they hide all MQTTs connection
management details.

Astarte devices connect to the remote Astarte instance using mutual TLS authentication.

### Server TLS certificates support

Server authentication is performed using a TLS certificate, as such each device will need to
include a set of root certificates in order to properly verify the server certificate.

### Client TLS certificate support

Client authentication is performed using a TLS certificate issued by the Astarte instance.
This certificate is obtained through the
[Astarte API for device credentials](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API#/device/obtainCredentials).
Each device will generate a certificate signing request and the Astarte instance will issue a
corresponding x509 certificate.

### Client TLS certificate renewal

Each device SDK is responsible to check the validity of its certificate using the appropriate
[Astarte API for device credentials validation](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API#/device/obtainCredentials).

Renewal of the certificate can be performed by requesting a fresh certificate to Astarte.

### Reconnection

Astarte device SDKs implement an internal reconnection strategy that uses an exponential backoff
to avoid network overloading.

## Data streaming

Each Astarte device SDK can transmit and receive data to one of the interfaces present in its
introspection.

### Individual data transmission and reception

Devices can transmit and receive data for individual interfaces.
Depending on the language and framework used by the SDK it might be required to place the data to
transmit in a dedicated structure.

### Aggregated data transmission and reception

Devices can transmit and receive data for aggregated interfaces.
Depending on the language and framework used by the SDK it might be required to place the data to
transmit in a dedicated structure.

### Reliability support

The devices ensure a level of reliability for all the data to transmitted or received. This level
of reliability is specified in the interfaces definition and is implemented using MQTT QoS levels.

### Data persistence and automatic retransmission

Astarte Device SDKs allow configuring persitence for high enough reliability levels. In case of
connection loss data is stored to memory or disk (according to configuration) and they are
automatically retransmitted as soon as the device is back online.

## Properties

Astarte has support for the concept of properties, which are kept synchronized between the server
and the device.

### Setting/unsetting device properties

Device properties can be set in each device and each value change is communicated to the Astarte
instance.
Unsetting properties will be allowed only for properties are defined as unsettable in their
interface definition.

### Setting/unsetting server properties

Server properties are property of the Astarte instance and can't be modified by the device.
However they can be added to the device introspection and any change for their value will be
communicated to the device.
Unsetting properties will be allowed only for properties are defined as unsettable in their
interface definition.

### Properties presistency

Astarte device SDKs store in persistent memory their owned properties.
This ensures a correct synchronization between Astarte and the device in cases of re-connections.

## Data Validation

The Astarte device SDKs validate user data before transmission, hence errors are reported locally
on the device improving troubleshooting experience.
