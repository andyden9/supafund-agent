# -*- coding: utf-8 -*-
# ------------------------------------------------------------------------------
#
#   Copyright 2023-2024 Valory AG
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# ------------------------------------------------------------------------------

"""This module contains a simple strategy that returns a bet amount based on a mapping."""

from typing import Union, List, Dict, Tuple, Any

REQUIRED_FIELDS = ("confidence", "bet_amount_per_threshold")


def check_missing_fields(kwargs: Dict[str, Any]) -> List[str]:
    """Check for missing fields and return them, if any."""
    missing = []
    for field in REQUIRED_FIELDS:
        if kwargs.get(field, None) is None:
            missing.append(field)
    return missing


def remove_irrelevant_fields(kwargs: Dict[str, Any]) -> Dict[str, Any]:
    """Remove the irrelevant fields from the given kwargs."""
    return {key: value for key, value in kwargs.items() if key in REQUIRED_FIELDS}


def amount_per_threshold(
    confidence: float, bet_amount_per_threshold: Dict[str, int]
) -> Dict[str, Union[int, Tuple[str]]]:
    """Get the bet amount per threshold strategy's result."""
    # we need the threshold as a string, because the agent/service overrides cannot be given with `int`s as keys
    threshold = str(round(confidence, 1))
    bet_amount = bet_amount_per_threshold.get(threshold, None)

    if bet_amount is None:
        return {
            "error": (
                f"No amount was found in {bet_amount_per_threshold=} for {confidence=}.",
            )
        }
    return {"bet_amount": bet_amount * confidence}


def run(*_args, **kwargs) -> Dict[str, Union[int, Tuple[str]]]:
    """Run the strategy."""
    missing = check_missing_fields(kwargs)
    if len(missing) > 0:
        return {"error": (f"Required kwargs {missing} were not provided.",)}

    kwargs = remove_irrelevant_fields(kwargs)
    return amount_per_threshold(**kwargs)
