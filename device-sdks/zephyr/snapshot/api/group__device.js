var group__device =
[
    [ "astarte_device_error_event_t", "structastarte__device__error__event__t.html", [
      [ "context", "structastarte__device__error__event__t.html#a18efd6e4c7637216c4cb9c2b9cbd4881", null ],
      [ "result", "structastarte__device__error__event__t.html#ae6162730e56bdf7926460d00f4992d6b", null ]
    ] ],
    [ "astarte_device_connection_event_t", "structastarte__device__connection__event__t.html", [
      [ "device", "structastarte__device__connection__event__t.html#a0e95777dc85382885c6d79ec33eaa2eb", null ]
    ] ],
    [ "astarte_device_disconnection_event_t", "structastarte__device__disconnection__event__t.html", [
      [ "device", "structastarte__device__disconnection__event__t.html#afc6c84c3353767621cea1207f800619c", null ]
    ] ],
    [ "astarte_device_data_event_t", "structastarte__device__data__event__t.html", [
      [ "device", "structastarte__device__data__event__t.html#a74f613f3a9867f8ca9481dcaa70b0c42", null ],
      [ "interface_name", "structastarte__device__data__event__t.html#a1d0505ac5af4065c5b797115a31135b9", null ],
      [ "path", "structastarte__device__data__event__t.html#aba09438e8ec8d49ccf823b894661fc50", null ]
    ] ],
    [ "astarte_device_datastream_individual_event_t", "structastarte__device__datastream__individual__event__t.html", [
      [ "base_event", "structastarte__device__datastream__individual__event__t.html#ab7a658a6b07cc6c464ee86b7aad22084", null ],
      [ "data", "structastarte__device__datastream__individual__event__t.html#a2e67853b34094c8b37bd5b8276081cb0", null ]
    ] ],
    [ "astarte_device_datastream_object_event_t", "structastarte__device__datastream__object__event__t.html", [
      [ "base_event", "structastarte__device__datastream__object__event__t.html#af91c81bcd0378db83fa5b8212fe4b63c", null ],
      [ "entries", "structastarte__device__datastream__object__event__t.html#adb6e9463cd6c0dda20e0ee65efd44f74", null ],
      [ "entries_len", "structastarte__device__datastream__object__event__t.html#a3990b60ce065cde698b91a13b53115ee", null ]
    ] ],
    [ "astarte_device_property_set_event_t", "structastarte__device__property__set__event__t.html", [
      [ "base_event", "structastarte__device__property__set__event__t.html#a0e8a2223a4b6014e4225b1cd6cc44eaf", null ],
      [ "data", "structastarte__device__property__set__event__t.html#a5a65fe6090919b980c3848651b414023", null ]
    ] ],
    [ "astarte_device_event_t", "structastarte__device__event__t.html", [
      [ "data", "structastarte__device__event__t.html#a0b15e0f4fe060d1e0a558a72f2d0531f", null ],
      [ "type", "structastarte__device__event__t.html#af7833d27ce07d4df1d15ff02fd6cdfbc", null ]
    ] ],
    [ "astarte_device_config_t", "structastarte__device__config__t.html", [
      [ "cred_secr", "structastarte__device__config__t.html#ad703fdfedf3d44d0eb060b2bd81220e2", null ],
      [ "device_id", "structastarte__device__config__t.html#a8055b3ed754b0090171ab06652aa32a0", null ],
      [ "http_timeout_ms", "structastarte__device__config__t.html#abb3c93af2eff51bd99593ec6adc9d67c", null ],
      [ "interfaces", "structastarte__device__config__t.html#adfdb52f5ec49246508f849e43f4cddbc", null ],
      [ "interfaces_size", "structastarte__device__config__t.html#a6e14e6ebe37dc3cb9bb3abf3ab5f6cf9", null ],
      [ "mqtt_connection_timeout_ms", "structastarte__device__config__t.html#aeb2ccfe0bbf58400680ec386346913a8", null ],
      [ "mqtt_poll_timeout_ms", "structastarte__device__config__t.html#a40acd03315ef5376780e2bb2d3f1ea22", null ]
    ] ],
    [ "astarte_device_handle_t", "group__device.html#ga8e6066c46bfa43d8aa10dac5bc5d16ea", null ],
    [ "astarte_device_event_type_t", "group__device.html#ga2c0eeb0d51f0d812ee27da0660e4969c", [
      [ "ASTARTE_DEVICE_EVENT_ERROR", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969ca78e1a92b6bd7ebe5ddcd587636b02886", null ],
      [ "ASTARTE_DEVICE_EVENT_CONNECTED", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969caf2530d28e2190b605f2bcc15632e75a4", null ],
      [ "ASTARTE_DEVICE_EVENT_DISCONNECTED", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969caa0db6bdd56292792691516ab8d5527bc", null ],
      [ "ASTARTE_DEVICE_EVENT_DATASTREAM_INDIVIDUAL", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969ca6435b3cd49f4fc5261e1a08cdc1ea42e", null ],
      [ "ASTARTE_DEVICE_EVENT_DATASTREAM_OBJECT", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969ca172020e117a851ffb05a1b09e8eba49e", null ],
      [ "ASTARTE_DEVICE_EVENT_PROPERTY_SET", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969ca61d49b64624742c97f07f57539f98968", null ],
      [ "ASTARTE_DEVICE_EVENT_PROPERTY_UNSET", "group__device.html#gga2c0eeb0d51f0d812ee27da0660e4969ca4aea03862187aeefd49284d8e8e54a87", null ]
    ] ],
    [ "astarte_device_add_interface", "group__device.html#ga93082fc0d2cd5068ca24c596de837b1f", null ],
    [ "astarte_device_connect", "group__device.html#ga6639c512b2ef5365bbdda9d31dfc277e", null ],
    [ "astarte_device_destroy", "group__device.html#ga31b74b5be3f495e22dfe4ff4a5a0bd21", null ],
    [ "astarte_device_disconnect", "group__device.html#gac0fdf93a511677f8d7f9e970886dff5c", null ],
    [ "astarte_device_event_cleanup", "group__device.html#ga484d93fec9d654d3b9e6592379acfe54", null ],
    [ "astarte_device_force_disconnect", "group__device.html#ga9dcc2121b96a3d2cc570afbf897cb0b3", null ],
    [ "astarte_device_get_event", "group__device.html#gae8ba2c5568664e983f3adb76b9e7eec6", null ],
    [ "astarte_device_new", "group__device.html#ga487521ab61f4fbc8d961db13d182594f", null ],
    [ "astarte_device_remove_interface", "group__device.html#ga67bcd4f8d6d923e529e1208505128277", null ],
    [ "astarte_device_send_individual", "group__device.html#ga9542caba91e741ac8b6fc1376b4c5d9a", null ],
    [ "astarte_device_send_object", "group__device.html#ga3370d8a040552ec7dc9d6f6b1faee209", null ],
    [ "astarte_device_set_property", "group__device.html#gad1f1910713e710705311aa008d813bb9", null ],
    [ "astarte_device_unset_property", "group__device.html#ga0f776ef7dd0b15c2088acff5d44127f2", null ]
];