<!--
Copyright 2024 SECO Mind Srl
SPDX-License-Identifier: Apache-2.0
-->

# Get started with Python

Follow this guide to get started with the Astarte device SDK for the Python programming language.

**Note:** The Astarte device SDK for Python can work using a direct MQTT connection to Astarte or
connect through the [Astarte message hub](https://github.com/astarte-platform/astarte-message-hub).
This getting started guide will show how to instantiate and connect a device to Astarte
using the MQTT protocol.

## Importing the device class

Import the device class from the astarte package.
```python
from astarte.device import DeviceMqtt
```

## Registering a device

In order for a device to connect to Astarte a registration procedure is required. This registration
will produce a device specific credential secret that will be used when connecting to Astarte.
The Python Astarte device SDKs provides utilities to perform a device registration directly on
the device. Those utilities require a registration JWT to be loaded on the device. Such JWT should
be discarded following the registration procedure.

This step is only useful when registering the device through the APIs using the JWT token.
Registration of a device can also be performed outside the device in the Astarte instance using
tools such as [astartectl](https://github.com/astarte-platform/astartectl), the
[Astarte dashboard](https://docs.astarte-platform.org/astarte/latest/015-astarte_dashboard.html),
or the dedicated
[Astarte API for device registration](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API).
The generated credential secret should then be loaded manually on the device.

To generate a credential secret use the function `register_device_with_jwt_token` as shown below.
```python
from astarte.device import register_device_with_jwt_token

DEVICE_ID = "<DEVICE_ID>"
REALM = "<REALM>"
JWT_TOKEN = "<JWT_TOKEN>"
PAIRING_BASE_URL = "<PAIRING_BASE_URL>"

credentials_secret = register_device_with_jwt_token(DEVICE_ID, REALM, JWT_TOKEN, PAIRING_BASE_URL)
```

## Instantiating a device

Now that we obtained a credential secret we can create a new device instance.
```python
# ... register the device with Astarte ...

device = DeviceMqtt(DEVICE_ID, realm, credentials_secret, pairing_base_url, persistency_dir)
```

## Adding interfaces to the device

Each device should include a set of interfaces in its introspection.
The Python SDK allows the user to add interfaces directly from `.json` files definitions using
the `add_interfaces` method of the abstract class `Device`.
```python
# ... register and instantiate the device ...

from pathlib import Path
interface_file = Path("/examples/interfaces/com.example.Interface.json")
device.add_interface_from_file(interface_file)
```

## Registering the callbacks

The Astarte device SDK uses callbacks to communicate to the user that some event has occurred.
Such callbacks should be configured prior to connecting to Astarte.

Three callbacks can be optionally configured. A connection callback, a data received callback and
a disconnection callback.
```python
def on_connected_cbk(device: DeviceMqtt):
    print("Device connected.")

def on_disconnected_cbk(device: DeviceMqtt, reason: int):
    print("Device disconnected.")

# ... register, instantiate and add the interfaces to a device ...

device.set_events_callbacks(on_connected=on_connected_cbk, on_disconnected=on_disconnected_cbk)
```

## Connecting the device

After the four fundamental steps of registering the device, instantiating the device,
adding the interfaces and setting the callbacks have been completed the device can be connected to
Astarte.
```python
# ... register, instantiate, add the interfaces and the callbacks for a device ...

device.connect()
while not device.is_connected():
    # Wait for connection
    pass
```

## Streaming data

Streaming of data could be performed for device owned interfaces of `individual` or `object`
aggregation type.

### Streaming individual data

In Astarte interfaces with `individual` aggregation, each mapping is treated as an independent value
and is managed individually.

The snippet bellow shows how to send a value that will be inserted into the `"/test0/value"`
datastream which is defined by `"/%{sensor_id}/value"` parametric endpoint, that is part of
`"org.astarte-platform.genericsensors.Values"` datastream interface.

```python
# ... device setup and connection ...

from datetime import datetime, timezone
device_interface_name = "org.astarte-platform.genericsensors.Values"
device_path = "/test0/value"
device.send(device_interface_name, device_path, 42.3, timestamp=datetime.now(timezone.utc))
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
examples, `lat` and `long` will be sent together and will be inserted into the `"/coords"`
datastream which is defined by the `"/coords"` endpoint, that is part of `"com.example.GPS"`
datastream interface.

```python
# ... device setup and connection ...

aggregated_data = {'lat': 45.409627, 'long': 11.8765254}
device_interface_name = "com.example.GPS"
device_path = "/coords"
device.send_aggregate(device_interface_name, device_path, aggregated_data, timestamp=datetime.now(timezone.utc))
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
```python
# ... device setup and connection ...

property_value = "foobar"
device_interface_name = "org.astarte-platform.genericsensors.AvailableSensors"
device_path = "/sensor0/name"
device.send(device_interface_name, device_path, property_value)
```
Unset property:
```python
# ... device setup and connection ...

device.unset_property("org.astarte-platform.genericsensors.AvailableSensors", "/sensor0/name")
```

## Disconnecting the device

The Astarte device can be gracefully disconnected by Astarte using the disconnect method.
This method will trigger a callback to one of the user defined functions.

```python
# ... device setup, connection and data transmission ...

device.disconnect()
```
