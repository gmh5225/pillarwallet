// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import { FlatList } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useTranslation } from 'translations/translate';
import { useDispatch } from 'react-redux';
import { isEmpty } from 'lodash';

// Components
import { Container } from 'components/layout/Layout';
import HeaderBlock from 'components/HeaderBlock';
import ChainSelectorContent from 'components/ChainSelector/ChainSelectorContent';
import AddTokenListItem from 'components/lists/AddTokenListItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Spinner from 'components/Spinner';

// Utils
import { filteredWithChain } from 'utils/etherspot';
import { getActiveAccount, isSmartWalletAccount } from 'utils/accounts';

// Constants
import { TOKENS_WITH_TOGGLES } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Actions
import { addTokensListAction } from 'actions/assetsActions';

// Selector
import { useRootSelector, addTokensListSelector, useAccounts } from 'selectors';

export function AddTokens() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const accounts = useAccounts();
  const activeAccount = getActiveAccount(accounts);
  const isSmartWallet = isSmartWalletAccount(activeAccount);

  const { addTokensList: tokenList, isFetching } = useRootSelector(addTokensListSelector);

  const [selectedChain, setSelectedChain] = React.useState(null);
  const tokensAccordingToChain = filteredWithChain(tokenList, !isSmartWallet ? CHAIN.ETHEREUM : selectedChain);

  React.useEffect(() => {
    dispatch(addTokensListAction());
  }, []);

  const renderItem = (token: any) => {
    if (!token) return;
    return (
      <AddTokenListItem
        {...token}
        onPress={() => {
          navigation.navigate(TOKENS_WITH_TOGGLES, { tokenInfo: token });
        }}
      />
    );
  };

  function getItemKey(item) {
    const { tokens, name, chain } = item;
    return name + '__' + chain + '__' + tokens?.length;
  }

  return (
    <Container accessibilityHint="add_tokens_main_content">
      <HeaderBlock
        accessibilityHint="header_block"
        navigation={navigation}
        centerItems={[{ title: t('label.add_tokens') }]}
        noPaddingTop
      />

      <ChainSelectorContent selectedAssetChain={selectedChain} onSelectChain={setSelectedChain} />

      {isFetching && isEmpty(tokenList) ? (
        <Spinner size={40} />
      ) : (
        <FlatList
          key={'add_tokens_list'}
          accessibilityHint="add_tokens_list"
          data={tokensAccordingToChain}
          renderItem={({ item }) => renderItem(item)}
          keyExtractor={getItemKey}
          ListEmptyComponent={() => <EmptyStateParagraph wide title={t('label.nothingFound')} />}
        />
      )}
    </Container>
  );
}

export default AddTokens;
