# Supafund Staking Status Report Tool

Complete monitoring script for OLAS Network Supafund agent staking status.

## 🎯 Features

This script provides comprehensive staking status information:

### ✅ Core Metrics
- **Staking Status** - Current state (UNSTAKED/STAKED/EVICTED)
- **Staking Program** - Which staking contract and program
- **Accrued Rewards** - OLAS rewards accumulated
- **Security Deposits** - Operator security deposit with warnings
- **Agent Bond** - Agent bonding amount with requirements
- **Minimum Deposits** - Required staking amounts

### 📊 Epoch Progress
- **Transaction Count** - Total transactions executed
- **Required Transactions** - Per-epoch KPI requirements
- **KPI Status** - Visual progress bar with percentage
- **Progress Warnings** - Alerts when below threshold

### ⏰ Timing Information
- **Current Time** - UTC timestamp
- **Epoch End Time** - When current epoch ends
- **Time Remaining** - Human-readable countdown (e.g., "3h 51m")
- **Urgency Warnings** - Alerts when epoch is ending soon

### 🔧 Automation Status
- **Checkpoint Round** - Confirms FSM includes checkpoint automation
- **Reward Distribution** - Explains when rewards are distributed
- **Important Notes** - Key information about the staking process

### 💪 Reliability Features
- **Multi-RPC Fallback** - Automatically tries multiple RPC endpoints
- **Error Handling** - Graceful handling of contract call failures
- **Auto-Discovery** - Finds most recent service configuration
- **Color-Coded Output** - Green (success), Yellow (warning), Red (error)

---

## 📋 Requirements

- Python 3.10 or 3.11
- Poetry package manager
- Active Supafund service deployment
- Service configuration in `~/.operate/services/` or `~/Downloads/quickstart-main-2/.operate/services/`

---

## 🚀 Usage

### Quick Start

```bash
cd /path/to/olas-operate-middleware
poetry run python check_staking_status_full.py
```

### What It Reports

```
======================================================================
                SUPAFUND STAKING STATUS - FULL REPORT
======================================================================

Loading service configuration...
  Loading: sc-0abbe0aa-e995-4a35-ae9b-05ac89af917a

  Service ID: 2406
  Multisig: 0xF3042de30E970D0760F725c3Ab119064d53A8315
  Staking Contract: 0x2540Ea7b11a557957a913E7Ef314A9aF28472c08
  Staking Program: supafund_test
  Agent Address: 0xa2b0A99D544e274f6eb5C02b4CB9210a70F0C472
  Agent ID: 71

  Connecting to Gnosis Chain...
    Trying https://gnosis-mainnet.g.alchemy.com/... ✓
  ✓ Connected to Gnosis Chain

======================================================================
                            STAKING STATUS
======================================================================

  Service staked?.............................. Yes
  Staking program.............................. supafund_test (Gnosis)
  Staking state................................ STAKED

  Accrued rewards.............................. 0.000000 OLAS

======================================================================
                      SECURITY DEPOSITS & BONDS
======================================================================

  Security deposit............................. 0.000000 OLAS (Warning if too low)
  Agent bond................................... 1.000000 OLAS
  Min deposit required......................... 1.000000 OLAS

======================================================================
                            EPOCH PROGRESS
======================================================================

  Total transactions........................... 17
  Required per 24h............................. 1
  KPI Status................................... [██████████████████████] 100.0%
  ✓ KPI met! (16 transactions above threshold)

======================================================================
                             EPOCH TIMING
======================================================================

  Current time................................. 2025-10-27 15:11:13 UTC
  Epoch ends at................................ 2025-10-27 19:02:30 UTC
  Time remaining............................... 3h 51m

======================================================================
                         CHECKPOINT & REWARDS
======================================================================

  ✓ Supafund agent includes 'call_checkpoint_round' in FSM
  ✓ Checkpoint will be called automatically after epoch ends

  💡 Important Notes:
     • Rewards are distributed ONLY after checkpoint() is called
     • The agent handles checkpoint calls automatically
     • If no agent calls checkpoint, rewards won't be distributed
     • Accrued rewards accumulate until checkpoint is triggered

======================================================================
                               SUMMARY
======================================================================

  ✓ Service is actively staked and earning rewards

======================================================================
                           Report Complete
======================================================================
```

---

## 🔍 Understanding the Output

### Staking States

| State | Meaning | Action Required |
|-------|---------|-----------------|
| **STAKED** 🟢 | Service is active and earning | None - all good! |
| **EVICTED** 🔴 | Service failed KPI requirements | Unstake and re-stake |
| **UNSTAKED** 🟡 | Service is not staking | Stake the service |

