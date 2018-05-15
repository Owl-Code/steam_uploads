App.StonehearthMultiplayerMenuView = App.View.extend({
      templateName: 'stonehearthMultiplayerMenu',
      closeOnEsc: true,
      uriProperty: 'model',

      _clients: {},
      _confirmView: null,
      _settingsView: null,

      init: function () {
            this._super();
            var self = this;

            self.set('isHostPlayer', App.stonehearthClient.isHostPlayer());
      },

      destroy: function () {
            if (this._getterTrace) {
                  this._getterTrace.destroy();
                  this._getterTrace = null;
            }
            if (this._sessionTrace) {
                  this._sessionTrace.destroy();
                  this._sessionTrace = null;
            }

            App.presenceClient.removeChangeCallback('multiplayer_menu');

            this._super();
      },

      didInsertElement: function () {
            var self = this;
            self._super();

            self.$().draggable({
                  handle: '.title'
            });

            self.$('#multiplayerMenu').on('mousedown', function (e) {
                  var element = $(e.target);
                  // Deselect if we aren't clicking a button
                  if (element && !element.is("button")) {
                        self.set('selectedRow', null);
                        self.$('.row').removeClass('selected');
                        self._updateSelectedRow();
                  }
            });

            radiant.call('radiant:is_steam_present')
                  .done(function (response) {
                        var present = response.present;
                        self.set('steamPresent', present);
                        self._updateParty();
                  });

            radiant.call('stonehearth:get_service', 'session_server')
                  .done(function (response) {
                        self._sessionServiceUri = response.result;
                        self._sessionTrace = new RadiantTrace(self._sessionServiceUri, self.components)
                              .progress(function (service) {
                                    if (self.isDestroying || self.isDestroyed) {
                                          return;
                                    }

                                    self.set('maxPlayers', service.max_players);
                                    self.set('remoteConnectionsDisabled', !service.remote_connections_enabled);

                                    if (!self._initialized) {
                                          self._initializeMenu();
                                    }

                                    self._updateParty();
                              });
                  });
      },

      willDestroyElement: function () {
            if (this._confirmView) {
                  this._confirmView.destroy();
                  this._confirmView = null;
            }
            if (this._settingsView) {
                  this._settingsView.destroy();
                  this._settingsView = null;
            }
            this.$().find('.tooltipstered').tooltipster('destroy');
            this.$('#multiplayerMenu').off('mousedown');
            this._super();
      },

      actions: {
            setPlayerHostile: function () {
                  var self = this;
                  var playerId = self.get('selectedRow.playerId');
                  if (playerId) {
                        radiant.call_obj('opvp.player', 'set_amenity_command', self.playerId, playerId, "hostile").done();
                  }
            },

            setPlayerNeutral: function () {
                  var self = this;
                  var playerId = self.get('selectedRow.playerId');
                  if (playerId) {
                        radiant.call_obj('opvp.player', 'set_amenity_command', self.playerId, playerId, "neutral").done();
                  }
            },

            setPlayerFriendly: function () {
                  var self = this;
                  var playerId = self.get('selectedRow.playerId');
                  if (playerId) {
                        radiant.call_obj('opvp.player', 'set_amenity_command', self.playerId, playerId, "friendly").done();
                  }
            },

            disconnectPlayer: function () {
                  this._showConfirmView('disconnect_player', function (playerId) {
                        radiant.call_obj('stonehearth.player', 'disconnect_player_command', playerId);
                  });
            },
            erasePlayer: function () {
                  this._showConfirmView('erase_player', function (playerId) {
                        radiant.call_obj('stonehearth.player', 'destroy_player_entities_command', playerId);
                  });
            },
            transferPlayer: function () {
                  this._showConfirmView('transfer_player', function (playerId) {
                        radiant.call_obj('stonehearth.player', 'transfer_player_entities_command', playerId, App.stonehearthClient.getHostPlayerId());
                  });
            },
            showSettings: function () {
                  this._showMultiplayerSettingsView();
            },
            startTradeWithPlayer: function () {
                  var self = this;
                  var playerId = self.get('selectedRow.playerId');
                  if (playerId) {
                        radiant.call_obj('stonehearth.trade', 'start_trade_command', playerId)
                              .done(function (o) {
                                    App.stonehearthClient.showTradeMenu(o.trade);
                              });
                  }
            },
            openFriendsOverlay: function () {
                  this._showConfirmView('friends_overlay', function () {
                        radiant.call('radiant:open_friends_list_overlay');
                  });
            }
      },

      _initializeMenu: function () {
            var self = this;

            if (self._initialized) {
                  return;
            }

            self.$('#multiplayerMenu').show();

            var changeCallback = function (presenceData) {
                  if (self.isDestroying || self.isDestroyed) {
                        return;
                  }

                  if (Object.keys(presenceData).length != Object.keys(self._clients).length) {
                        self._clients = {};
                  }

                  var addedNewClient = false;
                  radiant.each(presenceData, function (playerId, data) {
                        if (self._updateClientData(playerId, data)) {
                              addedNewClient = true;
                        }
                  });

                  if (addedNewClient) {
                        self._updateClientArray();
                  }
            }

            App.presenceClient.addChangeCallback('multiplayer_menu', changeCallback, true);

            self._initialized = true;

            self._updateParty();
      },

      _showMultiplayerSettingsView: function () {
            var self = this;
            if (self._settingsView) {
                  self._settingsView.destroy();
            }
            self._settingsView = App.gameView.addView(App.StonehearthMultiplayerSettingsView, {
                  title: i18n.t('stonehearth:ui.game.multiplayer_settings.settings'),
                  showEnableOption: true,
                  buttons: [{
                              label: i18n.t('stonehearth:ui.game.common.ok'),
                              click: function (options) {
                                    radiant.call_obj('stonehearth.session_server', 'set_remote_connections_enabled_command', options.remote_connections_enabled);
                                    if (options.remote_connections_enabled) {
                                          radiant.call_obj('stonehearth.session_server', 'set_max_players_command', options.max_players);
                                    }
                                    radiant.call_obj('stonehearth.game_speed', 'set_anarchy_enabled_command', options.game_speed_anarchy_enabled);
                              }
                        },
                        {
                              label: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.cancel')
                        }
                  ]
            });
      },

      _showConfirmView: function (actionName, actionCb) {
            var self = this;
            var playerId = self.get('selectedRow.playerId');
            if (self._confirmView != null && !this._confirmView.isDestroyed) {
                  self._confirmView.destroy();
                  self._confirmView = null;
            }

            self._confirmView = App.gameView.addView(App.StonehearthConfirmView, {
                  title: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.' + actionName + '.title'),
                  message: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.' + actionName + '.message'),
                  buttons: [{
                              label: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.continue'),
                              click: function () {
                                    actionCb(playerId);
                                    self._clearClientData(playerId);
                                    self.set('selectedRow', null);
                              }
                        },
                        {
                              id: 'confirmRemove',
                              label: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.cancel')
                        }
                  ]
            });
      },

      _showAllianceView: function (actionName, actionCb) {
            var self = this;
            var playerId = self.get('selectedRow.playerId');
            if (self._confirmView != null && !this._confirmView.isDestroyed) {
                  self._confirmView.destroy();
                  self._confirmView = null;
            }

            self._confirmView = App.gameView.addView(App.StonehearthConfirmView, {
                  title: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.' + actionName + '.title'),
                  message: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.' + actionName + '.message'),
                  buttons: [{
                              label: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.continue'),
                              click: function () {
                                    actionCb(playerId);
                                    self._clearClientData(playerId);
                                    self.set('selectedRow', null);
                              }
                        },
                        {
                              id: 'confirmRemove',
                              label: i18n.t('stonehearth:ui.game.multiplayer_menu.confirm.cancel')
                        }
                  ]
            });
      },

      _updateSelectedRow: function (view) {
            var view = this.get('selectedRow');
            if (view) {
                  var selectingDifferentPlayer = view.playerId != App.stonehearthClient.getPlayerId();
                  this.set('selectingOtherPlayer', selectingDifferentPlayer);
                  var isHostPlayer = App.stonehearthClient.isHostPlayer();
                  var canShowButtons = isHostPlayer && selectingDifferentPlayer;
                  this.set('showPlayerManagementButtons', canShowButtons);
            } else {
                  this.set('showPlayerManagementButtons', false);
                  this.set('selectingOtherPlayer', false);
            }
      }.observes('selectedRow'),

      _updateClientData: function (playerId, connectionData) {
            var self = this;
            var isInitialized = self._clients[playerId] != null;
            var addedNewClient = false;
            if (!isInitialized) {
                  var clientData = {
                        playerId: playerId,
                        connectionData: connectionData,
                  };

                  self._clients[playerId] = clientData;
                  addedNewClient = true;
            } else {
                  self._clients[playerId].connectionData = connectionData;
                  self.set('updatedClientData', self._clients[playerId]);
            }

            var numConnected = 0;
            radiant.each(self._clients, function (playerId, clientData) {
                  if (clientData && radiant.isOnline(clientData.connectionData)) {
                        numConnected++;
                  }
            });

            self.set('numConnected', numConnected);
            return addedNewClient;
      },

      _clearClientData: function (playerId) {
            this._clients[playerId] = null;
      },

      _updateClientArray: function () {
            var self = this;
            var clients = radiant.map_to_array(self._clients);
            App.presenceClient.sortClientsArray(clients);

            self.set('clientsArray', clients);
            Ember.run.scheduleOnce('afterRender', this, function () {
                  self._updateSelectedRow();
            });

            self._updateParty();
      },

      _updateParty: function () {
            var self = this;
            var maxPlayers = self.get('maxPlayers');
            var clients = self.get('clientsArray');
            var party = [];
            for (var i = 0; i < maxPlayers; i++) {
                  var data = {};
                  data.colorStyle = 'background-color: rgba(0,0,0,0); opacity: 0.2;';
                  if (i < clients.length) {
                        var color = clients[i].connectionData.player_color;
                        if (color) {
                              if (radiant.isOnline(clients[i].connectionData)) {
                                    data.colorStyle = 'background-color: rgba(' + color.x + ',' + color.y + ',' + color.z + ', 1)';
                              } else {
                                    data.colorStyle = 'background-color: rgba(' + color.x + ',' + color.y + ',' + color.z + ', 0.5)';
                              }
                        }
                  }
                  party.push(data);
            }
            self.set('partyArray', party);

            if ((clients && clients.length >= maxPlayers) || !self.get('steamPresent')) {
                  self.set('shouldHideInvite', true);
            } else {
                  self.set('shouldHideInvite', false);
            }
      },

      _updateTooltips: function () {
            Ember.run.scheduleOnce('afterRender', function () {
                  if (!(self.$('#remoteConnectionsDisabled').hasClass('tooltipstered'))) {
                        self.$('#remoteConnectionsDisabled').tooltipster();
                  }
            });
      }.observes('remoteConnectionsDisabled'),
});

