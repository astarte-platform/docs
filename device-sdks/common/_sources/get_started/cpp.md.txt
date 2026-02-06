<!--
Copyright 2025 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with C++

Follow this guide to start with the Astarte device SDK for C++. We will guide you through
setting up a very basic C++ application creating a device on a board of your choice, connecting
it to a local Astarte instance and transmitting some data.

## Before you begin

### Local Astarte instance

This get started will focus on creating a device and connecting it to an Astarte instance.
If you don't have access to an Astarte instance you can easily set up one following our
[Astarte quick instance guide](https://docs.astarte-platform.org/device-sdks/common/astarte_quick_instance.html).

From here on we will assume you have access to an Astarte instance, remote or on a host machine
connected to the same LAN where your device will be connected.
Furthermore, we will assume you have access to the Astarte dashboard for a realm.
The next steps be to will install the required interfaces and register a new device on Astarte
using the dashboard. The same operations could be performed using `astartectl` and the access token
generated in the Astarte quick instance guide.

### Installing the required interfaces

The interfaces that our device will use to send/receive data to/from Astarte must first be installed
within the Astarte instance.
In this guide, we will show how to stream individual and aggregated data as well as how to set and
unset properties. As a consequence, we will need three separate interfaces, one for each data type.

The following is the definition of the individually aggregated interface:
```json
{
    "interface_name": "org.astarte-platform.cpp.get-started.Individual",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "ownership": "device",
    "description": "Individual interface for the get-started of the Astarte device SDK for C++.",
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
    "interface_name": "org.astarte-platform.cpp.get-started.Aggregated",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "aggregation": "object",
    "ownership": "device",
    "description": "Aggregated interface for the get-started of the Astarte device SDK for C++.",
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
    "interface_name": "org.astarte-platform.cpp.get-started.Property",
    "version_major": 0,
    "version_minor": 1,
    "type": "properties",
    "ownership": "device",
    "description": "Property interface for the get-started of the Astarte device SDK for C++.",
    "mappings": [
        {
            "endpoint": "/%{sensor_id}/string_endpoint",
            "type": "string",
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

Devices should be pre-registered to Astarte before their first connection. This can be achieved in
two ways:
- By registering the device on Astarte manually, obtaining a credentials secret, and transferring it
  on the device.
- By using the included registration utilities provided by the Astarte message hub. Those utilities
  can make use of a registration JWT issued by Astarte and register the device automatically before
  the first connection.

To keep this guide as simple as possible we will use the first method, as a device can be registered
using the Astarte dashboard with a couple of clicks.

To install a new device start by opening the dashboard and navigating to the devices tab.
Click on register a new device, there you can input your own device ID or generate a random one.
For example, you could use the device ID `MFVgjjP2Tt6RbT_wKOI0VA`.
Click on register device, this will register the device and give you a credentials secret.
The credentials secret will be used by the device to authenticate with Astarte.
Copy it somewhere safe as it will be used in the next steps.

### Installing and configuring the Astarte message hub

The Astarte device SDK for C++ only supports connection to Astarte through a message hub instance.
The [Astarte message hub](https://github.com/astarte-platform/astarte-message-hub) provides access
to Astarte to multiple nodes through a single Astarte device.
Each Astarte device for C++ will connect to the message hub as a node, which in turn will forward
any message to Astarte.

The Astarte message hub is a Rust project. It is available on
[`crates.io`](https://crates.io/crates/astarte-message-hub) and can be installed from the official
Rust package index through `cargo`.

Configure the Astarte message hub to use the device we registered in the previous step.
If you used the Astarte quick instance guide to set up Astarte the pairing URL will be
`http://api.astarte.<HOST IP ADDRESS>.nip.io/pairing` while the realm name will be `test`.

Note that the local Astarte instance is not capable of using TLS. As such certificate errors
should be ignored in the Astarte message hub toml configuration file by setting the following lines:
```toml
[astarte]
ignore_ssl = true
```

## Creating a base CMake project

CMake is the build system of choice for many C++ projects. Make sure it is installed in your machine
before proceeding with this guide.

In this tutorial we will start with the most basic CMake project possible.

Create a `CMakeLists.txt` file with the following content:
```
cmake_minimum_required(VERSION 3.15)
project(GetStarted)
include(FetchContent)

# Import the Astarte device for C++
set(ASTARTE_GRPC_VERSION "1.57.1" CACHE STRING "Set gRPC version")
FetchContent_Declare(astarte_device_sdk
  GIT_REPOSITORY git@github.com:astarte-platform/astarte-device-sdk-cpp.git
  GIT_TAG main
)
FetchContent_MakeAvailable(astarte_device_sdk)

add_executable(get_started_app main.cpp)
target_link_libraries(get_started_app astarte_device_sdk)
```

Next, create a `main.cpp` file where we will place our source code.

The project can be built as any CMake project:
```
mkdir build
cd build
cmake -DCMAKE_POLICY_VERSION_MINIMUM=3.15 ..
make -j $(nproc --all)
```

## Instantiating and connecting a device

Finally, we can start with the source code of our device application. We will first create a new
device using the gRPC server address used in the message hub configuration.

The following code snippet shows how to instantiate a device, add the three Astarte interfaces and
connect to the message hub.
A couple of assumptions have been made:
- The Astarte message hub is running on the same machine accepting requests on `localhost:50051`
- The Astarte interfaces have been saved in json files in the folder where our sample will be run.

```cpp
#include <cstdlib>
#include <iostream>
#include <thread>
#include <chrono>

#include "astarte_device_sdk/data.hpp"
#include "astarte_device_sdk/device_grpc.hpp"
#include "astarte_device_sdk/msg.hpp"
#include "astarte_device_sdk/formatter.hpp"

using astarte::device::Data;
using astarte::device::DatastreamIndividual;
using astarte::device::DatastreamObject;
using astarte::device::grpc::DeviceGrpc;
using astarte::device::Message;
using astarte::device::PropertyIndividual;

using namespace std::chrono_literals;

void reception_handler(std::stop_token token, std::shared_ptr<DeviceGrpc> device) {
  while (!token.stop_requested()) {
    auto incoming = device->poll_incoming(std::chrono::milliseconds(100));
    if (incoming.has_value()) {
      Message msg(incoming.value());
      std::cout << "Received message." << std::endl;
      std::cout << "Interface name: {}" << msg.get_interface() << std::endl;
      std::cout << "Path: {}" << msg.get_path() << std::endl;
      if (msg.is_datastream()) {
        if (msg.is_individual()) {
          const auto &data(msg.into<DatastreamIndividual>());
          std::cout << "Value: {}" << data << std::endl;
        } else {
          const auto &data(msg.into<DatastreamObject>());
          std::cout << "Value: {}" << data << std::endl;
        }
      } else {
        const auto &data(msg.into<PropertyIndividual>());
          std::cout << "Value: {}" << data << std::endl;
      }
    }
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }
}

int main(int argc, char **argv) {
  std::string server_addr = "localhost:50051";
  std::string node_id("aa04dade-9401-4c37-8c6a-d8da15b083ae");
  std::shared_ptr<DeviceGrpc> device = std::make_shared<DeviceGrpc>(server_addr, node_id);

  // Se these paths based on your project structure.
  std::filesystem::path device_individual_interface_file_path =
      "./org.astarte-platform.cpp.get-started.Individual.json";
  std::filesystem::path device_aggregated_interface_file_path =
      "./org.astarte-platform.cpp.get-started.Aggregated.json";
  std::filesystem::path device_property_interface_file_path =
      "./org.astarte-platform.cpp.get-started.Property.json";

  device->add_interface_from_file(device_individual_interface_file_path, 0ms);
  device->add_interface_from_file(device_aggregated_interface_file_path, 0ms);
  device->add_interface_from_file(device_property_interface_file_path, 0ms);

  device->connect();

  do {
    std::this_thread::sleep_for(std::chrono::seconds(1));
  } while (!device->is_connected(std::chrono::milliseconds(100)));

  auto reception_thread = std::jthread(reception_handler, device);

  // ...
  // Here we will operate with the device
  // ...

  device->disconnect();

  std::this_thread::sleep_for(std::chrono::seconds(3));
  std::exit(EXIT_SUCCESS);
}
```

## Streaming some data

Streaming of data could be performed for device owned interfaces of individual or object aggregation
type.

### Streaming individual data

In Astarte interfaces with individual aggregation, each mapping is treated as an independent value
and is managed individually.

The snippet below shows how to send a value that will be inserted into the `"/double_endpoint"`
datastream, that is part of the `"org.astarte-platform.cpp.get-started.Individual"` datastream
interface.

```cpp
// Includes and reception handler

int main(int argc, char **argv) {
  // Instantiate and connect the device

  std::string interface_name("org.astarte-platform.cpp.get-started.Individual");
  std::string path("/double_endpoint");
  Data data(42.5);
  device->send_individual(interface_name, path, data, NULL);

  // Disconnect the device and exit
}
```

### Streaming aggregated data

In Astarte interfaces with object aggregation, Astarte expects the owner to send all of the
interface’s mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object-aggregated interface.
In this example, two different data types will be sent together and will be inserted into the
`"/group_data"` datastream, which is part of the
`"org.astarte-platform.cpp.get-started.Aggregated"` datastream interface.

```cpp
// Includes and reception handler

int main(int argc, char **argv) {
  // Instantiate and connect the device

  std::string interface_name("org.astarte-platform.cpp.get-started.Aggregated");
  std::string common_path("/group_data");
  DatastreamObject data = {
    {"double_endpoint", Data(43.5)},
    {"string_endpoint", Data(std::string("Hello from cpp!"))}
  };
  device->send_object(interface_name, common_path, data, NULL);

  // Disconnect the device and exit
}
```

### Setting and unsetting properties

Interfaces of property type represent a persistent, stateful, synchronized state with no concept of
history or timestamping. From a programming point of view, setting and unsetting properties of
device-owned interface is rather similar to sending messages on datastream interfaces.

The following snippet shows how to set a value that will be inserted into the
`"/sensor0/string_endpoint"` property which is defined by `"/%{sensor_id}/string_endpoint"`
parametric endpoint, that is part of `"org.astarte-platform.cpp.get-started.Property"` device-owned
properties interface.

It should be noted how a property should be marked as unsettable in its interface definition to be
able to use the unsetting method on it.

Set property:
```cpp
// Includes and reception handler

int main(int argc, char **argv) {
  // Instantiate and connect the device

  std::string interface_name("org.astarte-platform.cpp.get-started.Property");
  std::string path("/sensor0/string_endpoint");
  Data data(std::string("some sensor hardware defined info"));
  device->set_property(interface_name, path, data);

  // Disconnect the device and exit
}
```

Unset property:
```cpp
// Includes and reception handler

int main(int argc, char **argv) {
  // Instantiate and connect the device

  std::string interface_name("org.astarte-platform.cpp.get-started.Property");
  std::string path("/sensor0/string_endpoint");
  device->unset_property(interface_name, path);

  // Disconnect the device and exit
}
```
