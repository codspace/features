#!/bin/sh
set -e

echo "Activating feature 'hello'"

GREETING=${GREETING:-undefined}
echo "The provided greeting is: $GREETING"

echo "${GREETING}"  > /tmp/hello.txt
chmod +x /tmp/hello.txt

echo "Fav color from 'color'"
cat /tmp/color.txt