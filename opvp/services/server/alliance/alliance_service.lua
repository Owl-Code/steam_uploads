local PlayerService = require 'stonehearth.services.server.player.player_service'
local Relations = require 'stonehearth.lib.player.relations'
local AllianceService = class()

function AllianceService:intialize()
    self._sv = self.__saved_variables:get_data()

    if not self._sv.current_alliance_map then
        self._sv.alliance_map = {}
    end
    self._player_alliances = 


return AllianceService