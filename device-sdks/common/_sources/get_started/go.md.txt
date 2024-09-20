<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with Go

Follow this guide to get started with the Astarte device SDK for the Go programming language.

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
```go
random_id, err := GenerateRandomAstarteId()
```
Or in a deterministic way:
```go
namespaced_id, err := GetNamespacedAstarteDeviceID(namespaceUuid,payload)
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

```go
credentials_secret, err := client.Pairing.RegisterDevice(realm, deviceID)
```

## Instantiating and connecting a new device

Now that we obtained both a device ID and a credential secret we can create a new device instance.
Some of the SDKs will connect instantly as soon as the device is instantiated while others will
require a call to a `connect` function.
Furthermore, depending on the SDK the introspection of the device might be defined while
instantiating the device or between instantiation and connection.

```go
// Create device
d, err := device.NewDevice(deviceID, deviceRealm, credentialsSecret, apiEndpoint)
if err != nil {
    fmt.Println(err.Error())
    os.Exit(1)
}

// Load interface - fix this path(s) to load the right interface
byteValue, err := ioutil.ReadFile("/examples/interfaces/com.example.Interface.json")
if err != nil {
    fmt.Println(err.Error())
    os.Exit(1)
}
iface := interfaces.AstarteInterface{}
if iface, err = interfaces.ParseInterface(byteValue); err != nil {
    fmt.Println(err.Error())
    os.Exit(1)
}

if err = d.AddInterface(iface); err != nil {
    fmt.Println(err.Error())
    os.Exit(1)
}

// Set up callbacks
d.OnConnectionStateChanged = func(d *device.Device, state bool) {
    fmt.Printf("Device connection state: %t\n", state)
}

// Connect the device and listen to the connection status channel
c := make(chan error)
d.Connect(c)
if err := <-c; err == nil {
    fmt.Println("Connected successfully")
} else {
    fmt.Println(err.Error())
    os.Exit(1)
}
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

```go
d.SendIndividualMessageWithTimestamp("org.astarte-platform.genericsensors.Values", "/test0/value", 0.3, time.Now())
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
examples, `lat` and `long` will be sent together and will be inserted into the `"/coords"`
datastream which is defined by the `"/coords"` endpoint, that is part of `"com.example.GPS"`
datastream interface.

```go
coords := map[string]double{"lat": 45.409627, "long": 11.8765254}
d.SendAggregateMessageWithTimestamp("com.example.GPS", "/coords", coords, time.Now())
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
```go
d.SetProperty("org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name", "foobar")
```
Unset property:
```go
d.UnsetProperty("org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name")
```
