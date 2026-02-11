<!--
Copyright 2025 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with C++

Follow this guide to start with the Astarte device SDK for C++. This guide covers setting up a basic C++ application, creating a device, connecting it to a local Astarte instance, and transmitting data.

You can connect your device using one of two transport layers:
- MQTT: Connects directly to the Astarte broker. This is the standard method for standalone devices.
- gRPC: Connects to an [Astarte message hub](github.com/astarte-platform/astarte-message-hub). This is useful for complex architectures where multiple processes share a single connection.

## Before you begin

### Local Astarte instance

This guide focuses on creating a device and connecting it to an Astarte instance. If you do not have access to an Astarte instance, you can set one up following the [Astarte quick instance guide](https://docs.astarte-platform.org/device-sdks/common/astarte_quick_instance.html).

This guide assumes you have access to an Astarte instance (remote or on a host machine connected to the same LAN as your device) and the Astarte dashboard for a realm.

The next steps involve installing the required interfaces and registering a new device on Astarte using the dashboard. You can perform the same operations using `astartectl` and the access token generated in the Astarte quick instance guide.

### Installing the required interfaces

First, install the interfaces the device uses to send and receive data within the Astarte instance. This guide demonstrates how to stream individual and aggregated data, as well as how to set and unset properties. This requires three separate interfaces.

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
Finally, the definition of the property interface:
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

To install the three interfaces in the Astarte instance, open the Astarte dashboard, navigate to the interfaces tab, and click **install new interface**. You can copy and paste the JSON content for each interface into the editor, overwriting the default template.

### Registering the device

Devices must be registered with Astarte before their first connection. You can do this in two ways:
- manually registering the device on Astarte to obtain a credentials secret, then transferring it to the device.
- using the registration utilities provided by the Astarte message hub (gRPC) or Astarte device (MQTT). These utilities use a registration JWT issued by Astarte to register the device automatically before the first connection.

To keep this guide simple, we will use the first method.

To register a new device, open the dashboard and navigate to the devices tab. Click register a new device. You can input a custom device ID or generate a random one. For example, you could use the device ID `MFVgjjP2Tt6RbT_wKOI0VA`.

Click **register device** to complete the process and receive a credentials secret. The device uses this secret to authenticate with Astarte. Save this secret securely, as you will need it in the next steps.

### Installing and configuring the Astarte message hub (only gRPC)

The Astarte device SDK for C++ connects to Astarte exclusively through a message hub instance. The [Astarte message hub](https://github.com/astarte-platform/astarte-message-hub) allows multiple nodes to access Astarte through a single Astarte device. Each C++ device connects to the message hub as a node, which forwards messages to Astarte.

The Astarte message hub is a Rust project available on [crates.io](https://crates.io/crates/astarte-message-hub). You can install it from the official Rust package index using `cargo`.

Configure the Astarte message hub to use the device registered in the previous step. If you used the Astarte quick instance guide, the pairing URL is `http://api.astarte.<HOST IP ADDRESS>.nip.io/pairing` and the realm name is `test`.

Note that the local Astarte instance does not support TLS. Therefore, you must configure the Astarte message hub to ignore certificate errors by adding the following to the `toml` configuration file:
```toml
[astarte]
ignore_ssl = true
```

## Creating a CMake project

CMake is the preferred build system for many C++ projects. Ensure it is installed on your machine before proceeding.

Start by creating a `CMakeLists.txt` file with the following content:
```
cmake_minimum_required(VERSION 3.15)
project(GetStarted)
include(FetchContent)

# Configure the Astarte device
set(ASTARTE_TRANSPORT_GRPC ON CACHE BOOL "Select gRPC transport" FORCE)
set(ASTARTE_GRPC_VERSION "1.69.0" CACHE STRING "Set gRPC version")

# Import the Astarte device
FetchContent_Declare(
    astarte_device_sdk
    GIT_REPOSITORY https://github.com/astarte-platform/astarte-device-sdk-cpp.git
    GIT_TAG v0.9.0
)
FetchContent_MakeAvailable(astarte_device_sdk)

add_executable(get_started_app main.cpp)
target_link_libraries(get_started_app astarte_device_sdk)
```
Remember to enable or disable the `ASTARTE_TRANSPORT_GRPC` option to select gRPC or MQTT.

Next, create a `main.cpp` file for the source code.

Build the project using standard CMake commands:
```
mkdir build
cd build
cmake -DCMAKE_POLICY_VERSION_MINIMUM=3.15 ..
make -j $(nproc --all)
```

## Instantiating and connecting a device

Now you can write the device application source code. First we will create an Astarte device using the gRPC or MQTT configuration.

### Option A: Using MQTT

When using MQTT, you must configure the device with the Realm, Device ID, Credentials Secret, and Pairing URL. You also need a local directory (`store_dir`) for persistence.

```cpp
#include <cstdlib>
#include <iostream>
#include <thread>
#include <chrono>
#include <filesystem>

#include "astarte_device_sdk/mqtt/config.hpp"
#include "astarte_device_sdk/mqtt/device_mqtt.hpp"
#include "astarte_device_sdk/data.hpp"
#include "astarte_device_sdk/msg.hpp"

using astarte::device::Data;
using astarte::device::mqtt::Config;
using astarte::device::mqtt::DeviceMqtt;
using astarte::device::Message;

using namespace std::chrono_literals;

// [Reception Handler Code - see below]

int main(int argc, char **argv) {
    // 1. Configuration variables
    // Replace these with your actual values
    std::string realm = "test";
    std::string device_id = "YOUR_DEVICE_ID";
    std::string credentials_secret = "YOUR_CREDENTIALS_SECRET";
    std::string pairing_url = "http://api.astarte.localhost/pairing";
    std::string store_dir = "./astarte_persist";

    // Create persistence directory if it doesn't exist
    std::filesystem::create_directory(store_dir);

    // 2. Configure the device
    auto config = Config::with_credential_secret(
        realm,
        device_id,
        credentials_secret,
        pairing_url,
        store_dir
    ).ignore_ssl_errors(); // Only needed for local instances without valid certs

    // 3. Create the device instance
    auto device_result = DeviceMqtt::create(std::move(config));
    if (!device_result) {
        std::cerr << "Failed to create device: " << device_result.error().what() << std::endl;
        return EXIT_FAILURE;
    }
    auto& device = device_result.value();

    // 4. Load Interfaces
    device.add_interface_from_file("./org.astarte-platform.cpp.get-started.Individual.json");
    device.add_interface_from_file("./org.astarte-platform.cpp.get-started.Aggregated.json");
    device.add_interface_from_file("./org.astarte-platform.cpp.get-started.Property.json");

    // 5. Connect
    if (auto res = device.connect(); !res) {
         std::cerr << "Connection failed: " << res.error().what() << std::endl;
         return EXIT_FAILURE;
    }

    // Wait for connection
    while (!device.is_connected()) {
        std::this_thread::sleep_for(1s);
    }
    std::cout << "Device connected via MQTT!" << std::endl;

    // [Application Logic]
    // ... use 'device' to send data here ...

    device.disconnect();
    return EXIT_SUCCESS;
}
```

### Option B: Using gRPC (Message Hub)

When using gRPC, the device connects to a local Astarte message hub. Ensure the Astarte message hub is running and configured with your device credentials.

```cpp
#include <cstdlib>
#include <iostream>
#include <thread>
#include <chrono>
#include <filesystem>

// Headers for gRPC
#include "astarte_device_sdk/device_grpc.hpp"
#include "astarte_device_sdk/data.hpp"
#include "astarte_device_sdk/msg.hpp"

using astarte::device::Data;
using astarte::device::grpc::DeviceGrpc;
using astarte::device::Message;

using namespace std::chrono_literals;

// [Reception Handler Code - see below]

int main(int argc, char **argv) {
    // 1. Configuration
    std::string server_addr = "localhost:50051"; // Message Hub address
    std::string node_id = "aa04dade-9401-4c37-8c6a-d8da15b083ae"; // Arbitrary Node ID

    // 2. Instantiate Device
    auto device = std::make_shared<DeviceGrpc>(server_addr, node_id);

    // 3. Load Interfaces
    device->add_interface_from_file("./org.astarte-platform.cpp.get-started.Individual.json");
    device->add_interface_from_file("./org.astarte-platform.cpp.get-started.Aggregated.json");
    device->add_interface_from_file("./org.astarte-platform.cpp.get-started.Property.json");

    // 4. Connect
    device->connect();

    // Wait for connection
    while (!device->is_connected()) {
        std::this_thread::sleep_for(1s);
    }
    std::cout << "Device connected via gRPC!" << std::endl;

    // [Application Logic]
    // ... use 'device' to send data here ...

    device->disconnect();
    return EXIT_SUCCESS;
}
```

### Common: Reception Handler

Regardless of the transport, you can use a thread to poll for incoming messages.

```cpp
// Add appropriate includes for your chosen transport (PropertyIndividual, etc.)
// ...

void reception_handler(std::stop_token token, auto& device) {
  while (!token.stop_requested()) {
    // For MQTT use device.poll_incoming, for gRPC pointer use device->poll_incoming
    // This example assumes a reference or pointer wrapper handling the syntax
    auto incoming = device.poll_incoming(std::chrono::milliseconds(100));

    if (incoming.has_value()) {
      Message msg(incoming.value());
      std::cout << "Received message on interface: " << msg.get_interface() << std::endl;
      // Handle data...
    }
  }
}
```

## Streaming data

You can stream data using device-owned interfaces of either individual or object aggregation types.

### Streaming individual data

In Astarte interfaces with individual aggregation, each mapping is treated as an independent value and managed individually.

The snippet below demonstrates sending a value to the `/double_endpoint` datastream, which is part of the `org.astarte-platform.cpp.get-started.Individual` datastream interface.

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

In Astarte interfaces with object aggregation, Astarte expects the owner to send all interface mappings simultaneously, packed into a single message.

The snippet below demonstrates sending a value for an object-aggregated interface. In this example, two different data types are sent together to the `/group_data` datastream, which is part of the `org.astarte-platform.cpp.get-started.Aggregated` datastream interface.

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

Property interfaces represent a persistent, stateful, synchronized state without history or timestamping. Programmatically, setting and unsetting properties on a device-owned interface is similar to sending messages on datastream interfaces.

The snippet below demonstrates setting a value for the `/sensor0/string_endpoint` property. This property is defined by the `/%{sensor_id}/string_endpoint` parametric endpoint within the `org.astarte-platform.cpp.get-started.Property` device-owned properties interface.

Note: to use the unsetting method, the property must be marked with allow_unset: true in its interface definition.

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
