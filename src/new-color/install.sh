#!/bin/sh
set -e

echo "Activating feature 'color'"
echo "The provided favorite color is: ${FAVORITE}"

echo "${FAVORITE}"  > /tmp/color.txt
chmod +x /tmp/color.txt