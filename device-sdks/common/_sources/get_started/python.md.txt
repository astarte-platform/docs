<!--
Copyright 2024 SECO Mind Srl
SPDX-License-Identifier: Apache-2.0
-->

# Get started with Python

Follow this guide to start with the Astarte device SDK for the Python programming language.
We will explain how the SDK APIs can be used to create a device, connect to Astarte, and easily
transmit data.

**Note:** The Astarte device SDK for Python can work using a direct MQTT connection to Astarte or
connect through the [Astarte message hub](https://github.com/astarte-platform/astarte-message-hub).
This getting started guide will show how to instantiate and connect a device to Astarte
using the MQTT protocol.

## Prerequisites

This get-started will focus on creating a device and connecting it to an Astarte instance.
If you don't have access to an Astarte instance you can easily set up one following our
[Astarte quick instance guide](https://docs.astarte-platform.org/device-sdks/common/astarte_quick_instance.html).

From here on we will assume you have access to an Astarte instance, remote or on your local machine.
Furthermore, we will assume you have access to the Astarte dashboard for a realm.

### Installing the required interfaces

The interfaces that our device will use must first be installed within the Astarte instance.
In this guide we will shot how to stream individual and aggregated data as well as how to set and
unset data. As a consequence we will need three interfaces that the device will be able to use
to transmit this data.
The following is the definition of the individually aggregated interface:
```json
{
    "interface_name": "org.astarte-platform.python.get-started.Individual",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "ownership": "device",
    "description": "Individual interface for the get-started of the Astarte device SDK for Python.",
    "mappings": [
        {
            "endpoint": "/double_endpoint",
            "type": "double",
            "explicit_timestamp": false
        }
    ]
}
```
Next is the definition of the aggregated interface:
```json
{
    "interface_name": "org.astarte-platform.python.get-started.Aggregated",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "aggregation": "object",
    "ownership": "device",
    "description": "Aggregated interface for the get-started of the Astarte device SDK for Python.",
    "mappings": [
        {
            "endpoint": "/group_data/double_endpoint",
            "type": "double",
            "explicit_timestamp": false
        },
        {
            "endpoint": "/group_data/string_endpoint",
            "type": "string",
            "explicit_timestamp": false
        }
    ]
}
```
And finally the definition of the property interface:
```json
{
    "interface_name": "org.astarte-platform.python.get-started.Property",
    "version_major": 0,
    "version_minor": 1,
    "type": "properties",
    "ownership": "device",
    "description": "Property interface for the get-started of the Astarte device SDK for Python.",
    "mappings": [
        {
            "endpoint": "/double_endpoint",
            "type": "double",
            "allow_unset": true
        }
    ]
}
```

To install the three interfaces in the Astarte instance, open the Astarte dashboard, navigate to the
interfaces tab and click on install new interface.
You can copy and paste the JSON files for each interface in the right box overwriting the default
template.

### Registering the device

Devices should be pre-registered to Astarte before their first connection.
With the Astarte device SDK for Python this can be achieved in two ways:
- By registering the device on Astarte manually, obtaining a credentials secret and transfering it
  on the device.
- By using the included registration utilities provided by the SDK. Those utilities can make use of
  a registration JWT issued by Astarte and register the device automatically before the first
  connection.

To keep this guide as simple as possible we will use the first method, as a device can be registered
using the Astarte dashboard with a couple of clicks.

To install a new device start by opening the dashboard and navigate to the devices tab.
Click on register a new device, there you can input your own device ID or generate a random one.
Click on register device, this will register the device an give you a credentials secret.
The credentials secret will be used by the device to authenticate with Astarte.
Copy it somewhere safe as it will be used in the next steps.

## Installing the Astarte device SDK for Python

The library source code can be found on
[GitHub](https://github.com/astarte-platform/astarte-device-sdk-python) and can be installed using
pip:
```sh
pip install astarte-device-sdk
```

## Creating a device instance

The first step to use the Astarte device SDK is to import the device class from the astarte package
and create a device instance.

The init function for the device class will require some information:
- The Astarte pairing base URL. This is the Astarte base URL with an appendend `/pairing` at the
  end. If you deployed an Astarte instance using the Astarte quick instance guide and decided to
  use the SDK on the same machine as the Astarte instance, this will be
  `http://api.astarte.localhost/pairing`.
- The name of the realm where the device is registered. If you deployed an Astarte instance using
  the Astarte quick instance guide, you can use the default generated one named `test`.
- The device ID.
- The credentials sected associated to the device ID.
- The path to a directory where the Astarte device will store some persistent data.

```python
import os
from astarte.device import DeviceMqtt

astarte_pairing_base_url = "<PAIRING_BASE_URL>"
realm = "<REALM>"
device_id = "<DEVICE_ID>"
credentials_secret = "<DEVICE CREDENTIALS SECRET>"
persistency_dir = os.getcwd()

device = DeviceMqtt(
    device_id,
    realm,
    credentials_secret,
    astarte_pairing_base_url,
    persistency_dir,
    ignore_ssl_errors=True,
)
```

We will set the `ignore_ssl_errors` flag in order to ignore any self signed TLS certificate used
in our local Astarte instance.

## Adding the interfaces to the device

We previously added three interfaces to our Astarte instance. We will now do something similar on
the device.
The Python SDK allows the user to add interfaces directly from `.json` files definitions using
the `add_interface_from_file` method.
Save the three interfaces in JSON files in your working directory and add them to the device as
follows.
```python
from pathlib import Path

# ... instantiate the device ...

interface_file = Path("./org.astarte-platform.python.get-started.Individual.json")
device.add_interface_from_file(interface_file)
interface_file = Path("./org.astarte-platform.python.get-started.Aggregated.json")
device.add_interface_from_file(interface_file)
interface_file = Path("./org.astarte-platform.python.get-started.Property.json")
device.add_interface_from_file(interface_file)
```

## Registering the callbacks

The Astarte device SDK uses callbacks to communicate to the user that some event has occurred.
Such callbacks should be configured prior to connecting to Astarte.

Three callbacks can be optionally configured. A connection callback, a data received callback and
a disconnection callback.
```python
# ... instantiate and add the interfaces to a device ...

def on_connected_cbk(device: DeviceMqtt):
    print("Device connected.")

def on_disconnected_cbk(device: DeviceMqtt, reason: int):
    print("Device disconnected.")

device.set_events_callbacks(on_connected=on_connected_cbk, on_disconnected=on_disconnected_cbk)
```

## Connecting the device

We are finally ready to connect our device to Astarte.
```python
from time import sleep

# ... instantiate, add the interfaces and the callbacks to a device ...

device.connect()

while not device.is_connected():
    sleep(1)
    pass
```

## Streaming data

Streaming of data could be performed for device owned interfaces of `individual` or `object`
aggregation type.

### Streaming individual data

For Astarte interfaces with `individual` aggregation, each mapping is treated as an independent
value and is managed individually.

The snippet bellow shows how to send a value that will be inserted into the `"/double_endpoint"`,
that is part of the `"org.astarte-platform.python.get-started.Individual"` datastream interface.

```python
# ... device setup and connection ...

interface_name = "org.astarte-platform.python.get-started.Individual"
path = "/double_endpoint"
value = 42.3
device.send(interface_name, path, value)
```

### Streaming aggregated data

For Astarte interfaces with `object` aggregation, all of the interface's mappings should be sent
at the same time, packed in a single message.

The following snippet shows how to send a value for an object aggregated interface. In this
case, `double_endpoint` and `string_endpoint` will be sent together on the common `"/group_data"`
datastream path, that is part of the `"org.astarte-platform.python.get-started.Aggregated"`
datastream interface.

```python
# ... device setup and connection ...

interface_name = "org.astarte-platform.python.get-started.Aggregated"
common_path = "/group_data"
aggregated_data = {'double_endpoint': 45.409627, 'string_endpoint': "My string"}
device.send_aggregate(interface_name, common_path, aggregated_data)
```

## Setting and unsetting properties

Interfaces of `property` type represent a persistent, stateful, synchronized state with no concept
of history or timestamping. From a programming point of view, setting and unsetting properties of
device-owned interface is rather similar to sending messages on datastream interfaces.

The following snippet shows how to set a new value for the `"/double_endpoint"` property, that is
part of `"org.astarte-platform.python.get-started.Property"` properties interface.

It should be noted how a property should be marked as unsettable in its interface definition to
be able to use the unsetting method on it.

Set property:
```python
# ... device setup and connection ...

interface_name = "org.astarte-platform.python.get-started.Property"
path = "/double_endpoint"
value = 55.5
device.send(interface_name, path, value)
```
Unset property:
```python
# ... device setup and connection ...

interface_name = "org.astarte-platform.python.get-started.Property"
path = "/double_endpoint"
device.unset_property(interface_name, path)
```

## Disconnecting the device

The Astarte device can be gracefully disconnected by Astarte using the disconnect method.
This method will trigger a callback to one of the user defined functions.

```python
# ... device setup, connection and data transmission ...

sleep(1)
device.disconnect()
```
