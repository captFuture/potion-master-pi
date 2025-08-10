#!/usr/bin/env node

const i2c = require('i2c-bus');

const RELAY_ADDRESS = 0x20;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeRelayState(bus, state) {
  const buf = Buffer.from([state & 0xff]);
  bus.i2cWriteSync(RELAY_ADDRESS, 1, buf);
}

function readRelayState(bus) {
  const buf = Buffer.alloc(1);
  bus.i2cReadSync(RELAY_ADDRESS, 1, buf);
  return buf[0];
}

async function testRelay() {
  console.log('🔍 Testing 8-Channel I2C Relay Board (PCF8574) at address 0x20...\n');
  console.log('ℹ️  Control scheme: 0 = Relay ON, 1 = Relay OFF\n');
  
  let bus;
  try {
    // Open I2C bus
    bus = i2c.openSync(1);
    console.log('✅ I2C Bus 1 opened successfully');

    // Probe for device
    try {
      const initialState = readRelayState(bus);
      console.log(`✅ Relay board responds at address 0x20 (current state: 0x${initialState.toString(16).padStart(2, '0').toUpperCase()})`);
    } catch (error) {
      console.log('❌ No response from relay board at address 0x20');
      throw new Error('Relay board not found');
    }

    // All relays OFF
    console.log('\n🔌 Initializing - all relays OFF (0xFF)');
    writeRelayState(bus, 0xFF);
    await sleep(500);

    // Test each channel individually
    console.log('\n🧪 Testing each relay channel individually...');
    for (let channel = 0; channel < 8; channel++) {
      try {
        console.log(`   Testing Relay ${channel + 1} (bit position ${channel})...`);

        // Activate only this relay (set bit to 0)
        const activeMask = ~(1 << channel) & 0xFF;
        writeRelayState(bus, activeMask);
        console.log(`   ✅ Relay ${channel + 1} ON  - wrote 0x${activeMask.toString(16).padStart(2, '0').toUpperCase()} (bit ${channel} = 0)`);
        await sleep(800);

        // Deactivate (all OFF state)
        writeRelayState(bus, 0xFF);
        console.log(`   ⭕ Relay ${channel + 1} OFF - wrote 0xFF (all bits = 1)`);
        await sleep(400);
      } catch (error) {
        console.log(`   ❌ Error testing relay ${channel + 1}: ${error.message}`);
      }
    }

    // Test combinations
    console.log('\n🌟 Testing relay combinations...');

    // Pattern 1: Relays 1,3,5,7 ON
    const pattern1 = 0b10101010; // 0xAA
    console.log(`   Testing pattern: Relays 1,3,5,7 ON (0x${pattern1.toString(16).padStart(2, '0').toUpperCase()})`);
    writeRelayState(bus, pattern1);
    await sleep(1500);

    // Pattern 2: Relays 2,4,6,8 ON
    const pattern2 = 0b01010101; // 0x55
    console.log(`   Testing pattern: Relays 2,4,6,8 ON (0x${pattern2.toString(16).padStart(2, '0').toUpperCase()})`);
    writeRelayState(bus, pattern2);
    await sleep(1500);

    // Pattern 3: All relays ON
    console.log(`   Testing pattern: All relays ON (0x00)`);
    writeRelayState(bus, 0x00);
    await sleep(1500);

    // Final: All OFF
    console.log(`   Final state: All relays OFF (0xFF)`);
    writeRelayState(bus, 0xFF);

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
      try { writeRelayState(bus, 0xFF); } catch (_) {}
      bus.closeSync();
    }
  }
}

// Script direkt ausführbar machen
if (require.main === module) {
  testRelay();
}

module.exports = testRelay;
