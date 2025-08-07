#!/usr/bin/env node

const i2c = require('i2c-bus');

async function scanI2C() {
  console.log('🔍 Scanning I2C Bus 1 for devices...\n');
  
  let bus;
  try {
    bus = i2c.openSync(1);
    console.log('✅ I2C Bus 1 opened successfully\n');
    
    const devices = [];
    
    // Scan Adressen 0x03 bis 0x77
    for (let addr = 0x03; addr <= 0x77; addr++) {
      try {
        bus.receiveByteSync(addr);
        devices.push(addr);
        const deviceName = getDeviceName(addr);
        console.log(`✅ Device found at 0x${addr.toString(16).padStart(2, '0').toUpperCase()} (${addr}) - ${deviceName}`);
      } catch (error) {
        // Gerät nicht gefunden, normal
      }
    }
    
    console.log(`\n📊 Found ${devices.length} I2C device(s)`);
    
    if (devices.length === 0) {
      console.log('❌ No I2C devices found. Check connections and enable I2C.');
    } else {
      console.log('\n🎯 Expected devices for cocktail machine:');
      console.log('   0x20 (32) - 8-Channel I2C Relay Board');
      console.log('   0x26 (38) - M5Stack MiniScale');
      
      const hasRelay = devices.includes(0x20);
      const hasScale = devices.includes(0x26);
      
      console.log('\n✅ Hardware Status:');
      console.log(`   Relay Board (0x20): ${hasRelay ? '✅ Found' : '❌ Missing'}`);
      console.log(`   Scale (0x26): ${hasScale ? '✅ Found' : '❌ Missing'}`);
      
      if (hasRelay && hasScale) {
        console.log('\n🎉 All required hardware detected!');
      } else {
        console.log('\n⚠️  Some hardware is missing. Check connections.');
      }
    }
    
  } catch (error) {
    console.log(`❌ I2C scan failed: ${error.message}`);
    console.log('💡 Make sure I2C is enabled: sudo raspi-config → Interface Options → I2C');
    process.exit(1);
  } finally {
    if (bus) {
      bus.closeSync();
    }
  }
}

function getDeviceName(address) {
  const devices = {
    0x20: '8-Channel I2C Relay Board',
    0x26: 'M5Stack MiniScale',
    0x27: 'PCF8574 I/O Expander',
    0x48: 'ADS1115 ADC',
    0x68: 'DS1307 RTC / MPU6050',
    0x76: 'BMP280 Pressure Sensor',
    0x77: 'BMP180 Pressure Sensor'
  };
  
  return devices[address] || 'Unknown Device';
}

// Script direkt ausführbar machen
if (require.main === module) {
  scanI2C();
}

module.exports = scanI2C;