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

import * as React from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useQuery } from 'react-query';
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useDebounce } from 'use-debounce';
import { orderBy, maxBy } from 'lodash';
import { useTranslation } from 'translations/translate';
import { useDispatch } from 'react-redux';

// Components
import { Container, Content } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Icon from 'components/modern/Icon';
import Spinner from 'components/Spinner';
import ValueInput from 'components/ValueInput';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { EXCHANGE_CONFIRM } from 'constants/navigationConstants';

// Services
import etherspotService from 'services/etherspot';

// Selectors
import {
  useRootSelector,
  useFiatCurrency,
  useSupportedAssetsPerChain,
  useRatesPerChain,
  useActiveAccount,
} from 'selectors';
import { accountAssetsPerChainSelector } from 'selectors/assets';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { isLogV2AppEvents } from 'utils/environment';
import { getSupportedChains, nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { getChainWalletAssetsBalances } from 'utils/balances';

// Configs
import { getPlrAddressForChain } from 'configs/assetsConfig';

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { AssetOption } from 'models/Asset';
import type { ExchangeOffer } from 'models/Exchange';
import type { Chain } from 'models/Chain';

// Actions
import { logEventAction } from 'actions/analyticsActions';

// Local
import OfferCard from './OfferCard';
import { shouldTriggerSearch, getExchangeFromAssetOptions, getExchangeToAssetOptions } from './utils';

function Exchange() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const fromInputRef = React.useRef();

  const fiatCurrency = useFiatCurrency();

  const initialChain: Chain = navigation.getParam('chain') || CHAIN.ETHEREUM;
  const { address: nativeChainAssetAddress } = nativeAssetPerChain[initialChain];
  const initialFromAddress: string = navigation.getParam('fromAssetAddress') || nativeChainAssetAddress;
  const initialToAddress: string = navigation.getParam('toAssetAddress') || getPlrAddressForChain(initialChain);

  const [chain, setChain] = React.useState(initialChain);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(initialToAddress);

  const [rawFromAmount, setFromAmount] = React.useState('');
  const [fromAmount]: [string] = useDebounce(rawFromAmount, 500);

  const chainConfig = useChainConfig(chain);

  const assetsPerChain = useRootSelector(accountAssetsPerChainSelector);
  const supportedAssetsPerChain = useSupportedAssetsPerChain();
  const ratesPerChain = useRatesPerChain();
  const accountBalances = useRootSelector(accountAssetsBalancesSelector);
  const walletBalancesPerChain = getChainWalletAssetsBalances(accountBalances);

  const activeAccount = useActiveAccount();
  const supportedChains = getSupportedChains(activeAccount);

  const fromOptions = React.useMemo(
    () => supportedChains.reduce((multiChainOptions, supportedChain) => {
      const chainOptions = getExchangeFromAssetOptions(
        assetsPerChain,
        supportedAssetsPerChain,
        walletBalancesPerChain,
        fiatCurrency,
        ratesPerChain,
        supportedChain,
      );
      return [...multiChainOptions, ...chainOptions];
    }, []),
    [supportedChains, assetsPerChain, supportedAssetsPerChain, walletBalancesPerChain, fiatCurrency, ratesPerChain],
  );

  const toOptions = React.useMemo(
    () => getExchangeToAssetOptions(
      supportedAssetsPerChain,
      walletBalancesPerChain,
      fiatCurrency,
      ratesPerChain,
      chain,
    ),
    [chain, supportedAssetsPerChain, walletBalancesPerChain, fiatCurrency, ratesPerChain],
  );

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );
  const toAsset = React.useMemo(
    () => toOptions.find((a) => a.chain === chain && addressesEqual(a.address, toAddress)),
    [toOptions, toAddress, chain],
  );

  const offersQuery = useOffersQuery(chain, fromAsset, toAsset, fromAmount);
  const offers = sortOffers(offersQuery.data);

  // Focus on from amount input after user changes from or to asset
  React.useEffect(() => {
    let isCancelled = false;

    setTimeout(() => {
      if (!isCancelled) fromInputRef.current?.focus();
    }, 650);

    isLogV2AppEvents() && dispatch(logEventAction('v2_exchange_pair_selected'));

    return () => {
      isCancelled = true;
    };
  }, [fromAsset, toAsset, dispatch]);

  const handleOfferPress = (offer: ExchangeOffer) => {
    navigation.navigate(EXCHANGE_CONFIRM, { offer });
  };

  const allowSwap = fromOptions.some((o) => o.chain === chain && addressesEqual(o.address, toAddress));

  const handleSwapAssets = () => {
    if (!allowSwap) return;

    setFromAddress(toAddress);
    setToAddress(fromAddress);
    setFromAmount('');
  };

  const handleFromAmountChange = (input: string) => {
    setFromAmount(input.replace(/,/g, '.'));
  };

  const formattedToAmount = maxBy(offers, (offer) => offer.toAmount)?.toAmount.toFixed();

  const showLoading = offersQuery.isFetching;
  const showEmptyState = !offers?.length && !offersQuery.isIdle && !offersQuery.isFetching;

  return (
    <Container>
      <HeaderBlock
        centerItems={[{ title: t('exchangeContent.title.exchange', { chain: chainConfig.titleShort }) }]}
        navigation={navigation}
        noPaddingTop
      />

      <Content onScroll={() => Keyboard.dismiss()}>
        <FormWrapper>
          <ValueInput
            disabled={!fromAsset}
            assetData={fromAsset}
            onAssetDataChange={(asset) => {
              if (asset.chain !== chain) setChain(asset.chain);
              setFromAddress(asset.address);
            }}
            value={rawFromAmount}
            onValueChange={handleFromAmountChange}
            selectorOptionsTitle={t('label.sell')}
            customAssets={fromOptions}
            leftSideSymbol="minus"
            getInputRef={(ref) => {
              fromInputRef.current = ref;
            }}
            onBlur={() => fromInputRef.current?.blur()}
            disableAssetChange={false}
            hideMaxSend={!fromAsset}
          />

          <TouchableSwapIcon onPress={handleSwapAssets} disabled={!allowSwap}>
            <Icon name="arrow-up-down" />
          </TouchableSwapIcon>

          <ValueInput
            disabled
            value={formattedToAmount}
            assetData={toAsset}
            onAssetDataChange={(asset) => {
              if (asset.chain !== chain) setChain(asset.chain);
              setToAddress(asset.address);
            }}
            selectorOptionsTitle={t('label.buy')}
            customAssets={toOptions}
            leftSideSymbol="plus"
            onBlur={() => fromInputRef.current?.blur()}
            hideMaxSend
          />
        </FormWrapper>

        {showLoading && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {!showLoading &&
          offers?.map((offer) => (
            <OfferCard
              key={offer.provider}
              offer={offer}
              disabled={false}
              isLoading={false}
              onPress={() => handleOfferPress(offer)}
            />
          ))}

        {showEmptyState && (
          <EmptyStateWrapper>
            <EmptyStateParagraph
              title={t('exchangeContent.emptyState.offers.title')}
              bodyText={t('exchangeContent.emptyState.offers.paragraph')}
              large
            />
          </EmptyStateWrapper>
        )}
      </Content>
    </Container>
  );
}

export default Exchange;

function useOffersQuery(
  chain: Chain,
  fromAsset: ?AssetOption,
  toAsset: ?AssetOption,
  fromAmount: string,
): QueryResult<ExchangeOffer[]> {
  const enabled = shouldTriggerSearch(fromAsset, toAsset, fromAmount);

  return useQuery(
    ['ExchangeOffers', fromAsset, toAsset, fromAmount],
    () => etherspotService.getExchangeOffers(chain, fromAsset, toAsset, BigNumber(fromAmount)),
    { enabled, cacheTime: 0 },
  );
}

function sortOffers(offers: ?(ExchangeOffer[])): ?(ExchangeOffer[]) {
  if (!offers) return null;

  return orderBy(offers, [(offer) => offer.toAmount.toNumber()], ['desc']);
}

const FormWrapper = styled.View`
  padding: 24px 20px 40px;
`;

const TouchableSwapIcon = styled.TouchableOpacity`
  width: 100%;
  margin: 10px 0 20px;
  align-items: center;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;