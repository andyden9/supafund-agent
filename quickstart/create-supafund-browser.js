// 在浏览器控制台运行此脚本创建 Supafund 服务
// 复制整个文件内容

(async function createSupafundService() {
  console.log('🚀 Creating Supafund Service...');
  console.log('='.repeat(60));

  const SUPAFUND_TEMPLATE = {
    "agentType": "supafund",
    "name": "Supafund Agent",
    "hash": "bafybeihvqgjcq2g4nauxiryholvy6tuwxxrkq7ec236tgca2b6qagy6gvu",
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
        "use_staking": true,
        "use_mech_marketplace": false,
        "cost_of_bond": 1000000000000000,
        "monthly_gas_estimate": 1000000000000000000,
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
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "STAKING_CONTRACT_ADDRESS": {
        "name": "Staking contract address",
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "MECH_ACTIVITY_CHECKER_CONTRACT": {
        "name": "Mech activity checker contract",
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "MECH_CONTRACT_ADDRESS": {
        "name": "Mech contract address",
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "MECH_REQUEST_PRICE": {
        "name": "Mech request price",
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "USE_MECH_MARKETPLACE": {
        "name": "Use Mech marketplace",
        "description": "",
        "value": "",
        "provision_type": "computed"
      },
      "SUPAFUND_WEIGHTS": {
        "name": "Supafund agent weights configuration",
        "description": "JSON string with weights for: founder_team, market_opportunity, technical_analysis, social_sentiment, tokenomics",
        "value": "{\"founder_team\":20,\"market_opportunity\":20,\"technical_analysis\":20,\"social_sentiment\":20,\"tokenomics\":20}",
        "provision_type": "user"
      },
      "SUPAFUND_API_ENDPOINT": {
        "name": "Supafund API endpoint",
        "description": "API endpoint for Supafund backend services",
        "value": "",
        "provision_type": "user"
      },
      "MIN_EDGE_THRESHOLD": {
        "name": "Minimum edge threshold",
        "description": "Minimum edge percentage required to place a bet",
        "value": "5",
        "provision_type": "user"
      },
      "RISK_TOLERANCE": {
        "name": "Risk tolerance",
        "description": "Risk tolerance level (1-10)",
        "value": "5",
        "provision_type": "user"
      },
      "STORE_PATH": {
        "name": "Store path",
        "description": "",
        "value": "persistent_data/",
        "provision_type": "computed"
      }
    }
  };

  try {
    console.log('Sending request to create service...');
    const response = await fetch('http://localhost:8000/api/v2/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SUPAFUND_TEMPLATE)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('');
      console.log('✅ Supafund service created successfully!');
      console.log('   Service ID:', result.service_config_id);
      console.log('   Name:', result.name);
      console.log('');
      console.log('Setting service in localStorage...');
      localStorage.setItem('pearl_store_selectedService', JSON.stringify(result));
      localStorage.setItem('pearl_store_lastSelectedAgentType', '"supafund"');
      console.log('');
      console.log('🔄 Reloading page in 2 seconds...');
      setTimeout(() => location.reload(), 2000);
    } else {
      console.log('');
      console.log('❌ Failed to create service');
      console.log('Response:', result);
    }
  } catch (error) {
    console.log('');
    console.log('❌ Error:', error.message);
  }
})();
