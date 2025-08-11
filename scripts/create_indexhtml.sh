#!/bin/bash

# Define the full path for the new index.html file
DEST_PATH="/var/www/potion-master-pi/index.html"
DEST_DIR="/var/www/potion-master-pi"

echo "=========================================="
echo " Starting Nginx Index File Creation"
echo "=========================================="

# Check if the destination directory exists
if [ ! -d "$DEST_DIR" ]; then
    echo "❌ Error: Destination directory '$DEST_DIR' does not exist."
    echo "Please ensure the directory is created first."
    exit 1
fi

echo "✅ Destination directory '$DEST_DIR' found."
echo "------------------------------------------"

# Step 1: Create the index.html file with the redirect code
echo "🚀 Creating and writing redirect code to '$DEST_PATH'..."

# Use a here document to write the multi-line HTML code
sudo tee "$DEST_PATH" > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redirecting...</title>
    <meta http-equiv="refresh" content="0; url=./dist/">
</head>
<body>
    <h1>Redirecting to the application...</h1>
    <p>If you are not redirected automatically, <a href="./dist/">click here</a>.</p>
</body>
</html>
EOF

if [ $? -eq 0 ]; then
    echo "✅ index.html created successfully."
else
    echo "❌ Error: Failed to create index.html."
    exit 1
fi
echo "------------------------------------------"

# Step 2: Change ownership to the Nginx user (www-data)
echo "🛠️ Changing ownership of '$DEST_PATH' to www-data:www-data..."
sudo chown www-data:www-data "$DEST_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Ownership changed successfully."
else
    echo "❌ Error: Failed to change ownership."
    exit 1
fi
echo "------------------------------------------"

# Step 3: Set permissions to 755
echo "🔒 Setting permissions of '$DEST_PATH' to 755..."
sudo chmod 755 "$DEST_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Permissions set successfully."
else
    echo "❌ Error: Failed to set permissions."
    exit 1
fi
echo "------------------------------------------"

echo "🎉 Script completed successfully!"
echo "The index.html file is now ready to use."
echo "=========================================="

exit 0