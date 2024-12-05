<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with Zephyr

Follow this guide to start with the Astarte device SDK for the Zephyr framework.

We will assume you have already set up Zephyr and are starting with a fresh empty project.
Your starting project should initialize networking using an appropriate physical layer and you
should have added a set of TLS certificates appropriate to reach the Astarte servers.

## Add the Astarte device SDK as a dependency

To add this module as a dependency to an application the application's manifest file should be
modified in the following way.
First, a new remote should be added:
```yml
  remotes:
    # ... other remotes ...
    - name: astarte-platform
      url-base: https://github.com/astarte-platform
```
Second, a new entry should be added to the projects list:
```yml
  projects:
    # ... other projects ...
    - name: astarte-device-sdk-zephyr
      remote: astarte-platform
      repo-path: astarte-device-sdk-zephyr.git
      path: astarte-device-sdk-zephyr
      revision: v0.7.1
      west-commands: scripts/west-commands.yml
      import: true
```
Remember to run `west update` after changing the manifest file.

In addition, the Astarte device library `Kconfig` should be added to the `Kconfig` file of the
application.
```
rsource "../../astarte-device-sdk-zephyr/Kconfig"
```
This will add the configuration options of the example module to the application.

Last, install the dependencies for the west extensions required by the Astarte device, by running
this command in your Zephyr workspace.
```bash
pip install -r ./astarte-device-sdk-zephyr/scripts/requirements.txt
```

## Minimal configuration options for the Astarte device

A minimal set of Zephyr functionalities should be enabled for the Astarte device to work.
Modules such as MbedTLS, base64, and MQTT provide the necessary functionality.

```conf
# ... Hardware dependent networking configuration ...

# Astarte device SDK
CONFIG_ASTARTE_DEVICE_SDK=y
CONFIG_ASTARTE_DEVICE_SDK_HOSTNAME="."
CONFIG_ASTARTE_DEVICE_SDK_REALM_NAME="."
CONFIG_ASTARTE_DEVICE_SDK_PAIRING_JWT="."
# Assuming that HTTPs and MQTTs requests can use the same TLS certificate
# The two following tags should correspond to the certificates added by the user
CONFIG_ASTARTE_DEVICE_SDK_HTTPS_CA_CERT_TAG=1
CONFIG_ASTARTE_DEVICE_SDK_MQTTS_CA_CERT_TAG=1
# This tag should correspond to an unused certificate tag.
# The Astarte device will use it to store the client certificate.
CONFIG_ASTARTE_DEVICE_SDK_CLIENT_CERT_TAG=2
# This example will not include permanent storage
CONFIG_ASTARTE_DEVICE_SDK_PERMANENT_STORAGE=n

# Enable logging for application
CONFIG_LOG=y

# Increased stack size
CONFIG_MAIN_STACK_SIZE=16384

# DNS resolver
CONFIG_DNS_RESOLVER=y
CONFIG_DNS_SERVER_IP_ADDRESSES=y
CONFIG_DNS_SERVER1="8.8.8.8" # Google DNS

# Enable entropy generator
CONFIG_ENTROPY_GENERATOR=y

# Enable JSON library
CONFIG_JSON_LIBRARY=y

# Enable base64 encoding and decoding
CONFIG_BASE64=y

# Enable system hashmaps
CONFIG_SYS_HASH_MAP=y

# Sockets
CONFIG_NET_SOCKETS=y
CONFIG_NET_SOCKETS_SOCKOPT_TLS=y

# Enable HTTP client
CONFIG_HTTP_CLIENT=y

# MQTT options
CONFIG_MQTT_LIB=y
CONFIG_MQTT_LIB_TLS=y

# MbedTLS
CONFIG_MBEDTLS=y
CONFIG_MBEDTLS_BUILTIN=y
CONFIG_MBEDTLS_ENABLE_HEAP=y
CONFIG_MBEDTLS_HEAP_SIZE=55000
CONFIG_MBEDTLS_SSL_MAX_CONTENT_LEN=16384
CONFIG_MBEDTLS_PEM_CERTIFICATE_FORMAT=y
CONFIG_MBEDTLS_PK_WRITE_C=y
CONFIG_MBEDTLS_X509_CSR_WRITE_C=y
CONFIG_MBEDTLS_ENTROPY_ENABLED=y
CONFIG_MBEDTLS_ZEPHYR_ENTROPY=y
CONFIG_MBEDTLS_TLS_VERSION_1_2=y
CONFIG_MBEDTLS_CIPHER=y
CONFIG_MBEDTLS_CIPHER_ALL_ENABLED=y
CONFIG_MBEDTLS_SERVER_NAME_INDICATION=y
CONFIG_MBEDTLS_KEY_EXCHANGE_ALL_ENABLED=y
CONFIG_MBEDTLS_HASH_ALL_ENABLED=y
CONFIG_MBEDTLS_ECDH_C=y
CONFIG_MBEDTLS_ECDSA_C=y
CONFIG_MBEDTLS_ECJPAKE_C=y
CONFIG_MBEDTLS_ECP_C=y
CONFIG_MBEDTLS_ECP_ALL_ENABLED=y
```

