<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with C++ (Qt5)

Follow this guide to get started with the Astarte device SDK for the Qt5 framework.

## Generating a device ID

Not supported.

## Registering a device

Registration is done on device instantiation, see the next section.

## Instantiating and connecting a new device

Now that we obtained both a device ID and a credential secret we can create a new device instance.
Some of the SDKs will connect instantly as soon as the device is instantiated while others will
require a call to a `connect` function.
Furthermore, depending on the SDK the introspection of the device might be defined while
instantiating the device or between instantiation and connection.

```C++
// Instantiating a device and declaring the introspection
m_sdk = new AstarteDeviceSDK(QDir::currentPath() + QStringLiteral("./examples/device_sdk.conf").arg(deviceId), QDir::currentPath() + QStringLiteral("./examples/interfaces"), deviceId.toLatin1());
// Connecting to the Astarte instance
connect(m_sdk->init(), &Hemera::Operation::finished, this, &AstarteStreamQt5Test::checkInitResult);
// Setting data handlers
connect(m_sdk, &AstarteDeviceSDK::dataReceived, this, &AstarteStreamQt5Test::handleIncomingData);
```

## Streaming data

All Astarte Device SDKs include primitives for sending data to a remote Astarte instance.
Streaming of data could be performed for device owned interfaces of `individual` or `object`
aggregation type.

### Streaming individual data

In Astarte interfaces with `individual` aggregation, each mapping is treated as an independent value
and is managed individually.

The snippet bellow shows how to send a value that will be inserted into the `"/test0/value"`
datastream which is defined by `"/%{sensor_id}/value"` parametric endpoint, that is part of
`"org.astarte-platform.genericsensors.Values"` datastream interface.

```C++
m_sdk->sendData("org.astarte-platform.genericsensors.Values", "/test0/value", 0.3, QDateTime::currentDateTime());
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
examples, `lat` and `long` will be sent together and will be inserted into the `"/coords"`
datastream which is defined by the `"/coords"` endpoint, that is part of `"com.example.GPS"`
datastream interface.

```C++
QVariantHash coords;
coords.insert(QStringLiteral("lat"), 45.409627);
coords.insert(QStringLiteral("long"), 11.8765254);
m_sdk->sendData("com.example.GPS", "/coords", coords, QDateTime::currentDateTime());
```

## Setting and unsetting properties

Interfaces of `property` type represent a persistent, stateful, synchronized state with no concept
of history or timestamping. From a programming point of view, setting and unsetting properties of
device-owned interface is rather similar to sending messages on datastream interfaces.

The following snippet shows how to set a value that will be inserted into the `"/sensor0/name"`
property which is defined by `"/%{sensor_id}/name"` parametric endpoint, that is part of `"org.astarte-platform.genericsensors.AvailableSensors"` device-owned properties interface.

It should be noted how a property should be marked as unsettable in its interface definition to
be able to use the unsetting method on it.

Set property:
```C++
m_sdk->sendData(m_interface, m_path, value, QDateTime::currentDateTime());
```
Unset property:
```C++
m_sdk->sendUnset(m_interface, m_path);
```
