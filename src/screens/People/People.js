// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import {
  Alert,
  FlatList,
  Animated,
  Keyboard,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import Swipeout from 'react-native-swipeout';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import orderBy from 'lodash.orderby';
import isEqual from 'lodash.isequal';
import capitalize from 'lodash.capitalize';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { searchContactsAction, resetSearchContactsStateAction } from 'actions/contactsActions';
import { fetchInviteNotificationsAction } from 'actions/invitationsActions';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import { FETCHING, FETCHED } from 'constants/contactsConstants';
import { REMOVE } from 'constants/connectionsConstants';
import { baseColors, UIColors, fontSizes, spacing } from 'utils/variables';
import { Container, Wrapper } from 'components/Layout';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import Spinner from 'components/Spinner';
import { BaseText } from 'components/Typography';
import NotificationCircle from 'components/NotificationCircle';
import Button from 'components/Button/Button';
import SearchBar from 'components/SearchBar';
import PeopleSearchResults from 'components/PeopleSearchResults';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import type { SearchResults } from 'models/Contacts';
import ManageConnectionModal from './ManageConnectionModal';

const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  margin-bottom: 9px;
  flex-direction: row;
`;

const HeaderWrapper = styled.View`
  z-index: 20;
  background: ${UIColors.defaultBackgroundColor};
`;

const FullScreenOverlayWrapper = styled.TouchableOpacity`
  z-index: 10;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: absolute;
`;

const FullScreenOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,.6);
`;

const AnimatedFullScreenOverlay = Animated.createAnimatedComponent(FullScreenOverlay);

const ConnectionRequestBannerText = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: ${spacing.rhythm}px;
`;

const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

const EmptyStateBGWrapper = styled.View`
  flex-direction: row;
  justify-content: flex-start;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0 20px 20px;