## Generate a device ID

Each Astarte device is uniquely identified within an Astarte instance using a device ID. Device IDs
can be generated deterministically, starting from user-defined information or randomly.

If you already have a device ID and a credential secret skip to
[Generating the interfaces headers](#generating-the-interfaces-headers).
This step is only useful when registering the device through the APIs using the JWT token.
When registering a device using an alternative method the device ID should be provided by the user.

To generate a random device ID use the function `astarte_device_id_generate_random` as shown below.
```C
#include <astarte_device_sdk/device_id.h>
#include <astarte_device_sdk/result.h>

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    char device_id[ASTARTE_DEVICE_ID_LEN + 1] = { 0 };
    res = astarte_device_id_generate_random(device_id);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
    }

}
```

## Registering a device

For a device to connect to Astarte a registration procedure is required. This registration will
produce a device-specific credential secret that will be used when connecting to Astarte. The Zephyr
Astarte device SDKs provide utilities to perform a device registration directly on the device.
Those utilities require a registration JWT to be loaded on the device. Such JWT should be discarded
following the registration procedure.

This step is only useful when registering the device through the APIs using the JWT token.
Registration of a device can also be performed outside the device in the Astarte instance using
tools such as [astartectl](https://github.com/astarte-platform/astartectl), the
[Astarte dashboard](https://docs.astarte-platform.org/astarte/latest/015-astarte_dashboard.html),
or the dedicated
[Astarte API for device registration](https://docs.astarte-platform.org/astarte/latest/api/index.html?urls.primaryName=Pairing%20API).
The generated credential secret should then be loaded manually on the device.

To generate a credential secret use the function `astarte_pairing_register_device` as shown below.
The JWT should be specified in the Kconfig option `CONFIG_ASTARTE_DEVICE_SDK_PAIRING_JWT`.
```C
#include <astarte_device_sdk/pairing.h>
#include <astarte_device_sdk/result.h>

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    // ... Generate a device ID ...

    int32_t timeout_ms = 3 * MSEC_PER_SEC;
    char cred_secr[ASTARTE_PAIRING_CRED_SECR_LEN + 1] = { 0 };
    res = astarte_pairing_register_device(timeout_ms, device_id, cred_secr, sizeof(cred_secr));
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
    }

}
```

## Generating the interfaces headers

Each device should define a set of interfaces, defined as introspection, that will be used to
communicate with the Astarte instance.

Since the Astarte interfaces are defined in JSON files, we provide a Python script that
automatically performs the conversion to a compatible C header. It has been configured as a west
extension for this Zephyr module.

Assuming all the interface files are contained in a `json_interfaces` folder it can be run as
follows.
```bash
west generate-interfaces --output_dir ./generated_interfaces ./json_interfaces
```
The `generated_interfaces` folder should be added to the include search path in the CMake
configuration for your application.
Furthermore, the sources in the `generated_interfaces` folder should be added to your application
CMake target.
```
FILE(GLOB generated_interfaces_src ${CMAKE_CURRENT_LIST_DIR}/../generated_interfaces/*.c)
target_sources(app PRIVATE ${generated_interfaces_src})
target_include_directories(app PRIVATE ${CMAKE_CURRENT_LIST_DIR}/../generated_interfaces)
```

> NOTE: Remember that the interfaces should be installed in the Astarte
> instance for the device to use them.

## Instantiating a device

Now that we obtained a credential secret we can create a new device instance.

The Astarte device SDK uses callbacks to communicate to the user that some event has occurred.
Such callbacks should be configured before instantiating the device and connecting to Astarte.
Several callbacks can be optionally configured. A connection callback, an individual data received
callback, an object data received callback, and set property received callback, an unset property
received callback, and a disconnection callback.

```C
#include <astarte_device_sdk/interface.h>
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/result.h>

#include "generated_interfaces.h"

static K_SEM_DEFINE(device_connected, 0, 1);

static void connection_callback(astarte_device_connection_event_t event) {
    LOG_INF("Astarte device connected.");
	k_sem_give(&device_connected);
}
static void disconnection_callback(astarte_device_disconnection_event_t event) {
    LOG_INF("Astarte device disconnected");
    k_sem_take(&device_connected, K_NO_WAIT);
}

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    // ... generate device ID and register the device with Astarte ...

    const astarte_interface_t *interfaces[] = {
        &org_astarteplatform_zephyr_examples_DeviceAggregate,
        &org_astarteplatform_zephyr_examples_DeviceDatastream,
        &org_astarteplatform_zephyr_examples_DeviceProperty,
        &org_astarteplatform_zephyr_examples_ServerAggregate,
        &org_astarteplatform_zephyr_examples_ServerDatastream,
        &org_astarteplatform_zephyr_examples_ServerProperty
	};

    astarte_device_config_t device_config = { 0 };
    device_config.http_timeout_ms = 3000;
    device_config.mqtt_connection_timeout_ms = 3000;
    device_config.mqtt_poll_timeout_ms = 500;
    device_config.connection_cbk = connection_callback;
    device_config.disconnection_cbk = disconnection_callback;
    device_config.interfaces = interfaces;
    device_config.interfaces_size = ARRAY_SIZE(interfaces);
    memcpy(device_config.device_id, device_id, sizeof(device_id));
    memcpy(device_config.cred_secr, cred_secr, sizeof(cred_secr));

    astarte_device_handle_t device = NULL;
    res = astarte_device_new(&device_config, &device);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
    }

}
```

## Connecting and polling the device

After device initialization, the device will need to be connected explicitly and polled regularly
to ensure the processing of MQTT messages.
Ideally, a separate thread should be used for polling and transmission.
```C
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/result.h>

// ... semaphores and callbacks ...

K_THREAD_STACK_DEFINE(device_rx_thread_stack_area, 12288);
static struct k_thread device_rx_thread_data;
static void device_rx_thread_entry_point(void *device_handle, void *unused1, void *unused2);

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    // ... generate device ID, register and instantiate the device ...

    k_thread_create(&device_rx_thread_data, device_rx_thread_stack_area,
        K_THREAD_STACK_SIZEOF(device_rx_thread_stack_area), device_rx_thread_entry_point,
        (void *) device, NULL, NULL, 0, 0, K_NO_WAIT);

    while (k_sem_count_get(&device_connected) == 0) {
        k_sleep(K_MSEC(200));
    }

}

static void device_rx_thread_entry_point(void *device_handle, void *unused1, void *unused2)
{
    astarte_result_t res = ASTARTE_RESULT_OK;

    astarte_device_handle_t device = (astarte_device_handle_t) device_handle;
    res = astarte_device_connect(device);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
        return;
    }

    while (true) {
        res = astarte_device_poll(device);
        if (res != ASTARTE_RESULT_OK) {
			LOG_INF("Err: '%s'.", astarte_result_to_name(res));
            return;
        }
        k_sleep(K_MSEC(100));
    }
}
```

## Streaming data

Streaming of data could be performed for device owned interfaces of `individual` or `object`
aggregation type.

### Streaming individual data

In Astarte interfaces with `individual` aggregation, each mapping is treated as an independent value
and is managed individually.

The snippet below shows how to send a value that will be inserted into the `"/boolean_endpoint"`
datastream, that is part of `"org.astarteplatform.zephyr.examples.DeviceDatastream"` datastream
interface.

```C
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/individual.h>
#include <astarte_device_sdk/result.h>

// ... semaphores, callbacks and transmission thread ...

K_THREAD_STACK_DEFINE(device_tx_thread_stack_area, 8192);
static struct k_thread device_tx_thread_data;
static void device_tx_thread_entry_point(void *device_handle, void *unused1, void *unused2);

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    // ... generate device ID, register, instantiate and connect the device ...

    k_thread_create(&device_tx_thread_data, device_tx_thread_stack_area,
        K_THREAD_STACK_SIZEOF(device_tx_thread_stack_area), device_tx_thread_entry_point,
        (void *) device, NULL, NULL, 0, 0, K_NO_WAIT);

	while(true) {
        k_sleep(K_MSEC(100));
    }

}

static void device_tx_thread_entry_point(void *device_handle, void *unused1, void *unused2)
{
    astarte_result_t res = ASTARTE_RESULT_OK;
    astarte_device_handle_t device = (astarte_device_handle_t) device_handle;

    const char *interface_name = org_astarteplatform_zephyr_examples_DeviceDatastream.name;
    int64_t timestamp = 1714748755;

    astarte_individual_t boolean_individual = astarte_individual_from_boolean(true);
    const char boolean_path[] = "/boolean_endpoint";
    res = astarte_device_stream_individual(
        device, interface_name, boolean_path, boolean_individual, &timestamp);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
        return;
    }
}
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object-aggregated interface. In this example,
fourteen different data types will be sent together and will be inserted into the `"/sensor24"`
datastream which is defined by the `"/%{sensor_id}"` endpoint, which is part of
`"org.astarteplatform.zephyr.examples.DeviceDatastream"` datastream interface.

```C
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/object.h>
#include <astarte_device_sdk/result.h>

// ... semaphores, callbacks, transmission and reception thread, main program ...

static void device_tx_thread_entry_point(void *device_handle, void *unused1, void *unused2)
{
    astarte_result_t res = ASTARTE_RESULT_OK;
    astarte_device_handle_t device = (astarte_device_handle_t) device_handle;

    const uint8_t utils_binary_blob_data[8] = { 0x53, 0x47, 0x56, 0x73, 0x62, 0x47, 0x38, 0x3d };
    static const uint8_t binblob_1[8] = { 0x53, 0x47, 0x56, 0x73, 0x62, 0x47, 0x38, 0x3d };
    static const uint8_t binblob_2[5] = { 0x64, 0x32, 0x39, 0x79, 0x62 };
    const uint8_t *const utils_binary_blobs_data[2] = { binblob_1, binblob_2 };
    const size_t utils_binary_blobs_sizes_data[2] = { ARRAY_SIZE(binblob_1), ARRAY_SIZE(binblob_2) };
    const bool utils_boolean_data = true;
    const bool utils_boolean_array_data[3] = { true, false, true };
    const int64_t utils_unix_time_data = 1710940988984;
    const int64_t utils_unix_time_array_data[1] = { 1710940988984 };
    const double utils_double_data = 15.42;
    const double utils_double_array_data[2] = { 1542.25, 88852.6 };
    const int32_t utils_integer_data = 42;
    const int32_t utils_integer_array_data[3] = { 4525, 0, 11 };
    const int64_t utils_longinteger_data = 8589934592;
    const int64_t utils_longinteger_array_data[3] = { 8589930067, 42, 8589934592 };
    const char utils_string_data[] = "Hello world!";
    const char *const utils_string_array_data[2] = { "Hello ", "world!" };

    astarte_object_entry_t entries[] = {
        astarte_object_entry_new("binaryblob_endpoint",
            astarte_individual_from_binaryblob(
                (void *) utils_binary_blob_data, ARRAY_SIZE(utils_binary_blob_data))),
        astarte_object_entry_new("binaryblobarray_endpoint",
            astarte_individual_from_binaryblob_array((const void **) utils_binary_blobs_data,
                (size_t *) utils_binary_blobs_sizes_data, ARRAY_SIZE(utils_binary_blobs_data))),
        astarte_object_entry_new(
            "boolean_endpoint", astarte_individual_from_boolean(utils_boolean_data)),
        astarte_object_entry_new("booleanarray_endpoint",
            astarte_individual_from_boolean_array(
                (bool *) utils_boolean_array_data, ARRAY_SIZE(utils_boolean_array_data))),
        astarte_object_entry_new(
            "datetime_endpoint", astarte_individual_from_datetime(utils_unix_time_data)),
        astarte_object_entry_new("datetimearray_endpoint",
            astarte_individual_from_datetime_array(
                (int64_t *) utils_unix_time_array_data, ARRAY_SIZE(utils_unix_time_array_data))),
        astarte_object_entry_new(
            "double_endpoint", astarte_individual_from_double(utils_double_data)),
        astarte_object_entry_new("doublearray_endpoint",
            astarte_individual_from_double_array(
                (double *) utils_double_array_data, ARRAY_SIZE(utils_double_array_data))),
        astarte_object_entry_new(
            "integer_endpoint", astarte_individual_from_integer(utils_integer_data)),
        astarte_object_entry_new("integerarray_endpoint",
            astarte_individual_from_integer_array(
                (int32_t *) utils_integer_array_data, ARRAY_SIZE(utils_integer_array_data))),
        astarte_object_entry_new(
            "longinteger_endpoint", astarte_individual_from_longinteger(utils_longinteger_data)),
        astarte_object_entry_new("longintegerarray_endpoint",
            astarte_individual_from_longinteger_array((int64_t *) utils_longinteger_array_data,
                ARRAY_SIZE(utils_longinteger_array_data))),
        astarte_object_entry_new(
            "string_endpoint", astarte_individual_from_string(utils_string_data)),
        astarte_object_entry_new("stringarray_endpoint",
            astarte_individual_from_string_array(
                (const char **) utils_string_array_data, ARRAY_SIZE(utils_string_array_data))),
    };

    res = astarte_device_stream_aggregated(device,
        org_astarteplatform_zephyr_examples_DeviceAggregate.name, "/sensor24", entries,
        ARRAY_SIZE(entries), NULL);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
        return;
    }
}
```

## Setting and unsetting properties

Interfaces of the `property` type represent a persistent, stateful, synchronized state with no
concept of history or timestamping. From a programming point of view, setting and unsetting
properties of device-owned interfaces is rather similar to sending messages on datastream
interfaces.

In this simple get started persistency for the properties has been disabled. See the more complete
code examples in the GitHub repository for more information on how to set up the appropriate flash
partition.

## Disconnecting the device

The Astarte device can be gracefully disconnected by Astarte using the disconnect function.
This function will trigger a callback to one of the user-defined functions.

```C
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/result.h>

void main(void) {
	astarte_result_t res = ASTARTE_RESULT_OK;

    // ... generate device ID, register, instantiate and connect the device ...

    res = astarte_device_disconnect(device);
    if (res != ASTARTE_RESULT_OK) {
		LOG_INF("Err: '%s'.", astarte_result_to_name(res));
        return;
    }
}
```
