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
import React from 'react';
import styled from 'styled-components/native';

// eslint-disable-next-line import/no-extraneous-dependencies
import ContentLoader from 'react-native-content-loader';
import { Rect } from 'react-native-svg';

// Utils
import { useIsDarkTheme, useThemeColors } from 'utils/themes';

// Components
import Icon from 'components/core/Icon';

const DARK_PRIMARY_COLOR = 'rgba(31, 30, 30, 0.4)';
const DARK_SECONDARY_COLOR = 'rgba(55, 55, 55, 1)';

const LIGHT_PRIMARY_COLOR = 'rgba(235, 240, 246, 0.1)';
const LIGHT_SECONDARY_COLOR = 'rgba(252, 253, 255, 0.1)';

export const HeaderLoader = () => {
  const isDarkTheme = useIsDarkTheme();

  return (
    <ContentLoader
      primaryColor={isDarkTheme ? DARK_PRIMARY_COLOR : LIGHT_PRIMARY_COLOR}
      secondaryColor={isDarkTheme ? DARK_SECONDARY_COLOR : LIGHT_SECONDARY_COLOR}
      duration={1000}
      width={179}
      height={100}
    >
      <Rect x="54.5" y="5" rx="4" ry="4" width="70" height="25" />
      <Rect x="0" y="40" rx="4" ry="4" width="179" height="15" />
      <Rect x="0" y="60" rx="4" ry="4" width="179" height="15" />
    </ContentLoader>
  );
};

export const GraphLoader = () => {
  return (
    <Container>
      <IconContainer>
        <Icon name="plr-transparent" />
      </IconContainer>
    </Container>
  );
};

export const TokenAnalyticsLoader = () => {
  const colors = useThemeColors();
  return (
    <ContentLoader
      primaryColor={colors.purpleHeatPrimary}
      secondaryColor={colors.purpleHeatSecondary}
      duration={1000}
      width={66}
      height={23}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="66" height="15" />
    </ContentLoader>
  );
};

export const BalanceLoader = () => {
  const isDarkTheme = useIsDarkTheme();

  return (
    <RowContainer>
      <ContentLoader
        primaryColor={isDarkTheme ? DARK_PRIMARY_COLOR : LIGHT_PRIMARY_COLOR}
        secondaryColor={isDarkTheme ? DARK_SECONDARY_COLOR : LIGHT_SECONDARY_COLOR}
        duration={1000}
        width={99}
        height={50}
      >
        <Rect x="0" y="5" rx="4" ry="4" width="98" height="22" />
        <Rect x="0" y="32" rx="4" ry="4" width="98" height="13" />
      </ContentLoader>
      <ContentLoader
        primaryColor={isDarkTheme ? DARK_PRIMARY_COLOR : LIGHT_PRIMARY_COLOR}
        secondaryColor={isDarkTheme ? DARK_SECONDARY_COLOR : LIGHT_SECONDARY_COLOR}
        duration={1000}
        width={98}
        height={50}
      >
        <Rect x="0" y="5" rx="4" ry="4" width="98" height="22" />
        <Rect x="0" y="32" rx="4" ry="4" width="98" height="13" />
      </ContentLoader>
    </RowContainer>
  );
};

export const AllTimeLoader = () => {
  const isDarkTheme = useIsDarkTheme();

  return (
    <ContentLoader
      primaryColor={isDarkTheme ? DARK_PRIMARY_COLOR : LIGHT_PRIMARY_COLOR}
      secondaryColor={isDarkTheme ? DARK_SECONDARY_COLOR : LIGHT_SECONDARY_COLOR}
      duration={1000}
      width={52}
      height={13}
    >
      <Rect x="0" y="0" rx="4" ry="4" width="53" height="13" />
    </ContentLoader>
  );
};

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const Container = styled.View`
  height: 172px;
  align-items: center;
  justify-content: center;
`;

const IconContainer = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  border-radius: 24px;
  shadow-color: #5c0cac;
  shadow-opacity: 0.58;
  shadow-radius: 24;
  elevation: 56;
`;