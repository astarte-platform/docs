<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with Elixir

Follow this guide to get started with the Astarte device SDK for the Elixir programming language.

## Generating a device ID

A device ID will be required to uniquely identify a device in an Astarte instance.
Some of the Astarte device SDKs provide utilities to generate a deterministic or random device
identifier, in some cases based on hardware information.

This step is only useful when registering a device using a JWT token and the provided Astarte device
SDKs registration APIs. Registration of a device can also be performed outside the device in the
Astarte instance. In such cases the device ID should be obtained via
[astartectl](https://github.com/astarte-platform/astartectl), or the
[Astarte dashboard](https://docs.astarte-platform.org/astarte/latest/015-astarte_dashboard.html).
The device ID should then be loaded manually on the device.

A device ID can be generate randomly:
```elixir
device_id = :crypto.strong_rand_bytes(16)|> Base.url_encode64(padding: false)
```
Or in a deterministic way:
```elixir
device_id = UUID.uuid5(namespace_uuid, payload, :raw)
    |> Astarte.Core.Device.encode_device_id()
```

## Registering a device

In order for a device to connect to Astarte a registration procedure is required. This registration
will produce a device specific credential secret that will be used when connecting to Astarte.
Some of the Astarte device SDKs provide utilities to perform a device registration directly on
the device. Those APIs will require a registration JWT to be uploaded to the device. Such JWT should
be discarded following the registration procedure.

This step is only useful when registering the device through the APIs using the JWT token.
Registration of a device can also be performed outside the device in the Astarte instance using
tools such as [astartectl](https://github.com/astarte-platform/astartectl), the
[Astarte dashboard](https://docs.astarte-platform.org/astarte/latest/015-astarte_dashboard.html),
or the dedicated
[Astarte API for device registration](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API).
The generated credential secret should then be loaded manually on the device.

```elixir
{:ok, %{body: %{"data" => %{"credentials_secret" => credentials_secret}}}} = Agent.register_device(client, device_id)
```

## Instantiating and connecting a new device

Now that we obtained both a device ID and a credential secret we can create a new device instance.
Some of the SDKs will connect instantly as soon as the device is instantiated while others will
require a call to a `connect` function.
Furthermore, depending on the SDK the introspection of the device might be defined while
instantiating the device or between instantiation and connection.

```elixir
# declare device options
opts = [pairing_url: pairing_url, realm: realm, device_id: device_id, interface_provider: "./examples/interfaces", credentials_secret: credentials_secret]

# start device and connect asynchronously
{:ok, pid} = Device.start_link(opts)

# blocking (optional)
:ok <- Device.wait_for_connection(device_pid)
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

```elixir
Device.send_datastream(pid, "org.astarte-platform.genericsensors.Values", "/test0/value", 0.3, timestamp: DateTime.utc_now())
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
examples, `lat` and `long` will be sent together and will be inserted into the `"/coords"`
datastream which is defined by the `"/coords"` endpoint, that is part of `"com.example.GPS"`
datastream interface.

```elixir
coords = %{lat: 45.409627, long: 11.8765254}
Device.send_datastream(pid, "com.example.GPS", "/coords", coords, timestamp: DateTime.utc_now())
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
```elixir
Device.set_property(pid, "org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name", "foobar")
```
Unset property:
```elixir
Device.unset_property(pid, "org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name")
```
