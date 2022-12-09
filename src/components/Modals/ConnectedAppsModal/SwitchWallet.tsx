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

import React, { FC, ReactElement, useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';
import Icon from 'components/core/Icon';

// Constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// Utils
import { useThemeColors } from 'utils/themes';

// Selectors
import { useAccounts } from 'selectors';

// Local
import DropDown from './DropDown';

interface Props {
  dropDownStyle?: StyleProp<ViewStyle>;
  visible: boolean;
  onHide: (val: boolean) => void;
}

type itemProps = { label: string; value: string; icon: string };

const SwitchWallet: FC<Props> = ({ dropDownStyle, visible, onHide }) => {
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const accounts = useAccounts();

  const wallets = useMemo(() => {
    const avlAccounts: itemProps[] | any = [];
    accounts.forEach((account) => {
      if (account.type === ACCOUNT_TYPES.KEY_BASED) {
        avlAccounts.push({ value: 'Key wallet', label: t('key_based'), icon: 'key-wallet' });
      }
      if (account.type === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET) {
        avlAccounts.push({ value: 'Archanova wallet', label: t('plr_v1'), icon: 'plr-token' });
      }
      if (account.type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET) {
        avlAccounts.push({ value: 'Smart wallet', label: t('etherspot'), icon: 'etherspot' });
      }
    });
    return avlAccounts;
  }, [accounts]);

  const renderItem = ({ item }): ReactElement<any, any> => (
    <TouchableOpacity style={styles.btnContainer} onPress={() => onHide(false)}>
      <Icon name={item.icon} />
      <Spacing w={5} />
      <Text variant="regular" color={item.color}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <DropDown
      visible={visible}
      onHide={onHide}
      dropDownStyle={dropDownStyle}
      modalContent={
        <>
          <Text variant="regular" color={colors.basic030}>
            {t('switchWallet')}
          </Text>
          <Spacing h={5} />
          <View style={[styles.line, { backgroundColor: colors.basic050 }]} />
          <FlatList data={wallets} renderItem={renderItem} keyExtractor={(item) => item.value} />
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
  },
  btnContainer: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
});

export default SwitchWallet;
