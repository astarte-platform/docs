<!--
Copyright 2024 SECO Mind Srl

SPDX-License-Identifier: Apache-2.0
-->

# Get started with Zephyr

Follow this guide to start with the Astarte device SDK for the Zephyr framework. We will guide you
through setting up a very basic Zephyr application creating a device on a board of your choice,
connecting it to a local Astarte instance and transmitting some data.

## Before you begin

### Local Astarte instance

This get started will focus on creating a device and connecting it to an Astarte instance.
If you don't have access to an Astarte instance you can easily set up one following our
[Astarte quick instance guide](https://docs.astarte-platform.org/device-sdks/common/astarte_quick_instance.html).

From here on we will assume you have access to an Astarte instance, remote or on a host machine
connected to the same LAN where your device will be connected.
Furthermore, we will assume you have access to the Astarte dashboard for a realm.
The next steps will install the required interfaces and register a new device on Astarte using the
dashboard. The same operations could be performed using `astartectl` and the access token generated
in the Astarte quick instance guide.

### Installing the required interfaces

The interfaces that our device will use must first be installed within the Astarte instance.
In this guide we will show how to stream individual and aggregated data as well as how to set and
unset properties. As a consequence we will need three separated interfaces, one for each data type.

The following is the definition of the individually aggregated interface:
```json
{
    "interface_name": "org.astarte-platform.zephyr.get-started.Individual",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "ownership": "device",
    "description": "Individual interface for the get-started of the Astarte device SDK for Zephyr.",
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
    "interface_name": "org.astarte-platform.zephyr.get-started.Aggregated",
    "version_major": 0,
    "version_minor": 1,
    "type": "datastream",
    "aggregation": "object",
    "ownership": "device",
    "description": "Aggregated interface for the get-started of the Astarte device SDK for Zephyr.",
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
    "interface_name": "org.astarte-platform.zephyr.get-started.Property",
    "version_major": 0,
    "version_minor": 1,
    "type": "properties",
    "ownership": "device",
    "description": "Property interface for the get-started of the Astarte device SDK for Zephyr.",
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
With the Astarte device SDK for Zephyr this can be achieved in two ways:
- By registering the device on Astarte manually, obtaining a credentials secret and transfering it
  on the device.
- By using the included registration utilities provided by the SDK. Those utilities can make use of
  a registration JWT issued by Astarte and register the device automatically before the first
  connection.

To keep this guide as simple as possible we will use the first method, as a device can be registered
using the Astarte dashboard with a couple of clicks.

To install a new device start by opening the dashboard and navigate to the devices tab.
Click on register a new device, there you can input your own device ID or generate a random one.
For example you could use the device ID `MFVgjjP2Tt6RbT_wKOI0VA`.
Click on register device, this will register the device an give you a credentials secret.
The credentials secret will be used by the device to authenticate with Astarte.
Copy it somewhere safe as it will be used in the next steps.

## Creating a Zephyr RTOS project

This library is dependent on the [Zephyr RTOS](https://zephyrproject.org/) project.
If you are not familiar with Zephyr we suggest checking out their
[documentation](https://docs.zephyrproject.org/latest/index.html).
We will assume you have already followed at least the
[getting started guide](https://docs.zephyrproject.org/latest/develop/getting_started/index.html)
from Zephyr and have installed the latest Zephyr SDK.

Set up a new Zephyr project using the standard procedure.
First create a new folder for your project, we will use `~/astartezephyrproject`. Create a
Python venv within and install west.
```sh
python3 -m venv ~/astartezephyrproject/.venv
source ~/astartezephyrproject/.venv/bin/activate
pip install west
cd ~/astartezephyrproject
```
Next, create a new manifest file for your project with the basic dependencies.
We will add Zephyr and the Astarte device as dependencies, importing also all the Zephyr
dependencies for simplicity.
```yaml
manifest:
  remotes:
    - name: zephyrproject-rtos
      url-base: https://github.com/zephyrproject-rtos
    - name: astarte-platform
      url-base: https://github.com/astarte-platform
  projects:
    - name: zephyr
      remote: zephyrproject-rtos
      revision: v4.1.0
      import: true
    - name: astarte-device-sdk-zephyr
      remote: astarte-platform
      repo-path: astarte-device-sdk-zephyr.git
      path: astarte-device-sdk-zephyr
      revision: v0.9.0
```
Save the `west.yml` manifest in a `get_started_app` folder within the `astartezephyrproject`.
We can then initialize our project with west.
```sh
west init -l get_started_app
west update
west zephyr-export
pip install -r ~/astartezephyrproject/zephyr/scripts/requirements.txt
pip install -r ~/astartezephyrproject/astarte-device-sdk-zephyr/scripts/requirements.txt
```
This will initialize your workspace, downloading all required dependencies.
You will now need to create a valid Zephyr application scheleton in your `get_started_app`
folder. If you are unsure how to do it check out the
[application development](https://docs.zephyrproject.org/latest/develop/application/index.html)
section of the Zephyr documentation.
You will need at least a `CMakeList.txt`, a `prj.conf`, and a `src/main.c` files.

Once you correctly filled in those files with some placeholder code and configurations
you will be able to build your application using the command:
```sh
west build -p -b <YOUR BOARD> ./get_started_app/
```

## About networking layers

Your board should include some kind of physical networking layer in order to connect to the
internet. We expect you to configure your application for the specific physical layer of your board.
In the following sections we will assume your board can connect through Ethernet.

## Adding minimal configuration options for the Astarte device

A minimal set of Zephyr functionalities should be enabled for the Astarte device to work.
Modules such as MbedTLS, base64, and MQTT provide the necessary functionality.

Copy and paste the following Kconfig into the `prj.conf` file, replacing the `<ASTARTE HOSTNAME>`
and `<REALM NAME>` with appropriate values for your Astarte instance.
If you used the Astarte quick instance to set up Astarte those values will be
`api.astarte.<HOST IP ADDRESS>.nip.io` and `test`.
```kconfig
# Astarte device SDK
CONFIG_ASTARTE_DEVICE_SDK=y
CONFIG_ASTARTE_DEVICE_SDK_HOSTNAME="<ASTARTE HOSTNAME>"
CONFIG_ASTARTE_DEVICE_SDK_REALM_NAME="<REALM NAME>"
CONFIG_ASTARTE_DEVICE_SDK_DEVELOP_USE_NON_TLS_HTTP=y
CONFIG_ASTARTE_DEVICE_SDK_DEVELOP_USE_NON_TLS_MQTT=y
CONFIG_ASTARTE_DEVICE_SDK_CLIENT_CERT_TAG=1
# For simplicity this example will not include permanent storage
CONFIG_ASTARTE_DEVICE_SDK_PERMANENT_STORAGE=n

# Increased stack size
CONFIG_MAIN_STACK_SIZE=16384
# Enable base64 encoding and decoding
CONFIG_BASE64=y
# Enable system hashmaps
CONFIG_SYS_HASH_MAP=y
# Enable JSON library
CONFIG_JSON_LIBRARY=y
# Enable entropy generator
CONFIG_ENTROPY_GENERATOR=y
# DNS resolver
CONFIG_DNS_RESOLVER=y
CONFIG_DNS_SERVER_IP_ADDRESSES=y
CONFIG_DNS_SERVER1="8.8.8.8" # Google DNS
# MbedTLS
CONFIG_MBEDTLS=y
CONFIG_MBEDTLS_BUILTIN=y
CONFIG_MBEDTLS_ENABLE_HEAP=y
CONFIG_MBEDTLS_HEAP_SIZE=55000
CONFIG_MBEDTLS_SSL_MAX_CONTENT_LEN=16384
CONFIG_MBEDTLS_PEM_CERTIFICATE_FORMAT=y
CONFIG_MBEDTLS_PK_WRITE_C=y # Required for PEM writing
CONFIG_MBEDTLS_X509_CSR_WRITE_C=y
CONFIG_MBEDTLS_ENTROPY_C=y
CONFIG_MBEDTLS_ENTROPY_POLL_ZEPHYR=y
CONFIG_MBEDTLS_TLS_VERSION_1_2=y
CONFIG_MBEDTLS_CIPHER=y
CONFIG_MBEDTLS_CIPHER_ALL_ENABLED=y
CONFIG_MBEDTLS_SERVER_NAME_INDICATION=y
CONFIG_MBEDTLS_KEY_EXCHANGE_ALL_ENABLED=y
CONFIG_MBEDTLS_HASH_ALL_ENABLED=y
CONFIG_MBEDTLS_CTR_DRBG_ENABLED=y
CONFIG_MBEDTLS_HMAC_DRBG_ENABLED=y
CONFIG_MBEDTLS_CHACHAPOLY_AEAD_ENABLED=y
CONFIG_MBEDTLS_ECDH_C=y
CONFIG_MBEDTLS_ECDSA_C=y
CONFIG_MBEDTLS_ECJPAKE_C=y
CONFIG_MBEDTLS_ECP_C=y
CONFIG_MBEDTLS_ECP_ALL_ENABLED=y
CONFIG_MBEDTLS_GENPRIME_ENABLED=y
CONFIG_MBEDTLS_PKCS5_C=y
CONFIG_MBEDTLS_X509_CRL_PARSE_C=y
CONFIG_MBEDTLS_X509_CSR_PARSE_C=y
CONFIG_MBEDTLS_X509_CSR_WRITE_C=y
# Enable networking
CONFIG_NETWORKING=y
# Sockets
CONFIG_NET_SOCKETS=y
CONFIG_NET_SOCKETS_POLL_MAX=4
CONFIG_NET_SOCKETS_SOCKOPT_TLS=y
# Use DHCP for IPv4 and IPv6
CONFIG_NET_DHCPV4=y
CONFIG_NET_DHCPV6=y
# Generic networking options
CONFIG_NET_TX_STACK_SIZE=4096
CONFIG_NET_RX_STACK_SIZE=4096
CONFIG_NET_PKT_RX_COUNT=20
CONFIG_NET_PKT_TX_COUNT=20
CONFIG_NET_BUF_RX_COUNT=40
CONFIG_NET_BUF_TX_COUNT=40
CONFIG_NET_MAX_CONTEXTS=20
CONFIG_NET_MGMT=y
CONFIG_NET_MGMT_EVENT=y
CONFIG_NET_IPV4=y
CONFIG_NET_IPV6=y
CONFIG_NET_TCP=y
# Enable HTTP client
CONFIG_HTTP_CLIENT=y
# MQTT options
CONFIG_MQTT_LIB=y
CONFIG_MQTT_LIB_TLS=y
CONFIG_MQTT_KEEPALIVE=60
# Hash map function
CONFIG_SYS_HASH_FUNC32=y
```

## Generating the interfaces headers

We previously added three interfaces to our Astarte instance. We will now do something similar on
the device.
Start by saving the three interfaces in JSON files in a `interfaces` folder in your working
directory. You can then convert them to a set of C files containing all the same structures by
running a `west` extension command.

```sh
west generate-interfaces ./get_started_app/interfaces
```

This command will generate a source and header files. In order for zephyr to include them in the
build process we should add a couple of lines to the `CMakeLists.txt`.

```
target_include_directories(app PRIVATE interfaces)
target_sources(app PRIVATE interfaces/generated_interfaces.c)
```

This is assuming your target application is named `app`.

## Instantiating a device

Finally, we can start with the source code of our device application. We will first create a new
device using the device ID and credentials secret we obtained in the previous steps.

The Astarte device SDK uses callbacks to communicate to the user that some event has occurred.
Such callbacks should be configured before instantiating the device and connecting to Astarte.
Several callbacks can be optionally configured. A connection callback, an individual data received
callback, an object data received callback, and set property received callback, an unset property
received callback, and a disconnection callback.

```C
#include <zephyr/kernel.h>
#include <zephyr/net/ethernet.h>

#include <astarte_device_sdk/interface.h>
#include <astarte_device_sdk/device.h>
#include <astarte_device_sdk/result.h>

#include "generated_interfaces.h"

static struct net_mgmt_event_callback ipv4_cb;
static K_SEM_DEFINE(ipv4_address_obtained, 0, 1);

static void ipv4_mgmt_event_handler(
    struct net_mgmt_event_callback *event_cb, uint32_t mgmt_event, struct net_if *iface)
{
    switch (mgmt_event) {
        case NET_EVENT_IPV4_ADDR_ADD:
            k_sem_give(&ipv4_address_obtained);
            break;
        case NET_EVENT_IPV4_ADDR_DEL:
            break;
        default:
            break;
    }
}

#define DEVICE_ID "DEVICE ID"
#define CRED_SECR "CREDENTIALS SECRET"

static K_SEM_DEFINE(device_connected, 0, 1);

static void connection_callback(astarte_device_connection_event_t event) {
    printk("Astarte device connected.\n");
    k_sem_give(&device_connected);
}
static void disconnection_callback(astarte_device_disconnection_event_t event) {
    printk("Astarte device disconnected\n");
}

int main(void)
{
    astarte_result_t res = ASTARTE_RESULT_OK;

    net_mgmt_init_event_callback(&ipv4_cb, ipv4_mgmt_event_handler,
        NET_EVENT_IPV4_ADDR_ADD | NET_EVENT_IPV4_ADDR_DEL);
    net_mgmt_add_event_callback(&ipv4_cb);

    printk("Waiting for Ethernet interface to be operational.\n");
    struct net_if *iface = net_if_get_default();
    while (net_if_oper_state(iface) != NET_IF_OPER_UP) {
        k_sleep(K_MSEC(200));
    }
    printk("Waiting for an IPv4 address (DHCP).\n");
    net_dhcpv4_start(iface);
    while (k_sem_count_get(&ipv4_address_obtained) == 0) {
        k_sleep(K_MSEC(200));
    }

    printk("Creating an Astarte device.\n");
    const astarte_interface_t *interfaces[] = {
        &org_astarte_platform_zephyr_get_started_Individual,
        &org_astarte_platform_zephyr_get_started_Aggregated,
        &org_astarte_platform_zephyr_get_started_Property
    };

    astarte_device_config_t device_config = { 0 };
    device_config.http_timeout_ms = 3000;
    device_config.mqtt_connection_timeout_ms = 3000;
    device_config.mqtt_poll_timeout_ms = 500;
    device_config.connection_cbk = connection_callback;
    device_config.disconnection_cbk = disconnection_callback;
    device_config.interfaces = interfaces;
    device_config.interfaces_size = ARRAY_SIZE(interfaces);
    memcpy(device_config.device_id, DEVICE_ID, sizeof(DEVICE_ID));
    memcpy(device_config.cred_secr, CRED_SECR, sizeof(CRED_SECR));

    astarte_device_handle_t device = NULL;
    res = astarte_device_new(&device_config, &device);
    if (res != ASTARTE_RESULT_OK) {
        printk("Err: '%s'.\n", astarte_result_to_name(res));
        return -1;
    }
}
```

## Connecting and polling the device

After device initialization, the device will need to be connected explicitly and polled regularly
to ensure the processing of MQTT messages.
Ideally, two separate threads should be used for polling and transmission.
```C
// ... imports, semaphores and callbacks ...

K_THREAD_STACK_DEFINE(device_rx_thread_stack_area, 12288);
static struct k_thread device_rx_thread_data;
static void device_rx_thread_entry_point(void *device_handle, void *unused1, void *unused2);

int main(void) {
    astarte_result_t res = ASTARTE_RESULT_OK;

    // ... configure networking and instantiate the device ...

    k_thread_create(&device_rx_thread_data, device_rx_thread_stack_area,
        K_THREAD_STACK_SIZEOF(device_rx_thread_stack_area), device_rx_thread_entry_point,
        (void *) device, NULL, NULL, 0, 0, K_NO_WAIT);

    while (k_sem_count_get(&device_connected) == 0) {
        k_sleep(K_MSEC(200));
    }
    printk("Astarte device connected.\n");

}

static void device_rx_thread_entry_point(void *device_handle, void *unused1, void *unused2)
{
    astarte_result_t res = ASTARTE_RESULT_OK;

    astarte_device_handle_t device = (astarte_device_handle_t) device_handle;
    res = astarte_device_connect(device);
    if (res != ASTARTE_RESULT_OK) {
        printk("Err: '%s'.\n", astarte_result_to_name(res));
        return;
    }

    while (true) {
        res = astarte_device_poll(device);
        if (res != ASTARTE_RESULT_OK) {
            printk("Err: '%s'.\n", astarte_result_to_name(res));
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

The snippet below shows how to send a value that will be inserted into the `"/double_endpoint"`
datastream, that is part of the `"org.astarte-platform.zephyr.get-started.Individual"` datastream
interface.

```C
// ... imports, semaphores, callbacks and transmission thread ...

K_THREAD_STACK_DEFINE(device_tx_thread_stack_area, 8192);
static struct k_thread device_tx_thread_data;
static void device_tx_thread_entry_point(void *device_handle, void *unused1, void *unused2);

int main(void) {
    astarte_result_t res = ASTARTE_RESULT_OK;

    // ... configure networking, instantiate and connect the device ...

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

    printk("Streaming individual data.\n");
    const char *interface_name = org_astarte_platform_zephyr_get_started_Individual.name;
    const char double_path[] = "/double_endpoint";
    astarte_data_t double_individual = astarte_data_from_double(24.56);

    res = astarte_device_send_individual(
        device, interface_name, double_path, double_individual, NULL);
    if (res != ASTARTE_RESULT_OK) {
        printk("Err: '%s'.\n", astarte_result_to_name(res));
        return;
    }
}
```

### Streaming aggregated data

In Astarte interfaces with `object` aggregation, Astarte expects the owner to send all of the
interface's mappings at the same time, packed in a single message.

The following snippet shows how to send a value for an object-aggregated interface. In this example,
two different data types will be sent together and will be inserted into the `"/group_data"`
datastream, which is part of the `"org.astarte-platform.zephyr.get-started.Aggregated"` datastream
interface.

```C

// ... imports, semaphores, callbacks, reception thread, main program ...

static void device_tx_thread_entry_point(void *device_handle, void *unused1, void *unused2)
{
    astarte_result_t res = ASTARTE_RESULT_OK;
    astarte_device_handle_t device = (astarte_device_handle_t) device_handle;

    // ... transmission of an individual datastream ...

    printk("Streaming aggregated data.\n");
    const double double_data = 15.42;
    const char string_data[] = "Hello world!";
    astarte_object_entry_t entries[] = {
        astarte_object_entry_new(
            "double_endpoint", astarte_data_from_double(double_data)),
        astarte_object_entry_new(
            "string_endpoint", astarte_data_from_string(string_data)),
    };

    res = astarte_device_send_object(device,
        org_astarte_platform_zephyr_get_started_Aggregated.name, "/group_data", entries,
        ARRAY_SIZE(entries), NULL);
    if (res != ASTARTE_RESULT_OK) {
        printk("Err: '%s'.\n", astarte_result_to_name(res));
        return;
    }
}
```

## Setting and unsetting properties

Interfaces of the `property` type represent a persistent, stateful, synchronized state with no
concept of history or timestamping. From a programming point of view, setting and unsetting
properties of device-owned interfaces is rather similar to sending messages on datastream
interfaces.

In this get started guide persistency for the properties has been disabled. As such, setting and
unsetting properties from the device would make little sense. See the more complete code samples in
the [GitHub repository](https://github.com/astarte-platform/astarte-device-sdk-zephyr) of the
Zephyr Astarte device SDK for more information on how to set up the appropriate flash partition.

## Disconnecting the device

The Astarte device can be gracefully disconnected by Astarte using the disconnect function.
This function will trigger a callback to one of the user-defined functions.

Note that polling on the device following a disconnect will return an error.

```C
// ... imports, semaphores, callbacks, reception thread, main program ...

int main(void) {
    astarte_result_t res = ASTARTE_RESULT_OK;

    // ... configure networking, instantiate and connect the device, poll the device ...

    res = astarte_device_disconnect(device, K_SECONDS(10));
    if (res != ASTARTE_RESULT_OK) {
        printk("Err: '%s'.\n", astarte_result_to_name(res));
        return -1;
    }
}
```
