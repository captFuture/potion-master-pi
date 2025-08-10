#!/bin/bash

# Define the source and destination directories
SOURCE_DIR="/home/pi/potion-master-pi/dist"
DEST_DIR="/var/www/potion-frontend-pi"

echo "=========================================="
echo " Starting Nginx File Setup Script"
echo "=========================================="

# Check if the source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory '$SOURCE_DIR' does not exist."
    exit 1
fi

echo "✅ Source directory '$SOURCE_DIR' found."
echo "------------------------------------------"

# Step 1: Copy the contents of the source directory to the Nginx web root
echo "🚀 Copying files from '$SOURCE_DIR' to '$DEST_DIR'..."
# The trailing slash on the source directory ensures only its contents are copied.
sudo cp -r "$SOURCE_DIR/" "$DEST_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Files copied successfully."
else
    echo "❌ Error: Failed to copy files. Check your permissions."
    exit 1
fi
echo "------------------------------------------"

# Step 2: Change ownership to the Nginx user (www-data)
echo "🛠️ Changing ownership of '$DEST_DIR' to www-data:www-data..."
sudo chown -R www-data:www-data "$DEST_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Ownership changed successfully."
else
    echo "❌ Error: Failed to change ownership."
    exit 1
fi
echo "------------------------------------------"

# Step 3: Set permissions to 755
echo "🔒 Setting permissions of '$DEST_DIR' to 755..."
sudo chmod -R 755 "$DEST_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Permissions set successfully."
else
    echo "❌ Error: Failed to set permissions."
    exit 1
fi
echo "------------------------------------------"

echo "🎉 Nginx file setup completed successfully!"
echo "You can now check your Nginx server."
echo "=========================================="

exit 0
