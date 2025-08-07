#!/usr/bin/env node

const i2c = require('i2c-bus');

const RELAY_ADDRESS = 0x20;

async function testRelay() {
  console.log('🔍 Testing 8-Channel I2C Relay Board at address 0x20...\n');
  
  let bus;
  try {
    // I2C Bus öffnen
    bus = i2c.openSync(1);
    console.log('✅ I2C Bus 1 opened successfully');
    
    // Prüfen ob Gerät antwortet
    try {
      bus.receiveByteSync(RELAY_ADDRESS);
      console.log('✅ Relay board responds at address 0x20');
    } catch (error) {
      console.log('❌ No response from relay board at address 0x20');
      throw new Error('Relay board not found');
    }
    
    // Alle Relais deaktivieren (0xFF = alle HIGH = alle aus)
    console.log('\n🔌 Initializing - all relays OFF');
    bus.writeByteSync(RELAY_ADDRESS, 0xFF);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Jeden Kanal einzeln testen
    console.log('\n🧪 Testing each relay channel...');
    for (let channel = 0; channel < 8; channel++) {
      try {
        console.log(`   Testing Relay ${channel + 1}...`);
        
        // Relais aktivieren (entsprechendes Bit auf LOW)
        const activeMask = ~(1 << channel) & 0xFF;
        bus.writeByteSync(RELAY_ADDRESS, activeMask);
        console.log(`   ✅ Relay ${channel + 1} activated (${activeMask.toString(16).padStart(2, '0').toUpperCase()}h)`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Relais deaktivieren
        bus.writeByteSync(RELAY_ADDRESS, 0xFF);
        console.log(`   ⭕ Relay ${channel + 1} deactivated`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error testing relay ${channel + 1}: ${error.message}`);
      }
    }
    
    // Alle Relais gleichzeitig testen
    console.log('\n🌟 Testing all relays simultaneously...');
    try {
      bus.writeByteSync(RELAY_ADDRESS, 0x00); // Alle Relais an
      console.log('   ✅ All relays activated');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      bus.writeByteSync(RELAY_ADDRESS, 0xFF); // Alle Relais aus
      console.log('   ⭕ All relays deactivated');
    } catch (error) {
      console.log(`   ❌ Error testing all relays: ${error.message}`);
    }
    
    console.log('\n✅ Relay test completed successfully!');
    
  } catch (error) {
    console.log(`\n❌ Relay test failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (bus) {
      bus.closeSync();
    }
  }
}

// Script direkt ausführbar machen
if (require.main === module) {
  testRelay();
}

module.exports = testRelay;