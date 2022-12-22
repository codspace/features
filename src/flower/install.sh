#!/bin/sh
set -e

echo "Activating feature 'flower'"

FAVORITE_FLOWER=${FAVORITEFLOWER:-undefined}
echo "The provided favorite flower is: ${FAVORITE_FLOWER}"

echo "Fav color from 'color'"
cat /tmp/color.txt