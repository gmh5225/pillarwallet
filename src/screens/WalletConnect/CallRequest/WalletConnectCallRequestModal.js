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
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'translations/translate';
import { getSdkError } from '@walletconnect/utils';
import { formatJsonRpcError } from '@json-rpc-tools/utils';

// Components
import BottomModal from 'components/layout/BottomModal';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

// Constants
import { WALLETCONNECT_PIN_CONFIRM_SCREEN, WALLETCONNECT_CALL_REQUEST_FLOW } from 'constants/navigationConstants';
import { REQUEST_TYPE } from 'constants/walletConnectConstants';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { getWalletConnectCallRequestType, formatRequestType, parsePeerName } from 'utils/walletConnect';
import { chainFromChainId } from 'utils/chains';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { WalletConnectCallRequest } from 'models/WalletConnect';
import type { TransactionPayload } from 'models/Transaction';

// Local
import SignatureRequestContent from './SignatureRequestContent';
import TransactionRequestContent from './TransactionRequestContent';
import UnsupportedRequestContent from './UnsupportedRequestContent';

type Props = {|
  request: WalletConnectCallRequest,
|};

function WalletConnectCallRequestModal({ request }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const chainsConfig = useChainsConfig();

  const { rejectV2CallRequest } = useWalletConnect();

  const type = getWalletConnectCallRequestType(request);
  const chain = chainFromChainId[request.chainId];

  if (!chain) return null;

  const { title: chainName } = chainsConfig[chain];
  const appName = parsePeerName(request.name);

  const title =
    type !== REQUEST_TYPE.UNSUPPORTED
      ? t('walletConnect.requests.transactionRequestFormat', { app: appName, chain: chainName })
      : formatRequestType(type);

  const handleConfirm = (transactionPayload?: TransactionPayload) => {
    if (!request) {
      Toast.show({
        message: t('toast.walletConnectCallRequestApproveFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });

      Modal.closeAll();
      return;
    }

    Modal.closeAll();
    navigation.navigate(WALLETCONNECT_CALL_REQUEST_FLOW, {
      screen: WALLETCONNECT_PIN_CONFIRM_SCREEN,
      params: { callRequest: request, transactionPayload },
    });
  };

  const handleReject = () => {
    if (!request) {
      Toast.show({
        message: t('toast.walletConnectCallRequestRejectFailed'),
        emoji: 'woman-shrugging',
        supportLink: true,
      });

      Modal.closeAll();
      return;
    }

    Modal.closeAll();
    if (request?.topic) {
      rejectV2CallRequest(request, formatJsonRpcError(request.callId, getSdkError('USER_REJECTED_METHODS').message));
    }
  };

  return (
    <BottomModal title={title}>
      {type === REQUEST_TYPE.MESSAGE && (
        <SignatureRequestContent
          key={SIGNATURE_KEY}
          request={request}
          onConfirm={handleConfirm}
          onReject={handleReject}
        />
      )}
      {type === REQUEST_TYPE.TRANSACTION && (
        <TransactionRequestContent request={request} onConfirm={handleConfirm} onReject={handleReject} />
      )}
      {type === REQUEST_TYPE.UNSUPPORTED && <UnsupportedRequestContent request={request} onReject={handleReject} />}
    </BottomModal>
  );
}

const SIGNATURE_KEY = 'message_signature_request';

export default WalletConnectCallRequestModal;
