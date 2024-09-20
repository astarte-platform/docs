<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with C (ESP32)

Follow this guide to get started with the Astarte device SDK for ESP32 devices.

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

Generating a device ID from device MAC address and other hardware identification bits:
```C
astarte_err_t astarte_hwid_get_id(&hw_id);
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

```C
astarte_pairing_config cfg =
{
.base_url = &base_astarte_url;
.jwt = &jwt_token;
.realm = &realm;
.hw_id = &device_id;
.credentials_secret = &credentials_secret;
};

astarte_err_t err = astarte_pairing_register_device(&astarte_pairing_config);
```

## Instantiating and connecting a new device

Now that we obtained both a device ID and a credential secret we can create a new device instance.
Some of the SDKs will connect instantly as soon as the device is instantiated while others will
require a call to a `connect` function.
Furthermore, depending on the SDK the introspection of the device might be defined while
instantiating the device or between instantiation and connection.

```C
// Instantiating a device
astarte_device_config_t cfg = {
    .data_event_callback = astarte_data_events_handler,
    .unset_event_callback = astarte_unset_events_handler,
    .connection_event_callback = astarte_connection_events_handler,
    .disconnection_event_callback = astarte_disconnection_events_handler,
    .credentials_secret = cred_sec,
    .hwid = hwid,
    .realm = realm,
};
astarte_device_handle_t device = astarte_device_init(&cfg);
if (!device) {
    ESP_LOGE(TAG, "Failed to init astarte device");
    return;
}
// Adding an interface
astarte_device_add_interface(device, &device_example_interface);
// Starting a device
if (astarte_device_start(device) != ASTARTE_OK) {
    ESP_LOGE(TAG, "Failed to start astarte device");
    return;
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

```C
struct timeval tv;
gettimeofday(&tv, NULL);
uint64_t ts = tv->tv_sec * 1000 + tv->tv_usec / 1000;

astarte_err_t err = astarte_device_stream_double_with_timestamp(device, "org.astarte-platform.genericsensors.Values", "/test0/value", 0.3, ts, 0);
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
examples, `lat` and `long` will be sent together and will be inserted into the `"/coords"`
datastream which is defined by the `"/coords"` endpoint, that is part of `"com.example.GPS"`
datastream interface.

```C
astarte_bson_serializer_init(&bs);
astarte_bson_serializer_append_double(&bs, "lat", 45.409627);
astarte_bson_serializer_append_double(&bs, "long", 11.8765254);
astarte_bson_serializer_append_end_of_document(&bs);
int size;
const void *coord = astarte_bson_serializer_get_document(&bs, &size);

struct timeval tv;
gettimeofday(&tv, NULL);
uint64_t ts = tv->tv_sec * 1000 + tv->tv_usec / 1000;

astarte_device_stream_aggregate_with_timestamp(device, "com.example.GPS", "/coords", coords, ts, 0);
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
```C
astarte_device_set_string_property(device, "org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name", "foobar");
```
Unset property:
```C
astarte_device_unset_path(device, "org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name");
```
