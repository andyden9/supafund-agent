// 检查所有 25 个查询的详细状态
// 复制整个文件到浏览器控制台

(function check25Queries() {
  const queries = window.queryClient?.getQueryCache().getAll() || [];

  console.log('🔍 Analyzing all 25 queries...');
  console.log('='.repeat(70));
  console.log('');

  // Group by status
  const byStatus = {
    success: queries.filter(q => q.state.status === 'success'),
    error: queries.filter(q => q.state.status === 'error'),
    loading: queries.filter(q => q.state.status === 'loading'),
    pending: queries.filter(q => q.state.status === 'pending')
  };

  console.log('📊 Overview:');
  console.log(`  Total: ${queries.length}`);
  console.log(`  ✅ Success: ${byStatus.success.length}`);
  console.log(`  ❌ Error: ${byStatus.error.length}`);
  console.log(`  ⏳ Loading: ${byStatus.loading.length}`);
  console.log(`  ⏸️  Pending: ${byStatus.pending.length}`);
  console.log('');

  // Check critical queries
  console.log('🎯 Critical Queries for Button:');
  console.log('');

  // 1. Balance query
  const balanceQuery = queries.find(q =>
    JSON.stringify(q.queryKey).includes('BALANCES_AND_REFILL')
  );

  if (balanceQuery) {
    console.log('1️⃣ BALANCES_AND_REFILL_REQUIREMENTS:');
    console.log(`   Status: ${balanceQuery.state.status}`);
    console.log(`   allow_start_agent: ${balanceQuery.state.data?.allow_start_agent}`);
    console.log(`   is_refill_required: ${balanceQuery.state.data?.is_refill_required}`);
    if (balanceQuery.state.error) {
      console.log(`   ❌ Error: ${balanceQuery.state.error.message}`);
    }
  } else {
    console.log('1️⃣ ❌ BALANCES_AND_REFILL_REQUIREMENTS: NOT FOUND');
  }

  console.log('');

  // 2. Staking queries
  const stakingQueries = queries.filter(q =>
    JSON.stringify(q.queryKey).includes('STAKING_CONTRACT_DETAILS')
  );

  console.log(`2️⃣ STAKING_CONTRACT_DETAILS: ${stakingQueries.length} queries`);
  stakingQueries.forEach((q, i) => {
    console.log(`   ${i+1}. Status: ${q.state.status}`);
    if (q.state.error) {
      console.log(`      ❌ Error: ${q.state.error.message}`);
    }
    if (q.state.data) {
      console.log(`      ✅ Has data:`, Object.keys(q.state.data).slice(0, 3));
    }
  });

  console.log('');

  // 3. Service query
  const serviceQuery = queries.find(q =>
    JSON.stringify(q.queryKey).includes('SERVICE_DEPLOYMENT')
  );

  if (serviceQuery) {
    console.log('3️⃣ SERVICE_DEPLOYMENT_STATUS:');
    console.log(`   Status: ${serviceQuery.state.status}`);
    if (serviceQuery.state.data) {
      console.log(`   Deployment:`, serviceQuery.state.data);
    }
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('');

  // Show all error queries
  if (byStatus.error.length > 0) {
    console.log('❌ ERROR QUERIES:');
    byStatus.error.forEach(q => {
      console.log(`  Key: ${JSON.stringify(q.queryKey)}`);
      console.log(`  Error: ${q.state.error?.message || q.state.error}`);
      console.log('');
    });
  }

  // Check the specific condition
  console.log('🔍 Button Enable Conditions Check:');
  console.log('');

  const balanceOk = balanceQuery?.state.data?.allow_start_agent === true;
  const balanceLoaded = balanceQuery?.state.status === 'success';
  const stakingLoaded = stakingQueries.length > 0 && stakingQueries.every(q => q.state.status === 'success');

  console.log(`  ✓ Balance query loaded: ${balanceLoaded ? '✅' : '❌'}`);
  console.log(`  ✓ Balance allows start: ${balanceOk ? '✅' : '❌'}`);
  console.log(`  ✓ Staking queries loaded: ${stakingLoaded ? '✅' : '❌'}`);
  console.log('');

  if (balanceLoaded && balanceOk && stakingLoaded) {
    console.log('✅ ALL CONDITIONS MET! Button should be clickable!');
    console.log('');
    console.log('🤔 If button is still grayed:');
    console.log('  → Component might not be re-rendering');
    console.log('  → Try scrolling page or switching tabs');
    console.log('  → Or there is another condition in isDeployable');
  } else {
    console.log('❌ FOUND THE ISSUE:');
    if (!balanceLoaded) console.log('  → Balance query not loaded yet');
    if (!balanceOk) console.log('  → Backend says cannot start (allow_start_agent = false)');
    if (!stakingLoaded) console.log('  → Staking contract details not loaded');
  }

  console.log('');
  console.log('📋 Full Query List:');
  queries.forEach((q, i) => {
    const key = JSON.stringify(q.queryKey);
    const shortKey = key.length > 60 ? key.substring(0, 60) + '...' : key;
    console.log(`  ${i+1}. [${q.state.status}] ${shortKey}`);
  });

})();