### KPI Progress

The script shows a visual progress bar for transaction requirements:

```
KPI Status: [██████████████████████] 100.0%
✓ KPI met! (16 transactions above threshold)
```

- **Green bar (100%)** = KPI met, rewards will be earned
- **Yellow bar (<100%)** = Below threshold, may be evicted
- Transactions are counted since the last checkpoint

### Warnings

**Yellow warnings** indicate attention needed:
- ⚠ Low security deposit
- ⚠ Transactions below KPI threshold
- ⚠ Epoch ending soon

**Red errors** indicate critical issues:
- ✗ Service evicted from staking
- ✗ Unable to connect to blockchain
- ✗ Critical configuration missing

---

## 🛠 Troubleshooting

### "Could not find service configuration"

**Cause:** Script can't locate service config files.

**Solution:**
1. Check service is deployed: `ls ~/.operate/services/`
2. Or check quickstart location: `ls ~/Downloads/quickstart-main-2/.operate/services/`
3. Ensure `config.json` exists in service directory

### "Could not connect to any RPC"

**Cause:** All RPC endpoints are unreachable.

**Solution:**
1. Check internet connection
2. Wait a moment and retry (RPC may be temporarily down)
3. The script tries 4 different RPCs automatically

### "Service has been EVICTED"

**Cause:** Service failed to meet transaction KPI requirements.

**Solution:**
1. Run `unstake` command for the service
2. Ensure sufficient funds in Safe wallet
3. Verify agent is running properly
4. Re-stake the service

### "Accrued rewards: Unable to retrieve"

**Cause:** Contract ABI mismatch or service info unavailable.

**Note:** This is a non-critical error. If service is STAKED, rewards are still accumulating. This only affects display, not actual reward earning.

---

## 📊 Integration with QuickStart

This script is designed to work with the OLAS QuickStart setup:

1. **Automatic Path Detection** - Checks both standard and quickstart paths
2. **Latest Service Selection** - Automatically picks most recent service
3. **Fallback RPC** - Uses multiple public RPCs for reliability
4. **Color Output** - Terminal-friendly display

### Running from QuickStart Directory

```bash
cd ~/Downloads/quickstart-main-2
poetry run python /path/to/check_staking_status_full.py
```

Or copy the script to your quickstart directory:

```bash
cp check_staking_status_full.py ~/Downloads/quickstart-main-2/
cd ~/Downloads/quickstart-main-2
poetry run python check_staking_status_full.py
```

---

## 🔄 Checkpoint & Rewards

### How Rewards Work

1. **Accrual** - Rewards accumulate during each epoch
2. **Checkpoint Call** - Must be triggered after epoch ends
3. **Distribution** - Rewards are distributed when checkpoint is called
4. **Automation** - Supafund agent calls checkpoint automatically

### When Are Rewards Distributed?

- ✅ Epoch must end (see "Epoch ends at" in report)
- ✅ Checkpoint function must be called (automatic)
- ✅ Service must have met KPI requirements

**Important:** If NO agent calls checkpoint, rewards for ALL agents won't be distributed. The Supafund agent handles this automatically.

---

## 📝 Juli's Requirements Checklist

This script fulfills all requirements for QuickStart testing:

- ✅ Check staking status of the agent
- ✅ Report number of actions performed/to be performed
- ✅ Show when epoch ends (human-readable format)
- ✅ Display time until user receives current earned rewards
- ✅ Optional: Show accrued rewards
- ✅ Verify checkpoint function is called by agent FSM
- ✅ Handle edge cases (evicted, unstaked, errors)

---

## 🆘 Support

For issues or questions:

1. Check service logs: `~/.operate/services/*/deployment/agent/log.txt`
2. Verify service is running: `docker ps`
3. Check Safe wallet balances
4. Review this README's troubleshooting section

---

## 📄 License

Apache 2.0 - Same as OLAS Operate

---

## 🎉 Summary

This tool provides everything needed to monitor Supafund agent staking:

- ✅ **Complete** - All metrics and timing information
- ✅ **Reliable** - Multi-RPC fallback, error handling
- ✅ **User-Friendly** - Color-coded, progress bars, clear warnings
- ✅ **Automated** - Auto-discovers services, handles edge cases
- ✅ **Production-Ready** - Tested with real Supafund deployments

Run it anytime to check your staking status and ensure rewards are being earned!
