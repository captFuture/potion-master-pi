
#!/usr/bin/env node

const i2c = require('i2c-bus');

const RELAY_ADDRESS = 0x20;

async function testRelay() {
  console.log('🔍 Testing 8-Channel I2C Relay Board (PCF8574) at address 0x20...\n');
  console.log('ℹ️  Control scheme: 0 = Relay ON, 1 = Relay OFF\n');
  
  let bus;
  try {
    // I2C Bus öffnen
    bus = i2c.openSync(1);
    console.log('✅ I2C Bus 1 opened successfully');
    
    // Prüfen ob Gerät antwortet
    try {
      const initialState = bus.receiveByteSync(RELAY_ADDRESS);
      console.log(`✅ Relay board responds at address 0x20 (current state: 0x${initialState.toString(16).padStart(2, '0').toUpperCase()})`);
    } catch (error) {
      console.log('❌ No response from relay board at address 0x20');
      throw new Error('Relay board not found');
    }
    
    // Alle Relais deaktivieren (0xFF = alle HIGH = alle aus)
    console.log('\n🔌 Initializing - all relays OFF (0xFF)');
    bus.writeByteSync(RELAY_ADDRESS, 0xFF);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Jeden Kanal einzeln testen
    console.log('\n🧪 Testing each relay channel individually...');
    for (let channel = 0; channel < 8; channel++) {
      try {
        console.log(`   Testing Relay ${channel + 1} (bit position ${channel})...`);
        
        // Nur dieses Relais aktivieren (entsprechendes Bit auf LOW = 0)
        const activeMask = ~(1 << channel) & 0xFF;
        bus.writeByteSync(RELAY_ADDRESS, activeMask);
        console.log(`   ✅ Relay ${channel + 1} ON  - wrote 0x${activeMask.toString(16).padStart(2, '0').toUpperCase()} (bit ${channel} = 0)`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dieses Relais deaktivieren (entsprechendes Bit auf HIGH = 1)
        bus.writeByteSync(RELAY_ADDRESS, 0xFF);
        console.log(`   ⭕ Relay ${channel + 1} OFF - wrote 0xFF (all bits = 1)`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error testing relay ${channel + 1}: ${error.message}`);
      }
    }
    
    // Verschiedene Kombinationen testen
    console.log('\n🌟 Testing relay combinations...');
    
    // Test pattern 1: Relays 1,3,5,7 (odd numbered)
    const pattern1 = 0b10101010; // 0xAA - odd relays ON
    console.log(`   Testing pattern: Relays 1,3,5,7 ON (0x${pattern1.toString(16).padStart(2, '0').toUpperCase()})`);
    bus.writeByteSync(RELAY_ADDRESS, pattern1);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test pattern 2: Relays 2,4,6,8 (even numbered)
    const pattern2 = 0b01010101; // 0x55 - even relays ON  
    console.log(`   Testing pattern: Relays 2,4,6,8 ON (0x${pattern2.toString(16).padStart(2, '0').toUpperCase()})`);
    bus.writeByteSync(RELAY_ADDRESS, pattern2);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test pattern 3: All relays ON
    console.log(`   Testing pattern: All relays ON (0x00)`);
    bus.writeByteSync(RELAY_ADDRESS, 0x00);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Final state: All relays OFF
    console.log(`   Final state: All relays OFF (0xFF)`);
    bus.writeByteSync(RELAY_ADDRESS, 0xFF);
    
    console.log('\n✅ Relay test completed successfully!');
    console.log('\nℹ️  Summary:');
    console.log('   - Address: 0x20 (PCF8574)');
    console.log('   - Control: 0 = Relay ON, 1 = Relay OFF');
    console.log('   - Channels: 8 (mapped to bits 0-7)');
    console.log('   - Safe state: 0xFF (all relays OFF)');
    
  } catch (error) {
    console.log(`\n❌ Relay test failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (bus) {
      // Ensure all relays are OFF before closing
      try {
        bus.writeByteSync(RELAY_ADDRESS, 0xFF);
      } catch (error) {
        console.warn('⚠️  Could not set safe state on exit');
      }
      bus.closeSync();
    }
  }
}

// Script direkt ausführbar machen
if (require.main === module) {
  testRelay();
}

module.exports = testRelay;