App.StonehearthMultiplayerMenuRowView = App.View.extend({
      tagName: 'tr',
      classNames: ['row'],
      templateName: 'stonehearthMultiplayerMenuRow',
      uriProperty: 'model',

      components: {},

      clientData: {},
      menuView: null,
      playerId: null,

      didInsertElement: function () {
            var self = this;
            var clientData = self.clientData;
            self._updateConnectionData();
            self.$().on('click', function () {
                  var banner = self.get('townBanner');
                  if (banner) {
                        radiant.call('radiant:play_sound', {
                              'track': 'stonehearth:sounds:ui:start_menu:focus'
                        });
                        radiant.call('stonehearth:camera_look_at_entity', banner)
                        radiant.call('stonehearth:select_entity', banner);
                  }
                  self._selectRow();
            });

            self._traceTown();
      },

      willDestroyElement: function () {
            this.$().off('click');

            if (this._townTrace) {
                  this._townTrace.destroy();
                  this._townTrace = null;
            }

            this._super();
      },

      isHostPlayer: function () {
            return !!this.get('isHost');
      },

      _traceTown: function () {
            var self = this;

            radiant.call_obj('stonehearth.town', 'get_town_entity_command', self.playerId)
                  .done(function (response) {
                        var town = response.town;
                        if (self._townTrace) {
                              return;
                        }

                        self._townTrace = new StonehearthDataTrace(town, {
                                    banner: {}
                              })
                              .progress(function (result) {
                                    if (self.isDestroyed || self.isDestroying) {
                                          return;
                                    }

                                    // Set town banner icon and entity
                                    var townBanner = self.get('townBanner');
                                    if (!townBanner || townBanner != result.banner) {
                                          if (result.banner) {
                                                self.set('townBanner', result.banner.__self);
                                                var alias = result.banner.uri;
                                                if (alias && alias != '') {
                                                      var catalogData = App.catalog.getCatalogData(alias);
                                                      if (catalogData) {
                                                            self.set('playerIcon', catalogData.icon);
                                                      }
                                                }
                                          }
                                    }
                              })
                              .fail(function (e) {
                                    console.log(e);
                              });

                  });
      },

      _updateConnectionData: function () {
            var self = this;

            if (self.isDestroyed || self.isDestroying) {
                  return;
            }

            var connectionData = self.clientData.connectionData;
            var steamId = connectionData.steam_id;
            if (steamId) {
                  var steamName = App.presenceClient.getSteamName(self.playerId);
                  if (steamName && steamName != '') {
                        self.set('steamName', steamName);
                  }
                  radiant.call('radiant:can_see_steam_avatar', steamId)
                        .done(function () {
                              if (self.isDestroying || self.isDestroyed) {
                                    return;
                              }
                              self.set('steamAvatar', '/r/steam_avatar/' + steamId);
                        })
                        .fail(function (e) {
                              console.log(e);
                        });
            }

            var color = connectionData.player_color;
            if (color) {
                  self.set('colorStyle', 'background: rgba(' + color.x + ',' + color.y + ',' + color.z + ', 1)');
            }

            var townName = App.presenceClient.getPlayerDisplayName(self.playerId);
            if (townName) {
                  self.set('townName', townName);
            }

            var connectionStatus;
            if (radiant.isOnline(connectionData)) {
                  self.$().removeClass('inactive');
                  if (connectionData.connection_state == App.constants.multiplayer.connection_state.CONNECTING) {
                        connectionStatus = i18n.t('stonehearth:ui.game.multiplayer_menu.connecting');
                  } else if (!connectionData.is_camp_placed) {
                        connectionStatus = i18n.t('stonehearth:ui.game.multiplayer_menu.embarking');
                  } else {
                        connectionStatus = i18n.t('stonehearth:ui.game.multiplayer_menu.online');
                  }
                  self.set('is_online', true);
            } else {
                  connectionStatus = i18n.t('stonehearth:ui.game.multiplayer_menu.offline');
                  self.set('is_online', false);
                  self.$().addClass('inactive');
            }

            self.set('connectionStatus', connectionStatus);
            self.set('is_camp_placed', connectionData.is_camp_placed);

            var isHostPlayer = App.stonehearthClient.getHostPlayerId() == self.playerId;
            self.set('isHost', isHostPlayer);

            if (self.menuView._updateParty) {
                  self.menuView._updateParty();
            }
      },

      _selectRow: function () {
            var self = this;
            var selected = self.$().hasClass('selected');
            if (!selected) {
                  self.menuView.$('.row').removeClass('selected');
                  self.$().addClass('selected');

                  self.menuView.set('selectedRow', self);
            }
      },

      _clientDataChanged: function () {
            var self = this;
            var clientData = self.menuView.get('updatedClientData');
            if (clientData && clientData.playerId == self.playerId) {
                  self.set('clientData', clientData);
                  self._updateConnectionData();
            }

      }.observes('menuView.updatedClientData')
});