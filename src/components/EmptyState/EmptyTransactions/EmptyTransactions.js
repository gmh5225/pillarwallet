// @flow
import * as React from 'react';
import { Image } from 'react-native';
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 8px 16px;
`;

type Props = {
  title: string,
  bodyText: string,
}

const esLeft = require('assets/images/esLeft.png');
const esRight = require('assets/images/esRight.png');

const EmptyTransactions = (props: Props) => {
  const {
    title,
    bodyText,
  } = props;

  return (
    <Wrapper
      fullScreen
      style={{
        paddingTop: 90,
        paddingBottom: 90,
        alignItems: 'center',
      }}
    >
      <EmptyStateBGWrapper>
        <Image source={esLeft} resizeMode="contain" />
        <Image source={esRight} resizeMode="contain" />
      </EmptyStateBGWrapper>
      <EmptyStateParagraph
        title={title}
        bodyText={bodyText}
      />
    </Wrapper>
  );
};

export default EmptyTransactions;
