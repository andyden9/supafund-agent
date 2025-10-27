// 检查 isDeployable 的所有条件
// 复制整个脚本到浏览器控制台

(function checkIsDeployableConditions() {
  console.log('🔍 Checking isDeployable Conditions');
  console.log('='.repeat(70));
  console.log('');

  const queries = window.queryClient?.getQueryCache().getAll() || [];

  // Get critical query states
  const balanceQuery = queries.find(q =>
    JSON.stringify(q.queryKey).includes('BALANCES_AND_REFILL')
  );
  const stakingQueries = queries.filter(q =>
    JSON.stringify(q.queryKey).includes('STAKING_CONTRACT_DETAILS')
  );

  console.log('📊 Query States:');
  console.log(`  Balance query: ${balanceQuery ? balanceQuery.state.status : 'NOT FOUND'}`);
  console.log(`  Staking queries: ${stakingQueries.length} (${stakingQueries.filter(q => q.state.status === 'success').length} success)`);
  console.log('');

  // Check localStorage values
  console.log('💾 localStorage Values:');
  const agentType = localStorage.getItem('pearl_store_lastSelectedAgentType');
  const selectedSvc = localStorage.getItem('pearl_store_selectedService');
  const isInitialFunded = localStorage.getItem('pearl_store_supafund.isInitialFunded');

  console.log(`  lastSelectedAgentType: ${agentType}`);
  console.log(`  selectedService: ${selectedSvc ? 'SET' : 'NULL'}`);
  console.log(`  supafund.isInitialFunded: ${isInitialFunded}`);
  console.log('');

  // According to code line 80-131 in AgentNotRunningButton.tsx
  console.log('🎯 Checking isDeployable conditions (in order):');
  console.log('');

  // Line 81
  const isBalancesLoading = balanceQuery?.state.status === 'loading' || balanceQuery?.state.status === 'pending';
  console.log(`1. isBalancesAndFundingRequirementsLoading: ${isBalancesLoading}`);
  if (isBalancesLoading) {
    console.log('   ❌ FAIL: Balances still loading → return false');
    console.log('   🔍 Balance query status:', balanceQuery?.state.status);
    console.log('');
    console.log('   ROOT CAUSE: Balance query is PENDING because selectedServiceConfigId = null');
    console.log('   Which happened because service name does not match agentType');
    return;
  }
  console.log('   ✅ PASS');
  console.log('');

  // Line 82
  const isServicesLoading = queries.find(q => JSON.stringify(q.queryKey) === '["services"]')?.state.status === 'loading';
  const isServiceRunning = false; // we know it's not running
  console.log(`2. isServicesLoading || isServiceRunning: ${isServicesLoading || isServiceRunning}`);
  if (isServicesLoading || isServiceRunning) {
    console.log('   ❌ FAIL: return false');
    return;
  }
  console.log('   ✅ PASS');
  console.log('');

  // Line 84
  const allStakingLoaded = stakingQueries.length > 0 && stakingQueries.every(q => q.state.status === 'success');
  console.log(`3. isAllStakingContractDetailsRecordLoaded: ${allStakingLoaded}`);
  if (!allStakingLoaded) {
    console.log('   ❌ FAIL: Staking contract details not all loaded → return false');
    console.log(`   🔍 Staking queries: ${stakingQueries.length} total, ${stakingQueries.filter(q => q.state.status === 'success').length} success`);

    if (stakingQueries.length === 0) {
      console.log('   ⚠️  NO STAKING QUERIES AT ALL');
      console.log('   This happens when StakingContractDetailsProvider is not enabled');
    }
    return;
  }
  console.log('   ✅ PASS');
  console.log('');

  // Continue checking other conditions...
  console.log('='.repeat(70));
  console.log('');
  console.log('📋 Summary:');
  console.log('');
  console.log('Based on the check above, the button is disabled because:');
  console.log('');

  if (balanceQuery?.state.status === 'pending') {
    console.log('❌ ROOT CAUSE: Balance query is PENDING');
    console.log('');
    console.log('Why is it pending?');
    console.log('  → enabled: !!configId && isUserLoggedIn && isOnline');
    console.log('  → configId is NULL (from query key: ["balancesAndRefillRequirements", null])');
    console.log('');
    console.log('Why is configId NULL?');
    console.log('  → ServicesProvider.selectedServiceConfigId = null');
    console.log('');
    console.log('Why is selectedServiceConfigId NULL?');
    console.log('  → Filter logic found 0 matching services');
    console.log('  → Filter requires: name === "Supafund Agent"');
    console.log('  → Backend service: name === "Trader Agent"');
    console.log('  → No match → selectedServiceConfigId set to null');
    console.log('');
    console.log('🎯 THE BREAK POINT:');
    console.log('  User selected agentType: "supafund"');
    console.log('  But backend only has: "Trader Agent" service');
    console.log('  Pearl expects user to have a matching service for selected agent');
    console.log('');
    console.log('🔧 FIX OPTIONS:');
    console.log('  A. Change agentType to "trader" to match existing service');
    console.log('  B. Delete Trader service and create Supafund service');
    console.log('  C. Modify service name to "Supafund Agent" (breaks uniqueness)');
  }

})();
