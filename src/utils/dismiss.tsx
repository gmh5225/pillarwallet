// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import t from 'translations/translate';

// Components
import Toast from 'components/Toast';

// Utils
import { isLiquidityPoolsTransactionTag } from 'utils/liquidityPools';

// Constants
import { LIQUIDITY_POOL_DASHBOARD } from 'constants/navigationConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
} from 'constants/liquidityPoolsConstants';

export const handleDismissal = (props: any) => {
  const { transactionPayload, navigation, goBackDismiss, isSuccess } = props;

  const txTag = transactionPayload?.tag || '';

  if (isLiquidityPoolsTransactionTag(txTag)) {
    let toastMessage = null;
    const { extra: { amount, pool } = {} } = transactionPayload;
    navigation.navigate(LIQUIDITY_POOL_DASHBOARD, { pool });
    if (txTag === LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION) {
      toastMessage = t('toast.liquidityPoolsAddLiquidity', { value: amount, token: pool.symbol });
    } else if (txTag === LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION) {
      toastMessage = t('toast.liquidityPoolsRemoveLiquidity', { value: amount, token: pool.symbol });
    } else if (txTag === LIQUIDITY_POOLS_STAKE_TRANSACTION) {
      toastMessage = t('toast.liquidityPoolsStake', { value: amount, token: pool.symbol });
    } else if (txTag === LIQUIDITY_POOLS_UNSTAKE_TRANSACTION) {
      toastMessage = t('toast.liquidityPoolsUnstake', { value: amount, token: pool.symbol });
    } else if (txTag === LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION) {
      toastMessage = t('toast.liquidityPoolsClaimRewards', {
        value: amount,
        token: pool.rewards[0].symbol,
      });
    }
    if (toastMessage) {
      Toast.show({
        message: toastMessage,
        emoji: 'ok_hand',
        autoClose: true,
      });
    }
    return;
  }

  if (goBackDismiss) {
    navigation.goBack(null);
  } else {
    navigation.dismiss();
  }

  if (transactionPayload.usePPN && isSuccess) {
    const { amount, symbol } = transactionPayload;
    const paymentInfo = `${amount} ${symbol}`;
    Toast.show({
      message: t('toast.transactionStarted', { paymentInfo }),
      emoji: 'ok_hand',
      autoClose: true,
    });
  }
};