`;

const MIN_QUERY_LENGTH = 2;

const esBackground = require('assets/images/esLeftLong.png');

type Props = {
  navigation: NavigationScreenProp<*>,
  searchContacts: (query: string) => Function,
  searchResults: SearchResults,
  contactState: ?string,
  user: Object,
  fetchInviteNotifications: Function,
  resetSearchContactsState: Function,
  invitations: Object[],
  localContacts: Object[],
}

type State = {
  query: string,
  searchIsFocused: boolean,
  fullScreenOverlayOpacity: Animated.Value,
  showManageContactModal: boolean,
  manageContactType: ?string,
  manageContactId: ?string,
}

class PeopleScreen extends React.Component<Props, State> {
  _willBlur: NavigationEventSubscription;

  state = {
    query: '',
    searchIsFocused: false,
    fullScreenOverlayOpacity: new Animated.Value(0),
    showManageContactModal: false,
    manageContactType: null,
    manageContactId: null,
  };

  constructor(props: Props) {
    super(props);
    this.handleContactsSearch = debounce(this.handleContactsSearch, 500);
  }

  componentDidMount() {
    const { navigation } = this.props;
    this._willBlur = navigation.addListener('willBlur', this.onScreenBlur);
  }

  componentWillUnmount() {
    this._willBlur.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleSearchChange = (query: any) => {
    this.setState({ query });
    this.handleContactsSearch(query);
  };

  animateFullScreenOverlayOpacity = (active: boolean, onEnd?: Function) => {
    const { fullScreenOverlayOpacity } = this.state;
    if (!active) {
      fullScreenOverlayOpacity.setValue(0);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }).start();
    } else {
      fullScreenOverlayOpacity.setValue(1);
      Animated.timing(fullScreenOverlayOpacity, {
        toValue: 0,
        duration: 80,
        useNativeDriver: true,
      }).start(() => onEnd && onEnd());
    }
  };

  handleSearchFocus = () => {
    this.setState({
      searchIsFocused: true,
    });
    this.animateFullScreenOverlayOpacity(false);
  };

  animateAfterDelay = () => {
    this.setState({
      searchIsFocused: false,
    });
  };

  handleSearchBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true, this.animateAfterDelay);
  };

  handleContactsSearch = (query: string) => {
    if (!query || query.trim() === '' || query.length < MIN_QUERY_LENGTH) {
      this.props.resetSearchContactsState();
      return;
    }
    this.props.searchContacts(query);
  };

  handleContactCardPress = (contact: Object) => () => {
    this.props.navigation.navigate(CONTACT, { contact });
  };

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONNECTION_REQUESTS);
  };

  manageConnection = (manageContactType: ?string, contactData: Object) => {
    // condition to avoid confirmation if MUTE should be considered here
    this.setState({
      showManageContactModal: true,
      manageContactType,
      manageContactId: contactData.id,
    });
  };

  renderSwipeoutBtns = (data) => {
    const swipeButtonsWidth = '78';
    const swipeButtons = [
      // { actionType: MUTE, icon: 'mute', primary: true },
      { actionType: REMOVE, icon: 'remove', danger: true },
      // { actionType: BLOCK, icon: 'warning', dark: true },
    ];

    return swipeButtons.map((buttonDefinition) => {
      const { actionType, icon, ...btnProps } = buttonDefinition;

      return {
        component: (
          <Button
            alignTitleVertical
            isSquare
            noPadding
            small
            height={swipeButtonsWidth}
            onPress={() => this.manageConnection(actionType, data)}
            title={capitalize(actionType)}
            icon={icon}
            {...btnProps}
          />
        ),
      };
    });
  };

  renderContact = ({ item }) => (
    <Swipeout
      right={this.renderSwipeoutBtns(item)}
      sensitivity={10}
      backgroundColor="transparent"
      buttonWidth={80}
    >
      <ListItemWithImage
        label={item.username}
        onPress={this.handleContactCardPress(item)}
        avatarUrl={item.profileImage}
        navigateToProfile={this.handleContactCardPress(item)}
      />
    </Swipeout>
  );

  onScreenBlur = () => {
    Keyboard.dismiss();
    this.animateFullScreenOverlayOpacity(true);
  };

  confirmManageAction = (manageContactType: ?string, manageContactId: ?string) => {
    const contactType = manageContactType || '';
    const contactId = manageContactId || '';
    this.setState({ showManageContactModal: false });
    Alert.alert(`${contactType} ${contactId}`);
  };

  render() {
    const {
      query,
      searchIsFocused,
      fullScreenOverlayOpacity,
      showManageContactModal,
      manageContactType,
      manageContactId,
    } = this.state;
    const {
      searchResults,
      contactState,
      navigation,
      invitations,
      localContacts,
    } = this.props;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!contactState);
    const usersFound = !!searchResults.apiUsers.length || !!searchResults.localContacts.length;
    const pendingConnectionRequests = invitations.filter(({ type }) => type === TYPE_RECEIVED).length;
    const sortedLocalContacts = orderBy(localContacts, [user => user.username.toLowerCase()], 'asc');

    return (
      <Container inset={{ bottom: 0 }}>
        <HeaderWrapper>
          <Header title="people" />
          <Wrapper zIndex={100} regularPadding>
            <SearchBar
              backgroundColor={baseColors.white}
              inputProps={{
                onFocus: this.handleSearchFocus,
                onBlur: this.handleSearchBlur,
                onChange: this.handleSearchChange,
                value: query,
                autoCapitalize: 'none',
              }}
              marginTop={15}
            />
          </Wrapper>
        </HeaderWrapper>
        {searchIsFocused && !inSearchMode &&
          <FullScreenOverlayWrapper onPress={this.handleSearchBlur}>
            <AnimatedFullScreenOverlay
              style={{
                opacity: fullScreenOverlayOpacity,
              }}
            />
          </FullScreenOverlayWrapper>
        }
        {!inSearchMode && !!pendingConnectionRequests &&
          <ConnectionRequestBanner
            onPress={this.handleConnectionsRequestBannerPress}
            underlayColor={baseColors.lightGray}
          >
            <React.Fragment>
              <ConnectionRequestBannerText>
                Connection requests
              </ConnectionRequestBannerText>
              <ConnectionRequestNotificationCircle>
                {pendingConnectionRequests}
              </ConnectionRequestNotificationCircle>
              <ConnectionRequestBannerIcon type="Entypo" name="chevron-thin-right" />
            </React.Fragment>
          </ConnectionRequestBanner>
        }

        {inSearchMode && contactState === FETCHED && usersFound &&
          <PeopleSearchResults
            searchResults={searchResults}
            navigation={navigation}
            invitations={invitations}
            localContacts={sortedLocalContacts}
          />
        }

        {!inSearchMode && !!sortedLocalContacts.length &&
          <FlatList
            data={sortedLocalContacts}
            keyExtractor={(item) => item.id}
            renderItem={this.renderContact}
            initialNumToRender={8}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
            onScroll={() => Keyboard.dismiss()}
            contentContainerStyle={{
              paddingVertical: spacing.rhythm,
              paddingTop: 0,
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {
                  const { fetchInviteNotifications } = this.props;
                  fetchInviteNotifications();
                }}
              />
            }
          />
        }

        {(!inSearchMode || !this.props.searchResults.apiUsers.length) &&
          <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
            {!!query && contactState === FETCHING &&
              <Wrapper center><Spinner /></Wrapper>
            }

            {inSearchMode && contactState === FETCHED && !usersFound &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <EmptyStateParagraph title="Nobody found" bodyText="Make sure you entered the name correctly" />
              </Wrapper>
            }

            {!inSearchMode && !sortedLocalContacts.length &&
              <Wrapper center fullScreen style={{ paddingBottom: 100 }}>
                <EmptyStateBGWrapper>
                  <Image source={esBackground} />
                </EmptyStateBGWrapper>
                <EmptyStateParagraph
                  title="Nobody is here"
                  bodyText="Start building your connection list by inviting friends or by searching for someone"
                />
              </Wrapper>
            }
          </KeyboardAvoidingView>
        }
        <ManageConnectionModal
          showManageContactModal={showManageContactModal}
          manageContactType={manageContactType}
          contact={sortedLocalContacts.find((contact) => contact.id === manageContactId) || {}}
          onConfirm={() => this.confirmManageAction(manageContactType, manageContactId)}
          onModalHide={() => { this.setState({ showManageContactModal: false }); }}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: {
    searchResults,
    contactState,
    data: localContacts,
  },
  invitations: { data: invitations },
}) => ({
  searchResults,
  contactState,
  localContacts,
  invitations,
});

const mapDispatchToProps = (dispatch: Function) => ({
  searchContacts: (query) => dispatch(searchContactsAction(query)),
  resetSearchContactsState: () => dispatch(resetSearchContactsStateAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
