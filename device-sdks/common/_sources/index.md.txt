<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

```{toctree}
:hidden: true
:maxdepth: 1
get_started.md
astarte_quick_instance.md
features_def.md
api_docs.md
```

# Astarte device SDKs

## Introduction

Astarte Device SDKs are ready to use libraries that provide communication and pairing primitives.
They allow to connect any device to an Astarte instance.
While an SDK is not strictly required to connect an application to Astarte using MQTT, it enables
rapid development and a pleasant developer experience.

## Transport layer

### MQTT

The traditional way for an Astarte device to connect to an Astarte cloud instance is by implementing
the [Astarte MQTT v1 Protocol](https://docs.astarte-platform.org/astarte/latest/080-mqtt-v1-protocol.html).
Using this protocol each SDK device connects directly to Astarte cloud. This is ideal when interaction
with Astarte is performed by a single application contained within a single hardware device.

![Astarte device direct MQTT architecture](_static/transport_mqtt_direct.svg)

### gRPC

An additonal use case is when multiple hardware device or software services share the same network
connection and should interact with Astarte in an independent manner.
In this case the Astarte message hub may be used as a gateway, and each SDK will connect to Astarte
through it.
In this case each Astarte library will act as an independend message hub node. While the message
hub will manage the connection to the cloud using MQTT.

![Astarte message hub gRPC architecture](_static/transport_grpc_msghub.svg)

## Supported languages and platforms

To make Astarte a truly cross platform service we make available a set of SDKs written in different
languages and for different plaforms.

At the moment the following SDKs are available:

| Language | Platform | Transport | Source code | Documentation | Guide |
| -------- | -------- | --------- | ----------- | ------------- | ----- |
| **C** | Espressif | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-esp32) | [API docs](https://docs.astarte-platform.org/device-sdks/esp32/latest/api/) | [Get started](get_started/c_esp32.md) |
| **C** | Zephyr | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-zephyr) | [API docs](https://docs.astarte-platform.org/device-sdks/zephyr/latest/api/) | [Get started](get_started/zephyr.md) |
| **C++** | Linux/Windows | gRPC | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-cpp) | | [Get started](get_started/cpp.md) |
| **C++** | Qt5 | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-qt5) | | [Get started](get_started/cpp_qt5.md) |
| **C#** |  | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-csharp) | [API docs](https://docs.astarte-platform.org/device-sdks/csharp/snapshot/api/) | [Get started](get_started/csharp.md) |
| **Elixir** |  | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-elixir) | | [Get started](get_started/elixir.md) |
| **Go** |  | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-go) | [API docs](https://pkg.go.dev/github.com/astarte-platform/astarte-device-sdk-go) | [Get started](get_started/go.md) |
| **Java** | Android/Generic  | MQTT | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-java) | [API docs](https://docs.astarte-platform.org/device-sdks/java/latest/api/) | [Get started](get_started/java_android.md) |
| **Python** |  | MQTT + gRPC | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-python) | [API docs](https://docs.astarte-platform.org/device-sdks/python/latest/api/) | [Get started](get_started/python.md) |
| **Rust** | std | MQTT + gRPC | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-rust) | [API docs](https://docs.rs/astarte-device-sdk/latest/astarte_device_sdk/) | [Get started](get_started/rust.md) |

Further languages and platforms will be supported in the near future.
[Requests for new SDKs](https://github.com/astarte-platform/astarte/issues) are welcome.

## Notes

Astarte device SDKs should not be confused with Astarte clients, as they are not meant for
communication with the Astarte REST APIs. If one is interested in an abstraction layer on top of the
existing Astarte REST APIs instead, an optional Astarte client (such as
[astarte-go](https://github.com/astarte-platform/astarte-go) ) is to be used.
