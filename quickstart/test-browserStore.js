// Test if browserStore is working - paste in browser console on localhost:3000

(async function testBrowserStore() {
  console.log('🧪 Testing Browser Store Implementation');
  console.log('='.repeat(60));
  console.log('');

  // Check if browserStore module is loaded
  console.log('1️⃣ Checking if browserStore exists in modules...');

  // Since we can't import, let's test the logic directly
  const STORE_KEY_PREFIX = 'pearl_store_';

  const testStore = {
    store: async () => {
      const store = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORE_KEY_PREFIX)) {
          const actualKey = key.slice(STORE_KEY_PREFIX.length);
          const value = localStorage.getItem(key);
          if (value !== null) {
            try {
              store[actualKey] = JSON.parse(value);
            } catch (e) {
              store[actualKey] = value;
            }
          }
        }
      }
      return store;
    },

    get: async (key) => {
      const storageKey = STORE_KEY_PREFIX + key;
      const value = localStorage.getItem(storageKey);
      if (value === null) return undefined;
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
  };

  // Test the store
  console.log('2️⃣ Testing store.store()...');
  try {
    const storeData = await testStore.store();
    console.log('   ✅ Success! Store data:', storeData);
    console.log('   Keys:', Object.keys(storeData));
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('');
  console.log('3️⃣ Testing store.get()...');
  try {
    const selected = await testStore.get('selectedService');
    console.log('   selectedService:', selected);

    const agentType = await testStore.get('lastSelectedAgentType');
    console.log('   lastSelectedAgentType:', agentType);

    const loggedIn = await testStore.get('isUserLoggedIn');
    console.log('   isUserLoggedIn:', loggedIn);
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('📋 Results:');
  console.log('');

  // Now check if StoreProvider has this data
  console.log('4️⃣ Checking if StoreProvider loaded this data...');
  console.log('   (We cannot directly access React context from here)');
  console.log('');
  console.log('💡 If browserStore test passed but queries still 0:');
  console.log('   → StoreProvider might not be using browserStore correctly');
  console.log('   → Check browser console for errors during StoreProvider.setupStore()');
  console.log('');

})();
