<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

```{toctree}
:hidden: true
:maxdepth: 1
get_started.md
features_def.md
api_docs.md
```

# Astarte device SDKs

## Introduction

Astarte Device SDKs are ready to use libraries that provide communication and pairing primitives.
They allow to connect any device to an Astarte instance.
While an SDK is not strictly required to connect an application to Astarte using MQTT, it enables
rapid development and a pleasant developer experience.

Astarte Device SDKs should not be confused with client SDKs, as they are not meant for client to
device communications. If one is interested in an abstraction layer on top of existing APIs instead,
an optional Astarte Client SDK (such as
[astarte-go](https://github.com/astarte-platform/astarte-go) ) is to be used.

Under the hood Astarte Device SDKs make use of MQTT, BSON, HTTP, persistence and crypto libraries
to implement [Astarte MQTT v1 Protocol](https://docs.astarte-platform.org/astarte/latest/080-mqtt-v1-protocol.html)
and all the other useful features.

They can be easily integrated into new or existing IoT projects written in any of the supported
languages or platforms.

At the moment the following SDKs are available:

| Language | Platform | Source code | Documentation | Guide |
| -------- | -------- | ----------- | ------------- | ----- |
| **C** | Espressif | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-esp32) | [API docs](https://docs.astarte-platform.org/device-sdks/esp32/latest/api/) | [Get started](get_started/c_esp32.md) |
| **C** | Zephyr | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-zephyr) | [API docs](https://docs.astarte-platform.org/device-sdks/zephyr/latest/api/) | [Get started](get_started/zephyr.md) |
| **C++** | Qt5 | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-qt5) | | [Get started](get_started/cpp_qt5.md) |
| **C#** | | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-csharp) | [API docs](https://docs.astarte-platform.org/device-sdks/csharp/snapshot/api/) | [Get started](get_started/csharp.md) |
| **Elixir** | | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-elixir) | | [Get started](get_started/elixir.md) |
| **Go** | | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-go) | [API docs](https://pkg.go.dev/github.com/astarte-platform/astarte-device-sdk-go) | [Get started](get_started/go.md) |
| **Java** | Android/Generic | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-java) | [API docs](https://docs.astarte-platform.org/device-sdks/java/latest/api/) | [Get started](get_started/java_android.md) |
| **Python** | | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-python) | [API docs](https://docs.astarte-platform.org/device-sdks/python/latest/api/) | [Get started](get_started/python.md) |
| **Rust** | | [GitHub](https://github.com/astarte-platform/astarte-device-sdk-rust) | [API docs](https://docs.rs/astarte-device-sdk/latest/astarte_device_sdk/) | [Get started](get_started/rust.md) |

Further languages and platforms will be supported in the near future.
[Requests for new SDKs](https://github.com/astarte-platform/astarte/issues) are welcome.
