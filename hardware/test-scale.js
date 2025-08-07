#!/usr/bin/env node

const i2c = require('i2c-bus');

const SCALE_ADDRESS = 0x26;
const WEIGHT_REGISTER = 0x10;
const TARE_REGISTER = 0x50;

async function testScale() {
  console.log('🔍 Testing M5Stack MiniScale at I2C address 0x26...\n');
  
  let bus;
  try {
    // I2C Bus öffnen
    bus = i2c.openSync(1);
    console.log('✅ I2C Bus 1 opened successfully');
    
    // Prüfen ob Gerät antwortet
    try {
      bus.receiveByteSync(SCALE_ADDRESS);
      console.log('✅ M5Stack MiniScale responds at address v');
    } catch (error) {
      console.log('❌ No response from M5Stack MiniScale at address 0x26');
      throw new Error('Scale not found');
    }
    
    // Gewicht lesen
    console.log('\n📏 Reading weight...');
    for (let i = 0; i < 5; i++) {
      try {
        const buffer = Buffer.alloc(4);
        bus.readI2cBlockSync(SCALE_ADDRESS, WEIGHT_REGISTER, 4, buffer);
        const weight = buffer.readFloatLE(0);
        console.log(`   Reading ${i + 1}: ${weight.toFixed(2)}g`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.log(`❌ Error reading weight: ${error.message}`);
      }
    }
    
    // Tarierung testen
    console.log('\n⚖️ Testing tare function...');
    try {
      bus.writeByteSync(SCALE_ADDRESS, TARE_REGISTER, 0x1);
      console.log('✅ Tare command sent successfully');
      
      // Kurz warten und dann Gewicht lesen
      await new Promise(resolve => setTimeout(resolve, 200));
      const buffer = Buffer.alloc(4);
      bus.readI2cBlockSync(SCALE_ADDRESS, WEIGHT_REGISTER, 4, buffer);
      const weight = buffer.readFloatLE(0);
      console.log(`   Weight after tare: ${weight.toFixed(2)}g`);
    } catch (error) {
      console.log(`❌ Tare test failed: ${error.message}`);
    }
    
    console.log('\n✅ Scale test completed successfully!');
    
  } catch (error) {
    console.log(`\n❌ Scale test failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (bus) {
      bus.closeSync();
    }
  }
}

// Script direkt ausführbar machen
if (require.main === module) {
  testScale();
}

module.exports = testScale;