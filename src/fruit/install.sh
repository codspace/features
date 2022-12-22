#!/bin/sh
set -e

echo "Activating feature 'fruit'"
echo "The provided favorite fruit is: ${FAVORITE}"

cat > /usr/local/bin/fruit \
<< EOF
#!/bin/sh
echo "my favorite fruit is ${FAVORITE}"
EOF

chmod +x /usr/local/bin/fruit