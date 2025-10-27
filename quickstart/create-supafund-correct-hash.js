// 使用 Trader Pearl hash 创建 Supafund 服务
// 因为真正的 Supafund 服务包还不存在

(async function createSupafundWithCorrectHash() {
  console.log('🚀 Creating Supafund Service (with Trader Pearl hash)');
  console.log('='.repeat(60));
  console.log('');
  console.log('⚠️  Note: Using Trader Pearl service package');
  console.log('   Supafund is configured through environment variables');
  console.log('');

  const SUPAFUND_TEMPLATE = {
    "name": "Supafund Agent",
    "hash": "bafybeidavcdl5mex7ykrf4fytngrpgejp3oqdllqrj2uvj6vm4qlkqrklu",  // Trader Pearl hash
    "description": "[Pearl service] Predicts whether emerging projects will achieve key milestones, providing detailed AI-powered analysis",
    "image": "https://www.supafund.xyz/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Flight.71a38e21.png&w=64&q=75",
    "service_version": "v0.1.0",
    "home_chain": "gnosis",
    "configurations": {
      "gnosis": {
        "staking_program_id": "supafund_test",
        "nft": "bafybeig64atqaladigoc3ds4arltdu63wkdrk3gesjfvnfdmz35amv7faq",
        "rpc": "https://gnosis-mainnet.g.alchemy.com/v2/k72mJduMTVP0-6rwv2f1m",
        "agent_id": 14,
        "threshold": 1,
        "cost_of_bond": 1000000000000000,
        "fund_requirements": {
          "0x0000000000000000000000000000000000000000": {
            "agent": 1000000000000000000,
            "safe": 1000000000000000000
          }
        }
      }
    },
    "env_variables": {
      "GNOSIS_LEDGER_RPC": {
        "name": "Gnosis ledger RPC",
        "value": "",
        "provision_type": "computed"
      },
      "STAKING_CONTRACT_ADDRESS": {
        "name": "Staking contract address",
        "value": "",
        "provision_type": "computed"
      },
      "SUPAFUND_WEIGHTS": {
        "name": "Supafund agent weights configuration",
        "value": "{\"founder_team\":20,\"market_opportunity\":20,\"technical_analysis\":20,\"social_sentiment\":20,\"tokenomics\":20}",
        "provision_type": "user"
      },
      "SUPAFUND_API_ENDPOINT": {
        "name": "Supafund API endpoint",
        "value": "",
        "provision_type": "user"
      },
      "MIN_EDGE_THRESHOLD": {
        "name": "Minimum edge threshold",
        "value": "5",
        "provision_type": "user"
      },
      "RISK_TOLERANCE": {
        "name": "Risk tolerance",
        "value": "5",
        "provision_type": "user"
      },
      "STORE_PATH": {
        "name": "Store path",
        "value": "persistent_data/",
        "provision_type": "computed"
      }
    }
  };

  try {
    console.log('📤 Sending create request...');
    const response = await fetch('http://localhost:8000/api/v2/service', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(SUPAFUND_TEMPLATE)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('');
      console.log('✅ Supafund service created!');
      console.log('   ID:', result.service_config_id);
      console.log('   Name:', result.name);
      console.log('   Hash:', result.hash);
      console.log('');
      console.log('💡 This service uses Trader Pearl package');
      console.log('   Supafund behavior is configured via env variables:');
      console.log('   - SUPAFUND_WEIGHTS');
      console.log('   - SUPAFUND_API_ENDPOINT');
      console.log('   - MIN_EDGE_THRESHOLD');
      console.log('   - RISK_TOLERANCE');
      console.log('');
      console.log('Setting in localStorage...');
      localStorage.setItem('pearl_store_selectedService', JSON.stringify(result));
      localStorage.setItem('pearl_store_lastSelectedAgentType', '"supafund"');
      localStorage.setItem('pearl_store_supafund', JSON.stringify({isInitialFunded: false}));
      console.log('');
      console.log('🔄 Reloading page...');
      setTimeout(() => location.reload(), 1500);
    } else {
      console.log('');
      console.log('❌ Failed:', result);
    }
  } catch (error) {
    console.log('');
    console.log('❌ Error:', error.message);
  }
})();
