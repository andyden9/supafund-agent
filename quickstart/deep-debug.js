// Deep Debug - Copy this ENTIRE file content and paste into browser console

(function deepDebug() {
    console.log('🔍 DEEP DEBUG - Tracing React Context State');
    console.log('='.repeat(70));

    // Try to access React internals
    const rootElement = document.getElementById('__next');
    if (!rootElement) {
        console.log('❌ Cannot find React root element');
        return;
    }

    // Get React Fiber from DOM element
    const fiberKey = Object.keys(rootElement).find(key =>
        key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );

    if (!fiberKey) {
        console.log('❌ Cannot access React internals');
        return;
    }

    console.log('✅ Found React Fiber');

    // Helper to find context by name
    function findContextValue(fiber, contextName, depth = 0, maxDepth = 30) {
        if (depth > maxDepth || !fiber) return null;

        // Check if this fiber has context
        if (fiber.memoizedState) {
            let state = fiber.memoizedState;
            while (state) {
                if (state.memoizedState && typeof state.memoizedState === 'object') {
                    // Check context value
                    if (state.memoizedState.isOnline !== undefined) {
                        return { name: 'OnlineStatus', value: state.memoizedState };
                    }
                    if (state.memoizedState.isUserLoggedIn !== undefined) {
                        return { name: 'PageState', value: state.memoizedState };
                    }
                    if (state.memoizedState.services !== undefined) {
                        return { name: 'Services', value: state.memoizedState };
                    }
                }
                state = state.next;
            }
        }

        // Search children
        let result = findContextValue(fiber.child, contextName, depth + 1, maxDepth);
        if (result) return result;

        // Search siblings
        return findContextValue(fiber.sibling, contextName, depth + 1, maxDepth);
    }

    console.log('');
    console.log('Searching for context values in React tree...');
    console.log('(This may take a few seconds)');
    console.log('');

    // Since we can't easily access contexts, let's use a different approach
    // Check if there's a way to trigger the queries manually

    console.log('📊 Alternative Check - Using Network Tab');
    console.log('='.repeat(70));
    console.log('');
    console.log('Please check browser DevTools → Network tab:');
    console.log('');
    console.log('1. Do you see any requests to:');
    console.log('   - http://localhost:8000/api/v2/services');
    console.log('   - http://localhost:8000/api/v2/service/...');
    console.log('');
    console.log('2. If YES → Check the response');
    console.log('   If NO → Queries are not enabled');
    console.log('');

    console.log('🔍 Checking Core Conditions:');
    console.log('='.repeat(70));
    console.log('');

    // Check what we CAN access
    console.log('1. navigator.onLine:', navigator.onLine);
    console.log('');

    console.log('2. localStorage state:');
    const relevantKeys = Object.keys(localStorage).filter(k =>
        k.includes('pearl_store_') || k.includes('isUserLoggedIn') || k.includes('selectedService')
    );
    relevantKeys.forEach(key => {
        const val = localStorage.getItem(key);
        console.log(`   ${key}:`, val);
    });
    console.log('');

    console.log('3. Window location:', window.location.href);
    console.log('');

    console.log('4. Document readyState:', document.readyState);
    console.log('');

    // Check if we're on the right page
    const currentPath = window.location.pathname;
    console.log('5. Current page path:', currentPath);
    console.log('');

    // Most important: check if middleware is accessible
    console.log('6. Testing middleware connectivity...');
    fetch('http://localhost:8000/api/v2/services', {
        signal: AbortSignal.timeout(3000)
    })
        .then(r => r.json())
        .then(data => {
            console.log('   ✅ Middleware accessible');
            console.log('   Services count:', data.length);
            if (data.length > 0) {
                console.log('   First service:', {
                    id: data[0].service_config_id,
                    name: data[0].name,
                    chain: data[0].home_chain
                });
            }
        })
        .catch(e => {
            console.log('   ❌ Middleware not accessible:', e.message);
        });

    console.log('');
    console.log('='.repeat(70));
    console.log('🎯 ROOT CAUSE ANALYSIS');
    console.log('='.repeat(70));
    console.log('');

    if (!window.queryClient) {
        console.log('❌ CRITICAL: window.queryClient is undefined');
        console.log('   This means React Query is not initialized properly');
        console.log('   or we are running in the wrong context');
        console.log('');
        console.log('💡 Solution:');
        console.log('   1. Make sure you are on http://localhost:3000 (not localhost:3001 or other)');
        console.log('   2. Check if page fully loaded (wait 5 seconds after page load)');
        console.log('   3. Try refreshing the page');
        return;
    }

    console.log('✅ window.queryClient exists');
    console.log('');

    const queries = window.queryClient.getQueryCache().getAll();
    if (queries.length === 0) {
        console.log('❌ CRITICAL: No queries registered');
        console.log('');
        console.log('This happens when query providers are not enabled.');
        console.log('');
        console.log('Most likely causes:');
        console.log('  1. isOnline = false (initial state before useEffect runs)');
        console.log('  2. Page still loading/hydrating');
        console.log('  3. ServicesProvider not mounted yet');
        console.log('');
        console.log('💡 Try:');
        console.log('  1. Wait 5-10 seconds and run this script again');
        console.log('  2. Check Network tab for any API calls');
        console.log('  3. If still no queries after 10s, there is a deeper issue');
    }

    console.log('');
    console.log('📋 Action Items:');
    console.log('='.repeat(70));
    console.log('');
    console.log('[ ] Check Network tab for requests to localhost:8000');
    console.log('[ ] Wait 10 seconds, then run this script again');
    console.log('[ ] If still 0 queries, check browser console for React errors');
    console.log('[ ] Try: localStorage.clear(); location.reload()');
    console.log('');

})();
