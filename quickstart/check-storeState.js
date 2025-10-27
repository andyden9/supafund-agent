// 检查 storeState 是否正确初始化
// 在浏览器控制台运行

(function checkStoreState() {
  console.log('🔍 Checking storeState initialization');
  console.log('='.repeat(60));
  console.log('');

  // Check localStorage
  console.log('1️⃣ localStorage keys:');
  const storeKeys = Object.keys(localStorage).filter(k => k.startsWith('pearl_store_'));
  storeKeys.forEach(k => {
    const val = localStorage.getItem(k);
    console.log(`  ${k}: ${val}`);
  });

  console.log('');
  console.log('2️⃣ Expected keys for Supafund:');
  console.log('  pearl_store_supafund: Should contain {isInitialFunded: false}');

  const supafundKey = localStorage.getItem('pearl_store_supafund');
  if (supafundKey) {
    console.log('  ✅ Found:', supafundKey);
    try {
      const parsed = JSON.parse(supafundKey);
      console.log('  isInitialFunded:', parsed.isInitialFunded);
    } catch(e) {
      console.log('  ❌ Parse error:', e.message);
    }
  } else {
    console.log('  ❌ NOT FOUND - This is the problem!');
    console.log('');
    console.log('  In Electron, schema ensures supafund: { isInitialFunded: false }');
    console.log('  In browser, we need to manually set it');
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('🔧 FIX: Setting supafund in localStorage');
  console.log('');

  // Set the missing key
  localStorage.setItem('pearl_store_supafund', JSON.stringify({ isInitialFunded: false }));
  console.log('✅ Set pearl_store_supafund = {isInitialFunded: false}');

  console.log('');
  console.log('🔄 Reloading page to apply changes...');
  setTimeout(() => location.reload(), 2000);
})();
