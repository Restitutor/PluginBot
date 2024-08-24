#!/bin/bash

mkdir -p server_config
# exec node index.js
firejail --whitelist=~/Services/PluginBot node index.js | gawk '{ print strftime("[%Y-%m-%d %H:%M:%S]"), $0 }' | tee -a latest.log
read
